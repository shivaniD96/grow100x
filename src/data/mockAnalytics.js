// Generate mock analytics data for X integration
export const generateMockAnalytics = (days = 30) => {
  const now = new Date();
  const impressionsData = [];
  const engagementData = [];
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const baseImpressions = 15000 + Math.random() * 10000;
    const spike = i % 7 === 0 ? 2.5 : 1;
    
    impressionsData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date.toISOString(),
      impressions: Math.round(baseImpressions * spike),
      followers: 1340 + Math.round((30 - i) * 12 + Math.random() * 20),
    });
    
    engagementData.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date.toISOString(),
      likes: Math.round(200 + Math.random() * 300),
      retweets: Math.round(30 + Math.random() * 70),
      replies: Math.round(15 + Math.random() * 40),
      bookmarks: Math.round(20 + Math.random() * 50),
    });
  }
  
  return { impressionsData, engagementData };
};

export const mockTopPosts = [
  {
    id: 1,
    text: "Most people overcomplicate Web3 marketing.\n\nAfter launching 12 products onchain, here's what actually works:\n\n🧵",
    impressions: 127400,
    likes: 892,
    retweets: 234,
    replies: 67,
    bookmarks: 445,
    date: '2 days ago',
    hookType: 'Contrarian',
    contentType: 'Thread',
    postedAt: '8:30 AM EST',
  },
  {
    id: 2,
    text: "The window for Base ecosystem plays is closing.\n\nHere are 5 protocols most people are sleeping on:",
    impressions: 89200,
    likes: 634,
    retweets: 178,
    replies: 92,
    bookmarks: 312,
    date: '5 days ago',
    hookType: 'FOMO',
    contentType: 'Thread',
    postedAt: '7:15 PM EST',
  },
  {
    id: 3,
    text: "I analyzed 50 viral crypto threads.\n\n3 patterns emerged:\n\n↳ Hook in first 7 words\n↳ Data beats opinions\n↳ Contrarian > educational",
    impressions: 67800,
    likes: 523,
    retweets: 145,
    replies: 34,
    bookmarks: 267,
    date: '1 week ago',
    hookType: 'Data/Numbers',
    contentType: 'Single Tweet',
    postedAt: '9:00 AM EST',
  },
  {
    id: 4,
    text: "Unpopular opinion: Token incentives are overrated.\n\nThe best Web3 products grow through product-led virality, not airdrops.",
    impressions: 45600,
    likes: 312,
    retweets: 89,
    replies: 156,
    bookmarks: 98,
    date: '2 weeks ago',
    hookType: 'Contrarian',
    contentType: 'Single Tweet',
    postedAt: '12:30 PM EST',
  },
  {
    id: 5,
    text: "Stop building features. Start building flywheels.\n\nThe difference between a good product and a great one:\n\n→ Good: Users like it\n→ Great: Users bring more users",
    impressions: 38900,
    likes: 287,
    retweets: 76,
    replies: 43,
    bookmarks: 189,
    date: '2 weeks ago',
    hookType: 'Bold Statement',
    contentType: 'Single Tweet',
    postedAt: '8:00 AM EST',
  },
];

export const mockContentBreakdown = [
  { name: 'Threads', value: 45, color: '#8b5cf6' },
  { name: 'Single Tweets', value: 30, color: '#06b6d4' },
  { name: 'Long-form', value: 15, color: '#f59e0b' },
  { name: 'Replies', value: 10, color: '#10b981' },
];

export const mockHookPerformance = [
  { hook: 'Contrarian', avgImpressions: 78000, avgEngagement: 4.2, posts: 12 },
  { hook: 'Data/Numbers', avgImpressions: 65000, avgEngagement: 3.8, posts: 8 },
  { hook: 'FOMO', avgImpressions: 52000, avgEngagement: 3.5, posts: 6 },
  { hook: 'Question', avgImpressions: 41000, avgEngagement: 4.8, posts: 15 },
  { hook: 'Story', avgImpressions: 38000, avgEngagement: 5.1, posts: 5 },
];

export const mockAccountStats = {
  username: 'baeincrypto',
  displayName: 'Shivani | Building on Base',
  followers: 1652,
  following: 892,
  totalImpressions30d: 847000,
  totalLikes30d: 12400,
  engagementRate: 4.2,
  avgImpressionsPerPost: 28200,
  topDay: 'Tuesday',
  topTime: '8-9 AM EST',
};
