import React from 'react';
import { Star } from 'lucide-react';
import {
  ContentTypePieChart,
  HookPerformanceChart,
} from '../components';
import { formatNumber } from '../utils/helpers';
import { mockContentBreakdown } from '../data/mockAnalytics';

export const ContentAnalysis = ({ hookPerformance }) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Content Performance Analysis</h2>

      <div className="grid grid-cols-2 gap-6">
        {/* Content Type Breakdown */}
        <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
          <h3 className="font-semibold mb-4">Content Type Distribution</h3>
          <div className="flex items-center">
            <div className="w-1/2">
              <ContentTypePieChart data={mockContentBreakdown} />
            </div>
            <div className="space-y-3">
              {mockContentBreakdown.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-300">{item.name}</span>
                  <span className="text-sm text-gray-500">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hook Type Performance */}
        <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
          <h3 className="font-semibold mb-4">Hook Type Performance</h3>
          <HookPerformanceChart data={hookPerformance} />
        </div>
      </div>

      {/* Performance Matrix */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="font-semibold mb-4">Content Performance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">
                  Hook Type
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  Avg Impressions
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  Avg Engagement
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  Posts
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  Best Day
                </th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">
                  Recommendation
                </th>
              </tr>
            </thead>
            <tbody>
              {hookPerformance.map((hook, index) => (
                <tr
                  key={hook.hook}
                  className="border-b border-gray-700/50 hover:bg-gray-700/30"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <Star className="w-4 h-4 text-yellow-400" />
                      )}
                      {hook.hook}
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 font-medium">
                    {formatNumber(hook.avgImpressions)}
                  </td>
                  <td className="text-right py-3 px-4">
                    <span
                      className={
                        hook.avgEngagement >= 4
                          ? 'text-green-400'
                          : 'text-gray-400'
                      }
                    >
                      {hook.avgEngagement}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-4 text-gray-400">
                    {hook.posts}
                  </td>
                  <td className="text-right py-3 px-4 text-gray-400">
                    {
                      ['Tuesday', 'Wednesday', 'Thursday', 'Monday', 'Friday'][
                        index
                      ]
                    }
                  </td>
                  <td className="text-right py-3 px-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        index < 2
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {index < 2 ? 'Increase' : 'Maintain'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Posting Time Heatmap */}
      <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
        <h3 className="font-semibold mb-4">
          Best Posting Times (based on your data)
        </h3>
        <PostingTimeHeatmap />
      </div>
    </div>
  );
};

// Posting Time Heatmap Component
const PostingTimeHeatmap = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const times = ['6am', '9am', '12pm', '3pm', '6pm', '9pm'];

  // Pre-generate random values for consistency
  const getIntensity = (time, dayIndex) => {
    const isOptimal =
      (time === '9am' && dayIndex <= 2) || (time === '6pm' && dayIndex <= 3);
    if (isOptimal) return 'optimal';
    const hash = (time.length * dayIndex + dayIndex) % 10;
    if (hash > 7) return 'high';
    if (hash > 4) return 'medium';
    return 'low';
  };

  return (
    <>
      <div className="grid grid-cols-8 gap-2 text-sm">
        <div></div>
        {days.map((day) => (
          <div key={day} className="text-center text-gray-400 py-2">
            {day}
          </div>
        ))}
        {times.map((time) => (
          <React.Fragment key={time}>
            <div className="text-gray-400 py-2">{time}</div>
            {days.map((_, dayIndex) => {
              const intensity = getIntensity(time, dayIndex);
              return (
                <div
                  key={`${time}-${dayIndex}`}
                  className={`py-2 rounded ${
                    intensity === 'optimal'
                      ? 'bg-green-500/60'
                      : intensity === 'high'
                      ? 'bg-violet-500/40'
                      : intensity === 'medium'
                      ? 'bg-violet-500/20'
                      : 'bg-gray-700/30'
                  }`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center gap-4 justify-center mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500/60 rounded" />
          <span className="text-gray-400">Optimal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-violet-500/40 rounded" />
          <span className="text-gray-400">Good</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-violet-500/20 rounded" />
          <span className="text-gray-400">Average</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-700/30 rounded" />
          <span className="text-gray-400">Low</span>
        </div>
      </div>
    </>
  );
};
