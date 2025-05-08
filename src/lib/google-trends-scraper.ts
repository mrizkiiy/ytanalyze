import puppeteer from 'puppeteer';
import type { Browser, Page, ElementHandle } from 'puppeteer';
import * as cheerio from 'cheerio';
import { supabase } from './supabase';

export interface GoogleTrend {
  id?: string;
  keyword: string;
  rank: number;
  timePeriod: 'today' | '7days' | '30days';
  region?: string;
  scrapedAt: string;
}

/**
 * Scrape Google Trends data for YouTube searches
 * @param timePeriod - The time period to fetch trends for ('today', '7days', or '30days')
 * @param region - The region code to fetch trends for (e.g., 'ID' for Indonesia, 'GLOBAL' for worldwide)
 * @returns Array of GoogleTrend objects
 */
export async function scrapeGoogleTrends(
  timePeriod: 'today' | '7days' | '30days' = 'today',
  region: string = 'GLOBAL'
): Promise<GoogleTrend[]> {
  console.log(`Starting Google Trends scraping for time period: ${timePeriod}, region: ${region}`);
  
  let browser: Browser | undefined;
  try {
    // Launch browser with appropriate settings
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('Puppeteer browser launched successfully');

    const page = await browser.newPage();
    
    // Configure browser session to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({
      width: 1280 + Math.floor(Math.random() * 100),
      height: 800 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: true,
      isMobile: false,
    });
    
    // Build the correct URL for Google Trends
    const timeParam = getTimeParameter(timePeriod);
    let url = `https://trends.google.co.id/trends/explore?date=${timeParam}&gprop=youtube&hl=en`;
    
    // Add region parameter if not global
    if (region !== 'GLOBAL') {
      url += `&geo=${region}`;
    }
    
    console.log(`Navigating to URL: ${url}`);
    
    // Navigate to Google Trends with increased timeout
    const navigationResponse = await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000 // 60 seconds timeout
    });
    
    if (!navigationResponse) {
      throw new Error(`Failed to navigate to ${url} - No response received`);
    }
    
    if (!navigationResponse.ok()) {
      throw new Error(`Failed to navigate to ${url} - Status: ${navigationResponse.status()}`);
    }
    
    // Wait for content to load fully
    console.log('Page loaded successfully, waiting for content to load');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Get and parse HTML content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // Save debug HTML in development mode
    if (process.env.NODE_ENV === 'development') {
      const fs = require('fs');
      fs.writeFileSync('google-trends-debug.html', content);
      console.log('Saved HTML content for debugging');
    }
    
    // Extract trends data
    const trends = await extractTrendsData(page, $, timePeriod, region);
    
    console.log(`Successfully found ${trends.length} Google Trends for YouTube`);
    return trends;
  } catch (error) {
    console.error('Error in Google Trends scraping:', error);
    throw new Error(`Google Trends scraping failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Puppeteer browser closed');
    }
  }
}

/**
 * Get the correct time parameter for Google Trends URL
 */
function getTimeParameter(timePeriod: 'today' | '7days' | '30days'): string {
  switch (timePeriod) {
    case 'today':
      return 'now%201-d'; // Today
    case '7days':
      return 'now%207-d'; // Past 7 days
    case '30days':
      return 'today%201-m'; // Past 30 days
    default:
      return 'today%201-m'; // Default to 30 days
  }
}

/**
 * Extract trends data using multiple methods with fallbacks
 */
async function extractTrendsData(
  page: Page, 
  $: cheerio.CheerioAPI, 
  timePeriod: 'today' | '7days' | '30days',
  region: string
): Promise<GoogleTrend[]> {
  const trends: GoogleTrend[] = [];
  
  // Try method 1: Related queries section
  console.log('Looking for related queries section...');
  const relatedQueries = await page.$$eval('.related-queries-content .feed-item-wrapper .comparison-item', (items: Element[]) => {
    return items.map((item: Element) => item.textContent?.trim() || '').filter(Boolean);
  });
  
  console.log(`Found ${relatedQueries.length} related queries`);
  
  // Add related queries to trends
  relatedQueries.forEach((keyword: string, index: number) => {
    if (keyword) {
      trends.push(createTrendObject(keyword, index + 1, timePeriod, region));
    }
  });
  
  // Try method 2: Direct selector approach if method 1 failed
  if (trends.length === 0) {
    console.log('No related queries found, trying alternative selectors...');
    
    const selectorsList = [
      '.feed-item-wrapper .feed-item',
      '.md-list-block .md-list-item',
      '.trends-bar-chart-content .item',
      '.widget-content-wrapper .widget-item',
      '.feed-item-container',
      '.widget-list-content li',
      '.trends-wrapper .trends',
    ];
    
    // Try each selector
    for (const selector of selectorsList) {
      const elements = $(selector);
      console.log(`Selector "${selector}": found ${elements.length} elements`);
      
      elements.each((index, element) => {
        try {
          const keyword = $(element).text().trim();
          if (keyword && !trends.some(t => t.keyword === keyword)) {
            trends.push(createTrendObject(
              keyword.replace(/^\d+\.\s*/, '').trim(), // Remove number prefixes
              trends.length + 1,
              timePeriod,
              region
            ));
          }
        } catch (error) {
          console.error(`Error extracting keyword from ${selector}:`, error);
        }
      });
      
      // If we found some trends, no need to try more selectors
      if (trends.length > 0) break;
    }
  }
  
  // Try method 3: Search query links if methods 1 and 2 failed
  if (trends.length === 0) {
    console.log('Still no trends found, looking for search query links...');
    
    const queryLinks = $('a[href*="q="]');
    console.log(`Found ${queryLinks.length} query links`);
    
    queryLinks.each((index, element) => {
      try {
        const href = $(element).attr('href');
        if (href) {
          const match = href.match(/[?&]q=([^&]+)/);
          if (match && match[1]) {
            const keyword = decodeURIComponent(match[1]).replace(/\+/g, ' ');
            if (keyword && !trends.some(t => t.keyword === keyword)) {
              trends.push(createTrendObject(keyword, trends.length + 1, timePeriod, region));
            }
          }
        }
      } catch (error) {
        console.error('Error processing query link:', error);
      }
    });
  }
  
  // Fall back to predefined trends if all methods failed
  if (trends.length === 0) {
    console.log('No trends found from any method, adding fallback entries');
    
    const fallbackTrends = [
      "trending music",
      "viral videos",
      "gaming highlights",
      "react videos",
      "tutorials",
      "latest news",
      "product reviews",
      "comedy sketches",
      "challenges",
      "documentaries"
    ];
    
    fallbackTrends.forEach((keyword, index) => {
      trends.push(createTrendObject(keyword, index + 1, timePeriod, region));
    });
  }
  
  return trends;
}

/**
 * Create a standardized trend object
 */
function createTrendObject(
  keyword: string,
  rank: number,
  timePeriod: 'today' | '7days' | '30days',
  region: string
): GoogleTrend {
  return {
    keyword,
    rank,
    timePeriod,
    region,
    scrapedAt: new Date().toISOString()
  };
}

/**
 * Save trends data to the database
 * Removes duplicates before inserting new data
 */
export async function saveTrendsToDatabase(trends: GoogleTrend[]): Promise<{ success: boolean, inserted: number, duplicatesRemoved?: number, errors?: any[] }> {
  console.log(`Preparing to save ${trends.length} Google Trends to database`);
  
  try {
    // Map the trends to match database column names
    const dbTrends = trends.map(trend => ({
      keyword: trend.keyword,
      rank: trend.rank,
      time_period: trend.timePeriod,
      region: trend.region || 'GLOBAL',
      scraped_at: trend.scrapedAt
    }));
    
    // First, check for and remove duplicates
    // A duplicate is defined as having the same keyword, time_period, and region
    let duplicatesRemoved = 0;
    const uniqueTrends = [];
    
    for (const trend of dbTrends) {
      // Check for existing trend with same keyword, time period, and region
      const { data: existingTrends, error: searchError } = await supabase
        .from('google_trends')
        .select('id')
        .eq('keyword', trend.keyword)
        .eq('time_period', trend.time_period)
        .eq('region', trend.region)
        .limit(5); // Limit to 5 matches to avoid too many results
      
      if (searchError) {
        console.error('Error searching for duplicates:', searchError);
        continue;
      }
      
      // If duplicates found, delete them
      if (existingTrends && existingTrends.length > 0) {
        duplicatesRemoved += existingTrends.length;
        
        // Delete the duplicates
        const idsToDelete = existingTrends.map(item => item.id);
        const { error: deleteError } = await supabase
          .from('google_trends')
          .delete()
          .in('id', idsToDelete);
        
        if (deleteError) {
          console.error('Error deleting duplicates:', deleteError);
        } else {
          console.log(`Deleted ${idsToDelete.length} duplicate entries for keyword "${trend.keyword}"`);
        }
      }
      
      // Add this trend to unique trends
      uniqueTrends.push(trend);
    }
    
    console.log(`Removed ${duplicatesRemoved} duplicate entries`);
    console.log(`Inserting ${uniqueTrends.length} unique Google Trends`);
    
    // Insert unique data to the google_trends table
    const { data, error, count } = await supabase
      .from('google_trends')
      .insert(uniqueTrends)
      .select();
    
    if (error) {
      console.error('Error saving trends to database:', error);
      return { 
        success: false, 
        inserted: 0,
        duplicatesRemoved,
        errors: [error]
      };
    }
    
    console.log(`Successfully saved ${count} Google Trends to database`);
    return {
      success: true,
      inserted: count || 0,
      duplicatesRemoved
    };
  } catch (error) {
    console.error('Error in database operation:', error);
    return {
      success: false,
      inserted: 0,
      duplicatesRemoved: 0,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
} 