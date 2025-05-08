'use client';

import { useState, useEffect } from 'react';
import ControlPanel from '@/components/ControlPanel';
import StatisticsPanel from '@/components/StatisticsPanel';
import TrendingVideosTable from '@/components/TrendingVideosTable';
import Loading from '@/components/Loading';
import { TimePeriod } from '@/lib/youtube-scraper';

// Define the interface for statistics
interface Statistics {
  totalVideos: number;
  nicheDistribution: Record<string, number>;
  timePeriodDistribution: Record<string, number>;
  recentVideosCount: number;
  periodDays: number;
  currentTimePeriod: string;
}

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [selectedNiche, setSelectedNiche] = useState('');
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('all');
  const [niches, setNiches] = useState<string[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Time period options
  const timePeriods: { value: TimePeriod; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];
  
  // Check API and database connection status
  const checkConnectionStatus = async () => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setConnectionStatus(data);
      
      if (!data.success || !data.database.connected) {
        setErrorMessage(`Database connection error: ${data.database.error || 'Unknown error'}`);
        return false;
      }
      
      setErrorMessage(null);
      return true;
    } catch (error) {
      console.error('Error checking connection status:', error);
      setErrorMessage(`API connection error: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  };
  
  // Fetch trending videos
  const fetchTrendingVideos = async (removeDuplicates: boolean = false) => {
    setIsLoadingVideos(true);
    try {
      const baseUrl = window.location.origin;
      let url = `${baseUrl}/api/trends?${selectedNiche ? `niche=${selectedNiche}&` : ''}`;
      
      // Add time period filter if not 'all'
      if (selectedTimePeriod !== 'all') {
        url += `timePeriod=${selectedTimePeriod}&`;
      }
      
      // Add removeDuplicates parameter if requested
      if (removeDuplicates) {
        url += 'removeDuplicates=true&';
      }
      
      url += 'limit=50';
      
      console.log('Fetching videos from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error fetching videos');
      }
      
      setVideos(data.data || []);
      
      // If duplicates were removed, show a notification
      if (removeDuplicates && data.deduplication && data.deduplication.duplicatesRemoved > 0) {
        const message = `Successfully removed ${data.deduplication.duplicatesRemoved} duplicate videos from the database.`;
        console.log(message);
      }
    } catch (error) {
      console.error('Error fetching trending videos:', error);
      setErrorMessage(`Error fetching videos: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoadingVideos(false);
    }
  };
  
  // Handler for removing duplicates
  const handleRemoveDuplicates = () => {
    fetchTrendingVideos(true);
  };
  
  // Fetch statistics
  const fetchStatistics = async () => {
    setIsLoadingStats(true);
    try {
      let url = '/api/trends';
      
      // Add time period to statistics query if not 'all'
      if (selectedTimePeriod !== 'all') {
        url += `?timePeriod=${selectedTimePeriod}`;
      }
      
      console.log('Fetching statistics from:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Failed to get error details');
        console.error('Statistics API error response:', errorText);
        throw new Error(`Failed to fetch statistics: ${response.status} ${response.statusText}`);
      }
      
      let data;
      try {
        const text = await response.text();
        console.log('Raw API response:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Error parsing JSON response:', parseError);
        throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      console.log('Statistics data received:', data);
      
      if (!data || typeof data !== 'object') {
        console.error('Statistics data is not an object:', data);
        throw new Error('Statistics data is not an object');
      }
      
      if (!data.success) {
        console.error('Statistics API reported failure:', data.error);
        throw new Error(data.error || 'Unknown error fetching statistics');
      }
      
      if (!data.statistics) {
        console.error('Statistics data is missing statistics property:', data);
        throw new Error('Statistics data is missing statistics property');
      }
      
      setStatistics(data.statistics);
      
      // Extract niches for filter
      if (data.statistics?.nicheDistribution) {
        const nicheList = Object.keys(data.statistics.nicheDistribution);
        setNiches(['', ...nicheList]); // Add empty option for "All"
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setErrorMessage(`Error fetching statistics: ${error instanceof Error ? error.message : String(error)}`);
      // Set empty statistics object rather than null or undefined
      setStatistics({
        totalVideos: 0,
        nicheDistribution: {},
        timePeriodDistribution: { day: 0, week: 0, month: 0, all: 0 },
        recentVideosCount: 0,
        periodDays: 7,
        currentTimePeriod: 'all'
      });
    } finally {
      setIsLoadingStats(false);
    }
  };
  
  // Run scraper on-demand
  const runScraper = async (): Promise<void> => {
    setIsScraping(true);
    setErrorMessage(null);
    
    try {
      console.log(`Running scraper for time period: ${selectedTimePeriod}`);
      const timePeriods: TimePeriod[] = selectedTimePeriod === 'all' ? ['all'] : [selectedTimePeriod];
      
      // Add a short delay to allow the animation to start
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ timePeriods }),
      });
      
      let responseData;
      try {
        responseData = await response.json();
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        const text = await response.text();
        console.error('Raw response:', text);
        throw new Error(`Failed to parse response: ${text.substring(0, 100)}...`);
      }
      
      if (!response.ok) {
        console.error('API error response:', responseData);
        throw new Error(
          responseData?.error || 
          `Failed to run scraper: ${response.status} ${response.statusText}`
        );
      }
      
      if (!responseData.success) {
        console.error('API reported failure:', responseData);
        throw new Error(responseData.error || 'Unknown error running scraper');
      }
      
      console.log('Scraper completed successfully:', responseData);
      
      // Add a short delay to allow users to see the completion in the animation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Refresh data after scraping
      await fetchTrendingVideos();
      await fetchStatistics();
    } catch (error) {
      console.error('Error running scraper:', error);
      setErrorMessage(`Error running scraper: ${error instanceof Error ? error.message : String(error)}`);
      
      // Add a short delay for the user to see the error in the animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      throw error;
    } finally {
      setIsScraping(false);
    }
  };
  
  // Load initial data and check connection
  useEffect(() => {
    const initialize = async () => {
      const isConnected = await checkConnectionStatus();
      if (isConnected) {
        // Fetch videos first
        await fetchTrendingVideos();
        
        // Add a small delay before fetching statistics to avoid race conditions
        setTimeout(() => {
          fetchStatistics();
        }, 500);
      }
    };
    
    initialize();
  }, []);
  
  // Reload data when filters change
  useEffect(() => {
    fetchTrendingVideos();
    fetchStatistics();
  }, [selectedNiche, selectedTimePeriod]);
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black relative pt-2">
      {/* Cyberpunk background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.03),transparent_80%)]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        {errorMessage && (
          <div className="cyberpunk-panel border-secondary mb-6 bg-opacity-30 border-opacity-70">
            <div className="flex p-4">
              <div className="flex-shrink-0 text-red-500">
                <svg className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-400 cyberpunk-text-glitch">
                  {errorMessage}
                </p>
                <button 
                  onClick={() => checkConnectionStatus()}
                  className="mt-2 text-sm font-medium text-red-400 underline hover:text-red-300"
                >
                  Check connection again
                </button>
              </div>
            </div>
          </div>
        )}
        
        <ControlPanel 
          onRefresh={() => {
            checkConnectionStatus().then(isConnected => {
              if (isConnected) {
                fetchTrendingVideos();
                fetchStatistics();
              }
            });
          }}
          onScrape={runScraper}
          isScraping={isScraping}
          selectedTimePeriod={selectedTimePeriod}
          onTimePeriodChange={setSelectedTimePeriod}
        />
        
        <div className="mb-8">
          <StatisticsPanel 
            statistics={statistics}
            isLoading={isLoadingStats}
          />
        </div>
        
        <div className="cyberpunk-panel p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <h2 className="text-xl font-semibold cyberpunk-title">TRENDING VIDEOS</h2>
            
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Time Period Filter */}
              <div className="flex items-center">
                <label htmlFor="time-period-filter" className="mr-2 text-sm font-medium text-gray-300">
                  Time Period:
                </label>
                <select
                  id="time-period-filter"
                  value={selectedTimePeriod}
                  onChange={(e) => setSelectedTimePeriod(e.target.value as TimePeriod)}
                  className="cyberpunk-input block w-full pl-3 pr-10 py-2 text-base rounded-md"
                >
                  {timePeriods.map((period) => (
                    <option key={period.value} value={period.value}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Niche Filter */}
              <div className="flex items-center">
                <label htmlFor="niche-filter" className="mr-2 text-sm font-medium text-gray-300">
                  Niche:
                </label>
                <select
                  id="niche-filter"
                  value={selectedNiche}
                  onChange={(e) => setSelectedNiche(e.target.value)}
                  className="cyberpunk-input block w-full pl-3 pr-10 py-2 text-base rounded-md"
                >
                  <option value="">All Niches</option>
                  {niches.filter(niche => niche).map((niche) => (
                    <option key={niche} value={niche}>
                      {niche.charAt(0).toUpperCase() + niche.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <TrendingVideosTable
            videos={videos}
            isLoading={isLoadingVideos}
            onRemoveDuplicates={handleRemoveDuplicates}
          />
        </div>
      </div>
    </main>
  );
}
