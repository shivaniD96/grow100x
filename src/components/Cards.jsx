import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn, formatNumber, getTypeColors, getPriorityColors } from '../utils/helpers';

// Metric Card Component
export const MetricCard = ({ 
  icon: Icon, 
  iconColor = 'text-blue-400',
  label, 
  value, 
  trend,
  trendDirection = 'up',
  className 
}) => (
  <div className={cn("bg-gray-800/50 rounded-xl p-5 border border-gray-700", className)}>
    <div className="flex items-center justify-between mb-2">
      <Icon className={cn("w-5 h-5", iconColor)} />
      {trend && (
        <span className={cn(
          "text-xs flex items-center gap-1",
          trendDirection === 'up' ? 'text-green-400' : 'text-red-400'
        )}>
          {trendDirection === 'up' ? (
            <ArrowUpRight className="w-3 h-3" />
          ) : (
            <ArrowDownRight className="w-3 h-3" />
          )}
          {trend}
        </span>
      )}
    </div>
    <div className="text-2xl font-bold">{value}</div>
    <div className="text-sm text-gray-400">{label}</div>
  </div>
);

// Insight Card Component
export const InsightCard = ({ insight, onAction }) => {
  const Icon = insight.icon;
  const colors = getTypeColors(insight.type);
  
  return (
    <div className={cn(colors.bg, "rounded-xl p-5 border", colors.border)}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
          <Icon className={cn("w-5 h-5", colors.icon)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">{insight.title}</h3>
            <span className={cn("text-xs px-2 py-1 rounded-full", getPriorityColors(insight.priority))}>
              {insight.priority} priority
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-3">{insight.description}</p>
          {insight.metric && (
            <div className={cn("text-sm font-medium mb-2", colors.icon)}>
              {insight.metric}
            </div>
          )}
          <button 
            onClick={() => onAction?.(insight)}
            className={cn("text-sm hover:underline flex items-center gap-1", colors.icon)}
          >
            {insight.action} →
          </button>
        </div>
      </div>
    </div>
  );
};

// Post Card Component
export const PostCard = ({ post, onClick }) => (
  <div
    onClick={() => onClick?.(post)}
    className="bg-gray-900/50 rounded-lg p-4 hover:bg-gray-900 cursor-pointer transition-all border border-transparent hover:border-gray-700"
  >
    <div className="flex justify-between items-start mb-3">
      <p className="text-sm text-gray-300 line-clamp-2 flex-1 mr-4">
        {post.text}
      </p>
      <div className="flex gap-2 shrink-0">
        <span className="px-2 py-1 bg-violet-500/20 text-violet-400 text-xs rounded-full">
          {post.hookType}
        </span>
        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
          {post.contentType}
        </span>
      </div>
    </div>
    <PostMetrics post={post} />
  </div>
);

// Post Metrics Row
export const PostMetrics = ({ post, className }) => (
  <div className={cn("flex items-center gap-6 text-sm text-gray-400", className)}>
    <span className="flex items-center gap-1">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      {formatNumber(post.impressions)}
    </span>
    <span className="flex items-center gap-1">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {formatNumber(post.likes)}
    </span>
    <span className="flex items-center gap-1">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 1l4 4-4 4" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <path d="M7 23l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
      {formatNumber(post.retweets)}
    </span>
    <span className="flex items-center gap-1">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      {post.replies}
    </span>
    <span className="flex items-center gap-1">
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {formatNumber(post.bookmarks)}
    </span>
    {post.date && (
      <span className="ml-auto text-gray-500">{post.date}</span>
    )}
  </div>
);

// Progress Bar Component
export const ProgressBar = ({ value, max, color = 'violet', className }) => {
  const percent = Math.min((value / max) * 100, 100);
  
  const colors = {
    violet: 'from-violet-500 to-purple-500',
    green: 'from-green-500 to-emerald-500',
    blue: 'from-blue-500 to-cyan-500',
    orange: 'from-orange-500 to-amber-500',
  };
  
  return (
    <div className={cn("h-3 bg-gray-700 rounded-full overflow-hidden", className)}>
      <div
        className={cn("h-full bg-gradient-to-r rounded-full transition-all duration-500", colors[color])}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
};

// Badge Component
export const Badge = ({ children, variant = 'default', className }) => {
  const variants = {
    default: 'bg-gray-700 text-gray-300',
    success: 'bg-green-500/20 text-green-400',
    warning: 'bg-orange-500/20 text-orange-400',
    error: 'bg-red-500/20 text-red-400',
    info: 'bg-blue-500/20 text-blue-400',
    violet: 'bg-violet-500/20 text-violet-400',
  };
  
  return (
    <span className={cn("px-2 py-1 text-xs rounded-full font-medium", variants[variant], className)}>
      {children}
    </span>
  );
};

// Empty State Component
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <Icon className="w-8 h-8 text-gray-500" />
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-400 mb-4 max-w-md mx-auto">{description}</p>
    {action}
  </div>
);
