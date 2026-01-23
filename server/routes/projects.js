import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import database from '../services/database.js';
import { randomUUID } from 'crypto';

const router = express.Router();

// Create project
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, repoUrl, owner, repo } = req.body;

    if (!name || !repoUrl || !owner || !repo) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const project = {
      id: randomUUID(),
      name,
      repoUrl,
      owner,
      repo,
      ownerId: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await database.addProject(project);
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Get all projects for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await database.getProjects(req.user.id);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await database.getProject(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Update project
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await database.getProject(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    const updatedProject = await database.updateProject(req.params.id, updates);
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await database.getProject(req.params.id);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.deleteProject(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
