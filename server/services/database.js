import '../config/env-loader.js';
import axios from 'axios';

class GistDatabase {
  constructor() {
    this.token = process.env.GITHUB_GIST_TOKEN;
    this.gistId = null;
    this.baseURL = 'https://api.github.com';
  }

  async initialize() {
    try {
      // Try to find existing DevPulse gist
      const gists = await this.listGists();
      const devPulseGist = gists.find(g => g.description === 'DevPulse Database');
      
      if (devPulseGist) {
        this.gistId = devPulseGist.id;
        console.log('📦 Connected to existing DevPulse database');
      } else {
        // Create new gist
        await this.createDatabase();
        console.log('📦 Created new DevPulse database');
      }
    } catch (error) {
      console.error('Failed to initialize database:', error.message);
      throw error;
    }
  }

  async listGists() {
    const response = await axios.get(`${this.baseURL}/gists`, {
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    return response.data;
  }

  async createDatabase() {
    const initialData = {
      projects: [],
      tasks: [],
      users: [],
      analytics: [],
    };

    const response = await axios.post(
      `${this.baseURL}/gists`,
      {
        description: 'DevPulse Database',
        public: false,
        files: {
          'devpulse-data.json': {
            content: JSON.stringify(initialData, null, 2),
          },
        },
      },
      {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    this.gistId = response.data.id;
    return response.data;
  }

  async getData() {
    if (!this.gistId) {
      await this.initialize();
    }

    const response = await axios.get(`${this.baseURL}/gists/${this.gistId}`, {
      headers: {
        Authorization: `token ${this.token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const content = response.data.files['devpulse-data.json'].content;
    return JSON.parse(content);
  }

  async updateData(data) {
    if (!this.gistId) {
      await this.initialize();
    }

    await axios.patch(
      `${this.baseURL}/gists/${this.gistId}`,
      {
        files: {
          'devpulse-data.json': {
            content: JSON.stringify(data, null, 2),
          },
        },
      },
      {
        headers: {
          Authorization: `token ${this.token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    return data;
  }

  async addProject(project) {
    const data = await this.getData();
    data.projects.push(project);
    await this.updateData(data);
    return project;
  }

  async getProjects(userId) {
    const data = await this.getData();
    return data.projects.filter(p => p.ownerId === userId);
  }

  async getProject(projectId) {
    const data = await this.getData();
    return data.projects.find(p => p.id === projectId);
  }

  async updateProject(projectId, updates) {
    const data = await this.getData();
    const index = data.projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
      data.projects[index] = { ...data.projects[index], ...updates };
      await this.updateData(data);
      return data.projects[index];
    }
    return null;
  }

  async deleteProject(projectId) {
    const data = await this.getData();
    data.projects = data.projects.filter(p => p.id !== projectId);
    data.tasks = data.tasks.filter(t => t.projectId !== projectId);
    await this.updateData(data);
    return true;
  }

  async addTask(task) {
    const data = await this.getData();
    data.tasks.push(task);
    await this.updateData(data);
    return task;
  }

  async getTasks(projectId) {
    const data = await this.getData();
    return data.tasks.filter(t => t.projectId === projectId);
  }

  async updateTask(taskId, updates) {
    const data = await this.getData();
    const index = data.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      data.tasks[index] = { ...data.tasks[index], ...updates };
      await this.updateData(data);
      return data.tasks[index];
    }
    return null;
  }

  async deleteTask(taskId) {
    const data = await this.getData();
    data.tasks = data.tasks.filter(t => t.id !== taskId);
    await this.updateData(data);
    return true;
  }

  async addAnalytics(analytics) {
    const data = await this.getData();
    data.analytics.push(analytics);
    await this.updateData(data);
    return analytics;
  }

  async getAnalytics(projectId) {
    const data = await this.getData();
    return data.analytics.filter(a => a.projectId === projectId);
  }

  async saveUser(user) {
    const data = await this.getData();
    const existingIndex = data.users.findIndex(u => u.id === user.id);
    
    if (existingIndex !== -1) {
      data.users[existingIndex] = user;
    } else {
      data.users.push(user);
    }
    
    await this.updateData(data);
    return user;
  }

  async getUser(userId) {
    const data = await this.getData();
    return data.users.find(u => u.id === userId);
  }
}

// Use in-memory database instead of Gist (temporary fix)
import memoryDB from './memoryDatabase.js';
console.log('⚠️  Using in-memory database instead of Gist');
console.log('⚠️  Data will be lost when server restarts');
export default memoryDB;

// To use Gist database instead, comment out the above lines and uncomment this:
// export default new GistDatabase();
