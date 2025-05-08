/**
 * Gemini API Service for AI Predictions
 * 
 * This module provides functions to generate AI predictions using Google's Gemini API.
 * It's used to analyze YouTube video data and generate content insights.
 */

const GEMINI_API_KEY = 'AIzaSyBT1eMy7M9BOA6Z7AgfkM4HshVgQgm5ETE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface VideoData {
  title: string;
  channel?: string;
  views?: number;
  growthRate?: number;
  growthPercentage?: number;
  niche?: string;
  velocity?: 'slow' | 'normal' | 'fast' | 'viral';
}

export interface AIPrediction {
  successFactors: string[];
  contentSuggestions: string[];
  audienceInsights: string[];
  keywordRecommendations: string[];
  growthPotential: number; // 1-100 scale
  predictedViews: string;
}

/**
 * Generate AI predictions for a collection of videos
 * @param videos Array of video data to analyze
 * @returns AI predictions about the videos' success factors and recommendations
 */
export async function generatePredictionsFromVideos(videos: VideoData[]): Promise<AIPrediction> {
  try {
    const prompt = createPromptFromVideos(videos);
    const prediction = await callGeminiAPI(prompt);
    return parsePredictionResponse(prediction);
  } catch (error) {
    console.error('Error generating AI predictions:', error);
    throw new Error('Failed to generate AI predictions');
  }
}

/**
 * Create an analysis prompt based on viral/fast-growing videos
 */
function createPromptFromVideos(videos: VideoData[]): string {
  // Extract video titles and niches
  const titles = videos.map(v => v.title).join('\n- ');
  const niches = [...new Set(videos.map(v => v.niche).filter(Boolean))].join(', ');
  
  return `You are an expert YouTube content analyzer. I want you to analyze these viral/fast-growing videos and provide insights:

Videos:
- ${titles}

Niches: ${niches}

Based on these successful videos, please provide:
1. Key success factors (what made these videos successful)
2. Content suggestions (specific video ideas following similar patterns)
3. Audience insights (what audience these videos appeal to)
4. Keyword recommendations (10 specific keywords that could help new videos in this area)
5. Growth potential score (1-100) for this content area
6. Predicted view range for new videos in this area if they follow your recommendations

Provide the response in JSON format with these keys: successFactors, contentSuggestions, audienceInsights, keywordRecommendations, growthPotential, predictedViews.`;
}

/**
 * Call the Gemini API with the given prompt
 */
async function callGeminiAPI(prompt: string): Promise<string> {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error('Unexpected response format from Gemini API');
    }
    
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw new Error('Failed to get response from Gemini API');
  }
}

/**
 * Parse the text response from Gemini into a structured prediction object
 */
function parsePredictionResponse(responseText: string): AIPrediction {
  try {
    // First clean up the response to find any JSON
    let cleanedResponse = responseText;
    const jsonStartIndex = responseText.indexOf('{');
    const jsonEndIndex = responseText.lastIndexOf('}');
    
    if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
      cleanedResponse = responseText.substring(jsonStartIndex, jsonEndIndex + 1);
    }
    
    // Try to parse as JSON first
    try {
      const jsonResponse = JSON.parse(cleanedResponse);
      
      // Ensure all required fields exist with reasonable defaults
      return {
        successFactors: Array.isArray(jsonResponse.successFactors) ? jsonResponse.successFactors : 
          ['Engaging content', 'Trending topic', 'High-quality production', 'Strong audience connection'],
        contentSuggestions: Array.isArray(jsonResponse.contentSuggestions) ? jsonResponse.contentSuggestions : 
          ['Create similar content with unique angles', 'Build on trending topics in your niche', 'Use eye-catching thumbnails'],
        audienceInsights: Array.isArray(jsonResponse.audienceInsights) ? jsonResponse.audienceInsights : 
          ['Audience seeks valuable information', 'Viewers prefer concise content', 'Target demographic is interested in trending topics'],
        keywordRecommendations: Array.isArray(jsonResponse.keywordRecommendations) ? jsonResponse.keywordRecommendations : 
          ['trending', 'viral', 'how to', 'best', 'top', '2024', 'guide', 'tutorial', 'review', 'explained'],
        growthPotential: typeof jsonResponse.growthPotential === 'number' ? jsonResponse.growthPotential : 75,
        predictedViews: typeof jsonResponse.predictedViews === 'string' ? jsonResponse.predictedViews : '50,000 - 500,000 views',
      };
    } catch (e) {
      console.warn('Response not in valid JSON format, using fallback parsing');
      
      // If it's not valid JSON, try to extract structured data from the text
      const defaultPrediction: AIPrediction = {
        successFactors: extractListFromText(responseText, 'success factors', 'key success factors'),
        contentSuggestions: extractListFromText(responseText, 'content suggestions', 'video ideas'),
        audienceInsights: extractListFromText(responseText, 'audience insights', 'audience'),
        keywordRecommendations: extractListFromText(responseText, 'keyword recommendations', 'keywords'),
        growthPotential: extractGrowthPotential(responseText),
        predictedViews: extractPredictedViews(responseText),
      };
      
      // Ensure we have at least some content for each field
      if (defaultPrediction.successFactors.length === 0) {
        defaultPrediction.successFactors = ['Engaging content', 'Trending topic', 'High-quality production', 'Strong audience connection'];
      }
      
      if (defaultPrediction.contentSuggestions.length === 0) {
        defaultPrediction.contentSuggestions = ['Create similar content with unique angles', 'Build on trending topics in your niche', 'Use eye-catching thumbnails'];
      }
      
      if (defaultPrediction.audienceInsights.length === 0) {
        defaultPrediction.audienceInsights = ['Audience seeks valuable information', 'Viewers prefer concise content', 'Target demographic is interested in trending topics'];
      }
      
      if (defaultPrediction.keywordRecommendations.length === 0) {
        defaultPrediction.keywordRecommendations = ['trending', 'viral', 'how to', 'best', 'top', '2024', 'guide', 'tutorial', 'review', 'explained'];
      }
      
      return defaultPrediction;
    }
  } catch (error) {
    console.error('Error parsing prediction response:', error);
    // Return default prediction if parsing fails
    return {
      successFactors: ['Engaging content', 'Trending topic', 'High-quality production', 'Strong audience connection'],
      contentSuggestions: ['Create similar content with unique angles', 'Build on trending topics in your niche', 'Use eye-catching thumbnails'],
      audienceInsights: ['Audience seeks valuable information', 'Viewers prefer concise content', 'Target demographic is interested in trending topics'],
      keywordRecommendations: ['trending', 'viral', 'how to', 'best', 'top', '2024', 'guide', 'tutorial', 'review', 'explained'],
      growthPotential: 75,
      predictedViews: '50,000 - 500,000 views',
    };
  }
}

/**
 * Extract a list of items from text using multiple possible section headers
 */
function extractListFromText(text: string, ...sectionNames: string[]): string[] {
  let extractedItems: string[] = [];
  
  // Try each possible section name
  for (const sectionName of sectionNames) {
    const items = findSectionItems(text, sectionName);
    if (items.length > 0) {
      extractedItems = items;
      break;
    }
  }
  
  return extractedItems;
}

/**
 * Find items in a section, handling both numbered lists and bullet points
 */
function findSectionItems(text: string, sectionName: string): string[] {
  try {
    const lowerText = text.toLowerCase();
    
    // Find the section
    const sectionIndex = lowerText.indexOf(sectionName.toLowerCase());
    if (sectionIndex === -1) return [];
    
    // Get text after section name until next section or end
    let sectionEnd = lowerText.length;
    const possibleEndMarkers = ['factors:', 'suggestions:', 'insights:', 'recommendations:', 'potential:', 'views:', 'content suggestions:', 'audience insights:', 'keyword recommendations:', 'growth potential:', 'predicted views:'];
    
    for (const marker of possibleEndMarkers) {
      if (marker === sectionName.toLowerCase()) continue;
      
      const markerIndex = lowerText.indexOf(marker, sectionIndex + sectionName.length);
      if (markerIndex !== -1 && markerIndex < sectionEnd) {
        sectionEnd = markerIndex;
      }
    }
    
    // Extract section content
    const sectionContent = text.substring(sectionIndex + sectionName.length, sectionEnd).trim();
    
    // Split into lines and clean up
    return sectionContent
      .split(/[\r\n]+/)
      .map(line => line.replace(/^[-*•\d]+\.?\s*/, '').trim())
      .filter(line => line.length > 0 && !possibleEndMarkers.some(marker => line.toLowerCase().includes(marker)));
  } catch (e) {
    console.error('Error parsing section:', sectionName, e);
    return [];
  }
}

/**
 * Extract growth potential score from text
 */
function extractGrowthPotential(text: string): number {
  try {
    const lowerText = text.toLowerCase();
    const potentialIndex = lowerText.indexOf('growth potential');
    
    if (potentialIndex === -1) return 75;
    
    // Look for a number after "growth potential"
    const afterPotential = text.substring(potentialIndex, potentialIndex + 100);
    const numberMatch = afterPotential.match(/\d+/);
    
    if (numberMatch) {
      const potential = parseInt(numberMatch[0], 10);
      // Ensure it's within 1-100 range
      return Math.max(1, Math.min(100, potential));
    }
    
    return 75;
  } catch (e) {
    return 75;
  }
}

/**
 * Extract predicted views from text
 */
function extractPredictedViews(text: string): string {
  try {
    const lowerText = text.toLowerCase();
    const viewsIndex = lowerText.indexOf('predicted views');
    
    if (viewsIndex === -1) return '50,000 - 500,000 views';
    
    // Extract the line containing predicted views
    const afterViews = text.substring(viewsIndex, viewsIndex + 200);
    const lineEnd = afterViews.indexOf('\n');
    const line = lineEnd !== -1 ? afterViews.substring(0, lineEnd).trim() : afterViews.trim();
    
    // Look for a pattern like "100,000 - 500,000" or similar
    const viewsMatch = line.match(/[\d,]+ ?[-–—] ?[\d,]+ ?(?:views?)?/i);
    if (viewsMatch) {
      return viewsMatch[0];
    }
    
    // Look for just numbers with commas in the line
    const numbersMatch = line.match(/[\d,]+/g);
    if (numbersMatch && numbersMatch.length > 0) {
      return numbersMatch.join(' - ') + ' views';
    }
    
    return '50,000 - 500,000 views';
  } catch (e) {
    return '50,000 - 500,000 views';
  }
} 