import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET /api/users?username=
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username } = req.query;

    const users = await prisma.user.findMany({
      where: username
        ? { username: { contains: String(username) } }
        : undefined,
      select: {
        user_id: true,
        username: true,
        is_artist: true,
        created_at: true,
        artist: { select: { name: true, country: true } },
      },
      take: 50,
      orderBy: { username: 'asc' },
    });

    res.json(users);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/stats — user summary analytics
router.get('/me/stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const [userCounts, listeningAggregates] = await Promise.all([
      prisma.user.findUnique({
        where: { user_id: userId },
        select: {
          _count: {
            select: {
              playlists: true,
              following: true,
              followers: true,
              listening_activity: true,
            },
          },
        },
      }),
      prisma.listening_Activity.aggregate({
        where: { user_id: userId },
        _sum: { listening_time: true },
        _count: { activity_id: true },
      }),
    ]);

    const totalListeningSeconds = listeningAggregates._sum.listening_time || 0;

    res.json({
      playlistCount: userCounts?._count.playlists || 0,
      followingCount: userCounts?._count.following || 0,
      followersCount: userCounts?._count.followers || 0,
      totalListens: listeningAggregates._count.activity_id || 0,
      totalListeningMinutes: Math.round(totalListeningSeconds / 60),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/me/following  ← must come before /:id
router.get('/me/following', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const follows = await prisma.follow.findMany({
      where: { follower_user_id: req.user!.userId },
      include: {
        followed: {
          select: {
            user_id: true,
            username: true,
            is_artist: true,
            artist: { select: { name: true, country: true } },
          },
        },
      },
    });

    res.json(follows.map((f) => f.followed));
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { user_id: userId },
      select: {
        user_id: true,
        username: true,
        is_artist: true,
        created_at: true,
        artist: { include: { production_house: true } },
        _count: {
          select: {
            following: true,
            followers: true,
            playlists: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
