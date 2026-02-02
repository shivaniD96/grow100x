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

    // If days is Infinity (All Time), return all data without filtering
    if (days === Infinity) {
      return dataArray;
    }

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

    // "all" means no filtering - show all data
    const days = range === 'all' ? Infinity : range === '7d' ? 7 : range === '30d' ? 30 : 90;

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
    // If "all time", include all posts
    const filteredTopPosts = days === Infinity
      ? (data.topPosts || [])
      : (data.topPosts || []).filter(post => {
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
          const cutoffDate = new Date(mostRecentDate.getTime() - days * 24 * 60 * 60 * 1000);
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

    // Debug: Log the totals
    const totalImp = filteredImpressions.reduce((sum, d) => sum + (d.impressions || 0), 0);
    console.log('Total impressions after filter:', totalImp);
    console.log('Raw data summary:', data.summary);
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
  // For "All Time", use the raw CSV summary totals to ensure we show ALL data
  const useRawTotals = timeRange === 'all' && csvData?.summary;

  // Debug: Log what we have
  if (csvData) {
    console.log('csvData.summary:', csvData.summary);
    console.log('useRawTotals:', useRawTotals);
    console.log('timeRange:', timeRange);
  }

  const calculatedImpressions = analytics?.impressionsData?.reduce((sum, d) => sum + (d.impressions || 0), 0) || 0;
  const rawImpressions = csvData?.summary?.totalImpressions || 0;

  console.log('Calculated impressions from analytics:', calculatedImpressions);
  console.log('Raw impressions from csvData.summary:', rawImpressions);

  // Calculate real trends from data
  const trends = analytics ? calculateTrends(analytics, csvData, timeRange) : null;

  const summaryMetrics = analytics ? {
    totalImpressions: useRawTotals ? rawImpressions : calculatedImpressions,
    totalLikes: useRawTotals
      ? (csvData.summary.totalLikes || 0)
      : (analytics.engagementData?.reduce((sum, d) => sum + (d.likes || 0), 0) || 0),
    totalRetweets: analytics.engagementData?.reduce((sum, d) => sum + (d.retweets || 0), 0) || 0,
    totalReplies: analytics.engagementData?.reduce((sum, d) => sum + (d.replies || 0), 0) || 0,
    currentFollowers: analytics.impressionsData?.[analytics.impressionsData.length - 1]?.followers || 0,
    avgEngagementRate: calculateAvgEngagementRate(analytics),
    // Video metrics if available
    totalViews: csvData?.videoAnalytics?.summary?.totalViews || 0,
    totalWatchTime: csvData?.videoAnalytics?.summary?.totalWatchTimeMinutes || 0,
    // Include raw totals for debugging
    rawTotalImpressions: rawImpressions,
    // Real calculated trends
    trends: trends,
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

// Helper to calculate percentage change between two values
function calculatePercentChange(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return parseFloat((((current - previous) / previous) * 100).toFixed(1));
}

// Helper to split data into current and previous periods for trend calculation
function splitDataIntoPeriods(dataArray, days, mostRecentDate) {
  if (!dataArray || dataArray.length === 0) {
    return { current: [], previous: [] };
  }

  // If "all time", we can't calculate trends - need a specific period
  if (days === Infinity) {
    // For all time, split data in half
    const midpoint = Math.floor(dataArray.length / 2);
    return {
      current: dataArray.slice(midpoint),
      previous: dataArray.slice(0, midpoint)
    };
  }

  const cutoffDate = new Date(mostRecentDate.getTime() - days * 24 * 60 * 60 * 1000);
  const previousCutoffDate = new Date(cutoffDate.getTime() - days * 24 * 60 * 60 * 1000);

  const current = [];
  const previous = [];

  dataArray.forEach(item => {
    const dateStr = item.fullDate || item.date;
    if (!dateStr) return;

    const itemDate = new Date(dateStr);
    if (isNaN(itemDate.getTime())) return;

    if (itemDate >= cutoffDate) {
      current.push(item);
    } else if (itemDate >= previousCutoffDate && itemDate < cutoffDate) {
      previous.push(item);
    }
  });

  return { current, previous };
}

// Calculate trends by comparing current period to previous period
function calculateTrends(analytics, csvData, timeRange) {
  if (!analytics?.impressionsData || !analytics?.engagementData) {
    return {
      impressionsTrend: null,
      likesTrend: null,
      followersTrend: null,
      engagementTrend: null
    };
  }

  // Get days for the time range
  const days = timeRange === 'all' ? Infinity : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

  // Find most recent date in the data (not today)
  const allData = [...(csvData?.impressionsData || analytics.impressionsData || [])];
  let mostRecentDate = null;
  for (const item of allData) {
    const dateStr = item.fullDate || item.date;
    if (!dateStr) continue;
    const itemDate = new Date(dateStr);
    if (!isNaN(itemDate.getTime())) {
      if (!mostRecentDate || itemDate > mostRecentDate) {
        mostRecentDate = itemDate;
      }
    }
  }

  // If no valid date found, can't calculate trends
  if (!mostRecentDate) {
    return {
      impressionsTrend: null,
      likesTrend: null,
      followersTrend: null,
      engagementTrend: null
    };
  }

  console.log('Trend calculation - Most recent date:', mostRecentDate, 'Days:', days);

  // Split impressions data into periods
  const impressionsPeriods = splitDataIntoPeriods(
    csvData?.impressionsData || analytics.impressionsData,
    days,
    mostRecentDate
  );

  // Split engagement data into periods
  const engagementPeriods = splitDataIntoPeriods(
    csvData?.engagementData || analytics.engagementData,
    days,
    mostRecentDate
  );

  // Calculate current and previous metrics
  const currentImpressions = impressionsPeriods.current.reduce((sum, d) => sum + (d.impressions || 0), 0);
  const previousImpressions = impressionsPeriods.previous.reduce((sum, d) => sum + (d.impressions || 0), 0);

  const currentLikes = engagementPeriods.current.reduce((sum, d) => sum + (d.likes || 0), 0);
  const previousLikes = engagementPeriods.previous.reduce((sum, d) => sum + (d.likes || 0), 0);

  // Calculate follower change (net followers gained in current vs previous period)
  const currentFollowerData = impressionsPeriods.current;
  const previousFollowerData = impressionsPeriods.previous;

  // Get follower change by looking at first and last values in each period
  const currentFollowerChange = currentFollowerData.length > 1
    ? (currentFollowerData[currentFollowerData.length - 1]?.followers || 0) - (currentFollowerData[0]?.followers || 0)
    : 0;
  const previousFollowerChange = previousFollowerData.length > 1
    ? (previousFollowerData[previousFollowerData.length - 1]?.followers || 0) - (previousFollowerData[0]?.followers || 0)
    : 0;

  // Calculate engagement rates for current and previous
  const currentEngagement = engagementPeriods.current.reduce((sum, d) =>
    sum + (d.likes || 0) + (d.retweets || 0) + (d.replies || 0), 0
  );
  const previousEngagement = engagementPeriods.previous.reduce((sum, d) =>
    sum + (d.likes || 0) + (d.retweets || 0) + (d.replies || 0), 0
  );

  const currentEngagementRate = currentImpressions > 0
    ? (currentEngagement / currentImpressions) * 100
    : 0;
  const previousEngagementRate = previousImpressions > 0
    ? (previousEngagement / previousImpressions) * 100
    : 0;

  console.log('Trend calculation results:', {
    currentImpressions,
    previousImpressions,
    currentLikes,
    previousLikes,
    currentFollowerChange,
    previousFollowerChange,
    currentEngagementRate: currentEngagementRate.toFixed(2),
    previousEngagementRate: previousEngagementRate.toFixed(2),
    currentPeriodDays: impressionsPeriods.current.length,
    previousPeriodDays: impressionsPeriods.previous.length
  });

  return {
    impressionsTrend: {
      value: calculatePercentChange(currentImpressions, previousImpressions),
      direction: currentImpressions >= previousImpressions ? 'up' : 'down'
    },
    likesTrend: {
      value: calculatePercentChange(currentLikes, previousLikes),
      direction: currentLikes >= previousLikes ? 'up' : 'down'
    },
    followersTrend: {
      value: currentFollowerChange,
      direction: currentFollowerChange >= previousFollowerChange ? 'up' : 'down',
      isAbsolute: true // This is an absolute number, not a percentage
    },
    engagementTrend: {
      value: parseFloat((currentEngagementRate - previousEngagementRate).toFixed(1)),
      direction: currentEngagementRate >= previousEngagementRate ? 'up' : 'down',
      isAbsolute: true // This is a percentage point change
    }
  };
}
