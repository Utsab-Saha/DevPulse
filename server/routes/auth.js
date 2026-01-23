import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import database from '../services/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GitHub OAuth login
router.get('/github', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo,read:user,user:email`;
  res.redirect(githubAuthUrl);
});

// GitHub OAuth callback
router.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    // Get user info
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${accessToken}` },
    });

    const user = {
      id: userResponse.data.id,
      username: userResponse.data.login,
      name: userResponse.data.name,
      email: userResponse.data.email,
      avatar: userResponse.data.avatar_url,
      githubToken: accessToken,
    };

    // Save user to database
    await database.saveUser(user);

    // Create JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie and redirect
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : 'http://localhost:3000';
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    console.error('Auth error:', error);
    const frontendUrl = process.env.NODE_ENV === 'production' 
      ? process.env.FRONTEND_URL 
      : 'http://localhost:3000';
    res.redirect(`${frontendUrl}?error=auth_failed`);
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await database.getUser(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Don't send token to frontend
    const { githubToken, ...userWithoutToken } = user;
    res.json(userWithoutToken);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

export default router;
