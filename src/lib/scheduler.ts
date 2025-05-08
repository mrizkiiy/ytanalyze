import { CronJob } from 'cron';
import { scrapeYouTubeTrends, saveVideosToDatabase, TimePeriod } from './youtube-scraper';

// List of default niches to scrape
const DEFAULT_NICHES_TO_SCRAPE = [
  '',  // General trending
  'music',
  'gaming',
  'tech',
  'fashion',
  'food',
  'travel',
  'fitness',
  'education',
  'science',
  'politics',
  'business',
  'entertainment',
  'health',
  'movies',
  'tv',
];

// Store current niches being used (default or user-defined)
let NICHES_TO_SCRAPE = [...DEFAULT_NICHES_TO_SCRAPE];

// List of time periods to scrape
const TIME_PERIODS: TimePeriod[] = ['day', 'week', 'month', 'all'];

let activeJob: CronJob | null = null;

// Different schedules for different time periods
const schedules = {
  all: '0 0 * * *',      // Run every day at midnight
  day: '0 */6 * * *',    // Run every 6 hours (for 24-hour data)
  week: '0 6 * * *',     // Run every day at 6:00 (for 7-day data)
  month: '0 12 * * 1'    // Run every Monday at 12:00 (for 30-day data)
};

const activeJobs: Record<TimePeriod, CronJob | null> = {
  all: null,
  day: null,
  week: null,
  month: null
};

/**
 * Set custom niches to scrape
 * @param nichesInput - Comma-separated string of niches 
 * @returns Array of niches being used
 */
export function setNichesToScrape(nichesInput: string): string[] {
  if (!nichesInput || nichesInput.trim() === '') {
    // Reset to default niches if input is empty
    NICHES_TO_SCRAPE = [...DEFAULT_NICHES_TO_SCRAPE];
    console.log('Reset to default niches:', NICHES_TO_SCRAPE);
    return NICHES_TO_SCRAPE;
  }
  
  // Parse the input string, splitting by commas and trimming whitespace
  const customNiches = nichesInput.split(',')
    .map(niche => niche.trim())
    .filter(niche => niche !== '');
  
  // Always include empty string (general trending) if not explicitly provided
  if (!customNiches.includes('')) {
    customNiches.unshift('');
  }
  
  NICHES_TO_SCRAPE = customNiches;
  console.log('Using custom niches:', NICHES_TO_SCRAPE);
  return NICHES_TO_SCRAPE;
}

/**
 * Get current niches being used
 * @returns Array of niches currently being used
 */
export function getCurrentNiches(): string[] {
  return NICHES_TO_SCRAPE;
}

export function startScheduler() {
  if (Object.values(activeJobs).some(job => job !== null)) {
    console.log('Some scheduler jobs are already running');
  }
  
  // Start individual schedulers for each time period
  for (const period of TIME_PERIODS) {
    if (activeJobs[period]) {
      console.log(`Scheduler for ${period} period is already running`);
      continue;
    }
    
    const cronSchedule = schedules[period];
    
    activeJobs[period] = new CronJob(cronSchedule, async () => {
      console.log(`Running scheduled YouTube trend scraping for ${period} period:`, new Date().toISOString());
      await runScrapingForPeriod(period);
    });
    
    activeJobs[period]?.start();
    console.log(`Scheduler for ${period} period started. Will run on schedule: ${cronSchedule}`);
  }
  
  console.log('All schedulers started successfully.');
}

export function stopScheduler() {
  let stoppedCount = 0;
  
  for (const period of TIME_PERIODS) {
    if (activeJobs[period]) {
      activeJobs[period]?.stop();
      activeJobs[period] = null;
      stoppedCount++;
      console.log(`Scheduler for ${period} period stopped`);
    }
  }
  
  if (stoppedCount === 0) {
    console.log('No active schedulers to stop');
  } else {
    console.log(`Stopped ${stoppedCount} schedulers`);
  }
}

export async function runOnDemandScraping(timePeriods: TimePeriod[] = ['all'], customNiches?: string) {
  console.log('Running on-demand YouTube trend scraping:', new Date().toISOString());
  
  // Set custom niches if provided
  if (customNiches !== undefined) {
    setNichesToScrape(customNiches);
  }
  
  // Validate and deduplicate time periods
  const uniqueTimePeriods = Array.from(new Set(
    timePeriods.filter(period => TIME_PERIODS.includes(period))
  ));
  
  // If no valid time periods provided, use 'all'
  const periodsToScrape = uniqueTimePeriods.length > 0 ? uniqueTimePeriods : ['all' as TimePeriod];
  
  const results = [];
  for (const period of periodsToScrape) {
    const periodResults = await runScrapingForPeriod(period);
    results.push(...periodResults);
  }
  
  return results;
}

async function runScrapingForPeriod(timePeriod: TimePeriod) {
  console.log(`Starting scraping for time period: ${timePeriod}`);
  const results = [];
  
  for (const niche of NICHES_TO_SCRAPE) {
    try {
      console.log(`Scraping YouTube trends for niche: ${niche || 'general'}, time period: ${timePeriod}`);
      const videos = await scrapeYouTubeTrends(niche, timePeriod);
      console.log(`Found ${videos.length} videos for niche: ${niche || 'general'}, time period: ${timePeriod}`);
      
      // Save to database
      await saveVideosToDatabase(videos);
      
      results.push({
        niche: niche || 'general',
        timePeriod,
        count: videos.length,
        success: true
      });
    } catch (error) {
      console.error(`Error scraping niche ${niche || 'general'}, time period: ${timePeriod}:`, error);
      results.push({
        niche: niche || 'general',
        timePeriod,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  return results;
}

// Initialize on server start if it's a server environment
if (typeof window === 'undefined') {
  startScheduler();
} 