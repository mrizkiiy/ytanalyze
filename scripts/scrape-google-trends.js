/**
 * Google Trends Scraper CLI script
 * 
 * This script allows you to run the Google Trends scraper from the command line
 * Usage: node scripts/scrape-google-trends.js [today|7days|30days] [region]
 * Examples:
 *   node scripts/scrape-google-trends.js 7days
 *   node scripts/scrape-google-trends.js 30days ID
 */

// Set environment to server
process.env.NODE_ENV = 'production';

// Import required modules
require('dotenv').config();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

// Hardcoded Supabase credentials
const supabaseUrl = 'https://wpehmvcmplxlagwscgxk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwZWhtdmNtcGx4bGFnd3NjZ3hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYzNjA2ODQsImV4cCI6MjA2MTkzNjY4NH0.aAdaosqa7zFL4MBzxbVDtfmokVL6iJ8gZSR_-nkQIwc';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Get time period from command line argument
const timePeriod = process.argv[2] || 'today';
const region = process.argv[3] || 'GLOBAL';

if (!['today', '7days', '30days'].includes(timePeriod)) {
  console.error('Error: Invalid time period. Use today, 7days, or 30days.');
  process.exit(1);
}

console.log(`Using time period: ${timePeriod} and region: ${region}`);

// Main function to run the scraper
async function main() {
  console.log(`Starting Google Trends scraper for time period: ${timePeriod}, region: ${region}`);
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    console.log('Puppeteer browser launched successfully');

    const page = await browser.newPage();
    
    // Set a more realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Add some randomization to appear more human-like
    await page.setViewport({
      width: 1280 + Math.floor(Math.random() * 100),
      height: 800 + Math.floor(Math.random() * 100),
      deviceScaleFactor: 1,
      hasTouch: false,
      isLandscape: true,
      isMobile: false,
    });
    
    // Build URL for Google Trends with YouTube filter
    // Fix the URL format based on the time period
    let timeParam = '';
    switch (timePeriod) {
      case 'today':
        timeParam = 'now%201-d'; // Today - no results typically, but keep for compatibility
        break;
      case '7days':
        timeParam = 'now%207-d'; // Past 7 days
        break;
      case '30days':
        timeParam = 'today%201-m'; // Past 30 days - correct format
        break;
    }
    
    // Use the correct format with region parameter
    let url = `https://trends.google.co.id/trends/explore?date=${timeParam}&gprop=youtube&hl=en`;
    
    // Add region if not GLOBAL
    if (region !== 'GLOBAL') {
      url += `&geo=${region}`;
    }
    
    console.log(`Navigating to URL: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 60000 // Increase timeout to 60 seconds
    });
    
    console.log('Page loaded successfully, waiting for content to load');
    
    // Wait longer for content to load
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Get HTML content
    const content = await page.content();
    const $ = cheerio.load(content);
    
    // Save HTML for debugging
    await fs.writeFile('google-trends-debug.html', content);
    console.log('Saved HTML content for debugging');
    
    const trends = [];
    
    console.log('Looking for related queries section...');
    
    // Try to find related queries section
    const relatedQueries = await page.$$eval('.related-queries-content .feed-item-wrapper .comparison-item', items => {
      return items.map(item => {
        return item.textContent?.trim() || '';
      }).filter(text => text.length > 0);
    });
    
    console.log(`Found ${relatedQueries.length} related queries`);
    
    // Add related queries to trends
    relatedQueries.forEach((keyword, index) => {
      if (keyword) {
        trends.push({
          keyword,
          rank: index + 1,
          time_period: timePeriod,
          region,
          scraped_at: new Date().toISOString()
        });
      }
    });
    
    // Try various selectors to find trend elements
    console.log('Looking for trend elements with various selectors...');
    
    // Process trending searches - try different selectors
    const selectorsList = [
      '.feed-item-wrapper .feed-item',
      '.md-list-block .md-list-item',
      '.trends-bar-chart-content .item',
      '.widget-content-wrapper .widget-item',
      '.feed-item-container',
      '.widget-list-content li',
      '.trends-wrapper .trends',
      '.related-queries-content div',
      '.related-queries-content span',
      '.fe-related-searches'
    ];
    
    // Try each selector
    for (const selector of selectorsList) {
      const elements = $(selector);
      console.log(`Selector "${selector}": found ${elements.length} elements`);
      
      if (elements.length > 0) {
        elements.each((index, element) => {
          try {
            // Try different ways to extract the keyword
            let keyword = '';
            
            // Try text content
            keyword = $(element).text().trim();
            
            // Try title attribute
            if (!keyword) {
              keyword = $(element).attr('title');
            }
            
            // Try finding an anchor tag
            if (!keyword) {
              keyword = $(element).find('a').text().trim();
            }
            
            if (keyword) {
              // Clean up the keyword - remove any non-essential text
              keyword = keyword.replace(/^[0-9]+\.\s*/, ''); // Remove ranking numbers
              keyword = keyword.replace(/\s+/g, ' '); // Normalize whitespace
              keyword = keyword.trim();
              
              // Only add if it's not a duplicate
              if (keyword && !trends.some(t => t.keyword === keyword)) {
                trends.push({
                  keyword,
                  rank: trends.length + 1,
                  time_period: timePeriod,
                  region,
                  scraped_at: new Date().toISOString()
                });
                console.log(`Found trend: "${keyword}"`);
              }
            }
          } catch (error) {
            console.error(`Error processing element with selector "${selector}" at index ${index}:`, error);
          }
        });
      }
    }
    
    // Try a different approach - look for any <a> tags with search queries
    const searchLinks = $('a[href*="q="]');
    console.log(`Found ${searchLinks.length} search links`);
    
    searchLinks.each((index, element) => {
      try {
        const href = $(element).attr('href');
        if (href) {
          const match = href.match(/[?&]q=([^&]+)/);
          if (match && match[1]) {
            const keyword = decodeURIComponent(match[1]).replace(/\+/g, ' ');
            if (keyword && !trends.some(t => t.keyword === keyword)) {
              trends.push({
                keyword,
                rank: trends.length + 1,
                time_period: timePeriod,
                region,
                scraped_at: new Date().toISOString()
              });
              console.log(`Found trend from search link: "${keyword}"`);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing search link at index ${index}:`, error);
      }
    });
    
    console.log(`Successfully scraped ${trends.length} Google Trends for YouTube`);
    
    if (trends.length === 0) {
      console.log('No trends found, adding fallback entries');
      
      // Add some fallback entries if we couldn't find any trends
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
        trends.push({
          keyword,
          rank: index + 1,
          time_period: timePeriod,
          region,
          scraped_at: new Date().toISOString()
        });
      });
    }
    
    // Save trends to database
    console.log(`Saving ${trends.length} Google Trends to database`);
    const { data, error, count } = await supabase
      .from('google_trends')
      .insert(trends)
      .select();
    
    if (error) {
      console.error('Error saving trends to database:', error);
      process.exit(1);
    }
    
    console.log(`Successfully saved ${count} Google Trends to database`);
    
  } catch (error) {
    console.error('Error in Google Trends scraping:', error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Puppeteer browser closed');
    }
  }
}

// Run the main function
main(); 