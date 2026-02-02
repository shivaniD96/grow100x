import { clsx } from 'clsx';

// Format large numbers
export const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// Format percentage
export const formatPercent = (num, decimals = 1) => {
  return num.toFixed(decimals) + '%';
};

// Calculate engagement rate
export const calculateEngagementRate = (likes, retweets, replies, impressions) => {
  if (!impressions) return 0;
  return ((likes + retweets + replies) / impressions) * 100;
};

// Get trend indicator
export const getTrend = (current, previous) => {
  if (!previous) return { direction: 'neutral', percent: 0 };
  const percent = ((current - previous) / previous) * 100;
  return {
    direction: percent > 0 ? 'up' : percent < 0 ? 'down' : 'neutral',
    percent: Math.abs(percent).toFixed(1),
  };
};

// Class name utility
export const cn = (...inputs) => clsx(inputs);

// Get color classes based on type
export const getTypeColors = (type) => {
  const colors = {
    success: {
      border: 'border-green-500/50',
      bg: 'bg-green-500/10',
      icon: 'text-green-400',
      badge: 'bg-green-500/20 text-green-400',
    },
    warning: {
      border: 'border-orange-500/50',
      bg: 'bg-orange-500/10',
      icon: 'text-orange-400',
      badge: 'bg-orange-500/20 text-orange-400',
    },
    opportunity: {
      border: 'border-violet-500/50',
      bg: 'bg-violet-500/10',
      icon: 'text-violet-400',
      badge: 'bg-violet-500/20 text-violet-400',
    },
    insight: {
      border: 'border-blue-500/50',
      bg: 'bg-blue-500/10',
      icon: 'text-blue-400',
      badge: 'bg-blue-500/20 text-blue-400',
    },
  };
  return colors[type] || colors.insight;
};

// Get priority colors
export const getPriorityColors = (priority) => {
  const colors = {
    high: 'bg-red-500/20 text-red-400',
    medium: 'bg-yellow-500/20 text-yellow-400',
    low: 'bg-gray-500/20 text-gray-400',
  };
  return colors[priority] || colors.low;
};

// Local storage helpers
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Truncate text
export const truncate = (text, maxLength) => {
  if (text.length <= maxLength) return text;
  return text.substr(0, maxLength) + '...';
};

// Parse hook from content
export const detectHookType = (content) => {
  const text = content.toLowerCase();
  
  if (text.includes('unpopular opinion') || text.includes('hot take') || text.includes('wrong')) {
    return 'Contrarian';
  }
  if (text.match(/\d+%|\d+k|\d+ (days|weeks|hours|years)/)) {
    return 'Data/Numbers';
  }
  if (text.includes('sleeping on') || text.includes('closing') || text.includes('behind')) {
    return 'FOMO';
  }
  if (text.includes('?')) {
    return 'Question';
  }
  if (text.match(/in \d{4}|years ago|last week|first time/)) {
    return 'Story';
  }
  
  return 'Bold Statement';
};

// Calculate days until deadline
export const daysUntil = (deadline) => {
  const now = new Date();
  const target = new Date(deadline);
  const diff = target - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};
