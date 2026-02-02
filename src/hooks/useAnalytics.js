import { useState, useEffect, useCallback } from 'react';
import { generateMockAnalytics, mockTopPosts, mockHookPerformance, mockAccountStats } from '../data/mockAnalytics';
import { generateInsights } from '../data/insights';
import { storage } from '../utils/helpers';
import {
  initiateOAuth,
  handleOAuthCallback,
  clearTokens,
  hasValidSession,
  fetchUserProfile,
  fetchUserTweets,
  transformTweetsToAnalytics,
  transformToTopPosts,
  calculateHookPerformance
} from '../services/xApi';

export const useAnalytics = () => {
  const [isConnected, setIsConnected] = useState(() => storage.get('x_connected', false));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [insights, setInsights] = useState([]);
  const [topPosts, setTopPosts] = useState([]);
  const [hookPerformance, setHookPerformance] = useState([]);
  const [accountStats, setAccountStats] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [isDemoMode, setIsDemoMode] = useState(() => storage.get('x_demo_mode', false));

  // Handle OAuth callback on mount
  useEffect(() => {
    const checkOAuthCallback = async () => {
      try {
        const result = await handleOAuthCallback();
        if (result) {
          // OAuth successful
          storage.set('x_connected', true);
          storage.set('x_demo_mode', false);
          setIsConnected(true);
          setIsDemoMode(false);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err.message);
      }
    };

    checkOAuthCallback();
  }, []);

  // Connect to X (real OAuth or demo mode)
  const connect = useCallback(async (useDemo = false) => {
    setIsLoading(true);
    setError(null);

    try {
      if (useDemo) {
        // Demo mode - use mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        storage.set('x_connected', true);
        storage.set('x_demo_mode', true);
        setIsDemoMode(true);
        setIsConnected(true);
      } else {
        // Real OAuth flow - redirects to X
        await initiateOAuth();
        // Note: This will redirect, so code below won't execute
      }
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Disconnect
  const disconnect = useCallback(() => {
    clearTokens();
    storage.remove('x_connected');
    storage.remove('x_demo_mode');
    storage.remove('x_user_id');
    setIsConnected(false);
    setIsDemoMode(false);
    setAnalytics(null);
    setInsights([]);
    setTopPosts([]);
    setHookPerformance([]);
    setAccountStats(null);
    setError(null);
  }, []);

  // Fetch analytics data (real or mock)
  const fetchAnalytics = useCallback(async () => {
    if (!isConnected) return;

    setIsLoading(true);
    setError(null);

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

    try {
      if (isDemoMode) {
        // Use mock data for demo mode
        await new Promise(resolve => setTimeout(resolve, 500));
        const data = generateMockAnalytics(days);
        setAnalytics(data);
        setTopPosts(mockTopPosts);
        setHookPerformance(mockHookPerformance);
        setAccountStats(mockAccountStats);
        setInsights(generateInsights(data, mockTopPosts, mockHookPerformance));
      } else {
        // Fetch real data from X API
        const userProfile = await fetchUserProfile();

        // Store user ID for future requests
        storage.set('x_user_id', userProfile.id);

        // Fetch tweets
        const tweets = await fetchUserTweets(userProfile.id, days);

        // Transform data to match our format
        const analyticsData = transformTweetsToAnalytics(tweets, userProfile, days);
        const topPostsData = transformToTopPosts(tweets, 5);
        const hookPerfData = calculateHookPerformance(tweets);

        // Create account stats from profile
        const stats = {
          username: userProfile.username,
          displayName: userProfile.displayName,
          followers: userProfile.followers,
          following: userProfile.following,
          profileImage: userProfile.profileImage
        };

        setAnalytics(analyticsData);
        setTopPosts(topPostsData);
        setHookPerformance(hookPerfData);
        setAccountStats(stats);
        setInsights(generateInsights(analyticsData, topPostsData, hookPerfData));
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err.message);

      // Fall back to demo mode on error
      if (!isDemoMode) {
        console.log('Falling back to demo mode');
        const data = generateMockAnalytics(days);
        setAnalytics(data);
        setTopPosts(mockTopPosts);
        setHookPerformance(mockHookPerformance);
        setAccountStats(mockAccountStats);
        setInsights(generateInsights(data, mockTopPosts, mockHookPerformance));
      }
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, timeRange, isDemoMode]);

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
    avgEngagementRate: calculateAvgEngagementRate(analytics),
  } : null;

  return {
    isConnected,
    isLoading,
    error,
    analytics,
    insights,
    topPosts,
    hookPerformance,
    accountStats,
    summaryMetrics,
    timeRange,
    isDemoMode,
    setTimeRange,
    connect,
    disconnect,
    refreshInsights,
    fetchAnalytics,
  };
};

// Helper to calculate average engagement rate
function calculateAvgEngagementRate(analytics) {
  if (!analytics?.impressionsData || !analytics?.engagementData) return 0;

  const totalImpressions = analytics.impressionsData.reduce((sum, d) => sum + d.impressions, 0);
  const totalEngagement = analytics.engagementData.reduce((sum, d) =>
    sum + d.likes + d.retweets + d.replies, 0
  );

  if (totalImpressions === 0) return 0;
  return parseFloat(((totalEngagement / totalImpressions) * 100).toFixed(1));
}
