import React, { useState } from 'react';
import { Sparkles, BarChart3, Brain, PenTool } from 'lucide-react';
import { useAnalytics } from './hooks/useAnalytics';
import { PostDetailModal } from './components';
import {
  Dashboard,
  Insights,
  ContentAnalysis,
  ContentGenerator,
  ConnectPage,
} from './pages';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'insights', label: 'AI Insights', icon: Brain },
  { id: 'content', label: 'Content Analysis', icon: PenTool },
  { id: 'generator', label: 'Content Generator', icon: Sparkles },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPost, setSelectedPost] = useState(null);

  const {
    isConnected,
    isLoading,
    analytics,
    insights,
    topPosts,
    hookPerformance,
    summaryMetrics,
    timeRange,
    setTimeRange,
    connect,
    refreshInsights,
  } = useAnalytics();

  // Show connect page if not connected
  if (!isConnected) {
    return <ConnectPage onConnect={connect} isConnecting={isLoading} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Growth Skills Lab</h1>
                <p className="text-sm text-gray-400">Analytics & Insights</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm text-gray-300">@baeincrypto</span>
              </div>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 mt-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    activeTab === tab.id
                      ? 'bg-violet-500/20 text-violet-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {isLoading && !analytics ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading analytics...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                analytics={analytics}
                summaryMetrics={summaryMetrics}
                topPosts={topPosts}
                onPostClick={setSelectedPost}
              />
            )}
            {activeTab === 'insights' && (
              <Insights
                insights={insights}
                onRefresh={refreshInsights}
                onNavigate={setActiveTab}
              />
            )}
            {activeTab === 'content' && (
              <ContentAnalysis hookPerformance={hookPerformance} />
            )}
            {activeTab === 'generator' && (
              <ContentGenerator hookPerformance={hookPerformance} />
            )}
          </>
        )}
      </main>

      {/* Post Detail Modal */}
      <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  );
}
