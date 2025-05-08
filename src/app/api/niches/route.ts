import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * API endpoint to fetch all unique niches from the youtube_videos table
 */
export async function GET() {
  try {
    // Fetch all videos to extract niches
    const { data, error } = await supabase
      .from('youtube_videos')
      .select('niche')
      .not('niche', 'is', null);
    
    if (error) {
      console.error('Error fetching niches:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to fetch niches: ${error.message}` 
        },
        { status: 500 }
      );
    }
    
    if (!data || data.length === 0) {
      // Return default niches if no data is found
      return NextResponse.json({
        success: true,
        niches: ['programming', 'gaming', 'lifestyle', 'technology', 'music', 'education']
      });
    }
    
    // Extract unique niches
    const uniqueNiches = [...new Set(data.map(item => item.niche))].filter(Boolean).sort();
    
    return NextResponse.json({
      success: true,
      niches: uniqueNiches
    });
  } catch (error) {
    console.error('Error in niches API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}` 
      },
      { status: 500 }
    );
  }
} 