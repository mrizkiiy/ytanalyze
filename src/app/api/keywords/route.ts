import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TimePeriod } from '@/lib/youtube-scraper';

/**
 * Keywords and Topic Clustering API
 * 
 * This API performs natural language processing on video titles and descriptions to:
 * 1. Extract relevant keywords and their frequency
 * 2. Group keywords into topic clusters based on co-occurrence
 * 3. Identify the most significant trending topics across videos
 * 
 * The implementation extracts single keywords and meaningful phrases (bigrams),
 * then builds relationship graphs between related terms to visualize content trends.
 * 
 * In a production environment, this could be extended with:
 * - More sophisticated NLP using external libraries
 * - Named entity recognition for better topic extraction
 * - Sentiment analysis to understand emotional context
 * - TF-IDF scoring for better keyword relevance
 */

interface KeywordData {
  keyword: string;
  count: number;
  videos: number;
  niche: string;
  nodeId?: number;
}

interface ClusterNode {
  id: string;
  label: string;
  size: number;
  color: string;
  group: number;
}

interface ClusterEdge {
  from: string;
  to: string;
  width: number;
  value: number;
}

// GET: Handle both saved keywords and keyword analysis
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const timePeriod = searchParams.get('timePeriod') as TimePeriod;
    
    // If timePeriod is provided, perform keyword analysis
    if (timePeriod) {
      console.log(`Processing keyword analysis for time period: ${timePeriod}`);
      
      // Check if the database connection is working
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data: testData, error: testError } = await supabase
        .from('youtube_videos')
        .select('id')
        .limit(1);
        
      if (testError) {
        console.error('Database connection error:', testError);
        return NextResponse.json(
          { 
            success: false, 
            error: `Database connection error: ${testError.message}` 
          },
          { status: 500 }
        );
      }
      
      // Fetch videos based on time period
      let query = supabase
        .from('youtube_videos')
        .select('id, title, niche, keywords');
        
      // Apply time period filter if not 'all'
      if (timePeriod !== 'all') {
        const now = new Date();
        let fromDate = new Date();
        
        // Calculate date based on time period
        switch (timePeriod) {
          case 'day':
            fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case 'week':
            fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'month':
            fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        }
        
        query = query.gte('created_at', fromDate.toISOString());
      }
      
      const { data: videos, error: videosError } = await query;
      
      if (videosError) {
        console.error('Error fetching videos for keyword analysis:', videosError);
        return NextResponse.json(
          { 
            success: false, 
            error: `Error fetching videos: ${videosError.message}` 
          },
          { status: 500 }
        );
      }
      
      if (!videos || videos.length === 0) {
        console.log('No videos found for keyword analysis');
        return NextResponse.json({
          success: true,
          keywords: [],
          clusters: { nodes: [], edges: [] },
          message: 'No videos found for keyword analysis'
        });
      }
      
      console.log(`Found ${videos.length} videos for keyword analysis`);
      
      // Process keywords
      const keywordCounts: Record<string, { count: number; videos: Set<string>; niches: Record<string, number> }> = {};
      
      // Process video titles and keywords
      videos.forEach(video => {
        if (!video.title) return;
        
        // Get keywords from video data
        const videoKeywords = new Set<string>();
        
        // Add keywords from the keywords array if available
        if (Array.isArray(video.keywords)) {
          video.keywords.forEach(kw => {
            if (typeof kw === 'string' && kw.trim().length > 3) {
              videoKeywords.add(kw.trim().toLowerCase());
            }
          });
        }
        
        // Extract keywords from title
        const titleWords = video.title
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter((word: string) => word.length > 3);
          
        titleWords.forEach((word: string) => {
          videoKeywords.add(word);
        });
        
        // Add bigrams (2 consecutive words) from title
        for (let i = 0; i < titleWords.length - 1; i++) {
          if (titleWords[i].length > 2 && titleWords[i+1].length > 2) {
            const bigram = `${titleWords[i]} ${titleWords[i+1]}`;
            videoKeywords.add(bigram);
          }
        }
        
        // Record each keyword
        videoKeywords.forEach(keyword => {
          if (!keywordCounts[keyword]) {
            keywordCounts[keyword] = { 
              count: 0, 
              videos: new Set<string>(),
              niches: {}
            };
          }
          
          keywordCounts[keyword].count++;
          keywordCounts[keyword].videos.add(video.id);
          
          // Track niche for this keyword
          const niche = video.niche || 'unknown';
          if (!keywordCounts[keyword].niches[niche]) {
            keywordCounts[keyword].niches[niche] = 0;
          }
          keywordCounts[keyword].niches[niche]++;
        });
      });
      
      // Convert to array and sort by count
      const keywordsArray: KeywordData[] = Object.entries(keywordCounts)
        .filter(([_, data]) => data.videos.size >= 2) // Only keywords appearing in at least 2 videos
        .map(([keyword, data]) => {
          // Find the most common niche for this keyword
          let topNiche = 'unknown';
          let topNicheCount = 0;
          
          Object.entries(data.niches).forEach(([niche, count]) => {
            if (count > topNicheCount) {
              topNiche = niche;
              topNicheCount = count;
            }
          });
          
          return {
            keyword,
            count: data.count,
            videos: data.videos.size,
            niche: topNiche
          };
        })
        .sort((a, b) => b.count - a.count);
      
      // Take top 50 keywords for response
      const topKeywords = keywordsArray.slice(0, 50);
      
      // Generate cluster data
      const clusterNodes: ClusterNode[] = [];
      const clusterEdges: ClusterEdge[] = [];
      
      // Generate color map for niches
      const nicheColors: Record<string, string> = {
        'programming': '#4caf50',
        'gaming': '#ff5722',
        'technology': '#9c27b0',
        'education': '#2196f3',
        'entertainment': '#ffc107',
        'lifestyle': '#03a9f4',
        'beauty': '#e91e63',
        'fitness': '#8bc34a',
        'food': '#ff9800',
        'music': '#3f51b5',
        'news': '#607d8b',
        'sports': '#009688',
        'travel': '#cddc39',
        'fashion': '#ff4081',
        'unknown': '#9e9e9e'
      };
      
      // Group keywords by niche
      const nicheGroups: Record<string, KeywordData[]> = {};
      topKeywords.forEach(keyword => {
        if (!nicheGroups[keyword.niche]) {
          nicheGroups[keyword.niche] = [];
        }
        nicheGroups[keyword.niche].push(keyword);
      });
      
      // Create nodes and assign group numbers
      let groupCounter = 1;
      let nodeCounter = 1;
      
      Object.entries(nicheGroups).forEach(([niche, keywords]) => {
        const groupId = groupCounter++;
        const color = nicheColors[niche] || '#9e9e9e';
        
        // Add nodes for this niche
        keywords.forEach(keyword => {
          // Scale size based on count
          const size = Math.max(10, Math.min(30, 10 + (keyword.count / 5)));
          
          clusterNodes.push({
            id: String(nodeCounter),
            label: keyword.keyword,
            size,
            color,
            group: groupId
          });
          
          // Store the node ID mapping for creating edges
          keyword.nodeId = nodeCounter;
          nodeCounter++;
        });
      });
      
      // Create edges between related keywords
      const processedEdges = new Set<string>();
      
      videos.forEach(video => {
        // Get all keywords from this video that are in our top keywords list
        const videoKeywords = topKeywords.filter(k => {
          // Check if the keyword is in the video title or keywords
          const inTitle = video.title.toLowerCase().includes(k.keyword.toLowerCase());
          const inKeywords = Array.isArray(video.keywords) && 
            video.keywords.some(vk => typeof vk === 'string' && vk.toLowerCase().includes(k.keyword.toLowerCase()));
          
          return inTitle || inKeywords;
        });
        
        // Create edges between all pairs of keywords in this video
        for (let i = 0; i < videoKeywords.length; i++) {
          for (let j = i + 1; j < videoKeywords.length; j++) {
            const kw1 = videoKeywords[i];
            const kw2 = videoKeywords[j];
            
            if (!kw1.nodeId || !kw2.nodeId) continue;
            
            // Create an edge ID to avoid duplicates
            const edgeId = [kw1.nodeId, kw2.nodeId].sort().join('-');
            
            if (!processedEdges.has(edgeId)) {
              processedEdges.add(edgeId);
              
              // Calculate edge width based on counts
              const value = Math.min(5, Math.max(1, Math.floor((kw1.count + kw2.count) / 50)));
              const width = Math.min(3, Math.max(1, Math.floor(value / 2)));
              
              clusterEdges.push({
                from: String(kw1.nodeId),
                to: String(kw2.nodeId),
                width,
                value
              });
            }
          }
        }
      });
      
      // Return the results
      return NextResponse.json({
        success: true,
        keywords: topKeywords,
        clusters: {
          nodes: clusterNodes,
          edges: clusterEdges
        }
      });
    } else {
      // If no timePeriod, fetch saved keywords
      const { data, error } = await supabase
        .from('keywords')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching keywords:', error);
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    }
  } catch (error) {
    console.error('Error in keywords GET:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST: Save a new keyword
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.keyword) {
      return NextResponse.json(
        { success: false, error: 'Keyword is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('keywords')
      .upsert({
        keyword: body.keyword,
        search_volume: body.searchVolume,
        competition: body.competition,
        notes: body.notes || '',
      }, {
        onConflict: 'keyword',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error saving keyword:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Keyword saved successfully',
      data 
    });
  } catch (error) {
    console.error('Error in keywords POST:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Remove a keyword
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword');
    
    if (!keyword) {
      return NextResponse.json(
        { success: false, error: 'Keyword parameter is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('keywords')
      .delete()
      .eq('keyword', keyword);

    if (error) {
      console.error('Error deleting keyword:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Keyword deleted successfully' 
    });
  } catch (error) {
    console.error('Error in keywords DELETE:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 