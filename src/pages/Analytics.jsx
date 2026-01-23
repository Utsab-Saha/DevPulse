import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, TrendingUp, AlertCircle, CheckCircle, FileCode, Target, Sparkles } from 'lucide-react';
import axios from 'axios';

const Analytics = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedContributor, setSelectedContributor] = useState('');
  const [contributors, setContributors] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, analyticsRes, insightsRes] = await Promise.all([
        axios.get(`/api/projects/${id}`, { withCredentials: true }),
        axios.get(`/api/analytics/project/${id}`, { withCredentials: true }),
        axios.get(`/api/analytics/project/${id}/insights`, { withCredentials: true }),
      ]);

      setProject(projectRes.data);
      setAnalytics(analyticsRes.data);
      setInsights(insightsRes.data);

      // Get unique contributors
      const uniqueContributors = [...new Set(analyticsRes.data.map(a => a.contributor))];
      setContributors(uniqueContributors);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCommits = async () => {
    if (!selectedContributor) {
      alert('Please select a contributor');
      return;
    }

    setAnalyzing(true);
    try {
      await axios.post(
        '/api/analytics/analyze',
        {
          projectId: id,
          contributor: selectedContributor,
        },
        { withCredentials: true }
      );
      
      // Refresh data
      await fetchData();
      alert('Analysis complete!');
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  const avgScores = insights?.scores || { codeQuality: 0, impact: 0, documentation: 0, testing: 0, overall: 0 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="fixed inset-0 grid-bg opacity-10" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate(`/project/${id}`)} className="p-2 hover:bg-slate-800 rounded-lg transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold">Analytics Dashboard</h1>
              <p className="text-sm text-slate-400">{project?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6 py-12">
        {/* Analyze Section */}
        <div className="card mb-8 bg-gradient-to-br from-cyan-500/10 to-indigo-600/10 border-2 border-cyan-500/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-1">AI-Powered Commit Analysis</h2>
                <p className="text-slate-400">Analyze commits with Groq LLM</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={selectedContributor}
                onChange={(e) => setSelectedContributor(e.target.value)}
                placeholder="GitHub username"
                className="input w-48"
              />
              <button
                onClick={analyzeCommits}
                disabled={analyzing}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {analyzing ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing...</span>
                  </span>
                ) : (
                  'Analyze Commits'
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Overall Scores */}
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold mb-6 flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-yellow-400" />
            <span>Team Performance</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Overall', value: avgScores.overall, icon: TrendingUp },
              { label: 'Code Quality', value: avgScores.codeQuality, icon: FileCode },
              { label: 'Impact', value: avgScores.impact, icon: Target },
              { label: 'Documentation', value: avgScores.documentation, icon: CheckCircle },
              { label: 'Testing', value: avgScores.testing, icon: AlertCircle },
            ].map((score, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="card text-center"
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${getScoreGradient(score.value)} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                  <score.icon className="w-6 h-6" />
                </div>
                <div className={`text-4xl font-bold mb-2 ${getScoreColor(score.value)}`}>
                  {score.value}
                </div>
                <div className="text-sm text-slate-400">{score.label}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Insights */}
        {insights?.insights && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card border-2 border-green-500/50">
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Strengths</span>
              </h3>
              <ul className="space-y-2">
                {insights.insights.strengths.map((item, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-start space-x-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card border-2 border-yellow-500/50">
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <Target className="w-5 h-5 text-yellow-400" />
                <span>Focus Areas</span>
              </h3>
              <ul className="space-y-2">
                {insights.insights.focusAreas.map((item, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-start space-x-2">
                    <span className="text-yellow-400 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card border-2 border-blue-500/50">
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <span>Recommendations</span>
              </h3>
              <ul className="space-y-2">
                {insights.insights.recommendations.map((item, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-start space-x-2">
                    <span className="text-blue-400 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Recent Analyses */}
        <div>
          <h2 className="text-2xl font-display font-bold mb-6">Recent Commit Analyses</h2>
          
          {analytics.length === 0 ? (
            <div className="card text-center py-12">
              <Brain className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <h3 className="text-xl font-bold mb-2">No Analyses Yet</h3>
              <p className="text-slate-400">Run your first commit analysis to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.slice(0, 10).map((analysis, index) => (
                <motion.div
                  key={analysis.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="card"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-mono text-sm text-cyan-400">{analysis.commitSha?.substring(0, 7)}</span>
                        <span className="text-slate-500">by</span>
                        <span className="font-medium">{analysis.contributor}</span>
                      </div>
                      <p className="text-slate-300 mb-3">{analysis.commitMessage}</p>
                      <p className="text-sm text-slate-400 italic">{analysis.summary}</p>
                    </div>
                    
                    <div className={`text-4xl font-bold ${getScoreColor(analysis.overall)}`}>
                      {analysis.overall}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Code Quality</div>
                      <div className={`text-xl font-bold ${getScoreColor(analysis.codeQuality)}`}>
                        {analysis.codeQuality}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Impact</div>
                      <div className={`text-xl font-bold ${getScoreColor(analysis.impact)}`}>
                        {analysis.impact}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Documentation</div>
                      <div className={`text-xl font-bold ${getScoreColor(analysis.documentation)}`}>
                        {analysis.documentation}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Testing</div>
                      <div className={`text-xl font-bold ${getScoreColor(analysis.testing)}`}>
                        {analysis.testing}
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-green-400 mb-2">Strengths:</div>
                      <ul className="space-y-1 text-slate-400">
                        {analysis.strengths?.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium text-yellow-400 mb-2">Improvements:</div>
                      <ul className="space-y-1 text-slate-400">
                        {analysis.improvements?.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;
