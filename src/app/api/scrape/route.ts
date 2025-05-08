import { NextResponse } from 'next/server';
import { runOnDemandScraping } from '@/lib/scheduler';
import { TimePeriod } from '@/lib/youtube-scraper';

export async function POST(request: Request) {
  console.log('POST /api/scrape - Starting on-demand scraping');
  
  try {
    // Get time periods from request body
    const body = await request.json().catch((error) => {
      console.error('Error parsing request body:', error);
      return {};
    });
    
    const timePeriods = body.timePeriods || ['all'];
    console.log('Requested time periods:', timePeriods);
    
    // Validate time periods
    const validTimePeriods = ['day', 'week', 'month', 'all'] as TimePeriod[];
    const filteredTimePeriods = timePeriods.filter((period: string) => 
      validTimePeriods.includes(period as TimePeriod)
    ) as TimePeriod[];
    
    if (filteredTimePeriods.length === 0) {
      console.log(`No valid time periods found in request: ${timePeriods}. Using 'all' as default.`);
      filteredTimePeriods.push('all' as TimePeriod);
    } else {
      console.log('Using validated time periods:', filteredTimePeriods);
    }
    
    // Run scraping with specified time periods
    try {
      console.log(`Starting on-demand scraping for time periods: ${filteredTimePeriods.join(', ')}`);
      const results = await runOnDemandScraping(filteredTimePeriods);
      console.log('Scraping completed successfully');
      return NextResponse.json({ success: true, results });
    } catch (scrapingError) {
      console.error('Error during scraping process:', scrapingError);
      throw new Error(`Scraping process failed: ${scrapingError instanceof Error ? scrapingError.message : String(scrapingError)}`);
    }
  } catch (error) {
    console.error('Error running on-demand scraping:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// GET method to check scraper status
export async function GET() {
  return NextResponse.json({ 
    status: 'OK',
    message: 'YouTube scraper API is running. Use POST method to trigger scraping.',
    supportedTimePeriods: ['day', 'week', 'month', 'all']
  });
} 