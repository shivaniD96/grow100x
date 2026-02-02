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
import {
  parseCSV,
  transformCSVToAnalytics,
  transformCSVToTopPosts,
  calculateCSVHookPerformance,
  recalculateFromTweets
} from '../utils/csvParser';

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
  const [isCSVMode, setIsCSVMode] = useState(() => storage.get('x_csv_mode', false));
  const [csvRawTweets, setCsvRawTweets] = useState(() => storage.get('x_csv_tweets', []));

  // Handle OAuth callback on mount
  useEffect(() => {
    const checkOAuthCallback = async () => {
      try {
        const result = await handleOAuthCallback();
        if (result) {
          // OAuth successful
          storage.set('x_connected', true);
          storage.set('x_demo_mode', false);
          storage.set('x_csv_mode', false);
          setIsConnected(true);
          setIsDemoMode(false);
          setIsCSVMode(false);
        }
      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err.message);
      }
    };

    checkOAuthCallback();
  }, []);

  // Load CSV data on mount if in CSV mode
  useEffect(() => {
    if (isCSVMode && csvRawTweets.length > 0 && !analytics) {
      loadCSVData(csvRawTweets);
    }
  }, [isCSVMode]);

  // Load CSV data helper
  const loadCSVData = useCallback((rawTweets) => {
    const analyticsData = recalculateFromTweets(rawTweets);
    const topPostsData = transformCSVToTopPosts(rawTweets, 5);
    const hookPerfData = calculateCSVHookPerformance(rawTweets);

    setAnalytics(analyticsData);
    setTopPosts(topPostsData);
    setHookPerformance(hookPerfData);
    setAccountStats({
      username: 'CSV Import',
      displayName: 'Your Data',
      followers: 0,
      following: 0,
      profileImage: null
    });
    setInsights(generateInsights(analyticsData, topPostsData, hookPerfData));
  }, []);

  // Import CSV files
  const importCSV = useCallback(async (files) => {
    setIsLoading(true);
    setError(null);

    try {
      let allTweets = [...csvRawTweets];
      const existingIds = new Set(allTweets.map(t => t.id));

      for (const file of files) {
        const csvData = parseCSV(file.content);
        const { rawTweets } = transformCSVToAnalytics(csvData);

        // Merge, avoiding duplicates
        for (const tweet of rawTweets) {
          if (!existingIds.has(tweet.id)) {
            allTweets.push(tweet);
            existingIds.add(tweet.id);
          }
        }
      }

      // Sort by date
      allTweets.sort((a, b) => new Date(a.time) - new Date(b.time));

      // Store in localStorage
      storage.set('x_csv_tweets', allTweets);
      storage.set('x_csv_mode', true);
      storage.set('x_connected', true);
      storage.set('x_demo_mode', false);

      setCsvRawTweets(allTweets);
      setIsCSVMode(true);
      setIsDemoMode(false);
      setIsConnected(true);

      // Load the data
      loadCSVData(allTweets);

    } catch (err) {
      console.error('CSV import error:', err);
      setError(err.message || 'Failed to import CSV files');
    } finally {
      setIsLoading(false);
    }
  }, [csvRawTweets, loadCSVData]);

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
        storage.set('x_csv_mode', false);
        setIsDemoMode(true);
        setIsCSVMode(false);
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
    storage.remove('x_csv_mode');
    storage.remove('x_csv_tweets');
    storage.remove('x_user_id');
    setIsConnected(false);
    setIsDemoMode(false);
    setIsCSVMode(false);
    setCsvRawTweets([]);
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

    // If CSV mode, reload from stored tweets
    if (isCSVMode && csvRawTweets.length > 0) {
      loadCSVData(csvRawTweets);
      return;
    }

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
      if (!isDemoMode && !isCSVMode) {
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
  }, [isConnected, timeRange, isDemoMode, isCSVMode, csvRawTweets, loadCSVData]);

  // Refresh insights
  const refreshInsights = useCallback(() => {
    if (analytics) {
      setInsights(generateInsights(analytics, topPosts, hookPerformance));
    }
  }, [analytics, topPosts, hookPerformance]);

  // Load data when connected
  useEffect(() => {
    if (isConnected && !isCSVMode) {
      fetchAnalytics();
    }
  }, [isConnected, fetchAnalytics, isCSVMode]);

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
    isCSVMode,
    csvTweetCount: csvRawTweets.length,
    setTimeRange,
    connect,
    disconnect,
    importCSV,
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
