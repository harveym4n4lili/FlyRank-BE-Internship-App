import express from 'express';
import supabase from '../db/supabase.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *       400:
 *         description: Bad request - missing email or password
 */
router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    res.status(201).json(data.user);
  } catch (error) {
    console.error('Error during signup:', error.message);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 email:
 *                   type: string
 *       400:
 *         description: Bad request - missing email or password
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    });
  } catch (error) {
    console.error('Error during login:', error.message);
    return res.status(401).json({ error: 'Invalid login credentials' });
  }
});

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out and end session
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *       401:
 *         description: Missing or invalid token
 *       400:
 *         description: Failed to logout
 */
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return res.status(204).json({ message: 'Successfully logged out' });
  } catch (error) {
    console.error('Error during logout:', error.message);
    return res.status(400).json({ error: 'Failed to logout' });
  }
});

export default router;