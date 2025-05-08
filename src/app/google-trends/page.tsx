'use client'

import { useState, useEffect } from 'react'
import Loading from '@/components/Loading'

interface GoogleTrend {
  id: string
  keyword: string
  rank: number
  timePeriod: 'today' | '7days' | '30days'
  region?: string
  scrapedAt: string
}

interface TrendsStats {
  source?: string
  count: number
  duplicatesRemoved?: number
  message?: string
}

// Common country codes
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

export default function GoogleTrendsPage() {
  const [trends, setTrends] = useState<GoogleTrend[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'today' | '7days' | '30days'>('30days')
  const [region, setRegion] = useState<string>('GLOBAL')
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [dataLoaded, setDataLoaded] = useState<boolean>(false)
  const [stats, setStats] = useState<TrendsStats | null>(null)

  // Function to fetch trends data
  const fetchTrends = async (
    timePeriod: 'today' | '7days' | '30days' = '30days', 
    region: string = 'GLOBAL',
    force: boolean = false
  ) => {
    setLoading(true)
    setError(null)
    setStats(null)
    
    try {
      let url = `/api/google-trends?timePeriod=${timePeriod}&region=${region}`
      let method = 'GET'
      
      // If force refresh, use POST method
      if (force) {
        url = `/api/google-trends`
        method = 'POST'
      }
      
      const response = await fetch(
        url, 
        { 
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: force ? JSON.stringify({ timePeriod, region }) : undefined
        }
      )
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Google Trends')
      }
      
      if (!data.data || data.data.length === 0) {
        setTrends([])
        setError('No trending data available for the selected time period and region')
      } else {
        setTrends(data.data)
        const latestDate = new Date(data.data[0]?.scrapedAt || new Date())
        setLastUpdated(latestDate.toLocaleString())
        setDataLoaded(true)
        
        // Set stats from response
        setStats({
          source: data.source || 'unknown',
          count: data.count || data.data.length,
          duplicatesRemoved: data.saveResult?.duplicatesRemoved,
          message: data.message
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Error fetching Google Trends:', err)
    } finally {
      setLoading(false)
    }
  }

  // No initial automatic data fetch
  // useEffect(() => {
  //   fetchTrends(activeTab, region)
  // }, [activeTab, region])

  // Handle tab change - only change the tab state, don't fetch data
  const handleTabChange = (tab: 'today' | '7days' | '30days') => {
    setActiveTab(tab)
    // Reset data loaded flag when changing tabs
    if (dataLoaded) {
      setDataLoaded(false)
      setTrends([])
      setStats(null)
    }
  }

  // Handle region change - only change the region state, don't fetch data
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRegion(e.target.value)
    // Reset data loaded flag when changing region
    if (dataLoaded) {
      setDataLoaded(false) 
      setTrends([])
      setStats(null)
    }
  }

  // Handle fetch button click
  const handleFetchData = () => {
    fetchTrends(activeTab, region)
  }

  // Handle manual refresh - force refresh data
  const handleRefresh = () => {
    fetchTrends(activeTab, region, true)
  }

  // Open YouTube search for the trend
  const openYouTubeSearch = (keyword: string) => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`, '_blank')
  }

  return (
    <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 max-w-7xl">
      <div className="cyberpunk-header mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-cyan-400">YouTube Google Trends</h1>
          
          <div className="space-x-2">
            {dataLoaded && (
              <button 
                onClick={handleRefresh} 
                disabled={loading}
                className="cyberpunk-button flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh Data</span>
              </button>
            )}
          </div>
        </div>
        
        <p className="text-gray-400 mt-2">
          Trending search topics on YouTube worldwide
        </p>
        
        <div className="flex flex-wrap items-center mt-1 text-sm text-gray-500 gap-2">
          {lastUpdated && (
            <span>Last updated: {lastUpdated}</span>
          )}
          
          {stats && stats.source && (
            <span className="bg-gray-800 text-cyan-300 rounded-full px-2 py-0.5 text-xs">
              Source: {stats.source}
            </span>
          )}
          
          {stats && typeof stats.duplicatesRemoved === 'number' && stats.duplicatesRemoved > 0 && (
            <span className="bg-gray-800 text-yellow-300 rounded-full px-2 py-0.5 text-xs">
              {stats.duplicatesRemoved} duplicates removed
            </span>
          )}
        </div>
      </div>
      
      <div className="flex flex-wrap mb-4 space-x-0 md:space-x-4 items-center">
        <div className="cyberpunk-tabs border-b border-cyan-800 mb-4 md:mb-0">
          <div className="flex">
            <button
              onClick={() => handleTabChange('today')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'today'
                  ? 'bg-gray-800 text-cyan-400 border-t border-l border-r border-cyan-700'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-cyan-300'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleTabChange('7days')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === '7days'
                  ? 'bg-gray-800 text-cyan-400 border-t border-l border-r border-cyan-700'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-cyan-300'
              }`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => handleTabChange('30days')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === '30days'
                  ? 'bg-gray-800 text-cyan-400 border-t border-l border-r border-cyan-700'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-cyan-300'
              }`}
            >
              Past 30 Days
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={region}
            onChange={handleRegionChange}
            className="cyberpunk-select bg-gray-800 text-cyan-300 border border-cyan-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {REGIONS.map((region) => (
              <option key={region.code} value={region.code}>
                {region.name}
              </option>
            ))}
          </select>
          
          <button 
            onClick={handleFetchData} 
            disabled={loading}
            className="cyberpunk-button bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded flex items-center space-x-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Fetch Trends</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="cyberpunk-panel mb-6 overflow-hidden">
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loading />
            </div>
          ) : error ? (
            <div className="cyberpunk-alert bg-red-900/30 border border-red-700 p-4 rounded">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h3 className="text-lg font-medium text-red-300">Error</h3>
                  <p className="text-red-200">{error}</p>
                </div>
              </div>
            </div>
          ) : !dataLoaded ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xl text-gray-400">
                  Select your parameters and click "Fetch Trends" to load YouTube search trends
                </p>
              </div>
            </div>
          ) : trends.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xl cyberpunk-text-pulse">No trends found. Try refreshing or selecting a different time period or region.</p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-bold text-cyan-400 mb-4">
                {activeTab === 'today' ? 'Today' : 
                 activeTab === '7days' ? 'Past 7 Days' : 'Past 30 Days'} - Trending YouTube Search Topics
                {region !== 'GLOBAL' && ` in ${REGIONS.find(r => r.code === region)?.name || region}`}
              </h2>
              
              {stats && stats.message && (
                <div className="mb-4 p-2 bg-gray-800/50 border border-cyan-800/30 rounded text-yellow-300 text-sm">
                  {stats.message}
                </div>
              )}
              
              <div className="space-y-3">
                {trends.map((trend) => (
                  <div 
                    key={trend.id}
                    className="cyberpunk-card flex items-center justify-between p-3 bg-gray-800/50 border border-cyan-800/30 rounded hover:bg-cyan-900/20 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-cyan-900/50 border border-cyan-700 text-cyan-400 font-mono">
                        {trend.rank}
                      </div>
                      <span className="font-medium text-white">{trend.keyword}</span>
                    </div>
                    <button 
                      onClick={() => openYouTubeSearch(trend.keyword)}
                      className="cyberpunk-button-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Search
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 