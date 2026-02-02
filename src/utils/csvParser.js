/**
 * CSV Parser for X Analytics Data
 * Supports 3 types of X Analytics exports:
 * 1. Account Overview - Daily summary metrics
 * 2. Content Analytics - Individual post performance
 * 3. Video Analytics - Video-specific metrics
 */

import { format, parseISO } from 'date-fns';
import { detectHookType } from './helpers';

// CSV Types
export const CSV_TYPES = {
  ACCOUNT_OVERVIEW: 'account_overview',
  CONTENT_ANALYTICS: 'content_analytics',
  VIDEO_ANALYTICS: 'video_analytics',
  UNKNOWN: 'unknown'
};

/**
 * Parse CSV text into array of objects
 * Handles X Analytics format where first row may be a title row
 */
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  // Find the header row - X Analytics sometimes has a title row first
  // The header row is the one with multiple non-empty columns that look like column names
  let headerRowIndex = 0;
  let headers = parseCSVLine(lines[0]);

  // Check if first row is a title row (has mostly empty columns except first)
  const nonEmptyInFirstRow = headers.filter(h => h.trim() !== '').length;
  const totalColumns = headers.length;

  // If first row has only 1-2 non-empty values but many columns, it's likely a title
  // Or if the first cell contains words like "overview", "analytics", etc.
  const firstCellLower = headers[0].toLowerCase();
  const isTitleRow = (nonEmptyInFirstRow <= 2 && totalColumns > 3) ||
    firstCellLower.includes('overview') ||
    firstCellLower.includes('analytics') ||
    firstCellLower.includes('summary');

  if (isTitleRow && lines.length > 2) {
    console.log('Detected title row, using second row as headers');
    headerRowIndex = 1;
    headers = parseCSVLine(lines[1]);
  }

  console.log('CSV Headers found:', headers);

  const data = [];
  for (let i = headerRowIndex + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length > 0 && values.some(v => v.trim() !== '')) {
      const row = {};
      headers.forEach((header, index) => {
        const normalizedHeader = header.trim().toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
        row[normalizedHeader] = values[index] || '';
      });
      data.push(row);
    }
  }

  console.log('CSV Rows parsed:', data.length);
  return data;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Detect the type of CSV based on columns
 */
export function detectCSVType(csvData) {
  if (csvData.length === 0) return CSV_TYPES.UNKNOWN;

  const keys = Object.keys(csvData[0]);
  console.log('Detecting CSV type from keys:', keys);

  // Normalize keys for easier matching
  const normalizedKeys = keys.map(k => k.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, ''));
  console.log('Normalized keys:', normalizedKeys);

  // Video Analytics: has "views", "watch_time", "completion_rate", "video"
  // X Analytics video exports have: Date, Views, Watch Time (ms), Completion Rate, Average Watch Time (ms)
  if (normalizedKeys.some(k =>
    k.includes('watch_time') ||
    k.includes('completion_rate') ||
    k.includes('average_watch_time') ||
    k.includes('video_views') ||
    (k === 'views' && normalizedKeys.some(nk => nk.includes('watch')))
  )) {
    return CSV_TYPES.VIDEO_ANALYTICS;
  }

  // Content Analytics: has "post_id" or "post_text" or "post_link" or "tweet"
  if (normalizedKeys.some(k =>
    k.includes('post_id') ||
    k.includes('post_text') ||
    k.includes('post_link') ||
    k.includes('tweet')
  )) {
    return CSV_TYPES.CONTENT_ANALYTICS;
  }

  // Account Overview: has "date" with engagement metrics but no post_id/post_text
  // X Analytics account exports have: Date, Impressions, Likes, Engagements, New follows, etc.
  const hasDate = normalizedKeys.some(k => k === 'date');
  const hasEngagementMetrics = normalizedKeys.some(k =>
    k === 'impressions' ||
    k === 'likes' ||
    k === 'engagements' ||
    k === 'new_follows' ||
    k === 'profile_visits'
  );

  if (hasDate && hasEngagementMetrics) {
    return CSV_TYPES.ACCOUNT_OVERVIEW;
  }

  return CSV_TYPES.UNKNOWN;
}

/**
 * Find a value from multiple possible column names
 */
function findValue(row, ...possibleNames) {
  for (const name of possibleNames) {
    const normalizedName = name.toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
    if (row[normalizedName] !== undefined && row[normalizedName] !== '') {
      return row[normalizedName];
    }
  }
  return '';
}

/**
 * Parse integer safely
 */
function safeInt(value) {
  const parsed = parseInt(value || '0', 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse float safely
 */
function safeFloat(value) {
  const parsed = parseFloat(value || '0');
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Transform Account Overview CSV to app format
 * Columns: Date, Impressions, Likes, Engagements, Bookmarks, Shares, New follows, Unfollows, Replies, Reposts, Profile visits, etc.
 */
export function transformAccountOverview(csvData) {
  console.log('Transforming Account Overview data, rows:', csvData.length);

  const dailyData = csvData.map(row => {
    const date = findValue(row, 'date', 'Date');

    return {
      date,
      impressions: safeInt(findValue(row, 'impressions', 'Impressions')),
      likes: safeInt(findValue(row, 'likes', 'Likes')),
      engagements: safeInt(findValue(row, 'engagements', 'Engagements')),
      bookmarks: safeInt(findValue(row, 'bookmarks', 'Bookmarks')),
      shares: safeInt(findValue(row, 'shares', 'Shares')),
      newFollows: safeInt(findValue(row, 'new_follows', 'New follows')),
      unfollows: safeInt(findValue(row, 'unfollows', 'Unfollows')),
      replies: safeInt(findValue(row, 'replies', 'Replies')),
      reposts: safeInt(findValue(row, 'reposts', 'Reposts')),
      profileVisits: safeInt(findValue(row, 'profile_visits', 'Profile visits')),
      videoViews: safeInt(findValue(row, 'video_views', 'Video views')),
      mediaViews: safeInt(findValue(row, 'media_views', 'Media views')),
    };
  }).filter(row => row.date);

  // Sort by date
  dailyData.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Convert to chart format
  const impressionsData = [];
  const engagementData = [];
  const followerData = [];

  let cumulativeFollowers = 0;

  dailyData.forEach(day => {
    const parsedDate = parseDate(day.date);
    if (!parsedDate) return;

    const dateStr = format(parsedDate, 'MMM d');
    const fullDate = parsedDate.toISOString();

    cumulativeFollowers += day.newFollows - day.unfollows;

    impressionsData.push({
      date: dateStr,
      fullDate,
      impressions: day.impressions,
      followers: cumulativeFollowers
    });

    engagementData.push({
      date: dateStr,
      fullDate,
      likes: day.likes,
      retweets: day.reposts + day.shares,
      replies: day.replies,
      bookmarks: day.bookmarks
    });

    followerData.push({
      date: dateStr,
      fullDate,
      newFollows: day.newFollows,
      unfollows: day.unfollows,
      netGrowth: day.newFollows - day.unfollows
    });
  });

  return {
    type: CSV_TYPES.ACCOUNT_OVERVIEW,
    impressionsData,
    engagementData,
    followerData,
    dailyData,
    summary: {
      totalImpressions: dailyData.reduce((sum, d) => sum + d.impressions, 0),
      totalLikes: dailyData.reduce((sum, d) => sum + d.likes, 0),
      totalEngagements: dailyData.reduce((sum, d) => sum + d.engagements, 0),
      totalNewFollows: dailyData.reduce((sum, d) => sum + d.newFollows, 0),
      totalUnfollows: dailyData.reduce((sum, d) => sum + d.unfollows, 0),
      totalProfileVisits: dailyData.reduce((sum, d) => sum + d.profileVisits, 0),
    }
  };
}

/**
 * Transform Content Analytics CSV to app format
 * Columns: Post id, Date, Post text, Impressions, Likes, Engagements, etc.
 */
export function transformContentAnalytics(csvData) {
  console.log('Transforming Content Analytics data, rows:', csvData.length);

  const posts = csvData.map((row, index) => {
    const text = findValue(row, 'post_text', 'Post text', 'Tweet text', 'text');
    const date = findValue(row, 'date', 'Date', 'time');
    const id = findValue(row, 'post_id', 'Post id', 'Tweet id', 'id') || `post_${index}`;

    return {
      id,
      text,
      date,
      link: findValue(row, 'post_link', 'Post Link'),
      impressions: safeInt(findValue(row, 'impressions', 'Impressions')),
      likes: safeInt(findValue(row, 'likes', 'Likes')),
      engagements: safeInt(findValue(row, 'engagements', 'Engagements')),
      bookmarks: safeInt(findValue(row, 'bookmarks', 'Bookmarks')),
      shares: safeInt(findValue(row, 'shares', 'Shares')),
      newFollows: safeInt(findValue(row, 'new_follows', 'New follows')),
      replies: safeInt(findValue(row, 'replies', 'Replies')),
      reposts: safeInt(findValue(row, 'reposts', 'Reposts')),
      profileVisits: safeInt(findValue(row, 'profile_visits', 'Profile visits')),
      detailExpands: safeInt(findValue(row, 'detail_expands', 'Detail Expands')),
      urlClicks: safeInt(findValue(row, 'url_clicks', 'URL Clicks')),
      hashtagClicks: safeInt(findValue(row, 'hashtag_clicks', 'Hashtag Clicks')),
      permalinkClicks: safeInt(findValue(row, 'permalink_clicks', 'Permalink Clicks')),
    };
  }).filter(post => post.text || post.impressions > 0);

  // Group by date for charts
  const byDate = {};
  posts.forEach(post => {
    const parsedDate = parseDate(post.date);
    const dateKey = parsedDate ? format(parsedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    if (!byDate[dateKey]) {
      byDate[dateKey] = {
        impressions: 0,
        likes: 0,
        reposts: 0,
        shares: 0,
        replies: 0,
        bookmarks: 0,
        posts: []
      };
    }

    byDate[dateKey].impressions += post.impressions;
    byDate[dateKey].likes += post.likes;
    byDate[dateKey].reposts += post.reposts;
    byDate[dateKey].shares += post.shares;
    byDate[dateKey].replies += post.replies;
    byDate[dateKey].bookmarks += post.bookmarks;
    byDate[dateKey].posts.push(post);
  });

  // Convert to chart arrays
  const impressionsData = [];
  const engagementData = [];

  Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([dateKey, data]) => {
      const date = parseISO(dateKey);
      const dateStr = format(date, 'MMM d');

      impressionsData.push({
        date: dateStr,
        fullDate: date.toISOString(),
        impressions: data.impressions,
        followers: 0
      });

      engagementData.push({
        date: dateStr,
        fullDate: date.toISOString(),
        likes: data.likes,
        retweets: data.reposts + data.shares,
        replies: data.replies,
        bookmarks: data.bookmarks
      });
    });

  // Calculate top posts
  const topPosts = posts
    .filter(p => p.impressions > 0 || p.likes > 0)
    .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
    .slice(0, 10)
    .map(post => {
      const parsedDate = parseDate(post.date);
      return {
        id: post.id,
        text: post.text || 'No text available',
        impressions: post.impressions,
        likes: post.likes,
        retweets: post.reposts + post.shares,
        replies: post.replies,
        bookmarks: post.bookmarks,
        date: parsedDate ? formatRelativeDate(parsedDate) : 'Unknown',
        hookType: post.text ? detectHookType(post.text) : 'Unknown',
        contentType: detectContentType(post.text),
        postedAt: parsedDate ? format(parsedDate, 'h:mm a') : ''
      };
    });

  // Calculate hook performance
  const hookPerformance = calculateHookPerformance(posts);

  return {
    type: CSV_TYPES.CONTENT_ANALYTICS,
    impressionsData,
    engagementData,
    posts,
    topPosts,
    hookPerformance,
    summary: {
      totalPosts: posts.length,
      totalImpressions: posts.reduce((sum, p) => sum + p.impressions, 0),
      totalLikes: posts.reduce((sum, p) => sum + p.likes, 0),
      totalEngagements: posts.reduce((sum, p) => sum + p.engagements, 0),
    }
  };
}

/**
 * Transform Video Analytics CSV to app format
 * Columns: Date, Views, Watch Time (ms), Completion Rate, Average Watch Time (ms), Estimated Revenue
 */
export function transformVideoAnalytics(csvData) {
  console.log('Transforming Video Analytics data, rows:', csvData.length);

  const videoData = csvData.map(row => {
    const date = findValue(row, 'date', 'Date');

    return {
      date,
      views: safeInt(findValue(row, 'views', 'Views')),
      watchTimeMs: safeInt(findValue(row, 'watch_time_ms', 'Watch Time (ms)', 'watch_time')),
      completionRate: safeFloat(findValue(row, 'completion_rate', 'Completion Rate')),
      avgWatchTimeMs: safeInt(findValue(row, 'average_watch_time_ms', 'Average Watch Time (ms)', 'avg_watch_time')),
      estimatedRevenue: safeFloat(findValue(row, 'estimated_revenue', 'Estimated Revenue', 'revenue')),
    };
  }).filter(row => row.date);

  // Sort by date
  videoData.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Convert to chart format
  const viewsData = [];
  const watchTimeData = [];

  videoData.forEach(day => {
    const parsedDate = parseDate(day.date);
    if (!parsedDate) return;

    const dateStr = format(parsedDate, 'MMM d');
    const fullDate = parsedDate.toISOString();

    viewsData.push({
      date: dateStr,
      fullDate,
      views: day.views,
      completionRate: day.completionRate
    });

    watchTimeData.push({
      date: dateStr,
      fullDate,
      watchTimeMinutes: Math.round(day.watchTimeMs / 60000),
      avgWatchTimeSeconds: Math.round(day.avgWatchTimeMs / 1000)
    });
  });

  return {
    type: CSV_TYPES.VIDEO_ANALYTICS,
    viewsData,
    watchTimeData,
    videoData,
    summary: {
      totalViews: videoData.reduce((sum, d) => sum + d.views, 0),
      totalWatchTimeMinutes: Math.round(videoData.reduce((sum, d) => sum + d.watchTimeMs, 0) / 60000),
      avgCompletionRate: videoData.length > 0
        ? (videoData.reduce((sum, d) => sum + d.completionRate, 0) / videoData.length).toFixed(1)
        : 0,
      totalEstimatedRevenue: videoData.reduce((sum, d) => sum + d.estimatedRevenue, 0).toFixed(2),
    }
  };
}

/**
 * Calculate hook performance from posts
 */
function calculateHookPerformance(posts) {
  const hookStats = {};

  posts.forEach(post => {
    if (!post.text) return;

    const hookType = detectHookType(post.text);

    if (!hookStats[hookType]) {
      hookStats[hookType] = {
        hook: hookType,
        totalImpressions: 0,
        totalEngagement: 0,
        posts: 0
      };
    }

    hookStats[hookType].totalImpressions += post.impressions || 0;
    hookStats[hookType].totalEngagement += (post.likes || 0) + (post.reposts || 0) + (post.shares || 0) + (post.replies || 0);
    hookStats[hookType].posts += 1;
  });

  return Object.values(hookStats)
    .filter(stat => stat.posts > 0)
    .map(stat => ({
      hook: stat.hook,
      avgImpressions: Math.round(stat.totalImpressions / stat.posts),
      avgEngagement: stat.totalImpressions > 0
        ? parseFloat(((stat.totalEngagement / stat.totalImpressions) * 100).toFixed(1))
        : 0,
      posts: stat.posts
    }))
    .sort((a, b) => b.avgImpressions - a.avgImpressions);
}

/**
 * Parse various date formats from X exports
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  const cleaned = dateStr.toString().trim();
  if (!cleaned) return null;

  // Try ISO format first
  let date = new Date(cleaned);
  if (!isNaN(date.getTime())) return date;

  // Try common formats
  const patterns = [
    /^(\d{4})-(\d{2})-(\d{2})/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /^(\w+)\s+(\d{1,2}),?\s+(\d{4})/,
    /^(\d{1,2})\s+(\w+)\s+(\d{4})/,
  ];

  for (const pattern of patterns) {
    if (pattern.test(cleaned)) {
      date = new Date(cleaned);
      if (!isNaN(date.getTime())) return date;
    }
  }

  return null;
}

/**
 * Detect content type from post text
 */
function detectContentType(text) {
  if (!text) return 'Unknown';
  if (text.length > 200) return 'Long-form';
  return 'Single Post';
}

/**
 * Format relative date
 */
function formatRelativeDate(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return format(date, 'MMM d, yyyy');
}

/**
 * Process a single CSV file and return typed data
 */
export function processCSVFile(content) {
  const csvData = parseCSV(content);
  const csvType = detectCSVType(csvData);

  console.log('Detected CSV type:', csvType);

  switch (csvType) {
    case CSV_TYPES.ACCOUNT_OVERVIEW:
      return transformAccountOverview(csvData);
    case CSV_TYPES.CONTENT_ANALYTICS:
      return transformContentAnalytics(csvData);
    case CSV_TYPES.VIDEO_ANALYTICS:
      return transformVideoAnalytics(csvData);
    default:
      throw new Error('Unable to detect CSV type. Please ensure you are uploading an X Analytics export.');
  }
}

/**
 * Merge multiple CSV results into unified analytics data
 */
export function mergeAnalyticsData(dataArray) {
  const merged = {
    accountOverview: null,
    contentAnalytics: null,
    videoAnalytics: null,
    // Combined data for dashboard
    impressionsData: [],
    engagementData: [],
    topPosts: [],
    hookPerformance: [],
    summary: {
      totalImpressions: 0,
      totalLikes: 0,
      totalEngagements: 0,
      totalPosts: 0,
      totalViews: 0,
    }
  };

  dataArray.forEach(data => {
    switch (data.type) {
      case CSV_TYPES.ACCOUNT_OVERVIEW:
        merged.accountOverview = data;
        // Use account overview for main charts if available
        if (data.impressionsData.length > 0) {
          merged.impressionsData = data.impressionsData;
          merged.engagementData = data.engagementData;
        }
        merged.summary.totalImpressions += data.summary.totalImpressions;
        merged.summary.totalLikes += data.summary.totalLikes;
        merged.summary.totalEngagements += data.summary.totalEngagements;
        break;

      case CSV_TYPES.CONTENT_ANALYTICS:
        merged.contentAnalytics = data;
        merged.topPosts = data.topPosts;
        merged.hookPerformance = data.hookPerformance;
        merged.summary.totalPosts = data.summary.totalPosts;
        // Use content data for charts if no account overview
        if (merged.impressionsData.length === 0) {
          merged.impressionsData = data.impressionsData;
          merged.engagementData = data.engagementData;
        }
        // Add to totals if not already counted from account overview
        if (!merged.accountOverview) {
          merged.summary.totalImpressions += data.summary.totalImpressions;
          merged.summary.totalLikes += data.summary.totalLikes;
        }
        break;

      case CSV_TYPES.VIDEO_ANALYTICS:
        merged.videoAnalytics = data;
        merged.summary.totalViews = data.summary.totalViews;
        break;
    }
  });

  return merged;
}

// Legacy exports for backward compatibility
export function transformCSVToAnalytics(csvData) {
  return transformContentAnalytics(csvData);
}

export function transformCSVToTopPosts(posts, limit = 5) {
  return posts
    .filter(p => p.impressions > 0 || p.likes > 0)
    .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
    .slice(0, limit);
}

export function calculateCSVHookPerformance(posts) {
  return calculateHookPerformance(posts);
}

export function recalculateFromTweets(posts) {
  return transformContentAnalytics(posts);
}
