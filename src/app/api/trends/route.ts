import { NextResponse } from 'next/server';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';
import { TimePeriod } from '@/lib/youtube-scraper';

export async function GET(request: Request) {
  try {
    // Check Supabase connection first
    const connectionCheck = await checkSupabaseConnection();
    if (!connectionCheck.connected) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Supabase connection error: ${connectionCheck.error}` 
        },
        { status: 500 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    const timePeriod = searchParams.get('timePeriod') as TimePeriod | null;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const removeDuplicates = searchParams.get('removeDuplicates') === 'true';
    
    try {
      let query = supabase
        .from('youtube_videos')
        .select('*')
        .order('views', { ascending: false })
        .limit(limit * 2) // Fetch more to account for duplicates we'll filter out
        .range(offset, offset + (limit * 2) - 1);
        
      // Apply niche filter if provided
      if (niche) {
        query = query.eq('niche', niche);
      }
      
      // Get timestamp for time period filtering
      if (timePeriod && timePeriod !== 'all') {
        const now = new Date();
        let fromDate = new Date();
        
        // Calculate date range based on time period
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
        
        // Filter by created_at date instead of time_period column
        query = query.gte('created_at', fromDate.toISOString());
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Handle duplicate removal
      const seen = new Map<string, any>();
      const uniqueVideos: any[] = [];
      const duplicateIds: string[] = [];
      
      if (data) {
        // First pass: identify duplicates based on title and channel
        for (const video of data) {
          const key = `${video.title.toLowerCase()}|${video.channel.toLowerCase()}`;
          
          if (!seen.has(key)) {
            // First time seeing this video, add it to map
            seen.set(key, video);
            uniqueVideos.push(video);
          } else {
            // It's a duplicate - check if this one has more views
            const existingVideo = seen.get(key);
            if (video.views > existingVideo.views) {
              // This one has more views, replace the existing one
              const index = uniqueVideos.findIndex(v => v.id === existingVideo.id);
              if (index !== -1) {
                uniqueVideos[index] = video;
                seen.set(key, video);
                duplicateIds.push(existingVideo.id);
              }
            } else {
              // The existing one has more views, keep the duplicate ID
              duplicateIds.push(video.id);
            }
          }
        }
      }
      
      // If removeDuplicates is true, delete the duplicates from Supabase
      let deletedCount = 0;
      if (removeDuplicates && duplicateIds.length > 0) {
        // Delete in batches of 100 (Supabase limitation)
        const BATCH_SIZE = 100;
        for (let i = 0; i < duplicateIds.length; i += BATCH_SIZE) {
          const batch = duplicateIds.slice(i, i + BATCH_SIZE);
          const { data: deleteData, error: deleteError, count } = await supabase
            .from('youtube_videos')
            .delete()
            .in('id', batch)
            .select('id');
          
          if (deleteError) {
            console.error('Error deleting duplicate videos:', deleteError);
          } else {
            deletedCount += count || 0;
            console.log(`Deleted ${count} duplicate videos (batch ${i/BATCH_SIZE + 1})`);
          }
        }
      }
      
      // Limit the results to the requested amount
      const limitedVideos = uniqueVideos.slice(0, limit);
      
      return NextResponse.json({ 
        success: true, 
        data: limitedVideos,
        pagination: {
          limit,
          offset,
          total: limitedVideos.length
        },
        deduplication: {
          duplicatesFound: duplicateIds.length,
          duplicatesRemoved: deletedCount
        }
      });
    } catch (innerError) {
      console.error('Error fetching videos:', innerError);
      throw innerError;
    }
  } catch (error) {
    console.error('Error fetching YouTube trends:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// Get statistics
export async function POST(request: Request) {
  try {
    // Check Supabase connection first
    const connectionCheck = await checkSupabaseConnection();
    if (!connectionCheck.connected) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Supabase connection error: ${connectionCheck.error}` 
        },
        { status: 500 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');
    const timePeriod = searchParams.get('timePeriod') as TimePeriod | null;
    
    console.log('POST /api/trends - Requested time period:', timePeriod, 'Days:', days);
    
    // Calculate the date from N days ago
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    
    // Calculate the time period date if needed
    let timePeriodDate: Date | null = null;
    if (timePeriod && timePeriod !== 'all') {
      timePeriodDate = new Date();
      switch (timePeriod) {
        case 'day':
          timePeriodDate.setDate(timePeriodDate.getDate() - 1);
          break;
        case 'week':
          timePeriodDate.setDate(timePeriodDate.getDate() - 7);
          break;
        case 'month':
          timePeriodDate.setMonth(timePeriodDate.getMonth() - 1);
          break;
      }
    }
    
    try {
      // Get videos with counts by time period
      const now = new Date();
      
      // Calculate time periods using milliseconds for precision
      const day = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      
      // Base count query - will be filtered if time period selected
      let countQuery = supabase
        .from('youtube_videos')
        .select('*', { count: 'exact', head: true });
        
      // Apply time period filter if provided
      if (timePeriodDate) {
        countQuery = countQuery.gte('created_at', timePeriodDate.toISOString());
      }
      
      const { count: totalCount, error: countError } = await countQuery;
      
      if (countError) {
        console.error('Error fetching total count:', countError);
        throw countError;
      }
      
      // Get niche breakdown
      let nicheQuery = supabase
        .from('youtube_videos')
        .select('niche');
      
      // Apply time period filter if needed
      if (timePeriodDate) {
        nicheQuery = nicheQuery.gte('created_at', timePeriodDate.toISOString());
      }
      
      const { data: nicheData, error: nicheError } = await nicheQuery;
      
      if (nicheError) {
        console.error('Error fetching niche data:', nicheError);
        throw nicheError;
      }
      
      // Process niche data
      const nicheCount: Record<string, number> = {};
      nicheData.forEach(item => {
        const niche = item.niche || 'unknown';
        nicheCount[niche] = (nicheCount[niche] || 0) + 1;
      });
      
      // Get recent videos
      let recentQuery = supabase
        .from('youtube_videos')
        .select('*')
        .gt('created_at', fromDate.toISOString())
        .order('created_at', { ascending: false });
      
      // Apply time period filter if needed
      if (timePeriodDate) {
        recentQuery = recentQuery.gte('created_at', timePeriodDate.toISOString());
      }
      
      const { data: recentVideos, error: recentError } = await recentQuery;
      
      if (recentError) {
        console.error('Error fetching recent videos:', recentError);
        throw recentError;
      }
      
      // Get time period counts directly from database
      const dayCount = await supabase
        .from('youtube_videos')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', day.toISOString());
        
      const weekCount = await supabase
        .from('youtube_videos')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', week.toISOString());
        
      const monthCount = await supabase
        .from('youtube_videos')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', month.toISOString());
      
      // Create time period distribution from date-based filtering
      const timePeriodCount = {
        day: dayCount.count || 0,
        week: weekCount.count || 0,
        month: monthCount.count || 0,
        all: totalCount || 0
      };
      
      const statistics = {
        totalVideos: totalCount || 0,
        nicheDistribution: nicheCount,
        timePeriodDistribution: timePeriodCount,
        recentVideosCount: recentVideos?.length || 0,
        periodDays: days,
        currentTimePeriod: timePeriod || 'all'
      };
      
      return NextResponse.json({
        success: true,
        statistics
      });
    } catch (innerError) {
      console.error('Error processing statistics data:', innerError);
      return NextResponse.json(
        { 
          success: false, 
          error: innerError instanceof Error ? innerError.message : String(innerError) 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching YouTube statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 