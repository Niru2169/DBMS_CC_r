import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { ReleaseType } from '@prisma/client';

const router = Router();

// Helper: check if user has access to mutate a playlist
async function canMutatePlaylist(playlistId: number, userId: number): Promise<boolean> {
  const playlist = await prisma.playlist.findUnique({
    where: { playlist_id: playlistId },
    include: {
      collaborators: { where: { user_id: userId } },
    },
  });

  if (!playlist) return false;
  return playlist.created_by_user_id === userId || playlist.collaborators.length > 0;
}

// GET /api/playlists — list playlists user owns OR collaborates on
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const playlists = await prisma.playlist.findMany({
      where: {
        OR: [
          { created_by_user_id: userId },
          { collaborators: { some: { user_id: userId } } },
        ],
      },
      include: {
        creator: { select: { user_id: true, username: true } },
        _count: { select: { songs: true, collaborators: true } },
      },
      orderBy: { last_updated: 'desc' },
    });

    res.json(playlists);
  } catch (err) {
    next(err);
  }
});

// POST /api/playlists — create
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, cover_art_url, release_type, is_shared } = req.body;
    const userId = req.user!.userId;

    if (!name) {
      res.status(400).json({ error: 'Playlist name is required' });
      return;
    }

    // Non-artists cannot set release_type
    if (release_type && !req.user!.isArtist) {
      res.status(403).json({ error: 'Only artists can set a release type' });
      return;
    }

    const validReleaseTypes = ['Single', 'EP', 'Album'];
    if (release_type && !validReleaseTypes.includes(release_type)) {
      res.status(400).json({ error: 'Invalid release_type. Must be Single, EP, or Album' });
      return;
    }

    const playlist = await prisma.playlist.create({
      data: {
        name,
        created_by_user_id: userId,
        cover_art_url: cover_art_url || null,
        release_type: release_type ? (release_type as ReleaseType) : null,
        is_shared: Boolean(is_shared),
        duration: 0,
      },
      include: {
        creator: { select: { user_id: true, username: true } },
        _count: { select: { songs: true } },
      },
    });

    res.status(201).json(playlist);
  } catch (err) {
    next(err);
  }
});

// GET /api/playlists/:id — get playlist detail
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playlistId = parseInt(req.params.id);
    if (isNaN(playlistId)) {
      res.status(400).json({ error: 'Invalid playlist ID' });
      return;
    }

    const playlist = await prisma.playlist.findUnique({
      where: { playlist_id: playlistId },
      include: {
        creator: { select: { user_id: true, username: true } },
        songs: {
          include: {
            song: {
              include: {
                artists: {
                  include: { artist: { select: { name: true, user_id: true } } },
                  where: { is_primary: true },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        collaborators: {
          include: {
            user: { select: { user_id: true, username: true, is_artist: true } },
          },
        },
      },
    });

    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    // Access: owner, collaborator, or playlist is publicly shared
    const userId = req.user!.userId;
    const isOwner = playlist.created_by_user_id === userId;
    const isCollaborator = playlist.collaborators.some((c) => c.user_id === userId);

    if (!isOwner && !isCollaborator && !playlist.is_shared) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json(playlist);
  } catch (err) {
    next(err);
  }
});

// PUT /api/playlists/:id — update
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playlistId = parseInt(req.params.id);
    const userId = req.user!.userId;

    if (isNaN(playlistId)) {
      res.status(400).json({ error: 'Invalid playlist ID' });
      return;
    }

    // Only owner can update metadata
    const playlist = await prisma.playlist.findUnique({ where: { playlist_id: playlistId } });
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    if (playlist.created_by_user_id !== userId) {
      res.status(403).json({ error: 'Only the playlist owner can update it' });
      return;
    }

    const { name, cover_art_url, release_type, is_shared } = req.body;

    if (release_type && !req.user!.isArtist) {
      res.status(403).json({ error: 'Only artists can set a release type' });
      return;
    }

    const updated = await prisma.playlist.update({
      where: { playlist_id: playlistId },
      data: {
        ...(name && { name }),
        ...(cover_art_url !== undefined && { cover_art_url }),
        ...(release_type !== undefined && { release_type: release_type ? (release_type as ReleaseType) : null }),
        ...(is_shared !== undefined && { is_shared: Boolean(is_shared) }),
        last_updated: new Date(), // explicitly set so @updatedAt triggers on partial updates
      },
      include: {
        creator: { select: { user_id: true, username: true } },
        _count: { select: { songs: true } },
      },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/playlists/:id
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playlistId = parseInt(req.params.id);
    const userId = req.user!.userId;

    if (isNaN(playlistId)) {
      res.status(400).json({ error: 'Invalid playlist ID' });
      return;
    }

    const playlist = await prisma.playlist.findUnique({ where: { playlist_id: playlistId } });
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    if (playlist.created_by_user_id !== userId) {
      res.status(403).json({ error: 'Only the owner can delete a playlist' });
      return;
    }

    await prisma.playlist.delete({ where: { playlist_id: playlistId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/playlists/:id/songs — add song
router.post('/:id/songs', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playlistId = parseInt(req.params.id);
    const { song_id } = req.body;
    const userId = req.user!.userId;

    if (isNaN(playlistId) || !song_id) {
      res.status(400).json({ error: 'Invalid playlist ID or song_id' });
      return;
    }

    if (!(await canMutatePlaylist(playlistId, userId))) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    // Check if song already in playlist
    const existing = await prisma.playlist_Song.findUnique({
      where: { playlist_id_song_id: { playlist_id: playlistId, song_id: parseInt(song_id) } },
    });

    if (existing) {
      res.status(409).json({ error: 'Song already in playlist' });
      return;
    }

    // Get max order
    const maxOrderResult = await prisma.playlist_Song.aggregate({
      where: { playlist_id: playlistId },
      _max: { order: true },
    });
    const nextOrder = (maxOrderResult._max.order ?? 0) + 1;

    await prisma.playlist_Song.create({
      data: {
        playlist_id: playlistId,
        song_id: parseInt(song_id),
        order: nextOrder,
      },
    });

    // Recalculate duration
    const songs = await prisma.playlist_Song.findMany({
      where: { playlist_id: playlistId },
      include: { song: { select: { duration: true } } },
    });
    const totalDuration = songs.reduce((acc, ps) => acc + ps.song.duration, 0);
    await prisma.playlist.update({
      where: { playlist_id: playlistId },
      data: { duration: totalDuration },
    });

    res.status(201).json({ message: 'Song added to playlist' });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/playlists/:id/songs/:songId
router.delete('/:id/songs/:songId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playlistId = parseInt(req.params.id);
    const songId = parseInt(req.params.songId);
    const userId = req.user!.userId;

    if (isNaN(playlistId) || isNaN(songId)) {
      res.status(400).json({ error: 'Invalid IDs' });
      return;
    }

    if (!(await canMutatePlaylist(playlistId, userId))) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await prisma.playlist_Song.delete({
      where: { playlist_id_song_id: { playlist_id: playlistId, song_id: songId } },
    });

    // Recalculate duration
    const songs = await prisma.playlist_Song.findMany({
      where: { playlist_id: playlistId },
      include: { song: { select: { duration: true } } },
    });
    const totalDuration = songs.reduce((acc, ps) => acc + ps.song.duration, 0);
    await prisma.playlist.update({
      where: { playlist_id: playlistId },
      data: { duration: totalDuration },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
