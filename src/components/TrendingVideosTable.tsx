import React, { useState, useEffect } from 'react';
import Loading from './Loading';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { formatViewCount, formatRelativeDate } from '@/lib/utils';

// Interface updated to match the database schema - video_id is optional
interface Video {
  id: string;               // YouTube video ID (in our database schema)
  video_id?: string;        // Alternative field name (for flexibility)
  title: string;
  channel: string;
  views: number;
  niche: string;
  keywords: string[];
  created_at: string;
  published_at?: string;
  upload_date?: string;     // Alternative field for published date
}

interface PaginationData {
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface TrendingVideosTableProps {
  videos: Video[];
  isLoading: boolean;
  onRemoveDuplicates?: () => void;
}

export default function TrendingVideosTable({ videos, isLoading, onRemoveDuplicates }: TrendingVideosTableProps) {
  const [isDeletingDuplicates, setIsDeletingDuplicates] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedVideos, setPaginatedVideos] = useState<Video[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    pageSize: 20,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false
  });
  
  // Update pagination when videos change
  useEffect(() => {
    if (!videos || videos.length === 0) {
      setPaginatedVideos([]);
      setPagination({
        page: 1,
        pageSize: 20,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      });
      return;
    }
    
    const pageSize = 20;
    const totalPages = Math.ceil(videos.length / pageSize);
    
    // Make sure current page is valid
    const safePage = Math.max(1, Math.min(currentPage, totalPages));
    if (safePage !== currentPage) {
      setCurrentPage(safePage);
    }
    
    // Get paginated subset
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, videos.length);
    
    setPaginatedVideos(videos.slice(startIndex, endIndex));
    setPagination({
      page: safePage,
      pageSize,
      totalPages,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1
    });
  }, [videos, currentPage]);
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) {
      return;
    }
    setCurrentPage(newPage);
  };
  
  if (isLoading) {
    return <Loading />;
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="cyberpunk-panel p-6 w-full">
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xl cyberpunk-text-pulse">No videos found. Try running the scraper or adjusting your filters.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatViews = formatViewCount;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    
    // Check if the dateString is in a relative format like "5 days ago", "1 week ago", etc.
    if (dateString.includes('ago') || 
        dateString.includes('day') || 
        dateString.includes('week') || 
        dateString.includes('month') || 
        dateString.includes('year') || 
        dateString.includes('hour')) {
      // For relative dates, just return the original string from YouTube
      return dateString;
    }
    
    // For ISO dates or other parseable formats, try to convert to a formatted date
    return formatRelativeDate(dateString);
  };

  // Function to get the correct YouTube video ID
  const getYoutubeVideoId = (video: Video) => {
    // In our database schema, the YouTube video ID is stored in the 'id' field
    // The 'video_id' field is a fallback for compatibility with different APIs
    return video.video_id || video.id;
  };

  // Function to get the publication date
  const getPublicationDate = (video: Video) => {
    // Different field names might be used for the publication date
    return video.published_at || video.upload_date || video.created_at;
  };
  
  // Handle duplicate removal
  const handleRemoveDuplicates = async () => {
    if (!onRemoveDuplicates) return;
    
    setIsDeletingDuplicates(true);
    try {
      onRemoveDuplicates();
    } catch (error) {
      console.error('Error removing duplicates:', error);
    } finally {
      setIsDeletingDuplicates(false);
    }
  };

  return (
    <div className="cyberpunk-panel overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-800">
        <h3 className="text-cyan-400 font-medium">Trending Videos</h3>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-400">
            Showing {paginatedVideos.length} of {videos.length} videos
          </span>
        
          <button
            onClick={handleRemoveDuplicates}
            disabled={isDeletingDuplicates || !onRemoveDuplicates}
            className="cyberpunk-button text-xs py-1 px-3 flex items-center gap-1"
          >
            {isDeletingDuplicates ? (
              <>
                <svg className="animate-spin h-3 w-3 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                REMOVING DUPLICATES...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                REMOVE DUPLICATES
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="cyberpunk-table min-w-full">
          <thead>
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Video</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Niche</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Keywords</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-800/30">
            {paginatedVideos.map((video, index) => {
              const videoId = getYoutubeVideoId(video);
              // Calculate absolute index for pagination
              const absoluteIndex = (pagination.page - 1) * pagination.pageSize + index;
              
              return (
                <tr key={video.id} className="hover:bg-cyan-900/10 transition-colors">
                  <td className="px-4 py-3 text-cyan-300">{absoluteIndex + 1}</td>
                  <td className="px-4 py-3">
                    <a 
                      href={`https://youtube.com/watch?v=${videoId}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-cyan-400 transition-colors flex flex-col"
                    >
                      <span className="font-medium">{video.title}</span>
                      <span className="text-gray-400 text-sm mt-1">{video.channel}</span>
                    </a>
                  </td>
                  <td className="px-4 py-3 text-cyan-300 font-mono">{formatViews(video.views)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-md bg-gray-800 text-sm font-medium text-cyan-300 border border-cyan-800">
                      {video.niche}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 font-mono">{formatDate(getPublicationDate(video))}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {video.keywords && video.keywords.slice(0, 3).map((keyword, idx) => (
                        <span 
                          key={idx} 
                          className="px-2 py-0.5 text-xs bg-gray-800 rounded text-cyan-300 border border-cyan-900/50"
                        >
                          {keyword}
                        </span>
                      ))}
                      {video.keywords && video.keywords.length > 3 && (
                        <span className="px-2 py-0.5 text-xs bg-gray-700 rounded text-gray-300">
                          +{video.keywords.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="p-4 border-t border-gray-800 flex items-center justify-between">
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
  );
} 