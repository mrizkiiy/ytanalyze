import { NextResponse } from 'next/server';

// YouTube search suggestions URL
const YOUTUBE_SUGGEST_URL = 'https://suggestqueries.google.com/complete/search';

// Function to generate realistic search volume estimates
const generateSearchVolume = (keyword: string): number => {
  // Base volume depends on keyword length - shorter keywords tend to have higher volume
  const baseVolume = Math.max(10000, 1000000 / (keyword.length * 0.7));
  
  // Add randomness
  const randomFactor = 0.3 + Math.random() * 1.4;
  
  // Popular terms get a boost
  const popularTerms = ['how to', 'tutorial', 'review', 'best', '2024', 'guide', 'free'];
  const popularBoost = popularTerms.some(term => keyword.includes(term)) ? 1.5 : 1;
  
  // Calculate and round to a realistic number
  let volume = Math.round(baseVolume * randomFactor * popularBoost / 100) * 100;
  
  // Very high-traffic keywords
  if (keyword.length < 10 && Math.random() > 0.8) {
    volume *= 2.5;
  }
  
  return volume;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json(
      { success: false, error: 'Search query is required' },
      { status: 400 }
    );
  }
  
  try {
    // Fetch suggestions from YouTube's suggestion API
    const response = await fetch(
      `${YOUTUBE_SUGGEST_URL}?client=youtube&ds=yt&q=${encodeURIComponent(query)}`,
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );
    
    if (!response.ok) {
      throw new Error(`YouTube API returned ${response.status}`);
    }
    
    const data = await response.text();
    
    // The response is in JSONP format, we need to extract the JSON part
    const jsonData = JSON.parse(data.substring(data.indexOf('(') + 1, data.lastIndexOf(')')));
    
    // Define the type for the YouTube suggestion item
    interface YouTubeSuggestion {
      0: string; // The suggestion keyword
      1: string; // Optional additional data
    }
    
    // Extract the suggestion strings and add search volume
    const suggestions = jsonData[1].map((item: YouTubeSuggestion) => {
      const keyword = item[0];
      return {
        keyword,
        searchVolume: generateSearchVolume(keyword),
        competition: Math.random() * 100 < 40 ? 'Low' : Math.random() * 100 < 75 ? 'Medium' : 'High'
      };
    });
    
    return NextResponse.json({
      success: true,
      query,
      suggestions
    });
  } catch (error) {
    console.error('Error fetching YouTube search suggestions:', error);
    
    // Return mock data in case of error
    const mockSuggestions = [
      `${query} tutorial`,
      `${query} review`,
      `${query} tips`,
      `${query} 2024`,
      `how to ${query}`,
      `best ${query}`,
      `${query} for beginners`
    ].map(keyword => ({
      keyword,
      searchVolume: generateSearchVolume(keyword),
      competition: Math.random() * 100 < 40 ? 'Low' : Math.random() * 100 < 75 ? 'Medium' : 'High'
    }));
    
    return NextResponse.json({
      success: true,
      query,
      suggestions: mockSuggestions,
      isMock: true
    });
  }
} 