import React from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export const ConnectPage = ({ onConnect, isConnecting, error }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Growth Skills Lab</h1>
          <p className="text-gray-400">
            Connect your X account to unlock analytics-powered insights
          </p>
        </div>

        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700 mb-6">
          <h3 className="font-semibold mb-4">What you'll get:</h3>
          <ul className="space-y-3">
            <FeatureItem>
              Real-time analytics dashboard with impressions, engagement, and growth
            </FeatureItem>
            <FeatureItem>
              AI-powered insights on what content performs best
            </FeatureItem>
            <FeatureItem>
              Monetization progress tracker (5M impressions goal)
            </FeatureItem>
            <FeatureItem>
              Hook & content type performance breakdown
            </FeatureItem>
            <FeatureItem>
              Personalized recommendations based on your data
            </FeatureItem>
          </ul>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={() => onConnect(false)}
          disabled={isConnecting}
          className="w-full py-4 px-6 bg-black hover:bg-gray-900 border border-gray-700 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-50"
        >
          {isConnecting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <XIcon className="w-5 h-5" />
              Connect X Account
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          We only read your public analytics. We never post on your behalf.
        </p>

        {/* Demo Mode Button */}
        <button
          onClick={() => onConnect(true)}
          disabled={isConnecting}
          className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          Or try with demo data →
        </button>
      </div>
    </div>
  );
};

const FeatureItem = ({ children }) => (
  <li className="flex items-start gap-3">
    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
    <span className="text-gray-300">{children}</span>
  </li>
);

const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
