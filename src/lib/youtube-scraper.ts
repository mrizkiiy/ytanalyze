import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as cheerio from 'cheerio';
import { supabase } from './supabase';

export interface YouTubeVideo {
  id: string;
  title: string;
  channel: string;
  views: number;
  uploadDate: string;
  niche: string;
  keywords: string[];
  timePeriod?: 'day' | 'week' | 'month';
}

export type TimePeriod = 'day' | 'week' | 'month' | 'all';

export async function scrapeYouTubeTrends(
  nicheKeyword: string = '', 
  timePeriod: TimePeriod = 'all'
): Promise<YouTubeVideo[]> {
  console.log(`Starting YouTube scraping for niche: '${nicheKeyword}', time period: ${timePeriod}`);
  
  let browser;
  try {
    // Configure Chromium
    chromium.setGraphicsMode = false; // Disable WebGL to save resources
    
    // Launch browser using Sparticuz/chromium
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    
    console.log('Puppeteer browser launched successfully with @sparticuz/chromium');

    const page = await browser.newPage();
    
    // Additional settings to make puppeteer less detectable
    await page.setJavaScriptEnabled(true);
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Connection': 'keep-alive'
    });
    
    // Set a reasonable viewport size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Set longer timeouts for all operations
    await page.setDefaultNavigationTimeout(90000); // 1.5 minutes (reduced for serverless)
    await page.setDefaultTimeout(90000); // 1.5 minutes (reduced for serverless)
    
    // Retry mechanism for page navigation
    let retries = 0;
    const maxRetries = 3;
    let navigationResponse = null;
    
    // Navigate to YouTube Trending page or search results
    let url = 'https://www.youtube.com/feed/trending';
    if (nicheKeyword) {
      // For specific niche, we can search instead
      url = `https://www.youtube.com/results?search_query=${encodeURIComponent(nicheKeyword)}`;
      
      // Add time filter parameters if specified
      if (timePeriod !== 'all') {
        // YouTube's time filter parameter: sp=EgII...
        // EgIIAQ%3D%3D - Last hour
        // EgIIAg%3D%3D - Today
        // EgIIAw%3D%3D - This week
        // EgIIBA%3D%3D - This month
        // EgIIBQ%3D%3D - This year
        
        let timeParam = '';
        switch (timePeriod) {
          case 'day':
            timeParam = 'EgIIAg%3D%3D'; // Today
            break;
          case 'week':
            timeParam = 'EgIIAw%3D%3D'; // This week
            break;
          case 'month':
            timeParam = 'EgIIBA%3D%3D'; // This month
            break;
        }
        
        if (timeParam) {
          url += `&sp=${timeParam}`;
        }
      }
    }
    
    console.log(`Navigating to URL: ${url}`);
    
    // Retry loop for navigation
    while (retries < maxRetries) {
      try {
        navigationResponse = await page.goto(url, { 
          waitUntil: 'domcontentloaded', // Changed from networkidle2 to domcontentloaded
          timeout: 90000 // 1.5 minutes (reduced for serverless)
        });
        
        if (navigationResponse) break;
        
      } catch (navError) {
        console.error(`Navigation attempt ${retries + 1} failed:`, navError);
        retries++;
        
        if (retries >= maxRetries) {
          throw navError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 3000));
        console.log(`Retrying navigation (attempt ${retries + 1}/${maxRetries})...`);
      }
    }
    
    if (!navigationResponse) {
      throw new Error(`Failed to navigate to ${url} - No response received after ${maxRetries} attempts`);
    }
    
    if (!navigationResponse.ok()) {
      throw new Error(`Failed to navigate to ${url} - Status: ${navigationResponse.status()}`);
    }
    
    console.log('Page loaded successfully, starting to scroll');
    
    // Wait a moment for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try a simplified scroll approach that works better in serverless
    try {
      console.log('Using simplified scrolling optimized for serverless');
      await simplifiedScroll(page);
    } catch (scrollError) {
      console.error('Error during simplified scroll:', scrollError);
      // Continue even if scrolling fails - we might still get some content
    }
    
    // Try to find some content, even if the specific selectors fail
    let content;
    try {
      // Wait for content to be fully loaded with increased timeout
      await page.waitForSelector('#contents ytd-video-renderer, #contents ytd-grid-video-renderer', {
        timeout: 30000 // Reduced timeout to 30 seconds for serverless
      });
      
      // Get HTML content
      content = await page.content();
    } catch (selectorError) {
      console.log('Warning: Timeout waiting for specific video elements. Trying to get page content anyway.');
      // Still try to get content even if the specific selectors fail
      content = await page.content();
    }
    
    const $ = cheerio.load(content);
    
    const videos: YouTubeVideo[] = [];
    
    // Process each video
    const videoElements = $('#contents ytd-video-renderer, #contents ytd-grid-video-renderer');
    console.log(`Found ${videoElements.length} video elements on page`);
    
    // Limit to 5 videos for serverless environment to reduce processing time
    const maxVideos = Math.min(5, videoElements.length);
    
    for (let i = 0; i < maxVideos; i++) {
      try {
        const element = videoElements[i];
        
        // Extract video ID from href attribute
        const videoUrl = $(element).find('a#thumbnail').attr('href');
        if (!videoUrl) {
          console.log(`Video ${i} - No thumbnail href found, skipping`);
          continue;
        }
        // Support both /watch?v=VIDEO_ID and /shorts/VIDEO_ID
        let videoId = null;
        const watchMatch = videoUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
        const shortsMatch = videoUrl.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
        if (watchMatch) {
          videoId = watchMatch[1];
        } else if (shortsMatch) {
          videoId = shortsMatch[1];
        }
        if (!videoId) {
          console.log(`Video ${i} - Could not extract video ID from URL: ${videoUrl}`);
          continue;
        }
        
        console.log(`Processing video ${i+1}/${maxVideos}: ${videoId}`);
        
        // Extract basic info without navigating to video page to avoid rate limiting
        const title = $(element).find('#video-title').text().trim();
        
        // Fix channel name extraction to get only the direct text, avoiding duplicates
        const channelElement = $(element).find('#channel-name, #text.ytd-channel-name').first();
        let channel = '';
        
        // Try to get the direct text content first
        const directText = channelElement.find('.ytd-channel-name').first().text().trim();
        if (directText) {
          channel = directText;
        } else {
          // Fallback to the text of the first element
          channel = channelElement.text().trim();
        }
        
        // Extract views from text that might look like "123,456 views" or "1.5M views" or "4K views"
        const viewsText = $(element).find('#metadata-line span').first().text().trim();
        let views = 0;
        
        if (viewsText) {
          if (viewsText.includes('K')) {
            // Handle thousands (K) - e.g., "15K views" becomes 15,000
            const numMatch = viewsText.match(/([\d.]+)K/);
            if (numMatch) {
              views = Math.round(parseFloat(numMatch[1]) * 1000);
            }
          } else if (viewsText.includes('M')) {
            // Handle millions (M) - e.g., "1.5M views" becomes 1,500,000
            const numMatch = viewsText.match(/([\d.]+)M/);
            if (numMatch) {
              views = Math.round(parseFloat(numMatch[1]) * 1000000);
            }
          } else if (viewsText.includes('B')) {
            // Handle billions (B) - e.g., "1.2B views" becomes 1,200,000,000
            const numMatch = viewsText.match(/([\d.]+)B/);
            if (numMatch) {
              views = Math.round(parseFloat(numMatch[1]) * 1000000000);
            }
          } else {
            // Handle regular numbers with commas like "123,456 views"
            const viewsMatch = viewsText.match(/[\d,]+/);
            views = viewsMatch ? parseInt(viewsMatch[0].replace(/,/g, '')) : 0;
          }
        }
        
        console.log(`Extracted views for video ${videoId}: ${viewsText} → ${views}`);
        
        // Extract upload date
        const uploadDate = $(element).find('#metadata-line span').eq(1).text().trim();
        
        // Extract keywords from title and description
        const keywords = extractKeywordsFromTitle(title);
        console.log(`Extracted keywords for video ${videoId}:`, keywords);
                
        // Create simplified video object with data we can get from the listing
        videos.push({
          id: videoId,
          title,
          channel,
          views,
          uploadDate,
          niche: nicheKeyword || extractNiche(title, keywords),
          keywords,
          timePeriod: timePeriod === 'all' ? undefined : timePeriod
        });
      } catch (videoError) {
        console.error(`Error processing video ${i}:`, videoError);
        // Continue with the next video
      }
    }
    
    console.log(`Successfully processed ${videos.length} videos`);
    return videos;
  } catch (error) {
    console.error('Error in YouTube scraping:', error);
    throw new Error(`YouTube scraping failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (browser) {
      await browser.close();
      console.log('Puppeteer browser closed');
    }
  }
}

// Helper function to extract niche from title and keywords
function extractNiche(title: string, keywords: string[]): string {
  // This is a simple implementation; in a real application, you might want to use
  // more sophisticated methods like ML-based categorization
  const nicheCandidates = [
    'music', 'gaming', 'sports', 'news', 'education', 
    'howto', 'science', 'technology', 'entertainment', 'travel',
    'food', 'beauty', 'fashion', 'fitness', 'comedy'
  ];
  
  // Check title and keywords for niche indicators
  const titleLower = title.toLowerCase();
  const allText = [titleLower, ...keywords.map(k => k.toLowerCase())].join(' ');
  
  for (const niche of nicheCandidates) {
    if (allText.includes(niche)) {
      return niche;
    }
  }
  
  return 'other';
}

// Simpler scroll function optimized for serverless environments
async function simplifiedScroll(page: any) {
  console.log('Starting simplified page scroll for serverless');
  
  // Use a minimal scroll approach to avoid timeouts
  try {
    for (let i = 0; i < 2; i++) {
      // Execute a simple scroll command
      await page.evaluate('window.scrollBy(0, 800)');
      
      // Short wait between scrolls
      await new Promise(resolve => setTimeout(resolve, 800));
      
      console.log(`Completed scroll ${i+1}/2`);
    }
    
    console.log('Simplified scroll completed');
  } catch (error) {
    console.error('Error during simplified scroll:', error);
    // Just log the error and continue
  }
}

// Original auto-scroll function (keeping as backup/alternative)
async function autoScroll(page: any) {
  console.log('Starting page auto-scroll');
  
  try {
    // Use a simpler approach with a basic evaluation
    await page.evaluate(() => {
      for (let i = 0; i < 5; i++) {
        window.scrollBy(0, 500);
      }
    });
    
    console.log('Auto-scroll completed');
  } catch (scrollError) {
    console.error('Error during auto-scroll:', scrollError);
    // Continue execution even if scrolling fails
  }
}

// Helper function to extract keywords from title
function extractKeywordsFromTitle(title: string): string[] {
  // Remove special characters and convert to lowercase
  const cleanTitle = title.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split into words
  const words = cleanTitle.split(/\s+/).filter(word => word.length > 0);
  
  // Filter out common stop words
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
    'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'like', 
    'from', 'of', 'as', 'this', 'that', 'these', 'those', 'it', 'its',
    'how', 'what', 'when', 'where', 'who', 'why', 'will', 'would', 'could',
    'should', 'do', 'does', 'did', 'has', 'have', 'had', 'can', 'may', 'might'
  ]);
  
  const filteredWords = words.filter(word => 
    word.length > 2 && !stopWords.has(word)
  );
  
  // Look for common phrases and multi-word keywords
  const phrases: string[] = [];
  const phrasesToLookFor = [
    'how to', 'tutorial', 'review', 'unboxing', 'gameplay', 'walkthrough',
    'reaction', 'official video', 'official trailer', 'behind the scenes',
    'vs', 'versus', 'comparison', 'top 10', 'top 5', 'best of', 'worst of',
    'music video', 'live performance', 'interview', 'explained', 'guide',
    'step by step', 'diy', 'do it yourself', 'compilation'
  ];
  
  for (const phrase of phrasesToLookFor) {
    if (cleanTitle.includes(phrase)) {
      phrases.push(phrase);
    }
  }
  
  // Check for topic-specific keywords
  const topicKeywords: { [topic: string]: string[] } = {
    'gaming': ['gameplay', 'playthrough', 'walkthrough', 'game', 'gaming', 'xbox', 'playstation', 'nintendo', 'steam', 'pc game'],
    'music': ['music', 'song', 'album', 'concert', 'live', 'official video', 'lyrics', 'remix', 'cover'],
    'tech': ['review', 'unboxing', 'tech', 'technology', 'smartphone', 'laptop', 'computer', 'gadget', 'tutorial'],
    'food': ['recipe', 'cooking', 'food', 'chef', 'restaurant', 'kitchen', 'baking', 'meal', 'delicious'],
    'travel': ['travel', 'vlog', 'tour', 'trip', 'vacation', 'destination', 'hotel', 'resort', 'guide'],
    'fitness': ['workout', 'exercise', 'fitness', 'gym', 'training', 'bodybuilding', 'yoga', 'cardio', 'diet'],
    'fashion': ['fashion', 'style', 'outfit', 'clothing', 'haul', 'makeup', 'beauty', 'tutorial', 'trend'],
    'education': ['learn', 'education', 'course', 'tutorial', 'lesson', 'explained', 'guide', 'tips', 'how to'],
  };
  
  let topicMatches: string[] = [];
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    for (const keyword of keywords) {
      if (cleanTitle.includes(keyword)) {
        topicMatches.push(keyword);
      }
    }
  }
  
  // Get unique keywords from all sources
  const allKeywords = [...filteredWords, ...phrases, ...topicMatches];
  const uniqueKeywords = Array.from(new Set(allKeywords));
  
  // Limit to maximum 15 keywords
  return uniqueKeywords.slice(0, 15);
}

export async function saveVideosToDatabase(videos: YouTubeVideo[]) {
  console.log(`Attempting to save ${videos.length} videos to database`);
  
  if (videos.length === 0) {
    console.log('No videos to save, skipping database operation');
    return;
  }
  
  // Check if time_period column exists using a different approach
  let hasTimePeriodColumn = false;
  try {
    // Try to query with a filter on time_period - if it works, the column exists
    const { data, error } = await supabase
      .from('youtube_videos')
      .select('id')
      .eq('time_period', 'day')
      .limit(1);
    
    // If there's no error about the column not existing, we assume it exists
    hasTimePeriodColumn = !error || !error.message.includes('column');
    
    console.log('time_period column check result:', { hasTimePeriodColumn, error: error?.message });
  } catch (e) {
    console.log('Failed to check if time_period column exists, assuming it doesn\'t exist:', e);
    hasTimePeriodColumn = false;
  }
  
  console.log('time_period column exists in saveVideosToDatabase:', hasTimePeriodColumn);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const video of videos) {
    try {
      // Make sure keywords is always an array
      const safeKeywords = Array.isArray(video.keywords) ? video.keywords : [];
      console.log(`Processing video ${video.id} with ${safeKeywords.length} keywords`);
      
      // Check if video already exists - Modified approach to avoid errors
      const { data: existingVideos, error: queryError } = await supabase
        .from('youtube_videos')
        .select('id, keywords')
        .eq('id', video.id);
      
      if (queryError) {
        console.error(`Error checking if video ${video.id} exists:`, queryError);
        errorCount++;
        continue;
      }
      
      // Check if we found a matching video
      const videoExists = existingVideos && existingVideos.length > 0;
      
      if (videoExists) {
        // Get existing keywords to merge with new ones
        const existingKeywords = existingVideos[0].keywords || [];
        // Merge existing and new keywords, and remove duplicates
        const mergedKeywords = Array.from(new Set([...existingKeywords, ...safeKeywords]));
        
        // Update existing video with new view count
        const updateData: any = {
          views: video.views,
          keywords: mergedKeywords,
          updated_at: new Date().toISOString()
        };
        
        // Only add time_period field if the column exists
        if (hasTimePeriodColumn && video.timePeriod) {
          updateData.time_period = video.timePeriod;
        }
        
        const { error: updateError } = await supabase
          .from('youtube_videos')
          .update(updateData)
          .eq('id', video.id);
          
        if (updateError) {
          console.error(`Error updating video ${video.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`Successfully updated video ${video.id} with ${mergedKeywords.length} keywords`);
          successCount++;
        }
      } else {
        // Prepare data for new video
        const insertData: any = {
          id: video.id,
          title: video.title,
          channel: video.channel,
          views: video.views,
          upload_date: video.uploadDate,
          niche: video.niche,
          keywords: safeKeywords,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        // Only add time_period field if the column exists
        if (hasTimePeriodColumn && video.timePeriod) {
          insertData.time_period = video.timePeriod;
        }
        
        // Insert new video
        const { error: insertError } = await supabase
          .from('youtube_videos')
          .insert(insertData);
          
        if (insertError) {
          console.error(`Error inserting video ${video.id}:`, insertError);
          errorCount++;
        } else {
          console.log(`Successfully inserted video ${video.id} with ${safeKeywords.length} keywords`);
          successCount++;
        }
      }
    } catch (videoError) {
      console.error(`Unexpected error processing video ${video.id}:`, videoError);
      errorCount++;
    }
  }
  
  console.log(`Database operation completed. Success: ${successCount}, Errors: ${errorCount}`);
} 