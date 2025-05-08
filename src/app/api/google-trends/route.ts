import { NextResponse } from 'next/server';
import { scrapeGoogleTrends, saveTrendsToDatabase } from '@/lib/google-trends-scraper';
import { supabase } from '@/lib/supabase';

/**
 * GET method to fetch Google Trends data
 * Fetches from the database if available, scrapes fresh data otherwise
 */
export async function GET(request: Request) {
  try {
    // Extract time period and region from query params
    const url = new URL(request.url);
    const timePeriod = url.searchParams.get('timePeriod') as 'today' | '7days' | '30days';
    const region = url.searchParams.get('region') || 'GLOBAL';
    
    if (!timePeriod || !['today', '7days', '30days'].includes(timePeriod)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid time period. Use today, 7days, or 30days.' 
        },
        { status: 400 }
      );
    }
    
    // First, check if we have ANY data for this region/time period combination
    const { data: anyData, error: anyDataError } = await supabase
      .from('google_trends')
      .select('*')
      .eq('time_period', timePeriod)
      .eq('region', region)
      .order('rank', { ascending: true });
    
    if (anyDataError) {
      throw new Error(`Database error: ${anyDataError.message}`);
    }
    
    // If we have any data at all, use it (we can be less strict about freshness)
    if (anyData && anyData.length > 0) {
      // Map database fields to our interface
      const mappedTrends = anyData.map(trend => ({
        id: trend.id.toString(),
        keyword: trend.keyword,
        rank: trend.rank,
        timePeriod: trend.time_period as 'today' | '7days' | '30days',
        region: trend.region || 'GLOBAL',
        scrapedAt: trend.scraped_at
      }));
      
      console.log(`Returning ${mappedTrends.length} existing Google Trends from database for region ${region}`);
      return NextResponse.json({
        success: true,
        data: mappedTrends,
        source: 'database',
        count: mappedTrends.length
      });
    }
    
    console.log(`No data found for ${timePeriod} in region ${region}, attempting to scrape`);
    
    // Only scrape if there is no existing data at all
    try {
      const googleTrends = await scrapeGoogleTrends(timePeriod, region);
      
      if (googleTrends.length > 0) {
        // Save the fresh data to database
        const saveResult = await saveTrendsToDatabase(googleTrends);
        
        // Return the fresh data
        return NextResponse.json({
          success: true,
          data: googleTrends,
          source: 'scraper',
          count: googleTrends.length,
          saveResult: {
            inserted: saveResult.inserted,
            duplicatesRemoved: saveResult.duplicatesRemoved || 0
          }
        });
      }
      
      // No trends found from scraping
      return NextResponse.json({
        success: false,
        error: 'No trending data found for the region and time period',
        source: 'scraper'
      }, { status: 404 });
      
    } catch (scrapeError) {
      console.error('Scraping error:', scrapeError);
      
      // If it's a 429 error (rate limit), respond with a more user-friendly message
      const errorMessage = scrapeError instanceof Error ? scrapeError.message : String(scrapeError);
      if (errorMessage.includes('429')) {
        return NextResponse.json({
          success: false,
          error: 'Google Trends rate limit exceeded. Please try again later.',
          details: errorMessage
        }, { status: 429 });
      }
      
      throw scrapeError; // Re-throw for other errors
    }
    
  } catch (error) {
    console.error('Error in Google Trends API:', error);
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
 * POST method to force scraping fresh Google Trends data
 */
export async function POST(request: Request) {
  try {
    // Extract time period and region from request body
    const body = await request.json().catch(() => ({}));
    const timePeriod = body.timePeriod as 'today' | '7days' | '30days';
    const region = body.region || 'GLOBAL';
    
    if (!timePeriod || !['today', '7days', '30days'].includes(timePeriod)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid time period. Use today, 7days, or 30days.' 
        },
        { status: 400 }
      );
    }
    
    try {
      // Scrape fresh data
      console.log(`Attempting to scrape fresh Google Trends data for ${timePeriod} in region ${region}`);
      const googleTrends = await scrapeGoogleTrends(timePeriod, region);
      
      if (googleTrends.length > 0) {
        // Save the fresh data to database
        const saveResult = await saveTrendsToDatabase(googleTrends);
        
        // Return the fresh data
        return NextResponse.json({
          success: true,
          data: googleTrends,
          count: googleTrends.length,
          saveResult: {
            inserted: saveResult.inserted,
            duplicatesRemoved: saveResult.duplicatesRemoved || 0
          },
          message: saveResult.duplicatesRemoved ? `Removed ${saveResult.duplicatesRemoved} duplicate entries` : undefined
        });
      } else {
        // No trends found
        return NextResponse.json({
          success: false,
          error: 'No trending data found'
        }, { status: 404 });
      }
    } catch (scrapeError) {
      console.error('Scraping error:', scrapeError);
      
      // If it's a 429 error (rate limit), fall back to database
      const errorMessage = scrapeError instanceof Error ? scrapeError.message : String(scrapeError);
      if (errorMessage.includes('429')) {
        // Get existing data from database instead
        const { data: existingData, error: dbError } = await supabase
          .from('google_trends')
          .select('*')
          .eq('time_period', timePeriod)
          .eq('region', region)
          .order('rank', { ascending: true });
        
        if (dbError) {
          throw new Error(`Database error: ${dbError.message}`);
        }
        
        if (existingData && existingData.length > 0) {
          // Map database fields to our interface
          const mappedTrends = existingData.map(trend => ({
            id: trend.id.toString(),
            keyword: trend.keyword,
            rank: trend.rank,
            timePeriod: trend.time_period as 'today' | '7days' | '30days',
            region: trend.region || 'GLOBAL',
            scrapedAt: trend.scraped_at
          }));
          
          return NextResponse.json({
            success: true,
            data: mappedTrends,
            source: 'database (rate limited)',
            count: mappedTrends.length,
            rateLimit: true,
            message: 'Using cached data due to Google Trends rate limit'
          });
        }
        
        // No data in database either
        return NextResponse.json({
          success: false,
          error: 'Google Trends rate limit exceeded and no cached data available'
        }, { status: 429 });
      }
      
      throw scrapeError; // Re-throw for other errors
    }
    
  } catch (error) {
    console.error('Error in Google Trends API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 