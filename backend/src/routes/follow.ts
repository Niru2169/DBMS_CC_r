import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/users/:id/follow
router.post('/:id/follow', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const followedId = parseInt(req.params.id);
    const followerId = req.user!.userId;

    if (isNaN(followedId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    if (followedId === followerId) {
      res.status(400).json({ error: 'You cannot follow yourself' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { user_id: followedId } });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const existing = await prisma.follow.findUnique({
      where: { follower_user_id_followed_user_id: { follower_user_id: followerId, followed_user_id: followedId } },
    });

    if (existing) {
      res.status(409).json({ error: 'Already following this user' });
      return;
    }

    await prisma.follow.create({
      data: { follower_user_id: followerId, followed_user_id: followedId },
    });

    res.status(201).json({ message: `Now following ${targetUser.username}` });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id/follow
router.delete('/:id/follow', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const followedId = parseInt(req.params.id);
    const followerId = req.user!.userId;

    if (isNaN(followedId)) {
      res.status(400).json({ error: 'Invalid user ID' });
      return;
    }

    const existing = await prisma.follow.findUnique({
      where: { follower_user_id_followed_user_id: { follower_user_id: followerId, followed_user_id: followedId } },
    });

    if (!existing) {
      res.status(404).json({ error: 'You are not following this user' });
      return;
    }

    await prisma.follow.delete({
      where: { follower_user_id_followed_user_id: { follower_user_id: followerId, followed_user_id: followedId } },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
