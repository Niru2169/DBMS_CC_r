import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/artists?name=
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.query;

    const artists = await prisma.artist.findMany({
      where: name
        ? { name: { contains: String(name) } }
        : undefined,
      include: {
        user: { select: { user_id: true, username: true } },
        production_house: true,
        songs: {
          include: {
            song: true,
          },
        },
        _count: {
          select: { songs: true },
        },
      },
      orderBy: { name: 'asc' },
      take: 50,
    });

    res.json(artists);
  } catch (err) {
    next(err);
  }
});

// GET /api/artists/:userId
router.get('/:userId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const artist = await prisma.artist.findUnique({
      where: { user_id: userId },
      include: {
        user: { select: { user_id: true, username: true, created_at: true } },
        production_house: true,
        songs: {
          include: {
            song: true,
          },
          where: { is_primary: true },
          take: 50,
        },
        _count: {
          select: { songs: true },
        },
      },
    });

    if (!artist) {
      res.status(404).json({ error: 'Artist not found' });
      return;
    }

    res.json(artist);
  } catch (err) {
    next(err);
  }
});

export default router;
