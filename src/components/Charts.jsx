import React from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { formatNumber } from '../utils/helpers';

const chartTooltipStyle = {
  backgroundColor: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '8px',
};

// Impressions Area Chart
export const ImpressionsChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <AreaChart data={data}>
      <defs>
        <linearGradient id="impressionsGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
      <YAxis 
        stroke="#9ca3af" 
        fontSize={12} 
        tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} 
      />
      <Tooltip
        contentStyle={chartTooltipStyle}
        labelStyle={{ color: '#9ca3af' }}
        formatter={(value) => [formatNumber(value), 'Impressions']}
      />
      <Area 
        type="monotone" 
        dataKey="impressions" 
        stroke="#8b5cf6" 
        fillOpacity={1} 
        fill="url(#impressionsGradient)" 
      />
    </AreaChart>
  </ResponsiveContainer>
);

// Engagement Bar Chart
export const EngagementChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
      <YAxis stroke="#9ca3af" fontSize={12} />
      <Tooltip
        contentStyle={chartTooltipStyle}
        labelStyle={{ color: '#9ca3af' }}
      />
      <Bar dataKey="likes" fill="#ef4444" radius={[2, 2, 0, 0]} />
      <Bar dataKey="retweets" fill="#22c55e" radius={[2, 2, 0, 0]} />
      <Bar dataKey="replies" fill="#3b82f6" radius={[2, 2, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

// Content Type Pie Chart
export const ContentTypePieChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={50}
        outerRadius={80}
        paddingAngle={5}
        dataKey="value"
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip
        contentStyle={chartTooltipStyle}
        formatter={(value) => [`${value}%`, 'Share']}
      />
    </PieChart>
  </ResponsiveContainer>
);

// Hook Performance Horizontal Bar Chart
export const HookPerformanceChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={data} layout="vertical">
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis 
        type="number" 
        stroke="#9ca3af" 
        fontSize={12} 
        tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} 
      />
      <YAxis 
        type="category" 
        dataKey="hook" 
        stroke="#9ca3af" 
        fontSize={12} 
        width={80} 
      />
      <Tooltip
        contentStyle={chartTooltipStyle}
        formatter={(value) => [formatNumber(value), 'Avg Impressions']}
      />
      <Bar dataKey="avgImpressions" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

// Followers Growth Line Chart
export const FollowersChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
      <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
      <YAxis stroke="#9ca3af" fontSize={12} />
      <Tooltip
        contentStyle={chartTooltipStyle}
        labelStyle={{ color: '#9ca3af' }}
        formatter={(value) => [formatNumber(value), 'Followers']}
      />
      <Line 
        type="monotone" 
        dataKey="followers" 
        stroke="#10b981" 
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
);

// Chart Legend Component
export const ChartLegend = ({ items }) => (
  <div className="flex justify-center gap-6 mt-2">
    {items.map((item) => (
      <div key={item.label} className="flex items-center gap-2 text-sm">
        <div 
          className="w-3 h-3 rounded" 
          style={{ backgroundColor: item.color }} 
        />
        <span className="text-gray-400">{item.label}</span>
      </div>
    ))}
  </div>
);
