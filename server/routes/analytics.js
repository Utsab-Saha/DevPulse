import express from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';
import database from '../services/database.js';
import aiAnalyzer from '../services/aiAnalyzer.js';
import crypto from 'crypto';

const router = express.Router();

// Analyze commits for a contributor
router.post('/analyze', authenticateToken, async (req, res) => {
  try {
    const { projectId, contributor, since } = req.body;

    if (!projectId || !contributor) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const project = await database.getProject(projectId);
    if (!project || project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const user = await database.getUser(req.user.id);

    // Fetch commits from GitHub
    const params = {
      author: contributor,
      per_page: 10,
    };
    if (since) params.since = since;

    const commitsResponse = await axios.get(
      `https://api.github.com/repos/${project.owner}/${project.repo}/commits`,
      {
        headers: { Authorization: `token ${user.githubToken}` },
        params,
      }
    );

    const commits = commitsResponse.data;

    if (commits.length === 0) {
      return res.json({ 
        message: 'No commits found for this contributor',
        analytics: [],
      });
    }

    // Analyze each commit
    const analyses = [];
    
    for (const commit of commits.slice(0, 5)) { // Limit to 5 commits to avoid rate limits
      try {
        // Get detailed commit info
        const detailResponse = await axios.get(
          `https://api.github.com/repos/${project.owner}/${project.repo}/commits/${commit.sha}`,
          {
            headers: { Authorization: `token ${user.githubToken}` },
          }
        );

        const detailedCommit = {
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author.name,
          date: commit.commit.author.date,
          stats: detailResponse.data.stats,
          files: detailResponse.data.files,
          patch: detailResponse.data.files?.[0]?.patch?.substring(0, 1000) || '',
        };

        // AI Analysis
        const analysis = await aiAnalyzer.analyzeCommit(detailedCommit, {
          name: project.name,
        });

        const analyticsRecord = {
          id: crypto.randomUUID(),
          projectId,
          contributor,
          commitSha: commit.sha,
          commitMessage: commit.commit.message,
          commitDate: commit.commit.author.date,
          ...analysis,
          createdAt: new Date().toISOString(),
        };

        await database.addAnalytics(analyticsRecord);
        analyses.push(analyticsRecord);
      } catch (error) {
        console.error(`Failed to analyze commit ${commit.sha}:`, error);
      }
    }

    res.json({ 
      message: `Analyzed ${analyses.length} commits`,
      analytics: analyses,
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to analyze commits',
      message: error.message,
    });
  }
});

// Get analytics for project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const project = await database.getProject(req.params.projectId);
    
    if (!project || project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const analytics = await database.getAnalytics(req.params.projectId);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get analytics for specific contributor
router.get('/project/:projectId/contributor/:contributor', authenticateToken, async (req, res) => {
  try {
    const project = await database.getProject(req.params.projectId);
    
    if (!project || project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const analytics = await database.getAnalytics(req.params.projectId);
    const contributorAnalytics = analytics.filter(
      a => a.contributor === req.params.contributor
    );

    // Calculate aggregate scores
    const aggregate = aiAnalyzer.calculateAverageScores(contributorAnalytics);

    res.json({
      contributor: req.params.contributor,
      totalCommits: contributorAnalytics.length,
      scores: aggregate,
      analytics: contributorAnalytics,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contributor analytics' });
  }
});

// Get project insights
router.get('/project/:projectId/insights', authenticateToken, async (req, res) => {
  try {
    const project = await database.getProject(req.params.projectId);
    
    if (!project || project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const analytics = await database.getAnalytics(req.params.projectId);
    
    if (analytics.length === 0) {
      return res.json({
        insights: {
          strengths: ['No data yet'],
          focusAreas: ['Analyze commits to get insights'],
          recommendations: ['Start by analyzing team commits'],
        },
        scores: { codeQuality: 0, impact: 0, documentation: 0, testing: 0, overall: 0 },
      });
    }

    const insights = await aiAnalyzer.generateProjectInsights(analytics);
    const scores = aiAnalyzer.calculateAverageScores(analytics);

    res.json({ insights, scores });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

export default router;
