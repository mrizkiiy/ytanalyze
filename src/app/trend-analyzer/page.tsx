'use client'

import { useState } from 'react';
import SuccessFactors from '@/components/SuccessFactors';
import AudienceInsights from '@/components/AudienceInsights';
import ContentSuggestions from '@/components/ContentSuggestions';
import Loading from '@/components/Loading';

// Common country codes (same as in google-trends page)
const REGIONS = [
  { code: 'GLOBAL', name: 'Global' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IN', name: 'India' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'KR', name: 'South Korea' },
  { code: 'RU', name: 'Russia' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
];

type SortField = 'rank' | 'keyword' | 'region';
type SortDirection = 'asc' | 'desc';

export default function TrendAnalyzerPage() {
  const [keyword, setKeyword] = useState<string>('');
  const [timePeriod, setTimePeriod] = useState<'today' | '7days' | '30days'>('30days');
  const [region, setRegion] = useState<string>('GLOBAL');
  const [loading, setLoading] = useState<boolean>(false);
  const [analyzed, setAnalyzed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const analyzeKeyword = async () => {
    if (!keyword.trim()) {
      setError('Please enter a keyword to analyze');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // First, fetch trends data to validate our keyword is relevant
      const response = await fetch(`/api/google-trends?timePeriod=${timePeriod}&region=${region}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Google Trends');
      }
      
      // Store the trends data
      if (data.data) {
        setTrends(data.data);
        // Reset sort to default when new data loads
        setSortField('rank');
        setSortDirection('asc');
      }
      
      // Indicate analysis is complete
      setAnalyzed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error analyzing trends:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If new field, set it and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortDirection === 'asc' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getSortedTrends = () => {
    if (!trends || trends.length === 0) return [];
    
    return [...trends].sort((a, b) => {
      let comparison = 0;
      
      // Handle different field types
      if (sortField === 'rank') {
        comparison = a.rank - b.rank;
      } else if (sortField === 'keyword') {
        comparison = a.keyword.localeCompare(b.keyword);
      } else if (sortField === 'region') {
        comparison = a.region.localeCompare(b.region);
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="cyberpunk-header mb-6">
        <h1 className="text-3xl font-bold text-cyan-400">YouTube Trend Analyzer</h1>
        <p className="text-gray-400 mt-2">
          Get deep insights and content suggestions based on YouTube trends
        </p>
      </div>
      
      {/* Search and Filter Controls */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-grow">
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-400 mb-1">Keyword to Analyze</label>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter a keyword or topic..."
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          
          <div>
            <label htmlFor="timePeriod" className="block text-sm font-medium text-gray-400 mb-1">Time Period</label>
            <select
              id="timePeriod"
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as 'today' | '7days' | '30days')}
              className="bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="today">Today</option>
              <option value="7days">Past 7 Days</option>
              <option value="30days">Past 30 Days</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="region" className="block text-sm font-medium text-gray-400 mb-1">Region</label>
            <select
              id="region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-md px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {REGIONS.map((region) => (
                <option key={region.code} value={region.code}>
                  {region.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="self-end">
            <button
              onClick={analyzeKeyword}
              disabled={loading || !keyword.trim()}
              className="w-full md:w-auto cyberpunk-button bg-cyan-700 hover:bg-cyan-600 text-white px-6 py-2 rounded flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mt-4 text-red-400 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="flex justify-center py-12">
          <Loading />
        </div>
      ) : analyzed ? (
        <div className="space-y-6">
          {/* Trending Topics */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-cyan-400 font-bold">Related Trending Topics</h2>
              
              <div className="flex space-x-2">
                <button 
                  onClick={() => handleSort('rank')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-sm ${sortField === 'rank' ? 'bg-gray-800 text-cyan-400' : 'text-gray-400 hover:bg-gray-800/50'}`}
                >
                  <span>Rank</span>
                  {getSortIcon('rank')}
                </button>
                <button 
                  onClick={() => handleSort('keyword')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-sm ${sortField === 'keyword' ? 'bg-gray-800 text-cyan-400' : 'text-gray-400 hover:bg-gray-800/50'}`}
                >
                  <span>Keyword</span>
                  {getSortIcon('keyword')}
                </button>
                <button 
                  onClick={() => handleSort('region')}
                  className={`flex items-center space-x-1 px-3 py-1 rounded text-sm ${sortField === 'region' ? 'bg-gray-800 text-cyan-400' : 'text-gray-400 hover:bg-gray-800/50'}`}
                >
                  <span>Region</span>
                  {getSortIcon('region')}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {getSortedTrends().slice(0, 10).map((trend, index) => (
                <div 
                  key={index} 
                  className="bg-gray-800/70 border border-gray-700 rounded-md p-3 hover:border-cyan-700 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-cyan-900/70 text-cyan-400 text-xs font-mono">
                      {trend.rank}
                    </div>
                    <span className="text-sm font-medium text-white truncate">{trend.keyword}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {trend.region !== 'GLOBAL' ? `Region: ${trend.region}` : 'Global'}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Success Factors */}
          <SuccessFactors keyword={keyword} factors={[]} />
          
          {/* Audience Insights */}
          <AudienceInsights keyword={keyword} />
          
          {/* Content Suggestions */}
          <ContentSuggestions keyword={keyword} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
          </svg>
          <h2 className="text-xl text-gray-300 mb-2">Enter a keyword to analyze YouTube trends</h2>
          <p className="text-gray-500 max-w-md">
            Get detailed success factors, audience insights, and content suggestions
            based on trending YouTube search data.
          </p>
        </div>
      )}
    </div>
  );
} 