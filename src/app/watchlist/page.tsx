'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Loading from '@/components/Loading';
import { formatViewCount, formatRelativeDate } from '@/lib/utils';

interface WatchlistVideo {
  id: number;
  video_id: string;
  title: string;
  channel: string;
  views: number;
  niche: string;
  created_at: string;
  notes: string;
}

export default function WatchlistPage() {
  const [videos, setVideos] = useState<WatchlistVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [removingVideo, setRemovingVideo] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    fetchWatchlist();
  }, []);
  
  const fetchWatchlist = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const response = await fetch('/api/watchlist');
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Watchlist API error response:', errorText);
        throw new Error(`Failed to fetch watchlist: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error fetching watchlist');
      }
      
      setVideos(data.data || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setErrorMessage(`Error fetching watchlist: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const removeFromWatchlist = async (videoId: string) => {
    setRemovingVideo(prev => ({ ...prev, [videoId]: true }));
    
    try {
      const response = await fetch(`/api/watchlist?video_id=${videoId}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to remove video from watchlist');
      }
      
      // Update the local state by removing the video
      setVideos(prev => prev.filter(video => video.video_id !== videoId));
    } catch (error) {
      console.error('Error removing from watchlist:', error);
      setErrorMessage(`Error removing from watchlist: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRemovingVideo(prev => ({ ...prev, [videoId]: false }));
    }
  };
  
  const formatViews = formatViewCount;
  
  const formatDate = formatRelativeDate;
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black relative pt-2">
      {/* Cyberpunk background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.03),transparent_80%)]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold cyberpunk-title">MY WATCHLIST</h1>
        </div>
        
        {isLoading ? (
          <Loading />
        ) : errorMessage ? (
          <div className="cyberpunk-panel border-secondary p-4 bg-opacity-30 border-opacity-70">
            <div className="text-red-400 cyberpunk-text-glitch">{errorMessage}</div>
            <button 
              onClick={fetchWatchlist}
              className="mt-2 text-sm font-medium text-red-400 underline hover:text-red-300"
            >
              Try again
            </button>
          </div>
        ) : videos.length === 0 ? (
          <div className="cyberpunk-panel p-10 text-center">
            <div className="flex flex-col items-center justify-center gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <h2 className="text-xl font-medium text-gray-300">Your watchlist is empty</h2>
              <p className="text-gray-400 max-w-md">Add videos from the trending page to keep track of content you're interested in watching later.</p>
              <Link href="/" className="cyberpunk-button py-2 px-6 mt-4">
                BROWSE TRENDING VIDEOS
              </Link>
            </div>
          </div>
        ) : (
          <div className="cyberpunk-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="cyberpunk-table min-w-full">
                <thead>
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Video</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Views</th>
                    <th className="px-4 py-3">Niche</th>
                    <th className="px-4 py-3">Added On</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-800/30">
                  {videos.map((video, index) => {
                    const isRemoving = removingVideo[video.video_id] || false;
                    
                    return (
                      <tr key={video.id} className="hover:bg-cyan-900/10 transition-colors">
                        <td className="px-4 py-3 text-cyan-300">{index + 1}</td>
                        <td className="px-4 py-3">
                          <a 
                            href={`https://youtube.com/watch?v=${video.video_id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-cyan-400 transition-colors font-medium"
                          >
                            {video.title}
                          </a>
                        </td>
                        <td className="px-4 py-3 text-gray-300">{video.channel}</td>
                        <td className="px-4 py-3 text-cyan-300 font-mono">{formatViews(video.views)}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-md bg-gray-800 text-sm font-medium text-cyan-300 border border-cyan-800">
                            {video.niche}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300 font-mono">{formatDate(video.created_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <a
                              href={`https://youtube.com/watch?v=${video.video_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cyberpunk-button text-xs py-1 px-2 flex items-center gap-1"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                              WATCH
                            </a>
                            
                            <button
                              onClick={() => removeFromWatchlist(video.video_id)}
                              disabled={isRemoving}
                              className="cyberpunk-button cyberpunk-button-danger text-xs py-1 px-2 flex items-center gap-1"
                            >
                              {isRemoving ? (
                                <>
                                  <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  REMOVING...
                                </>
                              ) : (
                                <>
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                  REMOVE
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 