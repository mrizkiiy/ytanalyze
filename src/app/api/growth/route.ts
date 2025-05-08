import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TimePeriod } from '@/lib/youtube-scraper';

/**
 * Growth and Velocity Tracking API
 * 
 * This API analyzes the growth patterns of YouTube videos to identify:
 * 1. Videos with the fastest absolute growth rates (total new views)
 * 2. Videos with the highest percentage growth (proportional to starting views)
 * 3. Videos showing "viral potential" based on growth velocity
 * 
 * The implementation currently uses synthetic/simulated growth data for demo purposes.
 * 
 * In a production environment, this would:
 * - Store historical snapshots of view counts at regular intervals
 * - Calculate real growth rates between time periods
 * - Use machine learning to predict growth trajectories
 * - Identify videos that are accelerating in popularity
 * - Track growth rates relative to video age and channel size
 * 
 * This data would help content creators identify optimal posting strategies,
 * trending topics, and content formats that are gaining traction.
 */

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

// Calculate velocity based on growth percentage and time period
function calculateVelocity(growthPercentage: number, timePeriod: TimePeriod, views: number, uploadDate: string): 'slow' | 'normal' | 'fast' | 'viral' {
  // Calculate video age in days
  const now = new Date();
  const videoDate = new Date(uploadDate);
  const ageInDays = Math.max(1, Math.floor((now.getTime() - videoDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Adjust for video age - newer videos should have lower thresholds
  let ageMultiplier = 1;
  if (ageInDays <= 2) {
    // Very new videos (1-2 days)
    ageMultiplier = 0.5;
  } else if (ageInDays <= 7) {
    // Recent videos (3-7 days)
    ageMultiplier = 0.7;
  } else if (ageInDays <= 30) {
    // Videos less than a month old
    ageMultiplier = 0.9;
  } else if (ageInDays <= 90) {
    // Videos 1-3 months old
    ageMultiplier = 1.2;
  } else if (ageInDays <= 365) {
    // Videos up to a year old
    ageMultiplier = 1.5;
  } else {
    // Older videos
    ageMultiplier = 2;
  }

  // Adjust thresholds based on time period
  let periodMultiplier = 1;
  switch (timePeriod) {
    case 'day':
      periodMultiplier = 3; // Higher threshold for daily growth
      break;
    case 'week':
      periodMultiplier = 1; // Base threshold for weekly growth
      break;
    case 'month':
      periodMultiplier = 0.3; // Lower threshold for monthly growth
      break;
    default:
      periodMultiplier = 1;
  }
  
  // Adjust for view count scale - larger channels need higher growth percentages
  let viewScaleMultiplier = 1;
  if (views >= 1000000) {
    // 1M+ views
    viewScaleMultiplier = 2.5;
  } else if (views >= 500000) {
    // 500K-1M views
    viewScaleMultiplier = 2;
  } else if (views >= 100000) {
    // 100K-500K views
    viewScaleMultiplier = 1.5;
  } else if (views >= 10000) {
    // 10K-100K views
    viewScaleMultiplier = 1;
  } else if (views >= 1000) {
    // 1K-10K views
    viewScaleMultiplier = 0.8;
  } else {
    // Under 1K views
    viewScaleMultiplier = 0.6;
  }
  
  // Calculate combined multiplier
  const combinedMultiplier = periodMultiplier * ageMultiplier * viewScaleMultiplier;
  
  // Set thresholds based on combined multiplier
  const thresholds = {
    viral: 200 * combinedMultiplier,
    fast: 100 * combinedMultiplier,
    normal: 30 * combinedMultiplier
  };
  
  // Calculate velocity score (combination of growth percentage and rate of change)
  // This helps identify acceleration or deceleration in growth
  const velocityScore = growthPercentage / Math.sqrt(ageInDays);
  
  // Return velocity category based on velocity score
  if (velocityScore >= thresholds.viral) return 'viral';
  if (velocityScore >= thresholds.fast) return 'fast';
  if (velocityScore >= thresholds.normal) return 'normal';
  return 'slow';
}

export async function GET(request: Request) {
  // Get query parameters
  const { searchParams } = new URL(request.url);
  const timePeriod = searchParams.get('timePeriod') as TimePeriod || 'week';
  const sortBy = searchParams.get('sortBy') || 'growthRate';
  const niche = searchParams.get('niche') || null;
  
  // Pagination parameters (not used for initial fetch since we need all videos for growth calculations)
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');
  
  try {
    // Fetch all videos from the youtube_videos table - no limit
    let videoQuery = supabase
      .from('youtube_videos')
      .select('*')
      .order('views', { ascending: false });
      
    // Apply niche filter if provided
    if (niche && niche !== 'all') {
      videoQuery = videoQuery.eq('niche', niche);
    }
    
    const { data: videos, error, count } = await videoQuery;
      
    if (error) {
      throw error;
    }
    
    // Calculate growth metrics based on the time period
    const now = new Date();
    
    // Calculate date range based on time period (for future implementation)
    // This will be used to filter data when historical snapshots are available
    const fromDate = timePeriod === 'day' 
      ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
      : timePeriod === 'week'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Get historic view counts (in a real app, you would have a table with historical snapshots)
    // For now, we'll simulate initial views by calculating a percentage of current views
    const growthVideos: GrowthVideo[] = videos.map(video => {
      // Simulate initial views based on time period
      const viewDecayFactor = timePeriod === 'day' ? 0.85 : (timePeriod === 'week' ? 0.7 : 0.5);
      
      // Use upload_date or created_at to determine how old the video is
      let uploadDate = '';
      const possibleDateFields = [
        video.upload_date,
        video.published_at,
        video.created_at,
        video.updated_at
      ];
      
      // Try each possible date field until we find a valid one
      for (const dateField of possibleDateFields) {
        if (dateField) {
          const date = new Date(dateField);
          if (!isNaN(date.getTime())) {
            uploadDate = date.toISOString();
            break;
          }
        }
      }
      
      // If no valid date found, use current date as fallback
      if (!uploadDate) {
        uploadDate = new Date().toISOString();
      }
      
      // Calculate simulated initial views (in a real app, this would come from historical data)
      const initialViews = Math.round(video.views * viewDecayFactor);
      const growthRate = video.views - initialViews;
      const growthPercentage = initialViews > 0 ? (growthRate / initialViews) * 100 : 0;
      
      // Determine velocity based on growth percentage, considering video age and view count
      const velocity = calculateVelocity(growthPercentage, timePeriod, video.views, uploadDate);
      
      return {
        id: video.id,
        title: video.title,
        channel: video.channel,
        views: video.views,
        initialViews,
        growthRate,
        growthPercentage,
        uploadDate,
        niche: video.niche,
        velocity,
        isGrowthEstimated: true // Always true for now since we use simulated data
      };
    });
    
    // Filter out videos with minimal or no growth, considering view count scale
    const significantGrowthVideos = growthVideos.filter(video => {
      // Define minimum growth thresholds based on view count
      let minGrowthRate = 100;
      let minGrowthPercentage = 5;
      
      // Adjust thresholds based on view count
      if (video.views >= 1000000) {
        // 1M+ views
        minGrowthRate = 10000;
        minGrowthPercentage = 2;
      } else if (video.views >= 100000) {
        // 100K-1M views
        minGrowthRate = 1000;
        minGrowthPercentage = 3;
      } else if (video.views >= 10000) {
        // 10K-100K views
        minGrowthRate = 300;
        minGrowthPercentage = 4;
      }
      
      return video.growthRate > minGrowthRate || video.growthPercentage > minGrowthPercentage;
    });
    
    // Sort videos based on the sortBy parameter
    if (sortBy === 'growthRate') {
      significantGrowthVideos.sort((a, b) => b.growthRate - a.growthRate);
    } else if (sortBy === 'growthPercentage') {
      significantGrowthVideos.sort((a, b) => b.growthPercentage - a.growthPercentage);
    }
    
    // Calculate pagination values
    const totalVideos = significantGrowthVideos.length;
    const totalPages = Math.ceil(totalVideos / pageSize);
    const safePageNumber = Math.max(1, Math.min(page, totalPages || 1));
    
    // Get the paginated subset of videos for display
    const startIndex = (safePageNumber - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedVideos = significantGrowthVideos.slice(startIndex, endIndex);
    
    return NextResponse.json({ 
      success: true, 
      videos: paginatedVideos,
      allVideos: significantGrowthVideos, // Include all videos for filtering/stats on client
      timePeriod,
      totalVideos,
      pagination: {
        page: safePageNumber,
        pageSize,
        totalPages,
        hasNextPage: safePageNumber < totalPages,
        hasPreviousPage: safePageNumber > 1
      }
    });
  } catch (error) {
    console.error('Error fetching growth data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch growth data' },
      { status: 500 }
    );
  }
} 