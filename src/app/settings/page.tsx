'use client';

import NicheCustomizer from '@/components/NicheCustomizer';

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black relative pt-2">
      {/* Cyberpunk background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.03),transparent_80%)]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold cyberpunk-title">SETTINGS</h1>
          <p className="text-gray-400 mt-2">Configure your YouTube Trend Analyzer</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Niche Customizer */}
          <div className="cyberpunk-panel p-6">
            <h2 className="text-xl font-bold text-cyan-400 mb-4">YouTube Trend Scraper</h2>
            <p className="text-gray-400 mb-4">
              Customize which niches the trend scraper will analyze. By default, the scraper analyzes
              general trending videos and several popular niches. You can customize this list below.
            </p>
            
            <div className="mt-6">
              <NicheCustomizer />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 