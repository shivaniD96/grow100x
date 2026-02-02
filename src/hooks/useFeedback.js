import { useState, useCallback } from 'react';
import { storage, generateId } from '../utils/helpers';

const STORAGE_KEY = 'skill_feedback';
const INSIGHTS_KEY = 'skill_insights';

const defaultInsights = {
  productLaunch: { 
    likes: 12, 
    dislikes: 2, 
    topCategories: ['GTM Strategy', 'Press Release'], 
    improvements: ['Add more Web3 examples', 'Include budget templates'] 
  },
  viralX: { 
    likes: 45, 
    dislikes: 5, 
    topCategories: ['Hook Generator', 'Thread'], 
    improvements: ['More niche-specific hooks', 'Add engagement predictions'] 
  },
  cryptoContent: { 
    likes: 28, 
    dislikes: 3, 
    topCategories: ['Protocol Analysis', 'Educational Thread'], 
    improvements: ['Add on-chain data templates', 'Include tokenomics calculators'] 
  },
};

export const useFeedback = () => {
  const [feedbacks, setFeedbacks] = useState(() => storage.get(STORAGE_KEY, []));
  const [insights, setInsights] = useState(() => storage.get(INSIGHTS_KEY, defaultInsights));

  // Add feedback for a generated output
  const addFeedback = useCallback((skillId, category, rating, comment = '', output = '') => {
    const newFeedback = {
      id: generateId(),
      skillId,
      category,
      rating, // 'positive' or 'negative'
      comment,
      output: output.substring(0, 500),
      timestamp: new Date().toISOString(),
    };

    const updatedFeedbacks = [...feedbacks, newFeedback];
    setFeedbacks(updatedFeedbacks);
    storage.set(STORAGE_KEY, updatedFeedbacks);

    // Update insights
    const newInsights = { ...insights };
    if (!newInsights[skillId]) {
      newInsights[skillId] = { likes: 0, dislikes: 0, topCategories: [], improvements: [] };
    }

    if (rating === 'positive') {
      newInsights[skillId].likes += 1;
    } else {
      newInsights[skillId].dislikes += 1;
      if (comment) {
        newInsights[skillId].improvements = [
          ...new Set([comment, ...newInsights[skillId].improvements])
        ].slice(0, 5);
      }
    }

    if (!newInsights[skillId].topCategories.includes(category)) {
      newInsights[skillId].topCategories = [
        ...newInsights[skillId].topCategories, 
        category
      ].slice(0, 3);
    }

    setInsights(newInsights);
    storage.set(INSIGHTS_KEY, newInsights);

    return newFeedback;
  }, [feedbacks, insights]);

  // Get stats for a specific skill
  const getSkillStats = useCallback((skillId) => {
    return insights[skillId] || { likes: 0, dislikes: 0, topCategories: [], improvements: [] };
  }, [insights]);

  // Get all stats summary
  const getAllStats = useCallback(() => {
    const totalLikes = Object.values(insights).reduce((sum, s) => sum + s.likes, 0);
    const totalDislikes = Object.values(insights).reduce((sum, s) => sum + s.dislikes, 0);
    const totalImprovements = Object.values(insights).reduce((sum, s) => sum + s.improvements.length, 0);

    return {
      totalFeedback: feedbacks.length,
      totalLikes,
      totalDislikes,
      totalImprovements,
      satisfactionRate: totalLikes / (totalLikes + totalDislikes) || 0,
      skillStats: insights,
    };
  }, [feedbacks, insights]);

  // Get recent feedback
  const getRecentFeedback = useCallback((limit = 10) => {
    return feedbacks.slice(-limit).reverse();
  }, [feedbacks]);

  // Clear all feedback (for testing)
  const clearFeedback = useCallback(() => {
    setFeedbacks([]);
    setInsights(defaultInsights);
    storage.remove(STORAGE_KEY);
    storage.remove(INSIGHTS_KEY);
  }, []);

  return {
    feedbacks,
    insights,
    addFeedback,
    getSkillStats,
    getAllStats,
    getRecentFeedback,
    clearFeedback,
  };
};
