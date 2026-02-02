import React from 'react';
import { RefreshCw, Flame, Calendar, Target, ArrowRight } from 'lucide-react';
import { InsightCard } from '../components';

export const Insights = ({ insights, onRefresh, onNavigate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
          <p className="text-gray-400">
            Personalized recommendations based on your analytics
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-violet-500/20 text-violet-400 rounded-lg hover:bg-violet-500/30 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Insights
        </button>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-2 gap-4">
        {insights.map((insight) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            onAction={(i) => {
              if (i.action.toLowerCase().includes('generate')) {
                onNavigate?.('generator');
              }
            }}
          />
        ))}
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-3 gap-4 mt-8">
        <QuickActionCard
          icon={Flame}
          iconColor="text-violet-400"
          bgGradient="from-violet-500/20 to-purple-500/20"
          borderColor="border-violet-500/30"
          title="Generate Viral Hook"
          description="Based on your top performing patterns"
          actionText="Create content"
          onClick={() => onNavigate?.('generator')}
        />
        <QuickActionCard
          icon={Calendar}
          iconColor="text-blue-400"
          bgGradient="from-blue-500/20 to-cyan-500/20"
          borderColor="border-blue-500/30"
          title="Optimal Posting Time"
          description="Next best time: Today 7:30 PM EST"
          actionText="Schedule post"
          onClick={() => {}}
        />
        <QuickActionCard
          icon={Target}
          iconColor="text-green-400"
          bgGradient="from-green-500/20 to-emerald-500/20"
          borderColor="border-green-500/30"
          title="Weekly Goal"
          description="3/5 threads posted this week"
          actionText="View progress"
          onClick={() => onNavigate?.('dashboard')}
        />
      </div>
    </div>
  );
};

// Quick Action Card Component
const QuickActionCard = ({
  icon: Icon,
  iconColor,
  bgGradient,
  borderColor,
  title,
  description,
  actionText,
  onClick,
}) => (
  <div
    className={`bg-gradient-to-br ${bgGradient} rounded-xl p-5 border ${borderColor}`}
  >
    <Icon className={`w-8 h-8 ${iconColor} mb-3`} />
    <h3 className="font-semibold mb-1">{title}</h3>
    <p className="text-sm text-gray-400 mb-3">{description}</p>
    <button
      onClick={onClick}
      className={`text-sm ${iconColor} hover:underline flex items-center gap-1`}
    >
      {actionText} <ArrowRight className="w-4 h-4" />
    </button>
  </div>
);
