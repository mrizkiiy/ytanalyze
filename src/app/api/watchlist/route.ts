import { NextResponse } from 'next/server';
import { supabase, checkSupabaseConnection } from '@/lib/supabase';

// GET: Get all videos in watchlist
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
    
    // Query all watchlist items
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching watchlist:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      data
    });
  } catch (error) {
    console.error('Error in watchlist GET:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// POST: Add a video to watchlist
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
    
    // Get video data from request
    const body = await request.json().catch(() => ({}));
    
    if (!body.video_id || !body.title || !body.channel) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Insert into watchlist
    const { data, error } = await supabase
      .from('watchlist')
      .upsert({
        video_id: body.video_id,
        title: body.title,
        channel: body.channel,
        views: body.views || 0,
        niche: body.niche || 'unknown',
        notes: body.notes || ''
      }, {
        onConflict: 'video_id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('Error adding to watchlist:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Video added to watchlist'
    });
  } catch (error) {
    console.error('Error in watchlist POST:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// DELETE: Remove a video from watchlist
export async function DELETE(request: Request) {
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
    
    // Get video ID from query string
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('video_id');
    
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: 'Missing video_id parameter' },
        { status: 400 }
      );
    }
    
    // Delete from watchlist
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('video_id', videoId);
    
    if (error) {
      console.error('Error removing from watchlist:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Video removed from watchlist'
    });
  } catch (error) {
    console.error('Error in watchlist DELETE:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
} 