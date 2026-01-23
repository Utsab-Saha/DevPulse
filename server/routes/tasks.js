import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import database from '../services/database.js';
import crypto from 'crypto';

const router = express.Router();

// Create task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { projectId, title, description, assignee, priority, dueDate } = req.body;

    if (!projectId || !title || !assignee) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify project ownership
    const project = await database.getProject(projectId);
    if (!project || project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const task = {
      id: crypto.randomUUID(),
      projectId,
      title,
      description: description || '',
      assignee,
      assigneeUsername: assignee,
      priority: priority || 'medium',
      status: 'pending',
      dueDate: dueDate || null,
      createdBy: req.user.username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await database.addTask(task);
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get tasks for project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const project = await database.getProject(req.params.projectId);
    
    if (!project || project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tasks = await database.getTasks(req.params.projectId);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const tasks = await database.getData();
    const task = tasks.tasks.find(t => t.id === req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const project = await database.getProject(task.projectId);
    if (!project || project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates = {
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    const updatedTask = await database.updateTask(req.params.id, updates);
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const data = await database.getData();
    const task = data.tasks.find(t => t.id === req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const project = await database.getProject(task.projectId);
    if (!project || project.ownerId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await database.deleteTask(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;
