'use client';

import { useState } from 'react';
import GrowthAnalytics from './components/GrowthAnalytics';
import AIPredictionPanel from './components/AIPredictionPanel';

export default function GrowthPage() {
  const [selectedTab, setSelectedTab] = useState<'analytics' | 'ai'>('analytics');
  const [selectedNiche, setSelectedNiche] = useState('all');
  const [growthVideos, setGrowthVideos] = useState<any[]>([]);
  
  // Handle niche selection change
  const handleNicheSelect = (niche: string, videos?: any[]) => {
    setSelectedNiche(niche);
    if (videos) {
      setGrowthVideos(videos);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black relative pt-2">
      {/* Cyberpunk background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.03),transparent_80%)]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold cyberpunk-title">GROWTH TRACKER</h1>
          <p className="text-gray-400 mt-2">Monitor videos with explosive growth and viral potential</p>
        </div>
        
        {/* Growth Tabs */}
        <div className="mb-4 border-b border-gray-800">
          <div className="flex">
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                selectedTab === 'analytics'
                  ? 'border-cyan-500 text-cyan-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setSelectedTab('analytics')}
            >
              Growth Analytics
            </button>
            <button
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                selectedTab === 'ai'
                  ? 'border-cyan-500 text-cyan-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setSelectedTab('ai')}
            >
              AI Predictions
            </button>
          </div>
        </div>
        
        {/* Selected Tab Content */}
        <GrowthAnalytics
          isVisible={selectedTab === 'analytics'}
          onNicheSelect={handleNicheSelect}
        />
        <AIPredictionPanel
          isVisible={selectedTab === 'ai'}
          selectedNiche={selectedNiche}
          filteredVideos={growthVideos}
        />
      </div>
    </div>
  );
} 