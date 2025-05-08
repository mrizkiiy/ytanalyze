import React from 'react';

interface LoadingProps {
  small?: boolean;
}

export default function Loading({ small = false }: LoadingProps) {
  if (small) {
    return (
      <div className="relative w-5 h-5">
        <div className="absolute inset-0 border-t-2 border-r-2 border-cyan-500 rounded-full animate-spin"></div>
        <div className="absolute inset-0.5 border-b-2 border-l-2 border-cyan-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
    );
  }
  
  return (
    <div className="cyberpunk-panel p-6 flex flex-col items-center justify-center">
      <div className="relative w-16 h-16 mb-4">
        <div className="absolute inset-0 border-t-2 border-r-2 border-cyan-500 rounded-full animate-spin"></div>
        <div className="absolute inset-1 border-b-2 border-l-2 border-cyan-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        <div className="absolute inset-2 border-t-2 border-r-2 border-cyan-400 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
        <div className="absolute inset-3 border-l-2 border-b-2 border-cyan-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2.5s' }}></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      <div className="text-cyan-400 text-lg font-mono cyberpunk-text-pulse">LOADING</div>
      <div className="w-48 h-1 bg-gray-800 mt-2 relative overflow-hidden">
        <div className="absolute h-full bg-cyan-500 w-1/4 left-0 animate-[scan_1.5s_linear_infinite]"></div>
      </div>
    </div>
  );
} 