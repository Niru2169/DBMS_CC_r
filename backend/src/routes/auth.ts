import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password, is_artist, artist_name, country } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.status(409).json({ error: 'Username already taken' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        password_hash,
        is_artist: Boolean(is_artist),
        ...(is_artist && {
          artist: {
            create: {
              name: artist_name || username,
              country: country || null,
              is_band: false,
            },
          },
        }),
      },
      include: { artist: true },
    });

    const token = jwt.sign(
      { userId: user.user_id, username: user.username, isArtist: user.is_artist },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        is_artist: user.is_artist,
        created_at: user.created_at,
        artist: user.artist,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: { artist: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last_login
    await prisma.user.update({
      where: { user_id: user.user_id },
      data: { last_login: new Date() },
    });

    const token = jwt.sign(
      { userId: user.user_id, username: user.username, isArtist: user.is_artist },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        user_id: user.user_id,
        username: user.username,
        is_artist: user.is_artist,
        created_at: user.created_at,
        artist: user.artist,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { user_id: req.user!.userId },
      include: {
        artist: { include: { production_house: true } },
        _count: {
          select: {
            followers: true,
            following: true,
            playlists: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user_id: user.user_id,
      username: user.username,
      is_artist: user.is_artist,
      created_at: user.created_at,
      last_login: user.last_login,
      artist: user.artist,
      _count: user._count,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
