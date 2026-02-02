import React from 'react';
import { Eye, Heart, Users, TrendingUp } from 'lucide-react';
import {
  MetricCard,
  PostCard,
  ImpressionsChart,
  EngagementChart,
  ChartLegend,
  MonetizationTracker,
} from '../components';
import { formatNumber } from '../utils/helpers';

export const Dashboard = ({
  analytics,
  summaryMetrics,
  topPosts,
  onPostClick,
  monetizationGoal = 5000000,
  monetizationDeadline = null,
  timeRange = '30d'
}) => {
  // Get label for time range
  const timeLabel = timeRange === '7d' ? '7d' : timeRange === '30d' ? '30d' : timeRange === '90d' ? '90d' : 'All';
  if (!analytics || !summaryMetrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monetization Tracker - uses real impressions from CSV/API */}
      <MonetizationTracker
        current={summaryMetrics.totalImpressions}
        goal={monetizationGoal}
        deadline={monetizationDeadline}
      />

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          icon={Eye}
          iconColor="text-blue-400"
          label={`Impressions (${timeLabel})`}
          value={formatNumber(summaryMetrics.totalImpressions)}
          trend={summaryMetrics.trends?.impressionsTrend
            ? `${summaryMetrics.trends.impressionsTrend.value > 0 ? '+' : ''}${summaryMetrics.trends.impressionsTrend.value}%`
            : null}
          trendDirection={summaryMetrics.trends?.impressionsTrend?.direction || 'up'}
        />
        <MetricCard
          icon={Heart}
          iconColor="text-red-400"
          label={`Likes (${timeLabel})`}
          value={formatNumber(summaryMetrics.totalLikes)}
          trend={summaryMetrics.trends?.likesTrend
            ? `${summaryMetrics.trends.likesTrend.value > 0 ? '+' : ''}${summaryMetrics.trends.likesTrend.value}%`
            : null}
          trendDirection={summaryMetrics.trends?.likesTrend?.direction || 'up'}
        />
        <MetricCard
          icon={Users}
          iconColor="text-violet-400"
          label="Followers"
          value={formatNumber(summaryMetrics.currentFollowers)}
          trend={summaryMetrics.trends?.followersTrend
            ? `${summaryMetrics.trends.followersTrend.value >= 0 ? '+' : ''}${summaryMetrics.trends.followersTrend.value}`
            : null}
          trendDirection={summaryMetrics.trends?.followersTrend?.direction || 'up'}
        />
        <MetricCard
          icon={TrendingUp}
          iconColor="text-green-400"
          label="Engagement Rate"
          value={`${summaryMetrics.avgEngagementRate}%`}
          trend={summaryMetrics.trends?.engagementTrend
            ? `${summaryMetrics.trends.engagementTrend.value >= 0 ? '+' : ''}${summaryMetrics.trends.engagementTrend.value}%`
            : null}
          trendDirection={summaryMetrics.trends?.engagementTrend?.direction || 'up'}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Impressions Chart */}
        <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
          <h3 className="font-semibold mb-4">Impressions Over Time</h3>
          <ImpressionsChart data={analytics.impressionsData} />
        </div>

        {/* Engagement Chart */}
        <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
          <h3 className="font-semibold mb-4">Engagement Breakdown</h3>
          <EngagementChart data={analytics.engagementData.slice(-14)} />
          <ChartLegend
            items={[
              { label: 'Likes', color: '#ef4444' },
              { label: 'Retweets', color: '#22c55e' },
              { label: 'Replies', color: '#3b82f6' },
            ]}
          />
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="font-semibold mb-4">Top Performing Posts</h3>
        <div className="space-y-3">
          {topPosts.slice(0, 3).map((post) => (
            <PostCard key={post.id} post={post} onClick={onPostClick} />
          ))}
        </div>
      </div>
    </div>
  );
};
