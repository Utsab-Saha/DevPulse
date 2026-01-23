import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, CheckCircle2, Clock, AlertCircle, BarChart3, Users, Github } from 'lucide-react';
import axios from 'axios';

const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'medium',
    dueDate: '',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes, contributorsRes] = await Promise.all([
        axios.get(`/api/projects/${id}`, { withCredentials: true }),
        axios.get(`/api/tasks/project/${id}`, { withCredentials: true }),
        axios.get(`/api/github/repo/${project?.owner || 'owner'}/${project?.repo || 'repo'}/contributors`, { 
          withCredentials: true 
        }).catch(() => ({ data: [] })),
      ]);

      setProject(projectRes.data);
      setTasks(tasksRes.data);
      setContributors(contributorsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        '/api/tasks',
        { ...taskForm, projectId: id },
        { withCredentials: true }
      );
      setTasks([...tasks, response.data]);
      setShowModal(false);
      setTaskForm({ title: '', description: '', assignee: '', priority: 'medium', dueDate: '' });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      const response = await axios.put(
        `/api/tasks/${taskId}`,
        { status },
        { withCredentials: true }
      );
      setTasks(tasks.map(t => t.id === taskId ? response.data : t));
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const priorityColors = {
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    high: 'bg-red-500/20 text-red-400 border-red-500/50',
  };

  const statusIcons = {
    pending: Clock,
    'in-progress': AlertCircle,
    completed: CheckCircle2,
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
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-slate-800 rounded-lg transition">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-display font-bold">{project?.name}</h1>
                <p className="text-sm text-slate-400">{project?.owner}/{project?.repo}</p>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => navigate(`/project/${id}/analytics`)}
                className="btn-secondary flex items-center space-x-2"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Tasks', value: tasks.length, icon: Clock, color: 'from-blue-500 to-cyan-500' },
            { label: 'In Progress', value: tasks.filter(t => t.status === 'in-progress').length, icon: AlertCircle, color: 'from-yellow-500 to-orange-500' },
            { label: 'Completed', value: tasks.filter(t => t.status === 'completed').length, icon: CheckCircle2, color: 'from-green-500 to-emerald-500' },
            { label: 'Contributors', value: contributors.length, icon: Users, color: 'from-purple-500 to-pink-500' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Tasks Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold">Tasks</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Add Task</span>
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="card text-center py-12">
            <Clock className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <h3 className="text-xl font-bold mb-2">No Tasks Yet</h3>
            <p className="text-slate-400 mb-6">Create your first task to get started</p>
            <button onClick={() => setShowModal(true)} className="btn-primary">
              Create Task
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task, index) => {
              const StatusIcon = statusIcons[task.status] || Clock;
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold">{task.title}</h3>
                        <span className={`badge border ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-slate-400 mb-3">{task.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>{task.assigneeUsername}</span>
                        </div>
                        {task.dueDate && (
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <StatusIcon className="w-5 h-5 text-slate-400" />
                      <select
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-cyan-500"
                      >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl"
          >
            <h2 className="text-2xl font-display font-bold mb-6">Create Task</h2>
            
            <form onSubmit={createTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Task Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="input h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Assign To (GitHub username)</label>
                <input
                  type="text"
                  value={taskForm.assignee}
                  onChange={(e) => setTaskForm({ ...taskForm, assignee: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    className="input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Create Task
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
