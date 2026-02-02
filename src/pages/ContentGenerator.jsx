import React, { useState } from 'react';
import { Sparkles, RefreshCw, Copy, Check, Brain, Eye, TrendingUp } from 'lucide-react';
import { predictPerformance } from '../data/insights';
import { formatNumber } from '../utils/helpers';

const CONTENT_TYPES = [
  { id: 'contrarian', label: 'Contrarian Take', hookType: 'Contrarian' },
  { id: 'thread', label: 'Thread Hook', hookType: 'Data/Numbers' },
  { id: 'educational', label: 'Educational', hookType: 'Question' },
  { id: 'protocol', label: 'Protocol Breakdown', hookType: 'FOMO' },
];

const GENERATED_CONTENT = {
  contrarian: `Unpopular opinion: Token incentives are the lazy path to growth.

The best Web3 products I've seen grow through:

→ Product-led virality (not airdrops)
→ Community that stays after the hype
→ Solving real problems, not farming narratives

The projects dumping tokens for users are building on sand.

The projects building sticky products? That's the foundation.

What's one project you think got growth right without token games? 👇`,

  thread: `I analyzed 50 Base ecosystem projects over the last 30 days.

3 patterns separated the winners from the rest:

🧵 Thread incoming...

1/ They shipped weekly, not monthly.

Iteration speed > perfect launches.

The top 5 growing protocols all had 4+ updates in 30 days.`,

  educational: `Most people don't understand Account Abstraction.

Here's a simple breakdown that will put you ahead of 95% of crypto 🧵

Think of it like upgrading from a flip phone to a smartphone.

Your current wallet (EOA) = flip phone
Smart contract wallet = smartphone

The difference? Programmability.`,

  protocol: `This protocol is quietly doing $2M/month in fees.

And almost nobody is talking about it.

Here's the full breakdown 🧵

TVL: $890M
Daily users: 12K
Fee revenue: $67K/day

The tokenomics are interesting...`,
};

export const ContentGenerator = ({ hookPerformance }) => {
  const [selectedType, setSelectedType] = useState('contrarian');
  const [generatedContent, setGeneratedContent] = useState(GENERATED_CONTENT.contrarian);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentType = CONTENT_TYPES.find((t) => t.id === selectedType);
  const prediction = predictPerformance(
    generatedContent,
    currentType?.hookType || 'Contrarian',
    selectedType === 'thread' ? 'Thread' : 'Single Tweet'
  );

  const handleGenerate = async (type) => {
    setSelectedType(type);
    setIsGenerating(true);
    
    // Simulate generation delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    setGeneratedContent(GENERATED_CONTENT[type] || GENERATED_CONTENT.contrarian);
    setIsGenerating(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    // In a real app, this would generate new content
    setIsGenerating(false);
  };

  // Find best performing hooks from user data
  const topHooks = hookPerformance?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Generator</h2>
          <p className="text-gray-400">
            Generate content optimized for your audience
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-sm">
          <Brain className="w-4 h-4" />
          Powered by your analytics
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Generator Options */}
        <div className="space-y-4">
          {/* Your Best Performing */}
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <h3 className="font-semibold mb-4">Your Best Performing</h3>
            <div className="space-y-3">
              {topHooks.map((hook, index) => (
                <div
                  key={hook.hook}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    index === 0
                      ? 'bg-violet-500/10 border border-violet-500/30'
                      : 'bg-gray-700/30'
                  }`}
                >
                  <span className="text-sm">{hook.hook} hooks</span>
                  <span
                    className={`text-sm ${
                      index === 0 ? 'text-violet-400' : 'text-gray-400'
                    }`}
                  >
                    {formatNumber(hook.avgImpressions)} avg
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Generate */}
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <h3 className="font-semibold mb-4">Quick Generate</h3>
            <div className="space-y-2">
              {CONTENT_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleGenerate(type.id)}
                  disabled={isGenerating}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between ${
                    selectedType === type.id
                      ? 'bg-violet-500/20 border border-violet-500/30 text-violet-300'
                      : 'bg-gray-700/30 hover:bg-gray-700/50'
                  } disabled:opacity-50`}
                >
                  {type.label}
                  <Sparkles
                    className={`w-4 h-4 ${
                      selectedType === type.id
                        ? 'text-violet-400'
                        : 'text-gray-500'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
            <h4 className="text-sm font-medium mb-2 text-gray-400">Pro Tips</h4>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• Post at 8-9 AM or 7-8 PM EST</li>
              <li>• Contrarian hooks perform 2.3x better for you</li>
              <li>• Tuesday/Wednesday get 40% more engagement</li>
            </ul>
          </div>
        </div>

        {/* Generated Content Area */}
        <div className="col-span-2 bg-gray-800/50 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Generated Content</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`}
                />
                Regenerate
              </button>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Content Display */}
          <div className="bg-gray-900/50 rounded-lg p-4 mb-4 min-h-[200px]">
            {isGenerating ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">Generating content...</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-300 whitespace-pre-line">
                {generatedContent}
              </p>
            )}
          </div>

          {/* Prediction Bar */}
          <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-400">Predicted performance:</span>
              <span className="flex items-center gap-1 text-green-400">
                <Eye className="w-4 h-4" />
                {formatNumber(prediction.impressionsRange.min)}-
                {formatNumber(prediction.impressionsRange.max)} impressions
              </span>
              <span className="flex items-center gap-1 text-blue-400">
                <TrendingUp className="w-4 h-4" />
                {prediction.estimatedEngagement}% engagement
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {prediction.confidence}
            </span>
          </div>

          {/* Character Count */}
          <div className="flex justify-between items-center mt-3 text-sm">
            <span className="text-gray-500">
              {generatedContent.length} characters
            </span>
            <span
              className={`${
                generatedContent.length > 280
                  ? 'text-orange-400'
                  : 'text-gray-500'
              }`}
            >
              {generatedContent.length > 280
                ? 'Long-form post'
                : 'Single tweet'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
