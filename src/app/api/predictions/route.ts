import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generatePredictionsFromVideos, AIPrediction } from '@/lib/gemini-service';

/**
 * AI Predictions API
 * 
 * This API generates AI predictions based on the viral and fast-growing videos
 * from the growth tracker. It uses the Gemini AI model to analyze patterns
 * in successful videos and generate content recommendations.
 * 
 * Supports filtering by niche via the 'niche' query parameter.
 * Also supports direct video input via POST request with a videos array in the body.
 */

// Fallback prediction in case the AI generation fails
const fallbackPrediction: AIPrediction = {
  successFactors: [
    'High-quality, engaging content that resonates with viewers',
    'Clear and compelling thumbnails with bold typography',
    'Addressing trending topics or evergreen pain points',
    'Strong storytelling with emotional appeal',
    'Consistent posting schedule and audience engagement'
  ],
  contentSuggestions: [
    'Create a series exploring the latest industry trends with expert insights',
    'Develop how-to guides solving common problems in your niche',
    'Compare popular products or approaches with in-depth analysis',
    'Share behind-the-scenes or day-in-the-life content for authenticity',
    'React to viral content with your unique perspective and expertise'
  ],
  audienceInsights: [
    'Viewers are seeking practical solutions to everyday challenges',
    'Audience values authenticity and personal connection',
    'Content consumers prefer concise, well-structured information',
    'Users engage more with visually appealing and dynamic presentations',
    'Viewers appreciate expert insights and unique perspectives'
  ],
  keywordRecommendations: [
    'how to', 'best of 2024', 'explained', 'tutorial',
    'review', 'comparison', 'guide', 'tips and tricks',
    'ultimate', 'beginner friendly'
  ],
  growthPotential: 85,
  predictedViews: '75,000 - 500,000 views'
};

// Handle GET requests
export async function GET(request: Request) {
  try {
    // Get parameters from query
    const { searchParams } = new URL(request.url);
    const niche = searchParams.get('niche');
    
    // Get videos from the database that are classified as viral or fast-growing
    let videoQuery = supabase
      .from('youtube_videos')
      .select('id, title, channel, views, niche')
      .order('views', { ascending: false });
    
    // Apply niche filter if specified
    if (niche && niche !== 'all') {
      videoQuery = videoQuery.eq('niche', niche);
    }
    
    const { data: videos, error: videosError } = await videoQuery.limit(50);
      
    if (videosError) {
      console.error('Error fetching videos for AI predictions:', videosError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Error fetching videos: ${videosError.message}` 
        },
        { status: 500 }
      );
    }
    
    if (!videos || videos.length === 0) {
      console.log('No videos found for AI predictions, using mock data');
      
      // Use mock data instead of returning an error
      const mockVideos = generateMockVideos(niche);
      
      try {
        const predictions = await generatePredictionsFromVideos(mockVideos);
        
        return NextResponse.json({
          success: true,
          predictions,
          analyzedVideos: mockVideos
        });
      } catch (aiError) {
        console.error('Error generating AI predictions from mock data:', aiError);
        
        // Return fallback prediction data
        return NextResponse.json({
          success: true,
          predictions: fallbackPrediction,
          analyzedVideos: mockVideos
        });
      }
    }
    
    // Perform processing directly from the database or use a mock approach for dev/demo
    const isDevMode = process.env.NODE_ENV === 'development';
    
    if (isDevMode) {
      // In development mode, mock the viral/fast-growing filtering
      // This allows for testing without needing actual growth tracking data
      const mockViralAndFastVideos = videos.slice(0, 5).map(video => ({
        ...video,
        velocity: Math.random() > 0.5 ? 'viral' : 'fast' as 'viral' | 'fast',
        growthPercentage: Math.floor(Math.random() * 500) + 200,
        growthRate: Math.floor(Math.random() * 300000) + 50000,
      }));
      
      try {
        // Generate AI predictions
        const predictions = await generatePredictionsFromVideos(mockViralAndFastVideos);
        
        return NextResponse.json({
          success: true,
          predictions,
          analyzedVideos: mockViralAndFastVideos
        });
      } catch (aiError) {
        console.error('Error generating AI predictions in dev mode:', aiError);
        
        // Return fallback prediction data
        return NextResponse.json({
          success: true,
          predictions: fallbackPrediction,
          analyzedVideos: mockViralAndFastVideos
        });
      }
    } else {
      // In production mode, fetch actual viral/fast-growing videos from the growth analysis
      try {
        // Add niche filter to growth API call if specified
        const growthApiUrl = niche && niche !== 'all'
          ? `${request.headers.get('origin')}/api/growth?timePeriod=month&sortBy=growthRate&niche=${encodeURIComponent(niche)}`
          : `${request.headers.get('origin')}/api/growth?timePeriod=month&sortBy=growthRate`;
        
        const response = await fetch(growthApiUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch growth data');
        }
        
        const growthData = await response.json();
        
        if (!growthData.success) {
          throw new Error(growthData.error || 'Unknown error fetching growth data');
        }
        
        // Filter to viral and fast videos only
        const viralAndFastVideos = growthData.videos.filter(
          (video: any) => video.velocity === 'viral' || video.velocity === 'fast'
        );
        
        if (viralAndFastVideos.length === 0) {
          // If no viral/fast videos found, use all videos and take top 3
          const topVideos = growthData.videos.slice(0, 3).map((video: any) => ({
            ...video,
            velocity: 'fast' as 'fast'
          }));
          
          const predictions = await generatePredictionsFromVideos(topVideos);
          
          return NextResponse.json({
            success: true,
            predictions,
            analyzedVideos: topVideos
          });
        }
        
        // Generate AI predictions
        const predictions = await generatePredictionsFromVideos(viralAndFastVideos);
        
        return NextResponse.json({
          success: true,
          predictions,
          analyzedVideos: viralAndFastVideos
        });
      } catch (error) {
        console.error('Error processing production growth data:', error);
        
        // Use mock data as fallback
        const mockVideos = generateMockVideos(niche);
        
        return NextResponse.json({
          success: true,
          predictions: fallbackPrediction,
          analyzedVideos: mockVideos
        });
      }
    }
  } catch (error) {
    console.error('Error processing AI predictions:', error);
    
    // Always return something usable to prevent UI breakage
    const mockVideos = generateMockVideos();
    
    return NextResponse.json({
      success: true,
      predictions: fallbackPrediction,
      analyzedVideos: mockVideos
    });
  }
}

// Handle POST requests for direct video input
export async function POST(request: Request) {
  try {
    // Get the videos directly from the request body
    const body = await request.json();
    const { videos } = body;
    
    if (!videos || !Array.isArray(videos) || videos.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No videos provided in request body' 
        },
        { status: 400 }
      );
    }
    
    // Use the provided videos for prediction
    try {
      const predictions = await generatePredictionsFromVideos(videos);
      
      return NextResponse.json({
        success: true,
        predictions,
        analyzedVideos: videos
      });
    } catch (aiError) {
      console.error('Error generating AI predictions from provided videos:', aiError);
      
      // Return fallback prediction with the provided videos
      return NextResponse.json({
        success: true,
        predictions: fallbackPrediction,
        analyzedVideos: videos
      });
    }
  } catch (error) {
    console.error('Error processing POST request:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

/**
 * Generate mock videos for testing or fallback, optionally filtered by niche
 */
function generateMockVideos(niche?: string | null) {
  const allMockVideos = [
    {
      id: 'v1dE0mQ',
      title: 'How to Build a Website in 10 Minutes - Complete Guide 2024',
      channel: 'WebDevMaster',
      views: 850000,
      niche: 'technology',
      velocity: 'viral' as 'viral',
      growthPercentage: 740,
      growthRate: 750000
    },
    {
      id: 'y2cL9zP',
      title: 'The Ultimate Productivity System That Changed My Life',
      channel: 'LifeOptimized',
      views: 562000,
      niche: 'productivity',
      velocity: 'viral' as 'viral',
      growthPercentage: 680,
      growthRate: 490000
    },
    {
      id: 'k7mD3rT',
      title: '10 JavaScript Tricks Professional Developers Use Daily',
      channel: 'CodePro',
      views: 423000,
      niche: 'programming',
      velocity: 'fast' as 'fast',
      growthPercentage: 310,
      growthRate: 320000
    },
    {
      id: 'a4bN9qX',
      title: 'I Tried the Viral TikTok Productivity Hack for 30 Days',
      channel: 'TrendTracker',
      views: 980000,
      niche: 'lifestyle',
      velocity: 'viral' as 'viral',
      growthPercentage: 920,
      growthRate: 885000
    },
    {
      id: 'p5xR8sW',
      title: 'What Actually Happens When You Start Exercising Every Day',
      channel: 'HealthHabits',
      views: 720000,
      niche: 'fitness',
      velocity: 'fast' as 'fast',
      growthPercentage: 450,
      growthRate: 590000
    },
    {
      id: 'g6hJ7vT',
      title: 'The Best Gaming Setup Under $1000 in 2024',
      channel: 'GamerGuru',
      views: 530000,
      niche: 'gaming',
      velocity: 'fast' as 'fast',
      growthPercentage: 380,
      growthRate: 420000
    },
    {
      id: 'z9dK4lQ',
      title: '5 Money Habits That Changed My Financial Life',
      channel: 'FinanceCoach',
      views: 670000,
      niche: 'finance',
      velocity: 'viral' as 'viral',
      growthPercentage: 580,
      growthRate: 510000
    }
  ];
  
  // Filter by niche if specified
  if (niche && niche !== 'all') {
    const filteredVideos = allMockVideos.filter(video => video.niche === niche);
    return filteredVideos.length > 0 ? filteredVideos : allMockVideos.slice(0, 3);
  }
  
  return allMockVideos;
} 