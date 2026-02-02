import React from 'react';
import { X, Brain, Eye, Heart, Repeat2, MessageCircle, Bookmark } from 'lucide-react';
import { formatNumber } from '../utils/helpers';
import { analyzePostPerformance } from '../data/insights';

export const PostDetailModal = ({ post, onClose }) => {
  if (!post) return null;

  const reasons = analyzePostPerformance(post);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Post Analysis</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post Content */}
        <div className="bg-gray-900/50 rounded-lg p-4 mb-4">
          <p className="text-gray-300 whitespace-pre-line">{post.text}</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <MetricBox icon={Eye} label="Impressions" value={post.impressions} color="gray" />
          <MetricBox icon={Heart} label="Likes" value={post.likes} color="red" />
          <MetricBox icon={Repeat2} label="Retweets" value={post.retweets} color="green" />
          <MetricBox icon={MessageCircle} label="Replies" value={post.replies} color="blue" />
          <MetricBox icon={Bookmark} label="Bookmarks" value={post.bookmarks} color="violet" />
        </div>

        {/* Post Details */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Hook Type</div>
            <div className="font-medium text-violet-400">{post.hookType}</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Content Type</div>
            <div className="font-medium text-blue-400">{post.contentType}</div>
          </div>
          <div className="bg-gray-700/30 rounded-lg p-3">
            <div className="text-xs text-gray-400 mb-1">Posted At</div>
            <div className="font-medium">{post.postedAt || post.date}</div>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="bg-gray-700/30 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Engagement Rate</span>
            <span className="text-2xl font-bold text-green-400">
              {(((post.likes + post.retweets + post.replies) / post.impressions) * 100).toFixed(2)}%
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
              style={{
                width: `${Math.min(((post.likes + post.retweets + post.replies) / post.impressions) * 100 * 20, 100)}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0%</span>
            <span>Average: 2%</span>
            <span>5%+</span>
          </div>
        </div>

        {/* Why This Worked */}
        <div className="bg-violet-500/10 rounded-lg p-4 border border-violet-500/30">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-violet-400" />
            <span className="font-semibold">Why This Worked</span>
          </div>
          <ul className="text-sm text-gray-300 space-y-2">
            {reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4">
          <button className="flex-1 py-2 px-4 bg-violet-500 hover:bg-violet-600 rounded-lg font-medium transition-colors">
            Generate Similar
          </button>
          <button className="flex-1 py-2 px-4 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors">
            Copy Hook Pattern
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for metric boxes
const MetricBox = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    gray: 'text-gray-400',
    red: 'text-red-400',
    green: 'text-green-400',
    blue: 'text-blue-400',
    violet: 'text-violet-400',
  };

  return (
    <div className="text-center p-3 bg-gray-700/30 rounded-lg">
      <Icon className={`w-5 h-5 mx-auto mb-1 ${colorClasses[color]}`} />
      <div className="font-bold">{formatNumber(value)}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
};
