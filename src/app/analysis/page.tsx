'use client';

import { useState, useEffect, useCallback } from 'react';
import Loading from '@/components/Loading';
import { TimePeriod } from '@/lib/youtube-scraper';
import dynamic from 'next/dynamic';

// Dynamically import the NetworkGraph component with no SSR to avoid vis-network issues
const NetworkGraph = dynamic(
  () => import('./components/NetworkGraph'),
  { ssr: false }
);

interface KeywordData {
  keyword: string;
  count: number;
  videos: number;
  niche: string;
}

interface ClusterData {
  id: string;
  label: string;
  size: number;
  color: string;
  group: number;
}

interface EdgeData {
  from: string;
  to: string;
  width: number;
  value: number;
}

export default function AnalysisPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [clusters, setClusters] = useState<{nodes: ClusterData[], edges: EdgeData[]}>({
    nodes: [],
    edges: []
  });
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'keywords' | 'clusters'>('keywords');
  
  // Time period options
  const timePeriods: { value: TimePeriod; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];
  
  const fetchKeywordData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would be replaced with a real API endpoint for keyword analysis
      const response = await fetch(`/api/keywords?timePeriod=${timePeriod}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch keyword data');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error fetching keyword data');
      }
      
      setKeywords(data.keywords || []);
      setClusters(data.clusters || { nodes: [], edges: [] });
    } catch (error) {
      console.error('Error fetching keyword data:', error);
      setError(error instanceof Error ? error.message : String(error));
      // Set empty data
      setKeywords([]);
      setClusters({ nodes: [], edges: [] });
    } finally {
      setIsLoading(false);
    }
  }, [timePeriod]);
  
  useEffect(() => {
    fetchKeywordData();
  }, [fetchKeywordData]);
  
  // Generate placeholder data for development/preview
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Placeholder keywords data
      const placeholderKeywords: KeywordData[] = [
        { keyword: 'tutorial', count: 156, videos: 42, niche: 'education' },
        { keyword: 'react', count: 98, videos: 37, niche: 'programming' },
        { keyword: 'javascript', count: 85, videos: 31, niche: 'programming' },
        { keyword: 'gaming', count: 142, videos: 45, niche: 'gaming' },
        { keyword: 'minecraft', count: 87, videos: 32, niche: 'gaming' },
        { keyword: 'review', count: 112, videos: 56, niche: 'technology' },
        { keyword: 'unboxing', count: 78, videos: 29, niche: 'technology' },
        { keyword: 'iphone', count: 64, videos: 23, niche: 'technology' },
        { keyword: 'vlog', count: 92, videos: 48, niche: 'lifestyle' },
        { keyword: 'makeup', count: 83, videos: 38, niche: 'beauty' },
        { keyword: 'workout', count: 71, videos: 27, niche: 'fitness' },
        { keyword: 'recipe', count: 59, videos: 31, niche: 'food' },
        { keyword: 'challenge', count: 103, videos: 42, niche: 'entertainment' },
        { keyword: 'shorts', count: 132, videos: 84, niche: 'entertainment' },
      ];
      
      // Placeholder cluster data
      const placeholderNodes: ClusterData[] = [
        // Group 1: Gaming Content
        { id: '1', label: 'gaming', size: 35, color: '#ff5722', group: 1 },
        { id: '2', label: 'minecraft', size: 28, color: '#ff5722', group: 1 },
        { id: '3', label: 'fortnite', size: 25, color: '#ff5722', group: 1 },
        { id: '4', label: 'valorant', size: 22, color: '#ff5722', group: 1 },
        { id: '5', label: 'gameplay', size: 20, color: '#ff5722', group: 1 },
        { id: '6', label: 'esports', size: 18, color: '#ff5722', group: 1 },
        { id: '7', label: 'streaming', size: 24, color: '#ff5722', group: 1 },
        
        // Group 2: Tutorial/Education
        { id: '8', label: 'tutorial', size: 30, color: '#2196f3', group: 2 },
        { id: '9', label: 'howto', size: 24, color: '#2196f3', group: 2 },
        { id: '10', label: 'learn', size: 22, color: '#2196f3', group: 2 },
        { id: '11', label: 'education', size: 20, color: '#2196f3', group: 2 },
        { id: '12', label: 'course', size: 18, color: '#2196f3', group: 2 },
        { id: '13', label: 'skills', size: 16, color: '#2196f3', group: 2 },
        
        // Group 3: Programming/Development
        { id: '14', label: 'programming', size: 28, color: '#4caf50', group: 3 },
        { id: '15', label: 'javascript', size: 26, color: '#4caf50', group: 3 },
        { id: '16', label: 'react', size: 24, color: '#4caf50', group: 3 },
        { id: '17', label: 'webdev', size: 22, color: '#4caf50', group: 3 },
        { id: '18', label: 'nodejs', size: 20, color: '#4caf50', group: 3 },
        { id: '19', label: 'python', size: 25, color: '#4caf50', group: 3 },
        { id: '20', label: 'coding', size: 23, color: '#4caf50', group: 3 },
        
        // Group 4: Tech Reviews
        { id: '21', label: 'review', size: 30, color: '#9c27b0', group: 4 },
        { id: '22', label: 'unboxing', size: 25, color: '#9c27b0', group: 4 },
        { id: '23', label: 'tech', size: 28, color: '#9c27b0', group: 4 },
        { id: '24', label: 'smartphone', size: 24, color: '#9c27b0', group: 4 },
        { id: '25', label: 'iphone', size: 26, color: '#9c27b0', group: 4 },
        { id: '26', label: 'samsung', size: 22, color: '#9c27b0', group: 4 },
        { id: '27', label: 'gadget', size: 20, color: '#9c27b0', group: 4 },
        
        // Group 5: Short Form Content
        { id: '28', label: 'shorts', size: 40, color: '#ffc107', group: 5 },
        { id: '29', label: 'tiktok', size: 32, color: '#ffc107', group: 5 },
        { id: '30', label: 'trending', size: 30, color: '#ffc107', group: 5 },
        { id: '31', label: 'viral', size: 28, color: '#ffc107', group: 5 },
        { id: '32', label: 'challenge', size: 26, color: '#ffc107', group: 5 },
        { id: '33', label: 'reels', size: 24, color: '#ffc107', group: 5 },
        
        // Group 6: Entertainment
        { id: '34', label: 'vlog', size: 28, color: '#03a9f4', group: 6 },
        { id: '35', label: 'comedy', size: 26, color: '#03a9f4', group: 6 },
        { id: '36', label: 'reaction', size: 24, color: '#03a9f4', group: 6 },
        { id: '37', label: 'prank', size: 20, color: '#03a9f4', group: 6 },
        { id: '38', label: 'podcast', size: 22, color: '#03a9f4', group: 6 }
      ];
      
      const placeholderEdges: EdgeData[] = [
        // Gaming cluster connections
        { from: '1', to: '2', width: 5, value: 8 },
        { from: '1', to: '3', width: 4, value: 7 },
        { from: '1', to: '4', width: 4, value: 6 },
        { from: '1', to: '5', width: 5, value: 8 },
        { from: '1', to: '6', width: 3, value: 5 },
        { from: '1', to: '7', width: 5, value: 7 },
        { from: '2', to: '5', width: 4, value: 6 },
        { from: '3', to: '5', width: 3, value: 5 },
        { from: '4', to: '5', width: 3, value: 5 },
        { from: '6', to: '7', width: 4, value: 6 },
        
        // Tutorial/Education cluster connections
        { from: '8', to: '9', width: 5, value: 8 },
        { from: '8', to: '10', width: 4, value: 7 },
        { from: '8', to: '11', width: 4, value: 6 },
        { from: '8', to: '12', width: 3, value: 5 },
        { from: '8', to: '13', width: 3, value: 5 },
        { from: '9', to: '10', width: 3, value: 5 },
        { from: '11', to: '12', width: 4, value: 6 },
        { from: '12', to: '13', width: 3, value: 5 },
        
        // Programming/Development cluster connections
        { from: '14', to: '15', width: 5, value: 8 },
        { from: '14', to: '16', width: 4, value: 7 },
        { from: '14', to: '17', width: 5, value: 8 },
        { from: '14', to: '19', width: 4, value: 7 },
        { from: '14', to: '20', width: 5, value: 8 },
        { from: '15', to: '16', width: 5, value: 8 },
        { from: '15', to: '17', width: 4, value: 7 },
        { from: '15', to: '18', width: 5, value: 8 },
        { from: '16', to: '17', width: 4, value: 7 },
        { from: '16', to: '18', width: 3, value: 5 },
        { from: '19', to: '20', width: 4, value: 7 },
        
        // Tech Reviews cluster connections
        { from: '21', to: '22', width: 4, value: 7 },
        { from: '21', to: '23', width: 5, value: 8 },
        { from: '21', to: '24', width: 4, value: 7 },
        { from: '21', to: '25', width: 4, value: 7 },
        { from: '21', to: '26', width: 3, value: 6 },
        { from: '21', to: '27', width: 4, value: 7 },
        { from: '22', to: '23', width: 4, value: 7 },
        { from: '22', to: '27', width: 3, value: 6 },
        { from: '24', to: '25', width: 3, value: 6 },
        { from: '24', to: '26', width: 3, value: 6 },
        
        // Short Form Content cluster connections
        { from: '28', to: '29', width: 5, value: 8 },
        { from: '28', to: '30', width: 5, value: 8 },
        { from: '28', to: '31', width: 5, value: 8 },
        { from: '28', to: '32', width: 4, value: 7 },
        { from: '28', to: '33', width: 4, value: 7 },
        { from: '29', to: '30', width: 4, value: 7 },
        { from: '29', to: '33', width: 5, value: 8 },
        { from: '30', to: '31', width: 5, value: 8 },
        { from: '31', to: '32', width: 4, value: 7 },
        
        // Entertainment cluster connections
        { from: '34', to: '35', width: 3, value: 6 },
        { from: '34', to: '36', width: 2, value: 5 },
        { from: '34', to: '37', width: 2, value: 4 },
        { from: '34', to: '38', width: 3, value: 6 },
        { from: '35', to: '36', width: 3, value: 6 },
        { from: '35', to: '37', width: 4, value: 7 },
        
        // Inter-cluster connections (showing relationships between topic clusters)
        // Gaming to Shorts
        { from: '1', to: '28', width: 3, value: 5 },
        { from: '7', to: '28', width: 3, value: 5 },
        
        // Tech to Programming
        { from: '23', to: '14', width: 2, value: 4 },
        { from: '23', to: '19', width: 2, value: 4 },
        
        // Tutorial to Programming
        { from: '8', to: '14', width: 3, value: 6 },
        { from: '8', to: '20', width: 3, value: 6 },
        
        // Entertainment to Shorts
        { from: '35', to: '28', width: 3, value: 6 },
        { from: '37', to: '32', width: 3, value: 6 },
        
        // Tech to Shorts
        { from: '23', to: '28', width: 2, value: 4 },
        
        // Tutorial to Tech
        { from: '8', to: '21', width: 2, value: 5 }
      ];
      
      setKeywords(placeholderKeywords);
      setClusters({ nodes: placeholderNodes, edges: placeholderEdges });
      setIsLoading(false);
    }
  }, [timePeriod]);
  
  // Generate word cloud colors based on niches
  const getKeywordColor = (niche: string) => {
    const nicheColors: Record<string, string> = {
      'programming': '#4caf50',
      'gaming': '#ff5722',
      'technology': '#9c27b0',
      'education': '#2196f3',
      'entertainment': '#03a9f4',
      'lifestyle': '#607d8b',
      'beauty': '#e91e63',
      'fitness': '#8bc34a',
      'food': '#ff9800',
      'music': '#3f51b5',
      'news': '#607d8b',
      'sports': '#009688',
      'travel': '#cddc39',
      'fashion': '#ff4081',
    };
    
    return nicheColors[niche] || '#9e9e9e';
  };
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black relative pt-2">
      {/* Cyberpunk background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.03),transparent_80%)]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold cyberpunk-title">CONTENT ANALYSIS</h1>
          <p className="text-gray-400 mt-2">Discover trending keywords and topic clusters</p>
        </div>
        
        <div className="cyberpunk-panel p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => setTab('keywords')}
                className={`px-4 py-2 rounded-md ${
                  tab === 'keywords' 
                    ? 'bg-cyan-900/30 border border-cyan-500 text-cyan-300' 
                    : 'text-gray-400 hover:text-cyan-300 hover:bg-gray-800'
                }`}
              >
                Keywords
              </button>
              <button
                onClick={() => setTab('clusters')}
                className={`px-4 py-2 rounded-md ${
                  tab === 'clusters' 
                    ? 'bg-cyan-900/30 border border-cyan-500 text-cyan-300' 
                    : 'text-gray-400 hover:text-cyan-300 hover:bg-gray-800'
                }`}
              >
                Topic Clusters
              </button>
            </div>
            
            <div className="flex items-center">
              <label htmlFor="time-period" className="mr-2 text-sm text-gray-300">
                Time Period:
              </label>
              <select
                id="time-period"
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
                className="cyberpunk-input pl-3 pr-10 py-2 text-base rounded-md"
              >
                {timePeriods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {isLoading ? (
            <Loading />
          ) : error ? (
            <div className="p-4 rounded-md bg-red-900/30 border border-red-700 text-red-400">
              <p>{error}</p>
              <button
                onClick={fetchKeywordData}
                className="mt-2 underline text-red-400 hover:text-red-300"
              >
                Try again
              </button>
            </div>
          ) : tab === 'keywords' ? (
            <div>
              <h2 className="text-xl mb-4 font-semibold text-cyan-400">Trending Keywords</h2>
              
              {/* Word Cloud Visualization (simplified representation) */}
              <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-md mb-6">
                <div className="flex flex-wrap justify-center">
                  {keywords.map((keyword) => (
                    <div 
                      key={keyword.keyword}
                      className="m-2 px-3 py-1 rounded-md transition-all duration-200 hover:scale-110"
                      style={{
                        backgroundColor: `${getKeywordColor(keyword.niche)}20`,
                        borderColor: getKeywordColor(keyword.niche),
                        color: getKeywordColor(keyword.niche),
                        fontSize: `${Math.max(0.8, Math.min(2, 0.8 + (keyword.count / 50)))}rem`,
                        border: `1px solid ${getKeywordColor(keyword.niche)}`,
                      }}
                    >
                      {keyword.keyword}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Top Keywords Table */}
              <h3 className="text-lg mb-3 font-medium text-cyan-300">Top Keywords</h3>
              <div className="overflow-x-auto">
                <table className="cyberpunk-table w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Keyword</th>
                      <th className="px-4 py-2 text-left">Niche</th>
                      <th className="px-4 py-2 text-center">Appearances</th>
                      <th className="px-4 py-2 text-center">Videos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywords.slice(0, 10).map((keyword) => (
                      <tr key={keyword.keyword}>
                        <td className="px-4 py-2 font-medium text-cyan-300">{keyword.keyword}</td>
                        <td className="px-4 py-2">
                          <span 
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              backgroundColor: `${getKeywordColor(keyword.niche)}20`,
                              color: getKeywordColor(keyword.niche),
                              border: `1px solid ${getKeywordColor(keyword.niche)}`,
                            }}
                          >
                            {keyword.niche}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-center">{keyword.count}</td>
                        <td className="px-4 py-2 text-center">{keyword.videos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xl mb-4 font-semibold text-cyan-400">Topic Clusters</h2>
              
              {/* Network Graph Visualization */}
              <div className="bg-gray-900/50 border border-gray-800 p-6 rounded-md mb-6 h-[500px]">
                {clusters.nodes.length > 0 && clusters.edges.length > 0 ? (
                  <NetworkGraph nodes={clusters.nodes} edges={clusters.edges} />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400">
                      No topic cluster data available for the selected time period
                    </p>
                  </div>
                )}
              </div>
              
              <p className="text-gray-400 mb-4">
                Topic clusters show how keywords are related to each other based on co-occurrence in video titles and descriptions. 
                The size of each node represents how frequently that topic appears, and the connections between nodes 
                show how strongly topics are related.
              </p>
              
              {/* Topic Cluster Groups */}
              <h3 className="text-lg mb-3 font-medium text-cyan-300">Main Topic Groups</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...new Set(clusters.nodes.map(node => node.group))].map(group => {
                  const groupNodes = clusters.nodes.filter(node => node.group === group);
                  const sampleNode = groupNodes[0];
                  
                  return (
                    <div 
                      key={group}
                      className="p-4 rounded-md border"
                      style={{
                        backgroundColor: `${sampleNode?.color}10`,
                        borderColor: sampleNode?.color,
                      }}
                    >
                      <h4 className="font-medium mb-2" style={{ color: sampleNode?.color }}>
                        Group #{group}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {groupNodes.map(node => (
                          <span 
                            key={node.id}
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              backgroundColor: `${node.color}20`,
                              color: node.color,
                              border: `1px solid ${node.color}`,
                              fontSize: `${Math.max(0.7, Math.min(1, 0.7 + (node.size / 30)))}rem`,
                            }}
                          >
                            {node.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 