import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FolderGit2, LogOut, TrendingUp, User, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects', { withCredentials: true });
      setProjects(response.data);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      // Parse repo URL
      const parseResponse = await axios.post('/api/github/parse-url', 
        { url: repoUrl },
        { withCredentials: true }
      );

      const { owner, repo } = parseResponse.data;

      // Verify repo exists
      await axios.get(`/api/github/repo/${owner}/${repo}`, {
        withCredentials: true,
      });

      // Create project
      const response = await axios.post(
        '/api/projects',
        {
          name: projectName,
          repoUrl,
          owner,
          repo,
        },
        { withCredentials: true }
      );

      setProjects([...projects, response.data]);
      setShowModal(false);
      setRepoUrl('');
      setProjectName('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create project. Check repo URL.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="fixed inset-0 grid-bg opacity-10" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FolderGit2 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-display font-bold">DevPulse</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3 px-4 py-2 bg-slate-800 rounded-lg">
              <img src={user?.avatar} alt={user?.username} className="w-8 h-8 rounded-full" />
              <span className="font-medium">{user?.username}</span>
            </div>
            <button onClick={logout} className="p-2 hover:bg-slate-800 rounded-lg transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">Your Projects</h1>
            <p className="text-slate-400">Manage and analyze your GitHub repositories</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </button>
        </div>

        {projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <FolderGit2 className="w-20 h-20 mx-auto mb-6 text-slate-600" />
            <h2 className="text-2xl font-bold mb-4">No Projects Yet</h2>
            <p className="text-slate-400 mb-8">Create your first project to get started</p>
            <button 
              onClick={() => setShowModal(true)}
              className="btn-primary"
            >
              Create Project
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => navigate(`/project/${project.id}`)}
                className="card cursor-pointer group hover:scale-105"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition">
                    <FolderGit2 className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">{project.name}</h3>
                <p className="text-sm text-slate-400 mb-4 truncate">{project.repoUrl}</p>
                
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <User className="w-4 h-4" />
                  <span>{project.owner}/{project.repo}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl"
          >
            <h2 className="text-2xl font-display font-bold mb-6">Create New Project</h2>
            
            <form onSubmit={createProject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Repository URL</label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/username/repo"
                  className="input"
                  required
                />
                <p className="text-xs text-slate-500 mt-2">
                  Paste your GitHub repository URL
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setError('');
                    setRepoUrl('');
                    setProjectName('');
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
