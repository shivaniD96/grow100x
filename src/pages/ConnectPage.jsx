import React, { useState } from 'react';
import { Sparkles, CheckCircle2, Upload, ArrowLeft } from 'lucide-react';
import { CSVUpload } from '../components';

export const ConnectPage = ({ onConnect, onCSVUpload, isConnecting, error }) => {
  const [showCSVUpload, setShowCSVUpload] = useState(false);

  if (showCSVUpload) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-6">
        <div className="max-w-lg w-full">
          <button
            onClick={() => setShowCSVUpload(false)}
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Import X Analytics</h2>
            <p className="text-gray-400">
              Upload your exported CSV files from X Analytics
            </p>
          </div>

          <CSVUpload
            onUpload={(files) => {
              onCSVUpload(files);
            }}
            onCancel={() => setShowCSVUpload(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Growth Skills Lab</h1>
          <p className="text-gray-400">
            Import your X analytics to unlock powerful insights
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

        {/* CSV Upload Button - Primary Action */}
        <button
          onClick={() => setShowCSVUpload(true)}
          disabled={isConnecting}
          className="w-full py-4 px-6 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold flex items-center justify-center gap-3 transition-all disabled:opacity-50"
        >
          <Upload className="w-5 h-5" />
          Import CSV from X Analytics
        </button>

        <p className="text-center text-xs text-gray-500 mt-4">
          Export your data from analytics.x.com and upload it here
        </p>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-gray-900 text-gray-500">or</span>
          </div>
        </div>

        {/* X API Connect Button - Secondary */}
        <button
          onClick={() => onConnect(false)}
          disabled={isConnecting}
          className="w-full py-3 px-6 bg-black hover:bg-gray-900 border border-gray-700 rounded-xl font-medium flex items-center justify-center gap-3 transition-all disabled:opacity-50 text-sm"
        >
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <XIcon className="w-4 h-4" />
              Connect X Account (API)
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-500 mt-2">
          Requires X API subscription ($100/month)
        </p>

        {/* Demo Mode Button */}
        <button
          onClick={() => onConnect(true)}
          disabled={isConnecting}
          className="w-full mt-6 py-2 text-sm text-gray-400 hover:text-white transition-colors"
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
