import { NextResponse } from 'next/server';
import { getCurrentNiches, setNichesToScrape } from '@/lib/scheduler';

/**
 * Get current niches or set new niches for the YouTube trend scheduler
 */

export async function GET() {
  try {
    // Get the current niches being used
    const niches = getCurrentNiches();
    
    return NextResponse.json({
      success: true,
      niches,
      message: 'Current niches retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting niches:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.niches && body.niches !== '') {
      return NextResponse.json(
        { success: false, error: 'niches parameter is required' },
        { status: 400 }
      );
    }
    
    // Set the new niches
    const newNiches = setNichesToScrape(body.niches);
    
    return NextResponse.json({
      success: true,
      niches: newNiches,
      message: 'Niches updated successfully'
    });
  } catch (error) {
    console.error('Error setting niches:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 