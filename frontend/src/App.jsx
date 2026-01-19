 import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Github, Key, ExternalLink, Info, TrendingUp, Users, Code, Target, Loader2, AlertCircle, Award, Activity, GitCommit, Star, GitFork, Eye, CheckCircle, Calendar, Zap } from 'lucide-react';

const API_URL = 'http://localhost:5000';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('groqApiKey') || '');
  const [repoUrl, setRepoUrl] = useState('');
  const [objectives, setObjectives] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showApiHelp, setShowApiHelp] = useState(!apiKey);

  const saveApiKey = () => {
    localStorage.setItem('groqApiKey', apiKey);
    setShowApiHelp(false);
    alert('✅ API Key saved successfully!');
  };

  const analyzeRepo = async () => {
    if (!apiKey) {
      setError('Please enter your Groq API key first');
      setShowApiHelp(true);
      return;
    }

    if (!repoUrl) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    setLoading(true);
    setError('');
    setAnalysis(null);

    try {
      const response = await fetch(`${API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, objectives, apiKey })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }
      
      setAnalysis(data);
      setActiveTab('overview');
      
    } catch (err) {
      setError(err.message || 'Failed to analyze repository');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey && !loading && apiKey) {
      analyzeRepo();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Github className="w-8 h-8 md:w-10 md:h-10 text-blue-400" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Devpulse
                </h1>
                <p className="text-xs md:text-sm text-gray-400">Powered by Groq (Llama 3.3)</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-gray-400">100% FREE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-8">
        <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl p-6 md:p-8 border border-purple-500/30 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Key className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
              Your FREE Groq API Key
            </h2>
            <button
              onClick={() => setShowApiHelp(!showApiHelp)}
              className="text-purple-400 hover:text-purple-300 flex items-center gap-1 text-sm transition"
            >
              <Info className="w-4 h-4" />
              {showApiHelp ? 'Hide' : 'How to get?'}
            </button>
          </div>

          {showApiHelp && (
            <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4 md:p-6 mb-6">
              <h3 className="font-semibold mb-3 flex items-center gap-2 text-base md:text-lg">
                <span>⚡</span> Get Your FREE API Key (Takes 30 seconds):
              </h3>
              <ol className="space-y-2 text-sm md:text-base text-gray-300 ml-5 list-decimal mb-4">
                <li>
                  Visit{' '}
                  <a 
                    href="https://console.groq.com/keys" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-purple-400 hover:underline inline-flex items-center gap-1"
                  >
                    console.groq.com/keys <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Sign up with Google (free, no credit card needed)</li>
                <li>Click "Create API Key"</li>
                <li>Copy the key and paste it below</li>
                <li>Click "Save Key" - it stays private in your browser</li>
              </ol>
              
              <div className="bg-slate-800/50 rounded-lg p-3 md:p-4 border border-slate-700">
                <p className="text-xs md:text-sm text-gray-300 mb-2">✨ Why Groq?</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>14,400 requests/day FREE</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>World's fastest AI</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">✓</span>
                    <span>No credit card required</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="gsk_... (paste your Groq API key)"
              className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white placeholder-gray-500"
            />
            <button
              onClick={saveApiKey}
              disabled={!apiKey}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition"
            >
              Save Key
            </button>
          </div>
          
          {apiKey && !showApiHelp && (
            <p className="text-sm text-green-400 mt-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              API key saved locally
            </p>
          )}
        </div>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-700 mb-8">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-2">Analyze Repository Performance</h2>
            <p className="text-sm md:text-base text-gray-400">Get AI-powered insights into contributor performance</p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                <Github className="w-4 h-4" />
                GitHub Repository URL *
              </label>
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="https://github.com/facebook/react"
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-white placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Project Objectives (Optional)
              </label>
              <textarea
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Build scalable APIs, Improve test coverage..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-white placeholder-gray-500"
              />
            </div>

            <button
              onClick={analyzeRepo}
              disabled={loading || !apiKey}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed py-4 rounded-lg font-semibold text-lg transition flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <TrendingUp className="w-6 h-6" />
                  Analyze Performance
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-6 bg-red-900/30 border border-red-700 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-red-200 font-medium">Error</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        {analysis && (
          <div className="space-y-8">
            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-2xl p-8 border border-blue-500/30">
              <h2 className="text-3xl font-bold mb-2">{analysis.repository.fullName}</h2>
              {analysis.repository.description && (
                <p className="text-gray-300 mb-4">{analysis.repository.description}</p>
              )}
              <div className="grid grid-cols-5 gap-4">
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <Star className="w-4 h-4 text-yellow-400 mb-2" />
                  <p className="text-2xl font-bold text-yellow-400">{analysis.repository.stars.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Stars</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <GitFork className="w-4 h-4 text-purple-400 mb-2" />
                  <p className="text-2xl font-bold text-purple-400">{analysis.repository.forks.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Forks</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <Eye className="w-4 h-4 text-blue-400 mb-2" />
                  <p className="text-2xl font-bold text-blue-400">{analysis.repository.watchers.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Watchers</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400 mb-2" />
                  <p className="text-2xl font-bold text-red-400">{analysis.repository.openIssues.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Issues</p>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-lg">
                  <Code className="w-4 h-4 text-green-400 mb-2" />
                  <p className="text-2xl font-bold text-green-400">{analysis.repository.language || 'Multi'}</p>
                  <p className="text-xs text-gray-400">Language</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <h3 className="text-2xl font-bold mb-6">AI Analysis Results</h3>
              <div className="space-y-6">
                {analysis.analysis.contributors.map((c, i) => (
                  <div key={i} className="bg-slate-700/50 p-6 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-xl font-bold">{c.name}</h4>
                      <span className="text-3xl font-bold text-blue-400">{c.score}%</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2 mb-3">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: `${c.score}%`}} />
                    </div>
                    <p className="text-gray-300 mb-3">{c.impact}</p>
                    <div className="flex gap-2 flex-wrap">
                      {c.strengths.map((s, j) => (
                        <span key={j} className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
                <h3 className="text-xl font-bold mb-4">Objective Alignment</h3>
                <div className="text-6xl font-bold text-green-400 mb-4">{analysis.analysis.alignment.score}%</div>
                <p className="text-gray-300">{analysis.analysis.alignment.analysis}</p>
              </div>
              <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
                <h3 className="text-xl font-bold mb-4">Code Health</h3>
                <div className="text-6xl font-bold text-blue-400 mb-4">{analysis.analysis.codeHealth.score}%</div>
                <p className="text-gray-300">{analysis.analysis.codeHealth.insights}</p>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
              <h3 className="text-xl font-bold mb-6">Recommendations</h3>
              <div className="space-y-3">
                {analysis.analysis.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <p className="text-gray-300 pt-1">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-16 border-t border-slate-800 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-8 py-6 text-center text-gray-500 text-sm">
          <p>Built with Groq • DevTrack AI © 2025</p>
        </div>
      </footer>
    </div>
  );
}

export default App;