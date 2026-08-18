import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/playlists/:id/collaborators
router.get('/:id/collaborators', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playlistId = parseInt(req.params.id);
    if (isNaN(playlistId)) {
      res.status(400).json({ error: 'Invalid playlist ID' });
      return;
    }

    const playlist = await prisma.playlist.findUnique({
      where: { playlist_id: playlistId },
    });

    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    // Only owner or collaborator can view
    const userId = req.user!.userId;
    const collab = await prisma.playlist_Collaborator.findUnique({
      where: { playlist_id_user_id: { playlist_id: playlistId, user_id: userId } },
    });

    if (playlist.created_by_user_id !== userId && !collab) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const collaborators = await prisma.playlist_Collaborator.findMany({
      where: { playlist_id: playlistId },
      include: {
        user: { select: { user_id: true, username: true, is_artist: true } },
      },
    });

    res.json(collaborators.map((c) => c.user));
  } catch (err) {
    next(err);
  }
});

// POST /api/playlists/:id/collaborators — add by username
router.post('/:id/collaborators', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playlistId = parseInt(req.params.id);
    const { username } = req.body;
    const userId = req.user!.userId;

    if (isNaN(playlistId) || !username) {
      res.status(400).json({ error: 'Playlist ID and username are required' });
      return;
    }

    const playlist = await prisma.playlist.findUnique({ where: { playlist_id: playlistId } });
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    if (playlist.created_by_user_id !== userId) {
      res.status(403).json({ error: 'Only the playlist owner can add collaborators' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { username } });
    if (!targetUser) {
      res.status(404).json({ error: `User "${username}" not found` });
      return;
    }

    if (targetUser.user_id === userId) {
      res.status(400).json({ error: 'You cannot add yourself as a collaborator' });
      return;
    }

    // Check if already a collaborator
    const existing = await prisma.playlist_Collaborator.findUnique({
      where: { playlist_id_user_id: { playlist_id: playlistId, user_id: targetUser.user_id } },
    });

    if (existing) {
      res.status(409).json({ error: 'User is already a collaborator' });
      return;
    }

    await prisma.playlist_Collaborator.create({
      data: { playlist_id: playlistId, user_id: targetUser.user_id },
    });

    res.status(201).json({
      message: `${username} added as collaborator`,
      user: { user_id: targetUser.user_id, username: targetUser.username },
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/playlists/:id/collaborators/:userId
router.delete('/:id/collaborators/:userId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const playlistId = parseInt(req.params.id);
    const targetUserId = parseInt(req.params.userId);
    const requesterId = req.user!.userId;

    if (isNaN(playlistId) || isNaN(targetUserId)) {
      res.status(400).json({ error: 'Invalid IDs' });
      return;
    }

    const playlist = await prisma.playlist.findUnique({ where: { playlist_id: playlistId } });
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    if (playlist.created_by_user_id !== requesterId) {
      res.status(403).json({ error: 'Only the playlist owner can remove collaborators' });
      return;
    }

    await prisma.playlist_Collaborator.delete({
      where: { playlist_id_user_id: { playlist_id: playlistId, user_id: targetUserId } },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
