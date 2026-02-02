import { useState, useEffect, useCallback } from 'react';
import { generateMockAnalytics, mockTopPosts, mockHookPerformance, mockAccountStats } from '../data/mockAnalytics';
import { generateInsights } from '../data/insights';
import { storage } from '../utils/helpers';

export const useAnalytics = () => {
  const [isConnected, setIsConnected] = useState(() => storage.get('x_connected', false));
  const [isLoading, setIsLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [hookPerformance, setHookPerformance] = useState([]);
  const [accountStats, setAccountStats] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  // Connect to X (simulated)
  const connect = useCallback(async () => {
    setIsLoading(true);
    
    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    storage.set('x_connected', true);
    setIsConnected(true);
    setIsLoading(false);
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    storage.remove('x_connected');
    setIsConnected(false);
    setAnalytics(null);
    setInsights([]);
    setTopPosts([]);
    setHookPerformance([]);
    setAccountStats(null);
  }, []);

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = generateMockAnalytics(days);
    
    setAnalytics(data);
    setTopPosts(mockTopPosts);
    setHookPerformance(mockHookPerformance);
    setAccountStats(mockAccountStats);
    setInsights(generateInsights(data, mockTopPosts, mockHookPerformance));
    setIsLoading(false);
  }, [isConnected, timeRange]);

  // Refresh insights
  const refreshInsights = useCallback(() => {
    if (analytics) {
      setInsights(generateInsights(analytics, topPosts, hookPerformance));
    }
  }, [analytics, topPosts, hookPerformance]);

  // Load data when connected
  useEffect(() => {
    if (isConnected) {
      fetchAnalytics();
    }
  }, [isConnected, fetchAnalytics]);

  // Calculate summary metrics
  const summaryMetrics = analytics ? {
    totalImpressions: analytics.impressionsData.reduce((sum, d) => sum + d.impressions, 0),
    totalLikes: analytics.engagementData.reduce((sum, d) => sum + d.likes, 0),
    totalRetweets: analytics.engagementData.reduce((sum, d) => sum + d.retweets, 0),
    totalReplies: analytics.engagementData.reduce((sum, d) => sum + d.replies, 0),
    currentFollowers: analytics.impressionsData[analytics.impressionsData.length - 1]?.followers || 0,
    avgEngagementRate: 4.2, // Calculated from mock data
  } : null;

  return {
    isConnected,
    isLoading,
    analytics,
    insights,
    topPosts,
    hookPerformance,
    accountStats,
    summaryMetrics,
    timeRange,
    setTimeRange,
    connect,
    disconnect,
    refreshInsights,
    fetchAnalytics,
  };
};
