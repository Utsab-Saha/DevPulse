import React from 'react';
import { motion } from 'framer-motion';
import { Github, Zap, BarChart3, Users, Code2, TrendingUp, Shield, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Github,
      title: 'GitHub Integration',
      description: 'Seamlessly connect with your repositories via OAuth',
      color: 'from-violet-500 to-purple-600',
    },
    {
      icon: Zap,
      title: 'AI-Powered Analysis',
      description: 'Groq LLM analyzes commits and provides intelligent insights',
      color: 'from-cyan-500 to-blue-600',
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Assign tasks to contributors and track progress in real-time',
      color: 'from-pink-500 to-rose-600',
    },
    {
      icon: BarChart3,
      title: 'Performance Metrics',
      description: 'Get detailed scores on code quality, impact, and documentation',
      color: 'from-amber-500 to-orange-600',
    },
    {
      icon: Code2,
      title: 'Commit Tracking',
      description: 'Monitor every commit with detailed analytics and feedback',
      color: 'from-emerald-500 to-green-600',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'No centralized backend - your data stays with you',
      color: 'from-indigo-500 to-blue-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 grid-bg opacity-20" />
      
      {/* Floating orbs */}
      <div className="fixed top-20 left-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-float" />
      <div className="fixed bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      
      {/* Header */}
      <motion.header 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="relative z-10 container mx-auto px-6 py-8 flex justify-between items-center"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-2xl font-display font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
            DevPulse
          </span>
        </div>
        <button onClick={login} className="btn-primary flex items-center space-x-2">
          <Github className="w-5 h-5" />
          <span>Sign in with GitHub</span>
        </button>
      </motion.header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-7xl md:text-8xl font-display font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Elevate Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              Development
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-3xl mx-auto font-light">
            AI-powered project management for GitHub teams. Analyze commits, track performance, 
            and boost productivity with intelligent insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button onClick={login} className="btn-primary text-lg px-8 py-4 flex items-center space-x-3">
              <Github className="w-6 h-6" />
              <span>Get Started Free</span>
            </button>
            <a href="#features" className="btn-secondary text-lg px-8 py-4">
              Explore Features
            </a>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          {[
            { value: 'AI-Powered', label: 'Commit Analysis' },
            { value: 'Real-time', label: 'Team Sync' },
            { value: 'Zero Config', label: 'Setup' },
          ].map((stat, i) => (
            <div key={i} className="card text-center">
              <div className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-slate-400">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-display font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-slate-400">Everything you need to manage and analyze your development team</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="card group hover:scale-105 transition-transform duration-300"
            >
              <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-slate-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl font-display font-bold mb-4">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              How It Works
            </span>
          </h2>
        </motion.div>

        <div className="max-w-4xl mx-auto space-y-12">
          {[
            { step: '01', title: 'Connect GitHub', description: 'Sign in with GitHub OAuth and grant repository access' },
            { step: '02', title: 'Create Project', description: 'Paste your repo URL and invite team members' },
            { step: '03', title: 'Assign Tasks', description: 'Create and assign tasks to specific contributors' },
            { step: '04', title: 'Analyze Commits', description: 'AI analyzes every commit and provides detailed scores' },
            { step: '05', title: 'Track Progress', description: 'Monitor team performance with real-time analytics' },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex items-start space-x-6"
            >
              <div className="text-6xl font-display font-black bg-gradient-to-br from-cyan-500/20 to-indigo-600/20 bg-clip-text text-transparent">
                {item.step}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-lg">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="card text-center py-16 bg-gradient-to-br from-cyan-500/10 to-indigo-600/10 border-2 border-cyan-500/50"
        >
          <TrendingUp className="w-16 h-16 mx-auto mb-6 text-cyan-400" />
          <h2 className="text-4xl font-display font-bold mb-4">
            Ready to Transform Your Team?
          </h2>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Join developers who are already using DevPulse to boost their productivity
          </p>
          <button onClick={login} className="btn-primary text-lg px-10 py-4 inline-flex items-center space-x-3">
            <Github className="w-6 h-6" />
            <span>Start Now - It's Free</span>
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 container mx-auto px-6 py-8 text-center border-t border-slate-800">
        <p className="text-slate-500">
          © 2026 DevPulse. Built with passion for developers. Powered by Groq AI.
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
