/**
 * X API Service
 * Handles OAuth flow and API calls to X through the backend proxy
 */

import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  storePkceValues,
  retrievePkceValues,
  verifyState
} from '../utils/pkce';
import { storage, detectHookType } from '../utils/helpers';
import { format, subDays, parseISO } from 'date-fns';

// Token storage (in memory for security)
let accessToken = null;
let refreshToken = null;
let tokenExpiry = null;

/**
 * Initialize OAuth flow - redirects to X authorization
 */
export async function initiateOAuth() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Store PKCE values for callback
  storePkceValues(codeVerifier, state);

  // Get authorization URL from backend
  const response = await fetch(
    `/api/auth/authorize?code_challenge=${codeChallenge}&state=${state}`
  );

  if (!response.ok) {
    throw new Error('Failed to get authorization URL');
  }

  const { authUrl } = await response.json();

  // Redirect to X authorization
  window.location.href = authUrl;
}

/**
 * Handle OAuth callback - exchange code for tokens
 */
export async function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const error = params.get('auth_error');

  // Clear URL parameters
  window.history.replaceState({}, document.title, window.location.pathname);

  if (error) {
    throw new Error(decodeURIComponent(error));
  }

  if (!code || !state) {
    return null; // No OAuth callback in progress
  }

  // Verify state
  if (!verifyState(state)) {
    throw new Error('Invalid state parameter - possible CSRF attack');
  }

  // Get stored code verifier
  const { codeVerifier } = retrievePkceValues();

  if (!codeVerifier) {
    throw new Error('Missing code verifier - OAuth flow may have expired');
  }

  // Exchange code for tokens
  const response = await fetch('/api/auth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, code_verifier: codeVerifier })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.details || 'Failed to exchange authorization code');
  }

  const tokens = await response.json();

  // Store tokens
  setTokens(tokens);

  return true;
}

/**
 * Store tokens in memory
 */
function setTokens(tokens) {
  accessToken = tokens.access_token;
  refreshToken = tokens.refresh_token;
  tokenExpiry = Date.now() + (tokens.expires_in * 1000);

  // Store refresh token in localStorage (encrypted in production)
  storage.set('x_refresh_token', refreshToken);
}

/**
 * Get valid access token, refreshing if needed
 */
async function getAccessToken() {
  // Check if token is expired or about to expire (within 60 seconds)
  if (!accessToken || !tokenExpiry || Date.now() > tokenExpiry - 60000) {
    // Try to refresh
    const storedRefresh = refreshToken || storage.get('x_refresh_token');

    if (!storedRefresh) {
      throw new Error('No refresh token available - please reconnect');
    }

    await refreshAccessToken(storedRefresh);
  }

  return accessToken;
}

/**
 * Refresh the access token
 */
async function refreshAccessToken(token) {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: token })
  });

  if (!response.ok) {
    // Clear stored tokens on refresh failure
    clearTokens();
    throw new Error('Session expired - please reconnect your X account');
  }

  const tokens = await response.json();
  setTokens(tokens);
}

/**
 * Clear all tokens
 */
export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  tokenExpiry = null;
  storage.remove('x_refresh_token');
}

/**
 * Check if user has valid tokens
 */
export function hasValidSession() {
  return !!(accessToken || storage.get('x_refresh_token'));
}

/**
 * Fetch current user profile
 */
export async function fetchUserProfile() {
  const token = await getAccessToken();

  const response = await fetch('/api/x/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.details || 'Failed to fetch user profile');
  }

  const { data } = await response.json();

  return {
    id: data.id,
    username: data.username,
    displayName: data.name,
    profileImage: data.profile_image_url,
    bio: data.description,
    followers: data.public_metrics?.followers_count || 0,
    following: data.public_metrics?.following_count || 0,
    tweetCount: data.public_metrics?.tweet_count || 0,
    verified: data.verified || false,
    createdAt: data.created_at
  };
}

/**
 * Fetch user tweets with metrics
 */
export async function fetchUserTweets(userId, days = 30) {
  const token = await getAccessToken();

  const endTime = new Date().toISOString();
  const startTime = subDays(new Date(), days).toISOString();

  let allTweets = [];
  let paginationToken = null;

  // Paginate through all tweets in the time range
  do {
    const params = new URLSearchParams({
      user_id: userId,
      max_results: '100',
      start_time: startTime,
      end_time: endTime
    });

    if (paginationToken) {
      params.set('pagination_token', paginationToken);
    }

    const response = await fetch(`/api/x/tweets?${params}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.details || 'Failed to fetch tweets');
    }

    const result = await response.json();

    if (result.data) {
      allTweets = allTweets.concat(result.data);
    }

    paginationToken = result.meta?.next_token;

    // Respect rate limits - check remaining
    if (result._rateLimit?.remaining && parseInt(result._rateLimit.remaining) < 10) {
      console.warn('Approaching rate limit, stopping pagination');
      break;
    }
  } while (paginationToken && allTweets.length < 500);

  return allTweets;
}

/**
 * Transform raw tweets to analytics format matching mockAnalytics.js structure
 */
export function transformTweetsToAnalytics(tweets, userProfile, days = 30) {
  // Group tweets by date
  const tweetsByDate = {};
  const today = new Date();

  // Initialize all dates with zero values
  for (let i = days - 1; i >= 0; i--) {
    const date = subDays(today, i);
    const dateKey = format(date, 'yyyy-MM-dd');
    tweetsByDate[dateKey] = {
      impressions: 0,
      likes: 0,
      retweets: 0,
      replies: 0,
      bookmarks: 0,
      tweets: []
    };
  }

  // Aggregate tweet metrics by date
  tweets.forEach(tweet => {
    const tweetDate = format(parseISO(tweet.created_at), 'yyyy-MM-dd');

    if (tweetsByDate[tweetDate]) {
      const metrics = tweet.public_metrics || {};
      tweetsByDate[tweetDate].impressions += metrics.impression_count || 0;
      tweetsByDate[tweetDate].likes += metrics.like_count || 0;
      tweetsByDate[tweetDate].retweets += metrics.retweet_count || 0;
      tweetsByDate[tweetDate].replies += metrics.reply_count || 0;
      tweetsByDate[tweetDate].bookmarks += metrics.bookmark_count || 0;
      tweetsByDate[tweetDate].tweets.push(tweet);
    }
  });

  // Convert to arrays matching mock data format
  const impressionsData = [];
  const engagementData = [];

  Object.entries(tweetsByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([dateKey, data]) => {
      const date = parseISO(dateKey);

      impressionsData.push({
        date: format(date, 'MMM d'),
        fullDate: date.toISOString(),
        impressions: data.impressions,
        followers: userProfile.followers // Note: X API doesn't provide historical follower counts
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

  return { impressionsData, engagementData };
}

/**
 * Transform tweets to top posts format
 */
export function transformToTopPosts(tweets, limit = 5) {
  return tweets
    .filter(tweet => tweet.public_metrics?.impression_count > 0)
    .sort((a, b) => (b.public_metrics?.impression_count || 0) - (a.public_metrics?.impression_count || 0))
    .slice(0, limit)
    .map(tweet => {
      const metrics = tweet.public_metrics || {};
      const createdAt = parseISO(tweet.created_at);

      return {
        id: tweet.id,
        text: tweet.text,
        impressions: metrics.impression_count || 0,
        likes: metrics.like_count || 0,
        retweets: metrics.retweet_count || 0,
        replies: metrics.reply_count || 0,
        bookmarks: metrics.bookmark_count || 0,
        date: formatRelativeDate(createdAt),
        hookType: detectHookType(tweet.text),
        contentType: detectContentType(tweet),
        postedAt: format(createdAt, 'h:mm a')
      };
    });
}

/**
 * Calculate hook performance from tweets
 */
export function calculateHookPerformance(tweets) {
  const hookStats = {};

  tweets.forEach(tweet => {
    const hookType = detectHookType(tweet.text);
    const metrics = tweet.public_metrics || {};

    if (!hookStats[hookType]) {
      hookStats[hookType] = {
        hook: hookType,
        totalImpressions: 0,
        totalEngagement: 0,
        posts: 0
      };
    }

    const impressions = metrics.impression_count || 0;
    const engagement = (metrics.like_count || 0) + (metrics.retweet_count || 0) + (metrics.reply_count || 0);

    hookStats[hookType].totalImpressions += impressions;
    hookStats[hookType].totalEngagement += engagement;
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
 * Helper: Detect content type
 */
function detectContentType(tweet) {
  // Check if it's part of a thread
  if (tweet.referenced_tweets?.some(ref => ref.type === 'replied_to')) {
    return 'Thread';
  }

  // Check text length
  if (tweet.text.length > 200) {
    return 'Long-form';
  }

  return 'Single Tweet';
}

/**
 * Helper: Format relative date
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
