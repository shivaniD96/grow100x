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
  console.log('CSV Headers found:', headers);

  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    // Be more flexible - allow rows with fewer values (pad with empty strings)
    if (values.length > 0) {
      const row = {};
      headers.forEach((header, index) => {
        const normalizedHeader = header.trim().toLowerCase().replace(/\s+/g, '_').replace(/[()]/g, '');
        row[normalizedHeader] = values[index] || '';
      });
      data.push(row);
    }
  }

  console.log('CSV Rows parsed:', data.length);
  if (data.length > 0) {
    console.log('First row keys:', Object.keys(data[0]));
    console.log('First row sample:', data[0]);
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
 * Transform X Analytics CSV data to app format
 */
export function transformCSVToAnalytics(csvData) {
  console.log('Transforming CSV data, rows:', csvData.length);

  // Normalize column names (X exports vary significantly)
  const normalizedData = csvData.map((row, index) => {
    // Try many possible column name variations
    // X Analytics 2024+ uses "Post text", "Post id", etc.
    const text = findValue(row,
      'post_text', 'Post text', 'Tweet text', 'tweet_text', 'text', 'Tweet', 'tweet', 'content'
    );

    const time = findValue(row,
      'date', 'Date', 'time', 'Time', 'created_at', 'Created at', 'posted_at', 'Posted at',
      'tweet_time', 'post_time', 'timestamp', 'Timestamp'
    );

    const id = findValue(row,
      'post_id', 'Post id', 'Tweet id', 'tweet_id', 'id', 'ID', 'Tweet ID'
    ) || `generated_${index}`;

    const impressions = parseInt(findValue(row,
      'impressions', 'Impressions', 'views', 'Views', 'view_count', 'impression_count'
    ) || '0', 10);

    const engagements = parseInt(findValue(row,
      'engagements', 'Engagements', 'total_engagements', 'engagement_count'
    ) || '0', 10);

    // X now uses "Reposts" instead of "Retweets", and has separate "Shares"
    const reposts = parseInt(findValue(row,
      'reposts', 'Reposts', 'retweets', 'Retweets', 'repost_count', 'retweet_count'
    ) || '0', 10);

    const shares = parseInt(findValue(row,
      'shares', 'Shares', 'share_count'
    ) || '0', 10);

    const retweets = reposts + shares; // Combine reposts and shares

    const replies = parseInt(findValue(row,
      'replies', 'Replies', 'reply_count', 'comments', 'Comments'
    ) || '0', 10);

    const likes = parseInt(findValue(row,
      'likes', 'Likes', 'favorites', 'Favorites', 'like_count', 'favourite_count'
    ) || '0', 10);

    const bookmarks = parseInt(findValue(row,
      'bookmarks', 'Bookmarks', 'bookmark_count', 'saves', 'Saves'
    ) || '0', 10);

    const urlClicks = parseInt(findValue(row,
      'url_clicks', 'URL clicks', 'URL Clicks', 'link_clicks', 'Link clicks', 'clicks'
    ) || '0', 10);

    const profileClicks = parseInt(findValue(row,
      'profile_visits', 'Profile visits', 'user_profile_clicks', 'profile_clicks', 'Profile clicks', 'User profile clicks'
    ) || '0', 10);

    const newFollows = parseInt(findValue(row,
      'new_follows', 'New follows', 'follows', 'Follows'
    ) || '0', 10);

    if (index === 0) {
      console.log('First normalized row:', { id, text: text?.substring(0, 50), time, impressions, likes });
    }

    return {
      id,
      text,
      time,
      impressions,
      engagements,
      retweets,
      replies,
      likes,
      bookmarks,
      urlClicks,
      profileClicks,
      newFollows,
    };
  });

  // Filter out invalid rows - be more lenient (only need text OR impressions > 0)
  const validData = normalizedData.filter(row => {
    const hasText = row.text && row.text.length > 0;
    const hasMetrics = row.impressions > 0 || row.likes > 0 || row.engagements > 0;
    return hasText || hasMetrics;
  });

  console.log('Valid rows after filtering:', validData.length);

  if (validData.length === 0) {
    // Log what we got for debugging
    console.error('No valid data found. Sample row:', normalizedData[0]);
    throw new Error('No valid tweet data found in CSV. Please check the file format. Expected columns: Tweet text, time, impressions, likes, etc.');
  }

  // Sort by date (handle rows without dates)
  validData.sort((a, b) => {
    const dateA = parseDate(a.time);
    const dateB = parseDate(b.time);
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA - dateB;
  });

  // Group by date for time series
  const byDate = {};
  let noDateCount = 0;

  validData.forEach(tweet => {
    const date = parseDate(tweet.time);
    if (!date) {
      noDateCount++;
      // Use today's date for tweets without dates
      const today = format(new Date(), 'yyyy-MM-dd');
      if (!byDate[today]) {
        byDate[today] = {
          impressions: 0,
          likes: 0,
          retweets: 0,
          replies: 0,
          bookmarks: 0,
          engagements: 0,
          tweets: []
        };
      }
      byDate[today].impressions += tweet.impressions;
      byDate[today].likes += tweet.likes;
      byDate[today].retweets += tweet.retweets;
      byDate[today].replies += tweet.replies;
      byDate[today].bookmarks += tweet.bookmarks;
      byDate[today].engagements += tweet.engagements;
      byDate[today].tweets.push(tweet);
      return;
    }

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

  if (noDateCount > 0) {
    console.log(`${noDateCount} tweets had no parseable date, grouped under today`);
  }

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

  console.log('Analytics generated:', { days: impressionsData.length, tweets: validData.length });

  return { impressionsData, engagementData, rawTweets: validData };
}

/**
 * Transform CSV data to top posts format
 */
export function transformCSVToTopPosts(rawTweets, limit = 5) {
  return rawTweets
    .filter(tweet => tweet.impressions > 0 || tweet.likes > 0)
    .sort((a, b) => (b.impressions || b.likes * 100) - (a.impressions || a.likes * 100))
    .slice(0, limit)
    .map(tweet => {
      const date = parseDate(tweet.time);

      return {
        id: tweet.id,
        text: tweet.text || 'No text available',
        impressions: tweet.impressions,
        likes: tweet.likes,
        retweets: tweet.retweets,
        replies: tweet.replies,
        bookmarks: tweet.bookmarks,
        date: date ? formatRelativeDate(date) : 'Unknown date',
        hookType: tweet.text ? detectHookType(tweet.text) : 'Unknown',
        contentType: tweet.text ? detectContentType(tweet.text) : 'Unknown',
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
    if (!tweet.text) return;

    const hookType = detectHookType(tweet.text);

    if (!hookStats[hookType]) {
      hookStats[hookType] = {
        hook: hookType,
        totalImpressions: 0,
        totalEngagement: 0,
        posts: 0
      };
    }

    hookStats[hookType].totalImpressions += tweet.impressions || 0;
    hookStats[hookType].totalEngagement += (tweet.likes || 0) + (tweet.retweets || 0) + (tweet.replies || 0);
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

  // Clean up the string
  const cleaned = dateStr.toString().trim();
  if (!cleaned) return null;

  // Try ISO format first
  let date = new Date(cleaned);
  if (!isNaN(date.getTime())) return date;

  // Try common X export formats
  const patterns = [
    // 2024-01-15 14:30:00 +0000
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/,
    // 01/15/2024 14:30
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/,
    // Jan 15, 2024 at 2:30 PM
    /^(\w+)\s+(\d{1,2}),?\s+(\d{4})/,
    // 15 Jan 2024
    /^(\d{1,2})\s+(\w+)\s+(\d{4})/,
  ];

  for (const pattern of patterns) {
    if (pattern.test(cleaned)) {
      date = new Date(cleaned);
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Try parsing just the date part if time parsing fails
  const dateOnly = cleaned.split(/\s+/)[0];
  date = new Date(dateOnly);
  if (!isNaN(date.getTime())) return date;

  return null;
}

/**
 * Detect content type from tweet text
 */
function detectContentType(text) {
  if (!text) return 'Unknown';
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
    const dateKey = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

    if (!byDate[dateKey]) {
      byDate[dateKey] = {
        impressions: 0,
        likes: 0,
        retweets: 0,
        replies: 0,
        bookmarks: 0
      };
    }

    byDate[dateKey].impressions += tweet.impressions || 0;
    byDate[dateKey].likes += tweet.likes || 0;
    byDate[dateKey].retweets += tweet.retweets || 0;
    byDate[dateKey].replies += tweet.replies || 0;
    byDate[dateKey].bookmarks += tweet.bookmarks || 0;
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
