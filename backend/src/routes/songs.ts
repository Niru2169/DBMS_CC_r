import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/songs?q=&genre=
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q } = req.query;

    const songs = await prisma.song.findMany({
      where: {
        is_published: true,
        ...(q && { song_name: { contains: String(q) } }),
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

export default router;
