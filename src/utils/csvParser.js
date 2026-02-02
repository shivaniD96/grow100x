/**
 * CSV Parser for X Analytics Data
 * Parses exported CSV from X Analytics and transforms it to app format
 */

import { format, parseISO, subDays } from 'date-fns';
import { detectHookType } from './helpers';

/**
 * Parse CSV text into array of objects
 */
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  // Parse header row
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header.trim().toLowerCase().replace(/\s+/g, '_')] = values[index];
      });
      data.push(row);
    }
  }

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
 * Transform X Analytics CSV data to app format
 */
export function transformCSVToAnalytics(csvData) {
  // Normalize column names (X exports vary)
  const normalizedData = csvData.map(row => ({
    id: row.tweet_id || row.id || '',
    text: row.tweet_text || row.text || row.tweet || '',
    time: row.time || row.date || row.created_at || '',
    impressions: parseInt(row.impressions || row.views || '0', 10),
    engagements: parseInt(row.engagements || row.total_engagements || '0', 10),
    engagementRate: parseFloat(row.engagement_rate || row['engagement_rate_(%)'] || '0'),
    retweets: parseInt(row.retweets || row.reposts || '0', 10),
    replies: parseInt(row.replies || '0', 10),
    likes: parseInt(row.likes || row.favorites || '0', 10),
    bookmarks: parseInt(row.bookmarks || '0', 10),
    urlClicks: parseInt(row.url_clicks || row.link_clicks || '0', 10),
    profileClicks: parseInt(row.user_profile_clicks || row.profile_clicks || '0', 10),
  }));

  // Filter out invalid rows
  const validData = normalizedData.filter(row => row.text && row.time);

  if (validData.length === 0) {
    throw new Error('No valid tweet data found in CSV. Please check the file format.');
  }

  // Sort by date
  validData.sort((a, b) => new Date(a.time) - new Date(b.time));

  // Group by date for time series
  const byDate = {};
  validData.forEach(tweet => {
    const date = parseDate(tweet.time);
    if (!date) return;

    const dateKey = format(date, 'yyyy-MM-dd');

    if (!byDate[dateKey]) {
      byDate[dateKey] = {
        impressions: 0,
        likes: 0,
        retweets: 0,
        replies: 0,
        bookmarks: 0,
        engagements: 0,
        tweets: []
      };
    }

    byDate[dateKey].impressions += tweet.impressions;
    byDate[dateKey].likes += tweet.likes;
    byDate[dateKey].retweets += tweet.retweets;
    byDate[dateKey].replies += tweet.replies;
    byDate[dateKey].bookmarks += tweet.bookmarks;
    byDate[dateKey].engagements += tweet.engagements;
    byDate[dateKey].tweets.push(tweet);
  });

  // Convert to arrays
  const impressionsData = [];
  const engagementData = [];

  Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([dateKey, data]) => {
      const date = parseISO(dateKey);

      impressionsData.push({
        date: format(date, 'MMM d'),
        fullDate: date.toISOString(),
        impressions: data.impressions,
        followers: 0 // Not available in CSV export
      });

      engagementData.push({
        date: format(date, 'MMM d'),
        fullDate: date.toISOString(),
        likes: data.likes,
        retweets: data.retweets,
        replies: data.replies,
        bookmarks: data.bookmarks
      });
    });

  return { impressionsData, engagementData, rawTweets: validData };
}

/**
 * Transform CSV data to top posts format
 */
export function transformCSVToTopPosts(rawTweets, limit = 5) {
  return rawTweets
    .filter(tweet => tweet.impressions > 0)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit)
    .map(tweet => {
      const date = parseDate(tweet.time);

      return {
        id: tweet.id,
        text: tweet.text,
        impressions: tweet.impressions,
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies,
        bookmarks: tweet.bookmarks,
        date: date ? formatRelativeDate(date) : 'Unknown',
        hookType: detectHookType(tweet.text),
        contentType: detectContentType(tweet.text),
        postedAt: date ? format(date, 'h:mm a') : ''
      };
    });
}

/**
 * Calculate hook performance from CSV data
 */
export function calculateCSVHookPerformance(rawTweets) {
  const hookStats = {};

  rawTweets.forEach(tweet => {
    const hookType = detectHookType(tweet.text);

    if (!hookStats[hookType]) {
      hookStats[hookType] = {
        hook: hookType,
        totalImpressions: 0,
        totalEngagement: 0,
        posts: 0
      };
    }

    hookStats[hookType].totalImpressions += tweet.impressions;
    hookStats[hookType].totalEngagement += tweet.likes + tweet.retweets + tweet.replies;
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

  // Try ISO format first
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) return date;

  // Try common X export formats
  const formats = [
    /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/, // 2024-01-15 14:30
    /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})/, // 01/15/2024 14:30
    /(\w+) (\d{1,2}), (\d{4}) at (\d{1,2}):(\d{2})/, // Jan 15, 2024 at 2:30
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      date = new Date(dateStr);
      if (!isNaN(date.getTime())) return date;
    }
  }

  return null;
}

/**
 * Detect content type from tweet text
 */
function detectContentType(text) {
  if (text.length > 200) {
    return 'Long-form';
  }
  // Can't detect threads from CSV export easily
  return 'Single Tweet';
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
 * Merge multiple CSV uploads into one dataset
 */
export function mergeCSVData(existingData, newData) {
  // Combine raw tweets, avoiding duplicates by ID
  const existingIds = new Set(existingData.rawTweets?.map(t => t.id) || []);
  const mergedTweets = [
    ...(existingData.rawTweets || []),
    ...newData.rawTweets.filter(t => !existingIds.has(t.id))
  ];

  // Re-transform merged data
  const analytics = transformCSVToAnalytics({
    // Create a fake CSV data structure from merged tweets
    length: mergedTweets.length,
    map: (fn) => mergedTweets.map(fn)
  });

  // Actually, let's just recalculate from merged tweets
  return recalculateFromTweets(mergedTweets);
}

/**
 * Recalculate all analytics from raw tweets
 */
export function recalculateFromTweets(rawTweets) {
  // Group by date
  const byDate = {};
  rawTweets.forEach(tweet => {
    const date = parseDate(tweet.time);
    if (!date) return;

    const dateKey = format(date, 'yyyy-MM-dd');

    if (!byDate[dateKey]) {
      byDate[dateKey] = {
        impressions: 0,
        likes: 0,
        retweets: 0,
        replies: 0,
        bookmarks: 0
      };
    }

    byDate[dateKey].impressions += tweet.impressions;
    byDate[dateKey].likes += tweet.likes;
    byDate[dateKey].retweets += tweet.retweets;
    byDate[dateKey].replies += tweet.replies;
    byDate[dateKey].bookmarks += tweet.bookmarks;
  });

  // Convert to arrays
  const impressionsData = [];
  const engagementData = [];

  Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([dateKey, data]) => {
      const date = parseISO(dateKey);

      impressionsData.push({
        date: format(date, 'MMM d'),
        fullDate: date.toISOString(),
        impressions: data.impressions,
        followers: 0
      });

      engagementData.push({
        date: format(date, 'MMM d'),
        fullDate: date.toISOString(),
        likes: data.likes,
        retweets: data.retweets,
        replies: data.replies,
        bookmarks: data.bookmarks
      });
    });

  return {
    impressionsData,
    engagementData,
    rawTweets
  };
}
