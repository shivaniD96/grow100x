import React, { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Plus, BarChart2, FileVideo, Users } from 'lucide-react';

export const CSVUpload = ({ onUpload, onCancel, existingFiles = [] }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.csv')
    );

    if (droppedFiles.length === 0) {
      setError('Please drop CSV files only');
      return;
    }

    addFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    addFiles(selectedFiles);
    e.target.value = '';
  };

  const addFiles = (newFiles) => {
    setError(null);
    const existingNames = files.map(f => f.name);
    const uniqueFiles = newFiles.filter(f => !existingNames.includes(f.name));

    if (uniqueFiles.length < newFiles.length) {
      setError('Some files were already added');
    }

    setFiles([...files, ...uniqueFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getFileTypeInfo = (fileName) => {
    const name = fileName.toLowerCase();
    if (name.includes('account_overview') || name.includes('overview')) {
      return { type: 'Account Overview', icon: Users, color: 'text-blue-400' };
    }
    if (name.includes('video') || name.includes('watch')) {
      return { type: 'Video Analytics', icon: FileVideo, color: 'text-purple-400' };
    }
    if (name.includes('content') || name.includes('analytics') || name.includes('tweet')) {
      return { type: 'Content Analytics', icon: BarChart2, color: 'text-green-400' };
    }
    return { type: 'Analytics', icon: FileText, color: 'text-violet-400' };
  };

  const processFiles = async () => {
    if (files.length === 0) {
      setError('Please add at least one CSV file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const fileContents = await Promise.all(
        files.map(file => readFileContent(file))
      );

      onUpload(fileContents);
    } catch (err) {
      setError(err.message || 'Failed to process files');
      setIsProcessing(false);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          name: file.name,
          content: e.target.result
        });
      };
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsText(file);
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Supported File Types */}
      <div className="mb-6 grid grid-cols-3 gap-2">
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <p className="text-xs text-blue-400 font-medium">Account Overview</p>
        </div>
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-center">
          <BarChart2 className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-xs text-green-400 font-medium">Content Analytics</p>
        </div>
        <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
          <FileVideo className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <p className="text-xs text-purple-400 font-medium">Video Analytics</p>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
          ${isDragging
            ? 'border-violet-500 bg-violet-500/10'
            : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <Upload className={`w-10 h-10 mx-auto mb-4 ${isDragging ? 'text-violet-400' : 'text-gray-500'}`} />

        <p className="text-gray-300 mb-2">
          {isDragging ? 'Drop your CSV files here' : 'Drag & drop CSV files here'}
        </p>
        <p className="text-sm text-gray-500">
          Upload any of the 3 file types above
        </p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm text-gray-400 mb-2">{files.length} file(s) selected:</p>

          {files.map((file, index) => {
            const fileInfo = getFileTypeInfo(file.name);
            const Icon = fileInfo.icon;

            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <Icon className={`w-5 h-5 ${fileInfo.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-300 truncate">{file.name}</p>
                  <p className={`text-xs ${fileInfo.color}`}>{fileInfo.type}</p>
                </div>
                <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            );
          })}

          {/* Add More Button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 w-full p-3 border border-dashed border-gray-700 rounded-lg text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Add more files</span>
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
        <h4 className="text-sm font-medium text-gray-300 mb-3">How to export from X Analytics:</h4>
        <ol className="text-xs text-gray-500 space-y-2 list-decimal list-inside">
          <li>Go to <span className="text-gray-400">analytics.x.com</span></li>
          <li>Navigate to <span className="text-gray-400">Account Overview</span>, <span className="text-gray-400">Posts</span>, or <span className="text-gray-400">Videos</span></li>
          <li>Select your date range</li>
          <li>Click <span className="text-gray-400">Export data</span> button</li>
          <li>Upload all CSV files here for complete analytics</li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-3 px-4 border border-gray-700 rounded-xl text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={processFiles}
          disabled={files.length === 0 || isProcessing}
          className="flex-1 py-3 px-4 bg-violet-600 hover:bg-violet-500 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Import Data
            </>
          )}
        </button>
      </div>
    </div>
  );
};

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
