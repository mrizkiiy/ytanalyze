'use client';

import { useState, useEffect, useCallback } from 'react';
import Loading from '@/components/Loading';
import { TimePeriod } from '@/lib/youtube-scraper';
import { FaInfoCircle, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { formatViewCount, formatPercentage, formatRelativeDate } from '@/lib/utils';

interface GrowthVideo {
  id: string;
  title: string;
  channel: string;
  views: number;
  initialViews: number;
  growthRate: number;
  growthPercentage: number;
  uploadDate: string;
  niche: string;
  velocity: 'slow' | 'normal' | 'fast' | 'viral';
  isGrowthEstimated: boolean;
}

interface PaginationData {
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface GrowthAnalyticsProps {
  isVisible: boolean;
  onNicheSelect?: (niche: string, videos?: GrowthVideo[]) => void;
}

export default function GrowthAnalytics({ isVisible, onNicheSelect }: GrowthAnalyticsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [growthVideos, setGrowthVideos] = useState<GrowthVideo[]>([]);
  const [allGrowthVideos, setAllGrowthVideos] = useState<GrowthVideo[]>([]);
  const [sortBy, setSortBy] = useState<'growthRate' | 'growthPercentage'>('growthRate');
  const [error, setError] = useState<string | null>(null);
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [availableNiches, setAvailableNiches] = useState<string[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    pageSize: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [totalVideos, setTotalVideos] = useState(0);
  
  const timeOptions: { value: TimePeriod; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];
  
  // Fetch growth data function
  const fetchGrowthData = useCallback(async (page: number = 1) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Build API URL with all parameters
      const apiUrl = `/api/growth?timePeriod=${timePeriod}&sortBy=${sortBy}&page=${page}&pageSize=${pagination.pageSize}${selectedNiche !== 'all' ? `&niche=${selectedNiche}` : ''}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch growth data');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error fetching growth data');
      }
      
      // Sort videos by velocity before setting state
      const sortedVideos = sortVideosByVelocity(data.videos || []);
      setGrowthVideos(sortedVideos);
      
      // Sort all videos by velocity too
      const sortedAllVideos = sortVideosByVelocity(data.allVideos || data.videos || []);
      setAllGrowthVideos(sortedAllVideos);
      
      setTotalVideos(data.totalVideos || 0);
      
      // Update pagination information
      if (data.pagination) {
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching growth data:', error);
      setError(error instanceof Error ? error.message : String(error));
      // Set empty data
      setGrowthVideos([]);
      setAllGrowthVideos([]);
    } finally {
      setIsLoading(false);
    }
  }, [timePeriod, sortBy, selectedNiche, pagination.pageSize]);
  
  // Sort videos by velocity (viral, fast, normal, slow)
  const sortVideosByVelocity = (videos: GrowthVideo[]): GrowthVideo[] => {
    const velocityOrder = { 'viral': 0, 'fast': 1, 'normal': 2, 'slow': 3 };
    
    return [...videos].sort((a, b) => {
      // First sort by velocity
      const velocityDiff = velocityOrder[a.velocity] - velocityOrder[b.velocity];
      
      if (velocityDiff !== 0) {
        return velocityDiff;
      }
      
      // Within same velocity, sort by the current sortBy parameter
      if (sortBy === 'growthRate') {
        return b.growthRate - a.growthRate;
      } else {
        return b.growthPercentage - a.growthPercentage;
      }
    });
  };
  
  useEffect(() => {
    if (isVisible) {
      fetchGrowthData(1); // Reset to first page when parameters change
    }
  }, [isVisible, fetchGrowthData, timePeriod, sortBy, selectedNiche]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) {
      return;
    }
    fetchGrowthData(newPage);
  };
  
  // Handle niche selection
  const handleNicheChange = (niche: string) => {
    setSelectedNiche(niche);
    
    // Notify parent component if needed
    if (onNicheSelect) {
      // Find videos for this niche in all videos
      const filteredVideos = niche === 'all'
        ? allGrowthVideos
        : allGrowthVideos.filter(video => video.niche === niche);
      
      onNicheSelect(niche, filteredVideos);
    }
  };
  
  // Extract unique niches from the growth videos
  useEffect(() => {
    if (allGrowthVideos.length > 0) {
      const niches = [...new Set(allGrowthVideos.map(video => video.niche))].filter(Boolean);
      setAvailableNiches(niches);
    }
  }, [allGrowthVideos]);
  
  // Format date
  const formatDate = formatRelativeDate;
  
  // Get velocity indicator color
  const getVelocityColor = (velocity: string) => {
    switch (velocity) {
      case 'viral':
        return '#e91e63';
      case 'fast':
        return '#ff9800';
      case 'normal':
        return '#4caf50';
      case 'slow':
        return '#03a9f4';
      default:
        return '#9e9e9e';
    }
  };
  
  // Get velocity indicator label
  const getVelocityLabel = (velocity: string) => {
    switch (velocity) {
      case 'viral':
        return 'VIRAL';
      case 'fast':
        return 'FAST';
      case 'normal':
        return 'NORMAL';
      case 'slow':
        return 'SLOW';
      default:
        return 'UNKNOWN';
    }
  };
  
  // Get velocity description for tooltips
  const getVelocityDescription = (velocity: string) => {
    switch (velocity) {
      case 'viral':
        return 'Exceptional growth rate that indicates potential to go viral. Videos are growing extremely fast relative to their age and view count.';
      case 'fast':
        return 'Above average growth rate. These videos are performing very well and gaining significant traction.';
      case 'normal':
        return 'Average growth rate. These videos are performing as expected for their niche and age.';
      case 'slow':
        return 'Below average growth rate. These videos are growing more slowly than typical for their niche and age.';
      default:
        return 'Unknown growth velocity.';
    }
  };
  
  // Get filtered videos
  const getFilteredVideos = () => {
    return selectedNiche === 'all'
      ? allGrowthVideos
      : allGrowthVideos.filter(video => video.niche === selectedNiche);
  };
  
  // Calculate stats for the filtered niche
  const getFilteredStats = () => {
    const filteredVideos = getFilteredVideos();
    
    return {
      total: filteredVideos.length,
      viral: filteredVideos.filter(v => v.velocity === 'viral').length,
      fast: filteredVideos.filter(v => v.velocity === 'fast').length
    };
  };
  
  const stats = getFilteredStats();
  
  if (!isVisible) {
    return null;
  }
  
  return (
    <div className="cyberpunk-panel p-6 mb-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex space-x-2 items-center">
          <span className="text-gray-300 text-sm">Secondary sort by:</span>
          <button
            onClick={() => setSortBy('growthRate')}
            className={`px-3 py-1 text-sm rounded-md ${
              sortBy === 'growthRate' 
                ? 'bg-cyan-900/30 border border-cyan-500 text-cyan-300' 
                : 'text-gray-400 hover:text-cyan-300 hover:bg-gray-800'
            }`}
          >
            Total Views Growth
          </button>
          <button
            onClick={() => setSortBy('growthPercentage')}
            className={`px-3 py-1 text-sm rounded-md ${
              sortBy === 'growthPercentage' 
                ? 'bg-cyan-900/30 border border-cyan-500 text-cyan-300' 
                : 'text-gray-400 hover:text-cyan-300 hover:bg-gray-800'
            }`}
          >
            Percentage Growth
          </button>
          <span className="ml-2 text-xs text-gray-500 hidden sm:inline">
            (Within each velocity category)
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label htmlFor="niche-filter" className="mr-2 text-sm text-gray-300">
              Niche:
            </label>
            <select
              id="niche-filter"
              value={selectedNiche}
              onChange={(e) => handleNicheChange(e.target.value)}
              className="cyberpunk-input pl-3 pr-10 py-1 text-sm rounded-md"
            >
              <option value="all">All Niches</option>
              {availableNiches.map(niche => (
                <option key={niche} value={niche}>
                  {niche.charAt(0).toUpperCase() + niche.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <label htmlFor="time-period" className="mr-2 text-sm text-gray-300">
              Time Period:
            </label>
            <select
              id="time-period"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              className="cyberpunk-input pl-3 pr-10 py-1 text-sm rounded-md"
            >
              {timeOptions.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <Loading />
      ) : error ? (
        <div className="p-4 rounded-md bg-red-900/30 border border-red-700 text-red-400">
          <p>{error}</p>
          <button
            onClick={() => fetchGrowthData(1)}
            className="mt-2 underline text-red-400 hover:text-red-300"
          >
            Try again
          </button>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Total Videos Tracked */}
            <div className="bg-gray-900/50 border border-cyan-800 rounded-md p-4">
              <h3 className="text-gray-400 text-sm mb-1">Videos Tracked</h3>
              <p className="text-2xl font-bold text-cyan-300">{stats.total}</p>
            </div>
            
            {/* Viral Potential Videos */}
            <div className="bg-gray-900/50 border border-pink-800 rounded-md p-4">
              <h3 className="text-gray-400 text-sm mb-1">Viral Potential</h3>
              <p className="text-2xl font-bold text-pink-400">
                {stats.viral}
              </p>
            </div>
            
            {/* Fast Growth Videos */}
            <div className="bg-gray-900/50 border border-orange-800 rounded-md p-4">
              <h3 className="text-gray-400 text-sm mb-1">Fast Growth</h3>
              <p className="text-2xl font-bold text-orange-400">
                {stats.fast}
              </p>
            </div>
          </div>
          
          {/* Growth Velocity Legend */}
          <div className="bg-gray-900/30 border border-gray-800 rounded-md p-4 mb-6">
            <h3 className="text-gray-300 text-sm font-medium mb-3">Growth Velocity Categories:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {['viral', 'fast', 'normal', 'slow'].map(velocity => (
                <div 
                  key={velocity} 
                  className="flex items-start group relative"
                >
                  <span 
                    className="inline-block w-3 h-3 rounded-full mr-2 mt-1"
                    style={{ backgroundColor: getVelocityColor(velocity) }}
                  ></span>
                  <div>
                    <span className="text-sm font-medium" style={{ color: getVelocityColor(velocity) }}>
                      {getVelocityLabel(velocity)}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">{getVelocityDescription(velocity)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              <span className="flex items-center"><FaInfoCircle size={12} className="mr-1" /> 
                Growth velocity considers video age, view count, and growth percentage to categorize performance.
              </span>
            </div>
          </div>
          
          {selectedNiche !== 'all' && (
            <div className="mb-4 py-2 px-3 bg-cyan-900/20 border border-cyan-800 rounded-md inline-block">
              <span className="text-sm text-gray-300 mr-2">Filtering by niche:</span>
              <span className="text-cyan-300 font-medium">
                {selectedNiche.charAt(0).toUpperCase() + selectedNiche.slice(1)}
              </span>
            </div>
          )}
          
          {/* Pagination Info */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-gray-400">
              Showing {growthVideos.length} of {totalVideos} videos
              <span className="ml-2 px-2 py-1 text-xs bg-gray-800 rounded-md text-cyan-300 border border-cyan-900/50">
                Sorted by: Velocity (Viral → Fast → Normal → Slow)
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={!pagination.hasPreviousPage}
                className={`p-2 rounded-md ${
                  pagination.hasPreviousPage 
                    ? 'text-cyan-500 hover:bg-gray-800 hover:text-cyan-400' 
                    : 'text-gray-700 cursor-not-allowed'
                }`}
                aria-label="Previous page"
              >
                <FaChevronLeft size={14} />
              </button>
              
              <span className="text-sm text-gray-300">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              
              <button 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={!pagination.hasNextPage}
                className={`p-2 rounded-md ${
                  pagination.hasNextPage 
                    ? 'text-cyan-500 hover:bg-gray-800 hover:text-cyan-400' 
                    : 'text-gray-700 cursor-not-allowed'
                }`}
                aria-label="Next page"
              >
                <FaChevronRight size={14} />
              </button>
            </div>
          </div>
          
          {/* Growth Table */}
          <div className="overflow-x-auto">
            <table className="cyberpunk-table w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Video</th>
                  <th className="px-4 py-2 text-left">Channel</th>
                  <th className="px-4 py-2 text-center">Current Views</th>
                  <th className="px-4 py-2 text-center">Views Growth</th>
                  <th className="px-4 py-2 text-center">
                    Growth %
                    {growthVideos.length > 0 && growthVideos[0].isGrowthEstimated && (
                      <span className="ml-1 align-middle group relative cursor-pointer">
                        <FaInfoCircle className="inline text-cyan-400" size={14} />
                        <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-48 p-2 text-xs bg-gray-900 border border-cyan-700 text-cyan-200 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                          This growth % is estimated based on current views. For more accurate data, connect historical view tracking.
                        </span>
                      </span>
                    )}
                  </th>
                  <th className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center">
                      <span>Velocity</span>
                      <span className="ml-1 text-xs text-cyan-400">(Primary Sort)</span>
                    </div>
                  </th>
                  <th className="px-4 py-2 text-center">Upload Date</th>
                </tr>
              </thead>
              <tbody>
                {growthVideos.map((video) => (
                  <tr key={video.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <a 
                        href={`https://youtube.com/watch?v=${video.id}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-300 hover:text-cyan-400 font-medium"
                      >
                        {video.title}
                      </a>
                      <div className="text-xs text-gray-400">
                        {video.niche.charAt(0).toUpperCase() + video.niche.slice(1)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{video.channel}</td>
                    <td className="px-4 py-3 text-center font-mono text-gray-300">{formatViewCount(video.views)}</td>
                    <td 
                      className="px-4 py-3 text-center font-mono font-medium"
                      style={{ color: getVelocityColor(video.velocity) }}
                    >
                      +{formatViewCount(video.growthRate)}
                    </td>
                    <td 
                      className="px-4 py-3 text-center font-mono font-medium"
                      style={{ color: getVelocityColor(video.velocity) }}
                    >
                      +{formatPercentage(video.growthPercentage)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span 
                        className="inline-block px-2 py-1 rounded-full text-xs font-medium group relative cursor-help"
                        style={{ 
                          backgroundColor: `${getVelocityColor(video.velocity)}20`,
                          color: getVelocityColor(video.velocity),
                          borderColor: getVelocityColor(video.velocity),
                          border: `1px solid ${getVelocityColor(video.velocity)}`
                        }}
                      >
                        {getVelocityLabel(video.velocity)}
                        <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 text-xs bg-gray-900 border border-gray-700 text-gray-200 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                          {getVelocityDescription(video.velocity)}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-300">
                      {video.uploadDate ? formatDate(video.uploadDate) : <span className="text-gray-500">Unknown</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Bottom Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <div className="flex items-center space-x-1">
                <button 
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                  className={`px-3 py-1 text-sm rounded-md ${
                    pagination.page !== 1
                      ? 'bg-gray-800 text-cyan-400 hover:bg-gray-700'
                      : 'bg-gray-900/30 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  First
                </button>
                
                <button 
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className={`px-3 py-1 text-sm rounded-md ${
                    pagination.hasPreviousPage
                      ? 'bg-gray-800 text-cyan-400 hover:bg-gray-700'
                      : 'bg-gray-900/30 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Previous
                </button>
                
                {/* Page number buttons */}
                {[...Array(Math.min(5, pagination.totalPages))].map((_, idx) => {
                  // Logic to show current page in middle when possible
                  let pageNum = pagination.page;
                  if (pagination.page < 3) {
                    pageNum = idx + 1;
                  } else if (pagination.page > pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + idx;
                  } else {
                    pageNum = pagination.page - 2 + idx;
                  }
                  
                  // Ensure page numbers are in valid range
                  if (pageNum < 1 || pageNum > pagination.totalPages) {
                    return null;
                  }
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md ${
                        pageNum === pagination.page
                          ? 'bg-cyan-900/50 border border-cyan-500 text-cyan-300'
                          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button 
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`px-3 py-1 text-sm rounded-md ${
                    pagination.hasNextPage
                      ? 'bg-gray-800 text-cyan-400 hover:bg-gray-700'
                      : 'bg-gray-900/30 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
                
                <button 
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                  className={`px-3 py-1 text-sm rounded-md ${
                    pagination.page !== pagination.totalPages
                      ? 'bg-gray-800 text-cyan-400 hover:bg-gray-700'
                      : 'bg-gray-900/30 text-gray-600 cursor-not-allowed'
                  }`}
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 