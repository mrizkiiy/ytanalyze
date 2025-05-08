'use client';

import React from 'react';

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black relative pt-2">
      {/* Cyberpunk background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.03),transparent_80%)]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold cyberpunk-title">HELP & DOCUMENTATION</h1>
          <p className="text-gray-400 mt-2">Learn how to use the YouTube Trends Analyzer</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="cyberpunk-panel p-6">
            <h2 className="text-xl font-semibold mb-4 text-cyan-400">Quick Start</h2>
            <div className="space-y-4 text-gray-300">
              <p>Welcome to YouTube Trends Analyzer! Here's how to get started:</p>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Set up your Supabase database (see Settings page)</li>
                <li>Use the Control Panel to scrape trending videos</li>
                <li>View statistics and analyze the results</li>
                <li>Add interesting videos to your watchlist</li>
              </ol>
            </div>
          </div>
          
          <div className="cyberpunk-panel p-6">
            <h2 className="text-xl font-semibold mb-4 text-cyan-400">Features</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>Trend Scraping:</strong> Automatically scrape YouTube trending videos</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>Statistics:</strong> View detailed statistics about trending videos</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>Watchlist:</strong> Save videos to watch later</span>
              </li>
              <li className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span><strong>Filtering:</strong> Filter trends by time period and niche</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="cyberpunk-panel p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">How To Use</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-lg text-cyan-300">Scraping Trends</h3>
              <div className="mt-2 text-gray-300">
                <p>To scrape trending videos:</p>
                <ol className="list-decimal pl-5 mt-2 space-y-2">
                  <li>Go to the Dashboard</li>
                  <li>Select a time period (day, week, month, or all time)</li>
                  <li>Click the "SCRAPE YOUTUBE" button</li>
                  <li>Wait for the scraping process to complete</li>
                  <li>The results will appear in the trending videos table</li>
                </ol>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-lg text-cyan-300">Managing Your Watchlist</h3>
              <div className="mt-2 text-gray-300">
                <p>To add videos to your watchlist:</p>
                <ol className="list-decimal pl-5 mt-2 space-y-2">
                  <li>Browse the trending videos on the Dashboard</li>
                  <li>Click the "ADD TO WATCHLIST" button next to a video</li>
                  <li>The video will be saved to your watchlist</li>
                </ol>
                <p className="mt-3">To view and manage your watchlist:</p>
                <ol className="list-decimal pl-5 mt-2 space-y-2">
                  <li>Click "Watchlist" in the navigation bar</li>
                  <li>View your saved videos</li>
                  <li>Click "REMOVE" to delete videos from your watchlist</li>
                  <li>Click "WATCH" to open the video on YouTube</li>
                </ol>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-lg text-cyan-300">Clearing Data</h3>
              <div className="mt-2 text-gray-300">
                <p>To clear trending video data:</p>
                <ol className="list-decimal pl-5 mt-2 space-y-2">
                  <li>Go to the Dashboard</li>
                  <li>Select the time period you want to clear (day, week, month, or all)</li>
                  <li>Click the "CLEAR TRENDING" button</li>
                  <li>Confirm the action when prompted</li>
                </ol>
                <p className="mt-2 text-yellow-400">Note: This will not affect videos in your watchlist.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="cyberpunk-panel p-6">
          <h2 className="text-xl font-semibold mb-4 text-cyan-400">Troubleshooting</h2>
          
          <div className="space-y-4">
            <div className="p-4 border border-yellow-700 bg-yellow-900/20 rounded">
              <h3 className="font-medium text-lg text-yellow-400">Connection Issues</h3>
              <p className="mt-2 text-gray-300">
                If you have trouble connecting to Supabase:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-300">
                <li>Check your Supabase URL and key in the Settings page</li>
                <li>Make sure your Supabase project is active</li>
                <li>Verify that the required tables exist in your database</li>
                <li>Check your browser console for detailed error messages</li>
              </ul>
            </div>
            
            <div className="p-4 border border-red-700 bg-red-900/20 rounded">
              <h3 className="font-medium text-lg text-red-400">Data Not Loading</h3>
              <p className="mt-2 text-gray-300">
                If your data isn't loading properly:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-300">
                <li>Try refreshing the page</li>
                <li>Check your internet connection</li>
                <li>Make sure you've scraped data for the selected time period</li>
                <li>Verify that your database tables are set up correctly</li>
              </ul>
            </div>
            
            <div className="p-4 border border-green-700 bg-green-900/20 rounded">
              <h3 className="font-medium text-lg text-green-400">Need More Help?</h3>
              <p className="mt-2 text-gray-300">
                For additional support:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-gray-300">
                <li>Check the GitHub repository documentation</li>
                <li>Look for error messages in the browser console (F12)</li>
                <li>Submit an issue on the project's GitHub page</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
} 