import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST() {
  try {
    // Delete all videos from the youtube_videos table
    const { error } = await supabase
      .from('youtube_videos')
      .delete()
      .neq('id', 0); // This will delete all rows

    if (error) {
      console.error('Error clearing videos:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Trending videos cleared successfully'
    });
  } catch (error) {
    console.error('Error in clear route:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 