import { Rocket, Zap, TrendingUp } from 'lucide-react';

export const SKILLS = {
  productLaunch: {
    id: 'productLaunch',
    name: 'Product Launch Mastery',
    icon: Rocket,
    color: 'from-violet-500 to-purple-600',
    tagline: 'Launch like Apple, grow like Dropbox',
    description: 'Comprehensive framework for planning, executing, and scaling successful product launches',
    categories: ['GTM Strategy', 'Press Release', 'Launch Checklist', 'Growth Hacking'],
  },
  viralX: {
    id: 'viralX',
    name: 'Viral X Content',
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    tagline: 'Engineer posts for 50K+ views',
    description: 'Create viral content using proven formulas from posts with 50K+ impressions',
    categories: ['Single Tweet', 'Long-Form Post', 'Thread', 'Hook Generator'],
  },
  cryptoContent: {
    id: 'cryptoContent',
    name: 'Crypto Content Lab',
    icon: TrendingUp,
    color: 'from-orange-500 to-amber-500',
    tagline: 'CT bangers that hit different',
    description: 'Create viral crypto Twitter content based on patterns from top CT accounts',
    categories: ['Product Breakdown', 'Educational Thread', 'Protocol Analysis', 'Trading Content'],
  },
};

// Hook templates by emotion/type
export const hookTemplates = {
  contrarian: [
    "Unpopular opinion: {topic} is completely wrong.",
    "Most people fail at {topic} because they're doing it backwards.",
    "I'm going to say what everyone's thinking about {topic}:",
    "Hot take: {topic} is overrated. Here's why:",
    "Everyone says '{commonAdvice}' But the most successful {audience} do the opposite.",
  ],
  dataNumbers: [
    "I analyzed {number} {items}. {findings}",
    "After {timeframe} of {activity}: {results}",
    "{percentage}% of {audience} do this one thing daily.",
    "I spent {hours} hours researching {topic}. Here's everything you need to know:",
    "The data is clear: {dataPoint}",
  ],
  fomo: [
    "Everyone's sleeping on {topic}. Here's why it matters now:",
    "The {topic} that's about to explode (most people are ignoring it):",
    "If you're not paying attention to {topic}, you're already behind.",
    "The window for {opportunity} is closing. Here's what you need to know:",
    "I almost missed {opportunity}. Don't make the same mistake.",
  ],
  question: [
    "Why do some {audience} with 1K followers make more than those with 100K?",
    "What if everything you knew about {topic} was wrong?",
    "Ever wonder why {observation}?",
    "Why does nobody talk about {topic}?",
    "{question} The answer might surprise you.",
  ],
  story: [
    "In {year}, I was {situation}. Then I discovered {solution}.",
    "A {person} DM'd me last week. They were about to quit.",
    "My first attempt at {topic} failed. My second too. My tenth? That's when everything clicked.",
    "3 years ago, I knew nothing about {topic}. Today:",
    "The moment I stopped overthinking {topic} and just started:",
  ],
};

// Content templates by type
export const contentTemplates = {
  singleTweet: {
    structure: "Hook + Context + Insight + (Optional CTA)",
    maxLength: 280,
    tips: [
      "Front-load the hook in first 7 words",
      "Use whitespace between ideas",
      "One idea, one tweet",
      "End with engagement trigger (question, hot take)",
    ],
  },
  thread: {
    structure: [
      "Tweet 1: HOOK (most critical)",
      "Tweet 2: Context/credibility",
      "Tweets 3-8: Value (one idea per tweet)",
      "Tweet 9: Key takeaway",
      "Tweet 10: CTA",
    ],
    optimalLength: "7-10 tweets",
    tips: [
      "Number tweets (1/, 2/, etc.)",
      "Include visuals every 2-3 tweets",
      "Create cliffhangers to maintain momentum",
      "End tweets with open loops",
    ],
  },
  longForm: {
    structure: [
      "Hook (must compel 'Show More' click)",
      "Context/credibility",
      "Body (use bold headers, whitespace)",
      "Key takeaway",
      "CTA",
    ],
    tips: [
      "Use bold to break up sections",
      "Whitespace between every 2-3 lines",
      "Short sentences (8th grade reading level)",
      "One idea per paragraph",
    ],
  },
};

// Viral benchmarks
export const viralBenchmarks = {
  impressions: { viral: 500000, good: 100000, average: 25000 },
  likes: { viral: 10000, good: 1000, average: 100 },
  retweets: { viral: 1000, good: 100, average: 20 },
  engagementRate: { viral: 5, good: 3, average: 1.5 },
};
