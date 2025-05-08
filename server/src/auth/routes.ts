import { Router, Request, Response } from 'express';
import { findUserByCredentials, generateTokens, verifyToken, createUser } from './utils';
import { authenticate } from './middleware';

const router = Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Create user
    const user = await createUser(username, password);

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Return tokens
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Registration failed' });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by credentials
    const user = await findUserByCredentials(username, password);

    // Generate tokens
    const tokens = generateTokens({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    // Return tokens
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Authentication failed' });
  }
});

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    // Validate input
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, true);

    // Generate new tokens
    const tokens = generateTokens({
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
    });

    // Return new tokens
    res.json({
      message: 'Token refreshed successfully',
      ...tokens,
    });
  } catch (error: any) {
    res.status(401).json({ message: error.message || 'Token refresh failed' });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout a user
 * @access Private
 */
router.post('/logout', authenticate, (req: Request, res: Response) => {
  // Note: In a real-world scenario, you might want to invalidate the token
  // by adding it to a blacklist or using a token database
  res.json({ message: 'Logout successful' });
});

/**
 * @route GET /api/auth/me
 * @desc Get current user
 * @access Private
 */
router.get('/me', authenticate, (req: Request, res: Response) => {
  res.json({
    user: req.user,
  });
});

export default router;