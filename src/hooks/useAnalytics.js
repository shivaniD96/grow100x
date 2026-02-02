import { useState, useEffect, useCallback } from 'react';
import { generateMockAnalytics, mockTopPosts, mockHookPerformance, mockAccountStats } from '../data/mockAnalytics';
import { generateInsights } from '../data/insights';
import { storage } from '../utils/helpers';
import {
  initiateOAuth,
  handleOAuthCallback,
  clearTokens,
  fetchUserProfile,
  fetchUserTweets,
  transformTweetsToAnalytics,
  transformToTopPosts,
  calculateHookPerformance
} from '../services/xApi';
import {
  processCSVFile,
  mergeAnalyticsData,
  CSV_TYPES
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

  // Store merged CSV data
  const [csvData, setCsvData] = useState(() => storage.get('x_csv_data', null));

  // Track which CSV types have been uploaded
  const [uploadedTypes, setUploadedTypes] = useState(() => storage.get('x_csv_types', []));

  // Handle OAuth callback on mount
  useEffect(() => {
    const checkOAuthCallback = async () => {
      try {
        const result = await handleOAuthCallback();
        if (result) {
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
    if (isCSVMode && csvData && !analytics) {
      loadCSVData(csvData, timeRange);
    }
  }, [isCSVMode, csvData]);

  // Re-filter data when timeRange changes in CSV mode
  useEffect(() => {
    if (isCSVMode && csvData) {
      loadCSVData(csvData, timeRange);
    }
  }, [timeRange, isCSVMode]);

  // Find the most recent date in a data array
  const findMostRecentDate = useCallback((dataArray) => {
    if (!dataArray || dataArray.length === 0) return new Date();

    let mostRecent = null;
    for (const item of dataArray) {
      const dateStr = item.fullDate || item.date;
      if (!dateStr) continue;

      const itemDate = new Date(dateStr);
      if (!isNaN(itemDate.getTime())) {
        if (!mostRecent || itemDate > mostRecent) {
          mostRecent = itemDate;
        }
      }
    }
    return mostRecent || new Date();
  }, []);

  // Filter data by time range (from most recent date in data, not today)
  const filterByTimeRange = useCallback((dataArray, days, referenceDate) => {
    if (!dataArray || dataArray.length === 0) return dataArray;

    const cutoffDate = new Date(referenceDate.getTime() - days * 24 * 60 * 60 * 1000);

    return dataArray.filter(item => {
      // Try to parse the date from fullDate or date field
      const dateStr = item.fullDate || item.date;
      if (!dateStr) return true; // Keep items without dates

      const itemDate = new Date(dateStr);
      if (isNaN(itemDate.getTime())) return true; // Keep items with invalid dates

      return itemDate >= cutoffDate;
    });
  }, []);

  // Load CSV data helper with time range filtering
  const loadCSVData = useCallback((data, range = '30d') => {
    if (!data) return;

    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;

    // Find the most recent date in the data to use as reference
    // This way "last 7 days" means "7 days before the most recent data point"
    const allData = [...(data.impressionsData || []), ...(data.engagementData || [])];
    const mostRecentDate = findMostRecentDate(allData);
    console.log('Most recent date in data:', mostRecentDate, 'Filtering for last', days, 'days');

    // Filter data by time range from the most recent date
    const filteredImpressions = filterByTimeRange(data.impressionsData || [], days, mostRecentDate);
    const filteredEngagement = filterByTimeRange(data.engagementData || [], days, mostRecentDate);

    console.log('Filtered impressions:', filteredImpressions.length, 'of', (data.impressionsData || []).length);
    console.log('Filtered engagement:', filteredEngagement.length, 'of', (data.engagementData || []).length);

    // Create analytics object from filtered data
    const analyticsData = {
      impressionsData: filteredImpressions,
      engagementData: filteredEngagement
    };

    // Filter top posts by date range too (relative to most recent date)
    const cutoffDate = new Date(mostRecentDate.getTime() - days * 24 * 60 * 60 * 1000);
    const filteredTopPosts = (data.topPosts || []).filter(post => {
      if (!post.date) return true;
      // Parse relative dates like "2 days ago", "Yesterday", etc.
      const dateMatch = post.date.match(/(\d+)\s*days?\s*ago/i);
      if (dateMatch) {
        const daysAgo = parseInt(dateMatch[1]);
        return daysAgo <= days;
      }
      if (post.date.toLowerCase() === 'yesterday') return days >= 1;
      if (post.date.toLowerCase() === 'today') return true;
      // For absolute dates, try parsing
      const postDate = new Date(post.date);
      if (!isNaN(postDate.getTime())) {
        return postDate >= cutoffDate;
      }
      return true;
    });

    setAnalytics(analyticsData);
    setTopPosts(filteredTopPosts);
    setHookPerformance(data.hookPerformance || []);

    // Create account stats from summary
    setAccountStats({
      username: 'CSV Import',
      displayName: 'Your Data',
      followers: data.accountOverview?.summary?.totalNewFollows || 0,
      following: 0,
      profileImage: null,
      // Include additional data types info
      hasAccountOverview: !!data.accountOverview,
      hasContentAnalytics: !!data.contentAnalytics,
      hasVideoAnalytics: !!data.videoAnalytics,
    });

    // Generate insights from filtered data
    if (analyticsData.impressionsData.length > 0 || analyticsData.engagementData.length > 0) {
      setInsights(generateInsights(analyticsData, filteredTopPosts, data.hookPerformance || []));
    }
  }, [filterByTimeRange, findMostRecentDate]);

  // Import CSV files
  const importCSV = useCallback(async (files) => {
    setIsLoading(true);
    setError(null);

    try {
      const processedFiles = [];
      const newTypes = [];

      for (const file of files) {
        console.log('Processing file:', file.name);
        const result = processCSVFile(file.content);
        processedFiles.push(result);

        if (!newTypes.includes(result.type)) {
          newTypes.push(result.type);
        }
        console.log('File processed as:', result.type);
      }

      // Merge all processed data
      const mergedData = mergeAnalyticsData(processedFiles);
      console.log('Merged data:', mergedData);

      // Update uploaded types
      const allTypes = [...new Set([...uploadedTypes, ...newTypes])];

      // Store in localStorage
      storage.set('x_csv_data', mergedData);
      storage.set('x_csv_types', allTypes);
      storage.set('x_csv_mode', true);
      storage.set('x_connected', true);
      storage.set('x_demo_mode', false);

      setCsvData(mergedData);
      setUploadedTypes(allTypes);
      setIsCSVMode(true);
      setIsDemoMode(false);
      setIsConnected(true);

      // Load the data with current time range
      loadCSVData(mergedData, timeRange);

    } catch (err) {
      console.error('CSV import error:', err);
      setError(err.message || 'Failed to import CSV files');
    } finally {
      setIsLoading(false);
    }
  }, [uploadedTypes, loadCSVData, timeRange]);

  // Connect to X (real OAuth or demo mode)
  const connect = useCallback(async (useDemo = false) => {
    setIsLoading(true);
    setError(null);

    try {
      if (useDemo) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        storage.set('x_connected', true);
        storage.set('x_demo_mode', true);
        storage.set('x_csv_mode', false);
        setIsDemoMode(true);
        setIsCSVMode(false);
        setIsConnected(true);
      } else {
        await initiateOAuth();
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
    storage.remove('x_csv_data');
    storage.remove('x_csv_types');
    storage.remove('x_user_id');
    setIsConnected(false);
    setIsDemoMode(false);
    setIsCSVMode(false);
    setCsvData(null);
    setUploadedTypes([]);
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

    // If CSV mode, reload from stored data
    if (isCSVMode && csvData) {
      loadCSVData(csvData);
      return;
    }

    setIsLoading(true);
    setError(null);

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

    try {
      if (isDemoMode) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const data = generateMockAnalytics(days);
        setAnalytics(data);
        setTopPosts(mockTopPosts);
        setHookPerformance(mockHookPerformance);
        setAccountStats(mockAccountStats);
        setInsights(generateInsights(data, mockTopPosts, mockHookPerformance));
      } else {
        const userProfile = await fetchUserProfile();
        storage.set('x_user_id', userProfile.id);

        const tweets = await fetchUserTweets(userProfile.id, days);
        const analyticsData = transformTweetsToAnalytics(tweets, userProfile, days);
        const topPostsData = transformToTopPosts(tweets, 5);
        const hookPerfData = calculateHookPerformance(tweets);

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
  }, [isConnected, timeRange, isDemoMode, isCSVMode, csvData, loadCSVData]);

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
    totalImpressions: analytics.impressionsData?.reduce((sum, d) => sum + (d.impressions || 0), 0) || 0,
    totalLikes: analytics.engagementData?.reduce((sum, d) => sum + (d.likes || 0), 0) || 0,
    totalRetweets: analytics.engagementData?.reduce((sum, d) => sum + (d.retweets || 0), 0) || 0,
    totalReplies: analytics.engagementData?.reduce((sum, d) => sum + (d.replies || 0), 0) || 0,
    currentFollowers: analytics.impressionsData?.[analytics.impressionsData.length - 1]?.followers || 0,
    avgEngagementRate: calculateAvgEngagementRate(analytics),
    // Video metrics if available
    totalViews: csvData?.videoAnalytics?.summary?.totalViews || 0,
    totalWatchTime: csvData?.videoAnalytics?.summary?.totalWatchTimeMinutes || 0,
  } : null;

  // Get counts for display
  const getDataCounts = () => {
    if (!csvData) return { posts: 0, days: 0 };
    return {
      posts: csvData.contentAnalytics?.posts?.length || 0,
      days: csvData.accountOverview?.dailyData?.length || analytics?.impressionsData?.length || 0,
    };
  };

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
    csvData,
    uploadedTypes,
    dataCounts: getDataCounts(),
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

  const totalImpressions = analytics.impressionsData.reduce((sum, d) => sum + (d.impressions || 0), 0);
  const totalEngagement = analytics.engagementData.reduce((sum, d) =>
    sum + (d.likes || 0) + (d.retweets || 0) + (d.replies || 0), 0
  );

  if (totalImpressions === 0) return 0;
  return parseFloat(((totalEngagement / totalImpressions) * 100).toFixed(1));
}
