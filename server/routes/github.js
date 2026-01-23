import express from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';
import database from '../services/database.js';

const router = express.Router();

// Get repository info
router.get('/repo/:owner/:repo', authenticateToken, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const user = await database.getUser(req.user.id);

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: { Authorization: `token ${user.githubToken}` },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch repository',
      message: error.response?.data?.message || error.message,
    });
  }
});

// Get repository contributors
router.get('/repo/:owner/:repo/contributors', authenticateToken, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const user = await database.getUser(req.user.id);

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/contributors`,
      {
        headers: { Authorization: `token ${user.githubToken}` },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch contributors',
    });
  }
});

// Get commits for a contributor
router.get('/repo/:owner/:repo/commits', authenticateToken, async (req, res) => {
  try {
    const { owner, repo } = req.params;
    const { author, since } = req.query;
    const user = await database.getUser(req.user.id);

    const params = {
      per_page: 30,
    };

    if (author) params.author = author;
    if (since) params.since = since;

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits`,
      {
        headers: { Authorization: `token ${user.githubToken}` },
        params,
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch commits',
    });
  }
});

// Get detailed commit info
router.get('/repo/:owner/:repo/commits/:sha', authenticateToken, async (req, res) => {
  try {
    const { owner, repo, sha } = req.params;
    const user = await database.getUser(req.user.id);

    const response = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits/${sha}`,
      {
        headers: { Authorization: `token ${user.githubToken}` },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch commit details',
    });
  }
});

// Parse repository URL
router.post('/parse-url', authenticateToken, (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Invalid GitHub repository URL' });
    }
    
    // Parse GitHub URL patterns:
    // https://github.com/owner/repo
    // https://github.com/owner/repo.git
    // https://github.com/owner/repo/
    // git@github.com:owner/repo.git
    // github.com/owner/repo
    
    let owner, repo;
    
    // Remove trailing slashes and whitespace
    const cleanUrl = url.trim().replace(/\/+$/, '');
    
    // Pattern 1: HTTPS URLs (most common)
    // https://github.com/owner/repo or https://github.com/owner/repo.git
    const httpsMatch = cleanUrl.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/i);
    
    // Pattern 2: SSH URLs
    // git@github.com:owner/repo.git
    const sshMatch = cleanUrl.match(/git@github\.com:([^\/]+)\/(.+?)(?:\.git)?$/i);
    
    if (httpsMatch) {
      owner = httpsMatch[1];
      repo = httpsMatch[2];
    } else if (sshMatch) {
      owner = sshMatch[1];
      repo = sshMatch[2];
    }
    
    // Remove .git suffix if still present
    if (repo) {
      repo = repo.replace(/\.git$/i, '');
    }

    if (owner && repo) {
      console.log(`✅ Parsed URL: ${owner}/${repo}`);
      res.json({ owner, repo });
    } else {
      console.log(`❌ Failed to parse URL: ${cleanUrl}`);
      res.status(400).json({ error: 'Invalid GitHub repository URL' });
    }
  } catch (error) {
    console.error('URL parse error:', error);
    res.status(400).json({ error: 'Failed to parse repository URL' });
  }
});

export default router;