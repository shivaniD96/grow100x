import React from 'react';
import { Target } from 'lucide-react';
import { daysUntil, formatNumber } from '../utils/helpers';
import { ProgressBar } from './Cards';

export const MonetizationTracker = ({ 
  current = 3780000, 
  goal = 5000000, 
  deadline = '2026-02-28' 
}) => {
  const progress = (current / goal) * 100;
  const daysLeft = daysUntil(deadline);
  const dailyNeeded = Math.ceil((goal - current) / Math.max(daysLeft, 1));
  const onTrack = (current / (90 - daysLeft)) * 90 >= goal * 0.9;

  return (
    <div className="bg-gradient-to-br from-violet-900/40 to-purple-900/40 rounded-2xl p-6 border border-violet-700/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-500/30 rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold">X Monetization Goal</h3>
            <p className="text-sm text-gray-400">5M impressions in 3 months</p>
          </div>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            onTrack
              ? 'bg-green-500/20 text-green-400'
              : 'bg-orange-500/20 text-orange-400'
          }`}
        >
          {onTrack ? '✓ On Track' : '⚠ Behind Pace'}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">
            {(current / 1000000).toFixed(2)}M / 5M impressions
          </span>
          <span className="text-violet-400 font-medium">
            {progress.toFixed(1)}%
          </span>
        </div>
        <ProgressBar value={current} max={goal} color="violet" />
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-white">{daysLeft}</div>
          <div className="text-xs text-gray-400">Days Left</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-violet-400">
            {formatNumber(dailyNeeded)}
          </div>
          <div className="text-xs text-gray-400">Daily Target</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-400">
            {((goal - current) / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-gray-400">Remaining</div>
        </div>
      </div>

      {/* Weekly Milestones */}
      <div className="mt-4 pt-4 border-t border-violet-700/30">
        <div className="text-sm text-gray-400 mb-2">Weekly Milestones</div>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map((week) => {
            const weekTarget = (goal / 12) * week;
            const completed = current >= weekTarget;
            return (
              <div
                key={week}
                className={`flex-1 h-2 rounded-full ${
                  completed ? 'bg-violet-500' : 'bg-gray-700'
                }`}
                title={`Week ${week}: ${formatNumber(weekTarget)}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
