class MemoryDatabase {
  constructor() {
    this.users = new Map();
    this.projects = [];
    this.tasks = [];
    this.analytics = [];
    console.log('💾 Using in-memory database (data will reset on server restart)');
  }

  async initialize() {
    console.log('✅ In-memory database ready');
  }

  // User methods
  async saveUser(user) {
    this.users.set(user.id, user);
    console.log('✅ User saved:', user.username);
    return user;
  }

  async getUser(userId) {
    const user = this.users.get(userId);
    console.log('🔍 User lookup:', userId, '→', user ? 'Found' : 'Not found');
    return user || null;
  }

  // Project methods
  async addProject(project) {
    this.projects.push(project);
    console.log('✅ Project added:', project.name);
    return project;
  }

  async getProjects(userId) {
    return this.projects.filter(p => p.ownerId === userId);
  }

  async getProject(projectId) {
    return this.projects.find(p => p.id === projectId);
  }

  async updateProject(projectId, updates) {
    const index = this.projects.findIndex(p => p.id === projectId);
    if (index !== -1) {
      this.projects[index] = { ...this.projects[index], ...updates };
      return this.projects[index];
    }
    return null;
  }

  async deleteProject(projectId) {
    this.projects = this.projects.filter(p => p.id !== projectId);
    this.tasks = this.tasks.filter(t => t.projectId !== projectId);
    return true;
  }

  // Task methods
  async addTask(task) {
    this.tasks.push(task);
    return task;
  }

  async getTasks(projectId) {
    return this.tasks.filter(t => t.projectId === projectId);
  }

  async updateTask(taskId, updates) {
    const index = this.tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates };
      return this.tasks[index];
    }
    return null;
  }

  async deleteTask(taskId) {
    this.tasks = this.tasks.filter(t => t.id !== taskId);
    return true;
  }

  // Analytics methods
  async addAnalytics(analytics) {
    this.analytics.push(analytics);
    return analytics;
  }

  async getAnalytics(projectId) {
    return this.analytics.filter(a => a.projectId === projectId);
  }

  // For compatibility with existing code
  async getData() {
    return {
      projects: this.projects,
      tasks: this.tasks,
      users: Array.from(this.users.values()),
      analytics: this.analytics,
    };
  }
}

export default new MemoryDatabase();
