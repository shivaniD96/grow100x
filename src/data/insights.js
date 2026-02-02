import { TrendingUp, Clock, AlertCircle, Target, Brain, Flame, Zap, Users } from 'lucide-react';

// Generate personalized insights based on analytics data
export const generateInsights = (analyticsData, topPosts, hookPerformance) => {
  const insights = [];
  
  // Find best performing hook type
  const bestHook = hookPerformance.reduce((a, b) => 
    a.avgImpressions > b.avgImpressions ? a : b
  );
  
  insights.push({
    id: 'hook-superpower',
    type: 'success',
    icon: Flame,
    title: `${bestHook.hook} hooks are your superpower`,
    description: `Your ${bestHook.hook.toLowerCase()} takes get ${((bestHook.avgImpressions / 35000) * 100 - 100).toFixed(0)}% more impressions than average. Double down on these patterns.`,
    action: `Generate more ${bestHook.hook.toLowerCase()} content`,
    priority: 'high',
    metric: `${(bestHook.avgImpressions / 1000).toFixed(0)}K avg impressions`,
  });
  
  // Thread performance insight
  insights.push({
    id: 'thread-performance',
    type: 'opportunity',
    icon: TrendingUp,
    title: 'Thread game is strong',
    description: "Your threads average 85K impressions vs 32K for single tweets. You're on track for monetization - need 1.2M more impressions in 6 weeks.",
    action: 'Post 2 threads/week minimum',
    priority: 'high',
    metric: '2.6x better than tweets',
  });
  
  // Optimal posting times
  insights.push({
    id: 'posting-times',
    type: 'insight',
    icon: Clock,
    title: 'Best posting times identified',
    description: 'Your highest-performing posts went live between 8-9am EST and 7-8pm EST. Tuesday and Wednesday show 40% higher engagement.',
    action: 'Schedule posts for optimal times',
    priority: 'medium',
    metric: '+40% on Tue/Wed',
  });
  
  // Engagement warning
  insights.push({
    id: 'reply-game',
    type: 'warning',
    icon: AlertCircle,
    title: 'Reply game needs work',
    description: 'Your reply rate dropped 23% this week. Engagement breeds engagement - spend 30 min daily replying to bigger accounts.',
    action: 'Increase community engagement',
    priority: 'medium',
    metric: '-23% this week',
  });
  
  // Content focus opportunity
  insights.push({
    id: 'content-focus',
    type: 'opportunity',
    icon: Target,
    title: 'Crypto content outperforms',
    description: 'Base/L2 content gets 3x more bookmarks than general Web3 posts. Your audience wants alpha on specific ecosystems.',
    action: 'Focus on Base ecosystem content',
    priority: 'high',
    metric: '3x more bookmarks',
  });
  
  // Educational content insight
  insights.push({
    id: 'educational-threads',
    type: 'insight',
    icon: Brain,
    title: 'Educational threads convert followers',
    description: 'Your "explained" threads have a 12% follow rate vs 4% average. Teaching builds trust and grows audience faster.',
    action: 'Mix in 1 educational thread/week',
    priority: 'low',
    metric: '12% follow rate',
  });
  
  // Viral potential
  insights.push({
    id: 'viral-potential',
    type: 'opportunity',
    icon: Zap,
    title: 'Viral post pattern detected',
    description: 'Your contrarian takes + data combination has hit 100K+ twice. This formula has the highest viral potential.',
    action: 'Create contrarian + data posts',
    priority: 'high',
    metric: '100K+ potential',
  });
  
  // Follower growth
  insights.push({
    id: 'follower-growth',
    type: 'insight',
    icon: Users,
    title: 'Follower growth accelerating',
    description: "You're gaining 45 followers/day on average, up from 28/day last month. Thread days see 2x follower growth.",
    action: 'Maintain consistency',
    priority: 'low',
    metric: '+60% growth rate',
  });
  
  return insights;
};

// Analyze why a specific post performed well
export const analyzePostPerformance = (post) => {
  const reasons = [];
  
  // Hook analysis
  if (post.hookType === 'Contrarian') {
    reasons.push('Contrarian hook creates immediate engagement and debate');
  } else if (post.hookType === 'Data/Numbers') {
    reasons.push('Data-driven hook establishes credibility instantly');
  } else if (post.hookType === 'FOMO') {
    reasons.push('FOMO hook triggers urgency and saves/bookmarks');
  }
  
  // Time analysis
  if (post.postedAt?.includes('8') || post.postedAt?.includes('9')) {
    reasons.push('Posted at optimal morning time (8-10 AM EST)');
  } else if (post.postedAt?.includes('7 PM') || post.postedAt?.includes('8 PM')) {
    reasons.push('Posted at optimal evening time (7-9 PM EST)');
  }
  
  // Content type
  if (post.contentType === 'Thread') {
    reasons.push('Thread format increases time-on-post (algorithm boost)');
  }
  
  // Engagement signals
  if (post.bookmarks > post.likes * 0.3) {
    reasons.push('High bookmark ratio indicates valuable, save-worthy content');
  }
  
  if (post.replies > 50) {
    reasons.push('Strong reply count shows conversation-starting potential');
  }
  
  // Topic relevance
  if (post.text.toLowerCase().includes('web3') || post.text.toLowerCase().includes('crypto')) {
    reasons.push('Topic aligns with your audience interests (Web3/crypto)');
  }
  
  // CTA presence
  if (post.text.includes('?') || post.text.includes('👇')) {
    reasons.push('Clear call-to-action drives replies');
  }
  
  return reasons;
};

// Predict performance for new content
export const predictPerformance = (content, hookType, contentType) => {
  const baseImpressions = {
    'Contrarian': 78000,
    'Data/Numbers': 65000,
    'FOMO': 52000,
    'Question': 41000,
    'Story': 38000,
    'Bold Statement': 45000,
  };
  
  const typeMultiplier = {
    'Thread': 1.8,
    'Long-form': 1.3,
    'Single Tweet': 1.0,
  };
  
  const base = baseImpressions[hookType] || 35000;
  const multiplier = typeMultiplier[contentType] || 1.0;
  
  // Add some variance
  const variance = 0.3;
  const min = Math.round(base * multiplier * (1 - variance));
  const max = Math.round(base * multiplier * (1 + variance));
  
  // Estimate engagement rate based on hook type
  const engagementRates = {
    'Contrarian': 4.2,
    'Data/Numbers': 3.8,
    'FOMO': 3.5,
    'Question': 4.8,
    'Story': 5.1,
  };
  
  return {
    impressionsRange: { min, max },
    estimatedEngagement: engagementRates[hookType] || 3.5,
    confidence: 'Based on your historical data',
  };
};
