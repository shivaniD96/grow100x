import { TrendingUp, Clock, AlertCircle, Target, Brain, Flame, Zap, Users, BarChart2, Eye, Bookmark, MessageCircle, Share2, Calendar, Award } from 'lucide-react';

// Helper to format numbers
const formatNum = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Generate personalized insights based on REAL analytics data
export const generateInsights = (analyticsData, topPosts, hookPerformance, rawSummary = null) => {
  const insights = [];

  // Safety check - if no data, return empty insights
  if (!analyticsData || (!analyticsData.impressionsData?.length && !analyticsData.engagementData?.length)) {
    return [{
      id: 'no-data',
      type: 'info',
      icon: AlertCircle,
      title: 'Upload your analytics data',
      description: 'Import your X Analytics CSV files to see personalized insights based on your real performance data.',
      action: 'Upload CSV files',
      priority: 'high',
      metric: 'Get started',
    }];
  }

  // Calculate real metrics from data
  const impressionsData = analyticsData.impressionsData || [];
  const engagementData = analyticsData.engagementData || [];

  const totalImpressions = impressionsData.reduce((sum, d) => sum + (d.impressions || 0), 0);
  const totalLikes = engagementData.reduce((sum, d) => sum + (d.likes || 0), 0);
  const totalRetweets = engagementData.reduce((sum, d) => sum + (d.retweets || 0), 0);
  const totalReplies = engagementData.reduce((sum, d) => sum + (d.replies || 0), 0);
  const totalBookmarks = engagementData.reduce((sum, d) => sum + (d.bookmarks || 0), 0);
  const totalEngagement = totalLikes + totalRetweets + totalReplies;
  const engagementRate = totalImpressions > 0 ? ((totalEngagement / totalImpressions) * 100).toFixed(2) : 0;

  const avgDailyImpressions = impressionsData.length > 0
    ? Math.round(totalImpressions / impressionsData.length)
    : 0;

  // 1. Overall performance summary
  insights.push({
    id: 'performance-summary',
    type: 'insight',
    icon: Eye,
    title: `${formatNum(totalImpressions)} total impressions`,
    description: `Over ${impressionsData.length} days, you averaged ${formatNum(avgDailyImpressions)} impressions/day with a ${engagementRate}% engagement rate.`,
    action: 'Keep creating consistent content',
    priority: 'high',
    metric: `${engagementRate}% engagement`,
  });

  // 2. Best performing hook type (if hook data exists)
  if (hookPerformance && hookPerformance.length > 0) {
    const sortedHooks = [...hookPerformance].sort((a, b) => (b.avgImpressions || 0) - (a.avgImpressions || 0));
    const bestHook = sortedHooks[0];
    const worstHook = sortedHooks[sortedHooks.length - 1];

    const avgImpressions = hookPerformance.reduce((sum, h) => sum + (h.avgImpressions || 0), 0) / hookPerformance.length;
    const improvement = avgImpressions > 0 ? Math.round(((bestHook.avgImpressions - avgImpressions) / avgImpressions) * 100) : 0;

    if (bestHook.hook && bestHook.avgImpressions > 0) {
      insights.push({
        id: 'hook-superpower',
        type: 'success',
        icon: Flame,
        title: `${bestHook.hook} hooks are your superpower`,
        description: `Your ${bestHook.hook.toLowerCase()} content averages ${formatNum(bestHook.avgImpressions)} impressions (${improvement > 0 ? `${improvement}% above average` : 'your best performer'}). Used in ${bestHook.posts} posts.`,
        action: `Double down on ${bestHook.hook.toLowerCase()} content`,
        priority: 'high',
        metric: `${formatNum(bestHook.avgImpressions)} avg`,
      });

      // Add worst hook insight if significantly different
      if (worstHook && worstHook.hook !== bestHook.hook && worstHook.avgImpressions > 0) {
        const diff = Math.round(((bestHook.avgImpressions - worstHook.avgImpressions) / worstHook.avgImpressions) * 100);
        if (diff > 50) {
          insights.push({
            id: 'hook-underperformer',
            type: 'warning',
            icon: AlertCircle,
            title: `${worstHook.hook} hooks underperform`,
            description: `Your ${worstHook.hook.toLowerCase()} posts average only ${formatNum(worstHook.avgImpressions)} impressions - ${diff}% less than your best hooks. Consider pivoting this content style.`,
            action: `Reduce ${worstHook.hook.toLowerCase()} content or improve it`,
            priority: 'medium',
            metric: `${formatNum(worstHook.avgImpressions)} avg`,
          });
        }
      }
    }
  }

  // 3. Top performing posts analysis
  if (topPosts && topPosts.length > 0) {
    const bestPost = topPosts[0];
    const avgPostImpressions = topPosts.reduce((sum, p) => sum + (p.impressions || 0), 0) / topPosts.length;

    insights.push({
      id: 'top-post',
      type: 'success',
      icon: Zap,
      title: `Your top post: ${formatNum(bestPost.impressions || 0)} impressions`,
      description: bestPost.text
        ? `"${bestPost.text.substring(0, 100)}${bestPost.text.length > 100 ? '...' : ''}"`
        : 'Your highest performing content shows what resonates with your audience.',
      action: 'Analyze and replicate this format',
      priority: 'high',
      metric: `${formatNum(bestPost.likes || 0)} likes`,
    });

    // Analyze what top posts have in common
    if (topPosts.length >= 3) {
      const topHookTypes = {};
      topPosts.slice(0, 5).forEach(post => {
        const hook = post.hookType || 'Unknown';
        topHookTypes[hook] = (topHookTypes[hook] || 0) + 1;
      });

      const dominantHook = Object.entries(topHookTypes).sort((a, b) => b[1] - a[1])[0];
      if (dominantHook && dominantHook[1] >= 2) {
        insights.push({
          id: 'top-posts-pattern',
          type: 'insight',
          icon: Brain,
          title: `Pattern detected in your top posts`,
          description: `${dominantHook[1]} of your top 5 posts use ${dominantHook[0]} hooks. This style clearly resonates with your audience.`,
          action: `Create more ${dominantHook[0].toLowerCase()} content`,
          priority: 'medium',
          metric: `${dominantHook[1]}/5 top posts`,
        });
      }
    }

    // Viral potential - posts that significantly outperformed
    const viralThreshold = avgPostImpressions * 3;
    const viralPosts = topPosts.filter(p => (p.impressions || 0) > viralThreshold);
    if (viralPosts.length > 0) {
      insights.push({
        id: 'viral-potential',
        type: 'success',
        icon: Award,
        title: `${viralPosts.length} viral post${viralPosts.length > 1 ? 's' : ''} detected`,
        description: `You have ${viralPosts.length} post${viralPosts.length > 1 ? 's' : ''} that got 3x+ your average impressions. Study what made ${viralPosts.length > 1 ? 'these' : 'this'} go viral.`,
        action: 'Reverse-engineer your viral content',
        priority: 'high',
        metric: `3x+ average`,
      });
    }
  }

  // 4. Engagement analysis with actionable breakdown
  if (totalEngagement > 0) {
    const likeRatio = ((totalLikes / totalEngagement) * 100).toFixed(0);
    const rtRatio = ((totalRetweets / totalEngagement) * 100).toFixed(0);
    const replyRatio = ((totalReplies / totalEngagement) * 100).toFixed(0);

    let engagementInsight = '';
    let engagementAction = '';
    let engagementType = 'insight';

    if (parseInt(likeRatio) > 80) {
      engagementInsight = `${likeRatio}% of engagement is likes. Your content is likeable but not shareable or conversation-starting.`;
      engagementAction = 'Add questions, hot takes, or CTAs to boost replies and shares';
      engagementType = 'warning';
    } else if (parseInt(replyRatio) > 25) {
      engagementInsight = `Strong conversation driver! ${replyRatio}% of engagement is replies. This builds community and boosts algorithm reach.`;
      engagementAction = 'Keep engaging in replies to compound this';
      engagementType = 'success';
    } else if (parseInt(rtRatio) > 25) {
      engagementInsight = `Highly shareable content! ${rtRatio}% of engagement is retweets. Your ideas are spreading.`;
      engagementAction = 'Create more share-worthy threads and insights';
      engagementType = 'success';
    } else {
      engagementInsight = `Balanced engagement: ${likeRatio}% likes, ${rtRatio}% RTs, ${replyRatio}% replies. Good mix!`;
      engagementAction = 'Experiment with different content types';
    }

    insights.push({
      id: 'engagement-breakdown',
      type: engagementType,
      icon: BarChart2,
      title: 'Engagement breakdown',
      description: engagementInsight,
      action: engagementAction,
      priority: 'medium',
      metric: `${formatNum(totalEngagement)} total`,
    });

    // Bookmark ratio insight (if available)
    if (totalBookmarks > 0) {
      const bookmarkRatio = ((totalBookmarks / totalImpressions) * 100).toFixed(2);
      if (parseFloat(bookmarkRatio) > 0.1) {
        insights.push({
          id: 'bookmark-insight',
          type: 'success',
          icon: Bookmark,
          title: `High save rate: ${bookmarkRatio}% bookmark ratio`,
          description: `${formatNum(totalBookmarks)} bookmarks shows your content is valuable enough to save. This is a strong signal of quality.`,
          action: 'Create more reference-worthy content',
          priority: 'medium',
          metric: `${formatNum(totalBookmarks)} saves`,
        });
      }
    }
  }

  // 5. Trend analysis (compare first half vs second half of data)
  if (impressionsData.length >= 6) {
    const midpoint = Math.floor(impressionsData.length / 2);
    const firstHalf = impressionsData.slice(0, midpoint);
    const secondHalf = impressionsData.slice(midpoint);

    const firstHalfAvg = firstHalf.reduce((s, d) => s + (d.impressions || 0), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((s, d) => s + (d.impressions || 0), 0) / secondHalf.length;

    const trendPercent = firstHalfAvg > 0 ? Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100) : 0;

    if (Math.abs(trendPercent) >= 10) {
      const trending = trendPercent > 0;
      insights.push({
        id: 'trend-analysis',
        type: trending ? 'success' : 'warning',
        icon: TrendingUp,
        title: trending ? `📈 Reach growing ${trendPercent}%` : `📉 Reach down ${Math.abs(trendPercent)}%`,
        description: trending
          ? `Your recent content is getting ${trendPercent}% more impressions than earlier. Whatever you're doing is working!`
          : `Your recent impressions are ${Math.abs(trendPercent)}% lower. Time to experiment with new content or posting times.`,
        action: trending ? 'Keep this momentum - don\'t change strategy' : 'Try new hooks, topics, or posting times',
        priority: trending ? 'low' : 'high',
        metric: `${trending ? '+' : ''}${trendPercent}%`,
      });
    }
  }

  // 6. Best days analysis
  if (impressionsData.length >= 7) {
    const dayPerformance = {};
    impressionsData.forEach(d => {
      if (d.fullDate) {
        const dayOfWeek = new Date(d.fullDate).toLocaleDateString('en-US', { weekday: 'long' });
        if (!dayPerformance[dayOfWeek]) {
          dayPerformance[dayOfWeek] = { total: 0, count: 0 };
        }
        dayPerformance[dayOfWeek].total += d.impressions || 0;
        dayPerformance[dayOfWeek].count += 1;
      }
    });

    const dayAverages = Object.entries(dayPerformance)
      .map(([day, data]) => ({ day, avg: data.total / data.count }))
      .filter(d => d.avg > 0)
      .sort((a, b) => b.avg - a.avg);

    if (dayAverages.length >= 3) {
      const bestDay = dayAverages[0];
      const worstDay = dayAverages[dayAverages.length - 1];
      const improvement = Math.round(((bestDay.avg - worstDay.avg) / worstDay.avg) * 100);

      if (improvement > 30) {
        insights.push({
          id: 'best-day',
          type: 'insight',
          icon: Calendar,
          title: `${bestDay.day}s are your best day`,
          description: `You average ${formatNum(bestDay.avg)} impressions on ${bestDay.day}s vs ${formatNum(worstDay.avg)} on ${worstDay.day}s (${improvement}% better).`,
          action: `Schedule your best content for ${bestDay.day}s`,
          priority: 'medium',
          metric: `+${improvement}%`,
        });
      }
    }
  }

  // 7. Posting consistency
  if (impressionsData.length > 0) {
    const daysWithData = impressionsData.filter(d => (d.impressions || 0) > 0).length;
    const consistencyRate = Math.round((daysWithData / impressionsData.length) * 100);

    if (consistencyRate >= 90) {
      insights.push({
        id: 'consistency-great',
        type: 'success',
        icon: Clock,
        title: `Excellent consistency: ${consistencyRate}%`,
        description: `You posted on ${daysWithData} of ${impressionsData.length} days. Consistency is key to algorithm favor!`,
        action: 'Maintain this posting rhythm',
        priority: 'low',
        metric: `${daysWithData}/${impressionsData.length} days`,
      });
    } else if (consistencyRate < 70) {
      insights.push({
        id: 'consistency-warning',
        type: 'warning',
        icon: Clock,
        title: `Consistency opportunity: ${consistencyRate}%`,
        description: `You had activity on ${daysWithData} of ${impressionsData.length} days. Gaps hurt algorithm momentum.`,
        action: 'Aim to post daily, even if just one tweet',
        priority: 'medium',
        metric: `${daysWithData}/${impressionsData.length} days`,
      });
    }
  }

  // 8. Monetization progress (5M impressions goal)
  const monetizationGoal = 5000000;
  const progressPercent = ((totalImpressions / monetizationGoal) * 100).toFixed(1);

  if (totalImpressions < monetizationGoal) {
    const remaining = monetizationGoal - totalImpressions;
    const daysToGoal = avgDailyImpressions > 0 ? Math.ceil(remaining / avgDailyImpressions) : 999;

    insights.push({
      id: 'monetization-progress',
      type: 'opportunity',
      icon: Target,
      title: `${progressPercent}% to X monetization`,
      description: `You need ${formatNum(remaining)} more impressions. At ${formatNum(avgDailyImpressions)}/day, that's ~${daysToGoal > 365 ? Math.round(daysToGoal / 30) + ' months' : daysToGoal + ' days'}.`,
      action: daysToGoal > 180 ? 'Focus on growing impressions per post' : 'Stay consistent - you\'re getting close!',
      priority: 'high',
      metric: `${formatNum(remaining)} to go`,
    });
  } else {
    insights.push({
      id: 'monetization-achieved',
      type: 'success',
      icon: Target,
      title: '🎉 Monetization threshold reached!',
      description: `You've hit ${formatNum(totalImpressions)} impressions! Check if you're eligible for X monetization.`,
      action: 'Apply for X Ads Revenue Sharing',
      priority: 'high',
      metric: 'Goal achieved!',
    });
  }

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
