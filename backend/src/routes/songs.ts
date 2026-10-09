import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/songs?q=&genre=
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, genre } = req.query;

    const songs = await prisma.song.findMany({
      where: {
        is_published: true,
        ...(q && { song_name: { contains: String(q) } }),
        // Genre is stored as a JSON array — filter using string_contains on serialized value
        ...(genre && { genres: { string_contains: String(genre) } }),
      },
      include: {
        artists: {
          include: {
            artist: { select: { name: true, user_id: true } },
          },
          where: { is_primary: true },
        },
      },
      orderBy: { listen_count: 'desc' },
      take: 50,
    });

    res.json(songs);
  } catch (err) {
    next(err);
  }
});

// GET /api/songs/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const songId = parseInt(req.params.id);
    if (isNaN(songId)) {
      res.status(400).json({ error: 'Invalid song ID' });
      return;
    }

    const song = await prisma.song.findUnique({
      where: { song_id: songId },
      include: {
        artists: {
          include: {
            artist: {
              select: {
                name: true,
                user_id: true,
                country: true,
                production_house: true,
              },
            },
          },
        },
      },
    });

    if (!song) {
      res.status(404).json({ error: 'Song not found' });
      return;
    }

    res.json(song);
  } catch (err) {
    next(err);
  }
});

// POST /api/songs/:id/listen — increment listen count + log activity
router.post('/:id/listen', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const songId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const { listening_time } = req.body; // seconds listened (optional)

    if (isNaN(songId)) {
      res.status(400).json({ error: 'Invalid song ID' });
      return;
    }

    // Increment listen_count and log activity in a transaction
    await prisma.$transaction([
      prisma.song.update({
        where: { song_id: songId },
        data: { listen_count: { increment: 1 } },
      }),
      prisma.listening_Activity.create({
        data: {
          user_id: userId,
          song_id: songId,
          listening_time: listening_time ?? 0,
        },
      }),
    ]);

    res.json({ message: 'Listened' });
  } catch (err) {
    next(err);
  }
});

export default router;

