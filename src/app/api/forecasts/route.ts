import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkSupabaseConnection } from '@/lib/supabase';

// Initialize Gemini API
const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBT1eMy7M9BOA6Z7AgfkM4HshVgQgm5ETE';
const genAI = new GoogleGenerativeAI(API_KEY);

// Types for the forecast data
interface HistoricalMetrics {
  period: string;
  views: number;
  subscribers: number;
  engagementRate: number;
  watchTime: number;
  videosPublished: number;
}

export interface ForecastPoint {
  period: string;
  value: number;
  lowerBound?: number;
  upperBound?: number;
}

export interface MetricForecast {
  metric: string;
  description: string;
  currentValue: number;
  forecastedGrowth: number;
  confidenceScore: number;
  forecastPoints: ForecastPoint[];
  insights: string[];
  recommendations: string[];
}

// Cache for API responses
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
const forecastCache = new Map<string, { 
  data: { 
    success: boolean; 
    forecasts: MetricForecast[]; 
    historicalData: HistoricalMetrics[]; 
  }; 
  timestamp: number 
}>();

export async function GET(request: Request) {
  try {
    // Get params
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId') || 'current';
    const period = searchParams.get('period') || '90days';
    const forecastLength = searchParams.get('forecastLength') || '30days';
    
    console.log(`Forecast API request: channelId=${channelId}, period=${period}, forecastLength=${forecastLength}`);
    
    // Create cache key based on request parameters
    const cacheKey = `forecast-${channelId}-${period}-${forecastLength}`;
    
    // Check if we have a valid cached response
    const cachedResponse = forecastCache.get(cacheKey);
    if (cachedResponse && (Date.now() - cachedResponse.timestamp) < CACHE_DURATION) {
      console.log('Serving forecast from cache');
      return NextResponse.json(cachedResponse.data);
    }
    
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
    
    try {
      // Fetch historical data from the database
      // This would be replaced with actual data in production
      const historicalData = await getHistoricalMetrics(channelId, period);
      
      // Generate forecasts using Gemini API
      const forecasts = await generateForecasts(historicalData, forecastLength);
      
      const responseData = { 
        success: true,
        forecasts,
        historicalData
      };
      
      // Cache the response
      forecastCache.set(cacheKey, {
        data: responseData,
        timestamp: Date.now()
      });
      
      return NextResponse.json(responseData);
    } catch (innerError) {
      console.error('Error generating forecasts:', innerError);
      throw innerError;
    }
  } catch (error) {
    console.error('Error in forecast API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

// Get historical metrics for the channel
async function getHistoricalMetrics(channelId: string, period: string): Promise<HistoricalMetrics[]> {
  // In a production environment, this would fetch actual data from your database
  
  // For now, we'll generate sample historical data
  const numDays = period === '30days' ? 30 : period === '60days' ? 60 : 90;
  
  // Generate sample historical data with realistic patterns
  const historicalData: HistoricalMetrics[] = [];
  
  // Base values with slight randomness
  let views = 5000 + Math.floor(Math.random() * 2000);
  let subscribers = 100000;
  const subscriberGrowth = 30 + Math.floor(Math.random() * 20);
  let engagementRate = 4.5 + (Math.random() * 1.5);
  let watchTime = 20000 + Math.floor(Math.random() * 5000);
  
  const today = new Date();
  
  for (let i = numDays; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    // Add day-to-day variation
    const dailyVariation = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1
    
    // Gradual growth trend
    const growthFactor = 1 + ((numDays - i) * 0.001);
    
    // Weekend boost (Saturday/Sunday)
    const dayOfWeek = date.getDay();
    const weekendBoost = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;
    
    // Video publication (every 3-4 days on average)
    const isVideoDay = i % 3 === 0 || (i % 4 === 0 && Math.random() > 0.5);
    const videosPublished = isVideoDay ? 1 : 0;
    
    // Video boost (higher views on video days and the next 2 days)
    const videoBoost = isVideoDay ? 2.0 : (i % 3 === 1 || i % 4 === 1) ? 1.8 : (i % 3 === 2 || i % 4 === 2) ? 1.3 : 1.0;
    
    // Calculate metrics for this day
    views = Math.floor(views * dailyVariation * growthFactor * weekendBoost * videoBoost);
    subscribers += Math.floor(subscriberGrowth * dailyVariation * (isVideoDay ? 2 : 1));
    engagementRate = engagementRate * dailyVariation;
    watchTime = Math.floor(watchTime * dailyVariation * growthFactor * weekendBoost * videoBoost);
    
    historicalData.push({
      period: dateString,
      views,
      subscribers,
      engagementRate,
      watchTime,
      videosPublished
    });
  }
  
  return historicalData;
}

// Generate forecasts using Gemini API
async function generateForecasts(historicalData: HistoricalMetrics[], forecastLength: string): Promise<MetricForecast[]> {
  const generativeModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  // Determine the number of days to forecast
  const forecastDays = forecastLength === '30days' ? 30 : forecastLength === '60days' ? 60 : 90;
  
  // Extract the relevant historical data for the prompt
  const simplifiedData = historicalData.map(day => ({
    date: day.period,
    views: day.views,
    subscribers: day.subscribers,
    engagementRate: day.engagementRate.toFixed(2),
    watchTime: day.watchTime,
    videosPublished: day.videosPublished
  }));
  
  // Calculate current metrics (based on the most recent data point)
  const latestData = historicalData[historicalData.length - 1];
  
  const prompt = `
    You're an AI specializing in YouTube analytics forecasting.
    
    Here's historical YouTube channel performance data for the past ${historicalData.length} days:
    ${JSON.stringify(simplifiedData, null, 2)}
    
    The most recent metrics are:
    - Views: ${latestData.views}
    - Subscribers: ${latestData.subscribers}
    - Engagement Rate: ${latestData.engagementRate.toFixed(2)}
    - Watch Time: ${latestData.watchTime}
    
    Based on this historical data, generate forecasts for the next ${forecastDays} days for the following metrics:
    1. Views
    2. Subscribers
    3. Engagement Rate
    4. Watch Time
    
    For each metric, provide:
    - A forecast for each day in the forecast period
    - A confidence score for the forecast (0-100)
    - The forecasted growth percentage
    - 2-3 data-backed insights explaining the patterns
    - 2-3 strategic recommendations to improve the metric
    
    Return your analysis as a JSON array, with one object per metric, following this structure:
    [
      {
        "metric": "views",
        "description": "Daily video views",
        "currentValue": 12345,
        "forecastedGrowth": 12.5,
        "confidenceScore": 85,
        "forecastPoints": [
          {"period": "2023-06-01", "value": 12500, "lowerBound": 12000, "upperBound": 13000},
          ...
        ],
        "insights": [
          "Insight 1 about views trends",
          ...
        ],
        "recommendations": [
          "Recommendation 1 to improve views",
          ...
        ]
      },
      ...
    ]
    
    Provide only the JSON with no additional text or explanation.
  `;
  
  try {
    const result = await generativeModel.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
    if (!jsonMatch) {
      console.error("Could not extract JSON from Gemini response");
      throw new Error("Invalid response format from Gemini API");
    }
    
    const forecasts: MetricForecast[] = JSON.parse(jsonMatch[0]);
    console.log(`Successfully generated forecasts for ${forecasts.length} metrics`);
    
    return forecasts;
  } catch (error) {
    console.error("Error generating forecasts with Gemini:", error);
    
    // Fallback to mock forecasts if the API call fails
    return generateMockForecasts(historicalData, forecastDays);
  }
}

// Generate mock forecasts (fallback if API fails)
function generateMockForecasts(historicalData: HistoricalMetrics[], forecastDays: number): MetricForecast[] {
  const latestData = historicalData[historicalData.length - 1];
  const today = new Date();
  
  // Helper function to generate forecast points
  const generatePoints = (
    baseValue: number, 
    growthRate: number, 
    volatility: number
  ): ForecastPoint[] => {
    const points: ForecastPoint[] = [];
    let currentValue = baseValue;
    
    for (let i = 1; i <= forecastDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      
      // Apply growth and random daily variation
      const dailyVariation = 1 + ((Math.random() * 2 - 1) * volatility);
      currentValue = currentValue * (1 + (growthRate / 100)) * dailyVariation;
      
      // Weekend boost (Saturday/Sunday)
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentValue *= 1.1;
      }
      
      // Calculate confidence bounds (wider as we go further into the future)
      const boundWidth = baseValue * (0.02 + (i / forecastDays * 0.08)); // 2% to 10% bound
      
      points.push({
        period: dateString,
        value: Math.floor(currentValue),
        lowerBound: Math.floor(currentValue - boundWidth),
        upperBound: Math.floor(currentValue + boundWidth)
      });
    }
    
    return points;
  };
  
  // Generate forecasts for each metric
  return [
    {
      metric: "views",
      description: "Daily video views",
      currentValue: latestData.views,
      forecastedGrowth: 15.8,
      confidenceScore: 82,
      forecastPoints: generatePoints(latestData.views, 0.5, 0.15),
      insights: [
        "Weekend days consistently show 20-30% higher view counts",
        "New video uploads create a 2-3 day boost in overall views",
        "View retention is improving, with viewers watching more videos per session"
      ],
      recommendations: [
        "Upload content on Thursdays to maximize weekend view potential",
        "Create more content in your highest-performing topic cluster",
        "Increase video production frequency to capitalize on growing viewership"
      ]
    },
    {
      metric: "subscribers",
      description: "Total channel subscribers",
      currentValue: latestData.subscribers,
      forecastedGrowth: 8.3,
      confidenceScore: 91,
      forecastPoints: generatePoints(latestData.subscribers, 0.3, 0.05),
      insights: [
        "Subscriber conversion rate has improved by 12% in the last 30 days",
        "Videos on technical tutorials drive 2.5x more subscriptions than other content",
        "50% of new subscribers engage with at least 3 videos within their first week"
      ],
      recommendations: [
        "Add stronger CTAs for subscription at optimal points (0:30, 2:15, end)",
        "Create a 'start here' series for new subscribers to improve retention",
        "Focus on tutorial content which drives higher subscription rates"
      ]
    },
    {
      metric: "engagementRate",
      description: "Average engagement rate (likes, comments, shares)",
      currentValue: latestData.engagementRate,
      forecastedGrowth: 5.2,
      confidenceScore: 78,
      forecastPoints: generatePoints(latestData.engagementRate, 0.2, 0.1),
      insights: [
        "Question-based content receives 40% more comments than statement-based content",
        "Community posts that link to videos boost engagement by 35%",
        "Videos under 12 minutes receive 25% higher engagement rates than longer content"
      ],
      recommendations: [
        "Include specific questions for viewers to answer in comments",
        "Optimize first 30 seconds to include a strong engagement hook",
        "Respond to top comments within 6 hours to boost engagement algorithm signals"
      ]
    },
    {
      metric: "watchTime",
      description: "Total watch time in minutes",
      currentValue: latestData.watchTime,
      forecastedGrowth: 18.5,
      confidenceScore: 85,
      forecastPoints: generatePoints(latestData.watchTime, 0.6, 0.12),
      insights: [
        "Viewers watch 40% more content when videos are released in thematic series",
        "Tutorial content has 62% higher average watch time than entertainment content",
        "Videos with timestamps in description have 28% better retention"
      ],
      recommendations: [
        "Create more multi-part content series to increase session duration",
        "Add detailed timestamps to all videos over 8 minutes",
        "Optimize pacing in the 3-5 minute mark where most drop-offs occur"
      ]
    }
  ];
} 