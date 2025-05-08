import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TimePeriod } from '@/lib/youtube-scraper';

/**
 * POST handler for clearing youtube_videos data
 * This endpoint only clears data from the youtube_videos table and DOES NOT affect the watchlist table
 */
export async function POST(request: Request) {
  console.log('POST /api/clear - Starting data clearing operation');
  
  try {
    // Get time period from request body
    const body = await request.json().catch((error) => {
      console.error('Error parsing request body:', error);
      return {};
    });
    
    const timePeriod = body.timePeriod || 'all';
    console.log('Requested to clear time period:', timePeriod);
    
    // First, get the list of video IDs that are in the watchlist to preserve them
    const { data: watchlistVideos, error: watchlistError } = await supabase
      .from('watchlist')
      .select('video_id');
      
    if (watchlistError) {
      throw new Error(`Failed to fetch watchlist videos: ${watchlistError.message}`);
    }
    
    // Extract the video IDs from the watchlist
    const watchlistVideoIds = watchlistVideos.map(item => {
      // Clean video IDs to make sure they're valid for SQL filtering
      // Most YouTube IDs are 11 characters with letters, numbers, underscores, and hyphens
      // Extract just the base ID if there are additional parameters
      const match = item.video_id.match(/^[a-zA-Z0-9_-]{11}/);
      return match ? match[0] : item.video_id;
    }).filter(Boolean); // Remove any empty values
    
    console.log(`Found ${watchlistVideoIds.length} videos in watchlist that will be preserved`);
    
    // If we have watchlist videos to preserve
    if (watchlistVideoIds.length > 0) {
      // Use a different approach to handle deletion with exclusions
      // This will be more robust as it doesn't construct a potentially problematic query
      await performDeleteWithExclusions(timePeriod, watchlistVideoIds);
    } else {
      // No watchlist videos to preserve, can safely delete all matching records
      await performDeleteWithoutExclusions(timePeriod);
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully cleared trending videos data`,
      preserved: watchlistVideoIds.length
    });
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

/**
 * Perform delete operation while excluding watchlist videos
 */
async function performDeleteWithExclusions(timePeriod: string, watchlistVideoIds: string[]) {
  // For safety with large watchlists, process in smaller batches
  const BATCH_SIZE = 100;
  let totalDeleted = 0;
  
  // Get all videos that match our time period criteria
  const query = buildTimeQuery(timePeriod);
  
  // Fetch all eligible videos for deletion
  const { data: videosToCheck, error: fetchError } = await query;
  
  if (fetchError) {
    throw new Error(`Failed to fetch videos for deletion: ${fetchError.message}`);
  }
  
  if (!videosToCheck || videosToCheck.length === 0) {
    console.log('No videos found matching the criteria for deletion');
    return;
  }
  
  console.log(`Found ${videosToCheck.length} videos matching time criteria, filtering out watchlist videos`);
  
  // Filter out watchlist videos
  const videosToDelete = videosToCheck.filter(video => 
    !watchlistVideoIds.includes(video.id)
  );
  
  console.log(`After filtering, ${videosToDelete.length} videos will be deleted`);
  
  // Delete videos in batches
  for (let i = 0; i < videosToDelete.length; i += BATCH_SIZE) {
    const batch = videosToDelete.slice(i, i + BATCH_SIZE);
    const batchIds = batch.map(video => video.id);
    
    const { error: deleteError, count } = await supabase
      .from('youtube_videos')
      .delete()
      .in('id', batchIds);
      
    if (deleteError) {
      throw new Error(`Error deleting batch of videos: ${deleteError.message}`);
    }
    
    totalDeleted += count || 0;
    console.log(`Deleted batch of ${count} videos, total deleted: ${totalDeleted}`);
  }
  
  console.log(`Successfully deleted a total of ${totalDeleted} videos`);
}

/**
 * Perform delete operation without any exclusions
 */
async function performDeleteWithoutExclusions(timePeriod: string) {
    let result;
    
    if (timePeriod === 'all') {
    console.log('Clearing all data from youtube_videos table (no watchlist exclusions)');
      result = await supabase
        .from('youtube_videos')
        .delete()
        .neq('id', ''); // Equivalent to "TRUE" condition to delete all rows
    } else {
      // Calculate date for time period filtering
    const fromDate = getFromDate(timePeriod as TimePeriod);
    
    console.log(`Clearing data from youtube_videos table for time period: ${timePeriod}, after date: ${fromDate.toISOString()}`);
    
    result = await supabase
      .from('youtube_videos')
      .delete()
      .gte('created_at', fromDate.toISOString());
  }
  
  if (result.error) {
    throw new Error(`Failed to clear data: ${result.error.message}`);
  }
  
  const count = result.count || 0;
  console.log(`Successfully cleared ${count} records from youtube_videos table`);
}

/**
 * Build a query to select videos based on time period
 */
function buildTimeQuery(timePeriod: string) {
  if (timePeriod === 'all') {
    return supabase
      .from('youtube_videos')
      .select('id');
  } else {
    const fromDate = getFromDate(timePeriod as TimePeriod);
    return supabase
      .from('youtube_videos')
      .select('id')
      .gte('created_at', fromDate.toISOString());
  }
}

/**
 * Calculate the date range based on time period
 */
function getFromDate(timePeriod: TimePeriod): Date {
      const now = new Date();
      let fromDate = new Date();
      
      switch (timePeriod) {
        case 'day':
          // Last 24 hours
          fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          // Last 7 days
          fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          // Last 30 days
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }
      
  return fromDate;
}

// GET method to check status
export async function GET() {
  return NextResponse.json({ 
    status: 'OK',
    message: 'Clear data API is available. Use POST method to clear scraped data. Note: This only affects trending videos, not your watchlist.',
    supportedTimePeriods: ['day', 'week', 'month', 'all']
  });
} 