import React, { useState, useEffect } from 'react';
import Loading from '@/components/Loading';
import { formatViewCount, formatRelativeDate } from '@/lib/utils';

// Define the interface for statistics
interface Statistics {
  totalVideos: number;
  nicheDistribution: Record<string, number>;
  timePeriodDistribution?: Record<string, number>;
  recentVideosCount?: number;
  periodDays?: number;
  currentTimePeriod?: string;
}

interface ViralVideo {
  id: string;
  title: string;
  channel: string;
  views: number;
  niche?: string;
  growthRate?: number;
  growthPercentage?: number;
}

interface SchedulerRun {
  timestamp: string;
  timePeriod: string;
  niches: number;
  videosFound: number;
  status: 'success' | 'failed' | 'partial';
}

interface StatisticsPanelProps {
  statistics: Statistics | null;
  isLoading: boolean;
}

export default function StatisticsPanel({ statistics, isLoading }: StatisticsPanelProps) {
  const [viralVideos, setViralVideos] = useState<ViralVideo[]>([]);
  const [schedulerRuns, setSchedulerRuns] = useState<SchedulerRun[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);

  // Format numbers
  const formatNumber = formatViewCount;

  // Truncate long titles
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Fetch the most viral videos when component mounts
  useEffect(() => {
    const fetchViralVideos = async () => {
      setIsLoadingVideos(true);
      try {
        // For demonstration, we'll use the trends API endpoint and sort by views
        const response = await fetch('/api/trends?limit=3&sortBy=views');
        if (!response.ok) {
          throw new Error('Failed to fetch viral videos');
        }
        
        const data = await response.json();
        if (data.success && data.data) {
          setViralVideos(data.data.slice(0, 3).map((video: any) => ({
            id: video.id,
            title: video.title,
            channel: video.channel,
            views: video.views,
            niche: video.niche,
            growthRate: Math.round(video.views * 0.2), // Mock growth rate
            growthPercentage: Math.round(Math.random() * 300 + 100) // Mock growth percentage
          })));
        }
      } catch (error) {
        console.error('Error fetching viral videos:', error);
        // Provide mock data as fallback
        setViralVideos([
          {
            id: 'video1',
            title: 'How to Build a Viral YouTube Channel in 2024',
            channel: 'TrendMasters',
            views: 1250000,
            niche: 'business',
            growthRate: 250000,
            growthPercentage: 320
          },
          {
            id: 'video2',
            title: 'The Ultimate Guide to Modern JavaScript Features',
            channel: 'CodeWizard',
            views: 980000,
            niche: 'programming',
            growthRate: 180000,
            growthPercentage: 250
          },
          {
            id: 'video3',
            title: '10 AMAZING Productivity Hacks That Changed My Life',
            channel: 'LifeOptimized',
            views: 850000,
            niche: 'productivity',
            growthRate: 160000,
            growthPercentage: 210
          }
        ]);
      } finally {
        setIsLoadingVideos(false);
      }
    };

    const generateSchedulerRuns = () => {
      // Generate mock scheduler run data for demonstration
      const now = new Date();
      const runs: SchedulerRun[] = [];
      
      for (let i = 0; i < 4; i++) {
        const date = new Date(now);
        date.setHours(now.getHours() - (i * 6));
        
        const timePeriods = ['day', 'week', 'month', 'all'];
        
        runs.push({
          timestamp: date.toISOString(),
          timePeriod: timePeriods[i % 4],
          niches: Math.floor(Math.random() * 8) + 5,
          videosFound: Math.floor(Math.random() * 50) + 20,
          status: Math.random() > 0.2 ? 'success' : (Math.random() > 0.5 ? 'partial' : 'failed')
        });
      }
      
      setSchedulerRuns(runs);
    };

    fetchViralVideos();
    generateSchedulerRuns();
  }, []);

  if (isLoading || isLoadingVideos) {
    return <Loading />;
  }

  if (!statistics) {
    return (
      <div className="cyberpunk-panel p-6">
        <div className="text-center">
          <p className="text-gray-400 cyberpunk-text-pulse">No statistics available. Try running the scraper.</p>
        </div>
      </div>
    );
  }

  // Get niche data for the tag cloud
  const { nicheDistribution } = statistics;
  const niches = Object.entries(nicheDistribution)
    .sort(([, a], [, b]) => b - a);
  
  // Find the max count for normalization
  const maxNicheCount = niches.length > 0 ? niches[0][1] : 0;

  // Format the relative time
  const formatRelativeTime = (timestamp: string) => {
    return formatRelativeDate(timestamp);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Most Viral Videos */}
      <div className="cyberpunk-panel p-6">
        <h3 className="text-gray-400 text-sm uppercase tracking-wider font-medium mb-4">Most Viral Videos</h3>
        
        <div className="space-y-4">
          {viralVideos.map((video, index) => (
            <div key={video.id} className="bg-gray-900/60 border border-gray-800 rounded-md p-3 hover:bg-gray-800/60 transition">
              <div className="flex items-center mb-2">
                <div className={`
                  ${index === 0 ? 'bg-yellow-600' : index === 1 ? 'bg-gray-500' : 'bg-amber-800'} 
                  w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-2`
                }>
                  {index + 1}
                </div>
                <h4 className="font-medium text-cyan-300 truncate flex-1" title={video.title}>
                  {truncateText(video.title, 35)}
                </h4>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">{video.channel}</span>
                <div className="flex items-center text-cyan-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <span>{formatNumber(video.views)}</span>
                </div>
              </div>
              
              <div className="flex justify-between mt-2 text-xs">
                <div className="text-green-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                  <span>+{video.growthPercentage}%</span>
                </div>
                <div className={`px-2 py-1 rounded text-xs ${video.niche ? 'bg-gray-800 text-gray-300' : 'hidden'}`}>
                  {video.niche}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduler Runs */}
      <div className="cyberpunk-panel p-6">
        <h3 className="text-gray-400 text-sm uppercase tracking-wider font-medium mb-4">Recent Scheduler Runs</h3>
        
        <div className="space-y-3">
          {schedulerRuns.map((run, index) => (
            <div key={index} className="bg-gray-900/60 border border-gray-800 rounded-md p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-400">{formatRelativeTime(run.timestamp)}</span>
                <div className={`px-2 py-0.5 rounded-full text-xs 
                  ${run.status === 'success' ? 'bg-green-900/60 text-green-300 border border-green-600' : 
                    run.status === 'partial' ? 'bg-yellow-900/60 text-yellow-300 border border-yellow-600' : 
                    'bg-red-900/60 text-red-300 border border-red-600'}`}>
                  {run.status === 'success' ? 'Success' : run.status === 'partial' ? 'Partial' : 'Failed'}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex flex-col">
                  <span className="text-cyan-400">{run.timePeriod === 'day' ? 'Today' : 
                    run.timePeriod === 'week' ? 'This Week' : 
                    run.timePeriod === 'month' ? 'This Month' : 'All Time'}</span>
                  <span className="text-xs text-gray-400 mt-1">{run.niches} niches</span>
                </div>
                <div className="text-indigo-300 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                  </svg>
                  {formatNumber(run.videosFound)} videos
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Niche Tag Cloud */}
      <div className="cyberpunk-panel p-6">
        <h3 className="text-gray-400 text-sm uppercase tracking-wider font-medium mb-4">Niche Tag Cloud</h3>
        
        <div className="flex flex-wrap gap-2">
          {niches.map(([niche, count]) => {
            // Calculate size and color based on count
            const normalizedSize = 0.5 + (count / maxNicheCount) * 0.8; // Scale between 0.5 and 1.3
            const fontSize = `${Math.max(0.75, normalizedSize)}rem`;
            const opacity = 0.3 + (count / maxNicheCount) * 0.7; // Scale between 0.3 and 1.0
            
            // Generate color based on size
            // Smaller -> cyan/blue, Larger -> pink/purple
            const hue = 180 - Math.floor((count / maxNicheCount) * 60);
            const saturation = 70 + Math.floor((count / maxNicheCount) * 30);
            const lightness = 50 + Math.floor((count / maxNicheCount) * 20);
            
            return (
              <span 
                key={niche} 
                className="px-3 py-1.5 bg-gray-900/60 border border-gray-800 rounded-lg"
                style={{ 
                  fontSize, 
                  color: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
                  opacity: opacity,
                  transition: 'all 0.2s ease',
                  fontWeight: normalizedSize > 0.8 ? 'bold' : 'normal',
                }}
              >
                {niche === '' ? 'general' : niche}
                <span className="ml-1 text-xs opacity-70">{count}</span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
} 