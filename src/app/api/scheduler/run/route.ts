import { NextResponse } from 'next/server';
import { runOnDemandScraping } from '@/lib/scheduler';
import { TimePeriod } from '@/lib/youtube-scraper';

/**
 * Run the YouTube trend scraper on demand with optional custom niches
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const timePeriods = body.timePeriods as TimePeriod[] || ['all'];
    const customNiches = body.niches as string | undefined;
    
    // Validate time periods
    const validTimePeriods = ['day', 'week', 'month', 'all'];
    const validatedTimePeriods = timePeriods.filter(period => 
      validTimePeriods.includes(period)
    );
    
    if (validatedTimePeriods.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid time periods provided' },
        { status: 400 }
      );
    }
    
    console.log(`Starting on-demand scraping with time periods: ${validatedTimePeriods.join(', ')}`);
    if (customNiches) {
      console.log(`Using custom niches: ${customNiches}`);
    }
    
    // Run the scraping (this is async but we don't need to wait for completion)
    const scrapePromise = runOnDemandScraping(validatedTimePeriods as TimePeriod[], customNiches);
    
    // Respond immediately that the process has started
    return NextResponse.json({
      success: true,
      message: 'YouTube trend scraping started',
      timePeriods: validatedTimePeriods,
      customNiches: customNiches
    });
  } catch (error) {
    console.error('Error starting trend scraping:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 