'use client';

import { useState, useEffect } from 'react';
import KeywordSuggestions from '@/components/KeywordSuggestions';

interface KeywordData {
  keyword: string;
  searchVolume?: number;
  competition?: 'Low' | 'Medium' | 'High';
}

export default function KeywordResearchPage() {
  const [selectedKeyword, setSelectedKeyword] = useState<KeywordData | null>(null);
  const [keywordHistory, setKeywordHistory] = useState<KeywordData[]>([]);
  const [savedKeywords, setSavedKeywords] = useState<KeywordData[]>([]);
  const [message, setMessage] = useState<string>('');
  
  const handleKeywordSelect = (keyword: string, searchVolume?: number, competition?: 'Low' | 'Medium' | 'High') => {
    const keywordData: KeywordData = { 
      keyword, 
      searchVolume, 
      competition 
    };
    
    setSelectedKeyword(keywordData);
    
    // Add to history if not already there
    if (!keywordHistory.some(k => k.keyword === keyword)) {
      setKeywordHistory(prev => [keywordData, ...prev].slice(0, 10)); // Keep only the 10 most recent
    }
  };
  
  // Clear the history
  const clearHistory = () => {
    setKeywordHistory([]);
  };
  
  // Save a keyword to the saved list
  const saveKeyword = async (keywordData: KeywordData) => {
    try {
      const response = await fetch('/api/keywords', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(keywordData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save keyword');
      }

      // Update local state
      if (!savedKeywords.some(k => k.keyword === keywordData.keyword)) {
        setSavedKeywords(prev => [keywordData, ...prev]);
      }
    } catch (error) {
      console.error('Error saving keyword:', error);
      // You might want to show an error message to the user here
    }
  };
  
  // Remove a keyword from saved list
  const removeSavedKeyword = async (keyword: string) => {
    try {
      const response = await fetch(`/api/keywords?keyword=${encodeURIComponent(keyword)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to remove keyword');
      }

      // Update local state
      setSavedKeywords(prev => prev.filter(k => k.keyword !== keyword));
    } catch (error) {
      console.error('Error removing keyword:', error);
      // You might want to show an error message to the user here
    }
  };
  
  // Load saved keywords on component mount
  useEffect(() => {
    const loadSavedKeywords = async () => {
      try {
        const response = await fetch('/api/keywords');
        const data = await response.json();

        if (response.ok && data.success) {
          setSavedKeywords(data.data || []);
        }
      } catch (error) {
        console.error('Error loading saved keywords:', error);
      }
    };

    loadSavedKeywords();
  }, []);
  
  // Format number with commas
  const formatNumber = (num?: number): string => {
    if (num === undefined) return 'Unknown';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  // Export saved keywords as CSV
  const exportSavedKeywords = () => {
    if (savedKeywords.length === 0) return;
    
    // Format as CSV: Keyword, Search Volume, Competition
    const keywordsText = savedKeywords
      .map(k => `${k.keyword},${k.searchVolume || 'Unknown'},${k.competition || 'Unknown'}`)
      .join('\n');
    
    // Add header row
    const csvContent = `Keyword,Search Volume,Competition\n${keywordsText}`;
    
    // Create a download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'saved-keywords.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  // Get competition color
  const getCompetitionColor = (competition?: string) => {
    if (!competition) return 'text-gray-400';
    switch (competition) {
      case 'Low': return 'text-green-400';
      case 'Medium': return 'text-yellow-400';
      case 'High': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  // Get competition badge color
  const getCompetitionBadgeColor = (competition?: string) => {
    if (!competition) return 'bg-gray-800 border-gray-700';
    switch (competition) {
      case 'Low': return 'bg-green-900/30 border-green-800';
      case 'Medium': return 'bg-yellow-900/30 border-yellow-800';
      case 'High': return 'bg-red-900/30 border-red-800';
      default: return 'bg-gray-800 border-gray-700';
    }
  };
  
  const copyKeyword = (keyword: string) => {
    // Try to use clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(keyword)
        .then(() => {
          // Show success message
          setMessage('Keyword copied!');
          setTimeout(() => setMessage(''), 2000);
        })
        .catch(() => {
          // Fallback to textarea method if clipboard API fails
          fallbackCopyToClipboard(keyword);
        });
    } else {
      // Use fallback method if clipboard API is not available
      fallbackCopyToClipboard(keyword);
    }
  };

  // Fallback method using a temporary textarea
  const fallbackCopyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Avoid scrolling to bottom
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setMessage('Keyword copied!');
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage('Failed to copy keyword');
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (err) {
      setMessage('Failed to copy keyword');
      setTimeout(() => setMessage(''), 2000);
    }
    
    document.body.removeChild(textArea);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black relative pt-2">
      {/* Cyberpunk background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.03),transparent_80%)]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold cyberpunk-title">YOUTUBE KEYWORD RESEARCH</h1>
          <p className="text-gray-400 mt-2">Discover trending and high-performing search terms for your content</p>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Keyword Search Panel */}
          <div className="lg:col-span-2">
            <div className="cyberpunk-panel p-6 mb-6">
              <h2 className="text-xl font-bold text-cyan-400 mb-4">Find Trending Keywords</h2>
              <p className="text-gray-400 mb-4">Enter a topic to get YouTube's most searched suggestions with volume data</p>
              
              <KeywordSuggestions
                placeholder="Start typing to see what people search for on YouTube..."
                onSelect={(keyword: string, searchVolume?: number, competition?: 'Low' | 'Medium' | 'High') => 
                  handleKeywordSelect(keyword, searchVolume, competition)}
                className="mb-16"
              />
              
              {selectedKeyword && (
                <div className="mt-6 p-5 bg-gray-900/50 border border-gray-800 rounded-md">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-lg text-cyan-300 mb-1">Selected Keyword:</div>
                      <div className="text-white text-xl font-semibold">{selectedKeyword.keyword}</div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      {selectedKeyword.searchVolume && (
                        <div className="text-cyan-300 font-mono text-lg">
                          {formatNumber(selectedKeyword.searchVolume)} <span className="text-gray-400 text-sm">monthly searches</span>
                        </div>
                      )}
                      
                      {selectedKeyword.competition && (
                        <div className={`px-2 py-1 rounded text-sm ${getCompetitionBadgeColor(selectedKeyword.competition)} ${getCompetitionColor(selectedKeyword.competition)} mt-1`}>
                          {selectedKeyword.competition} Competition
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={() => copyKeyword(selectedKeyword.keyword)}
                      className="px-3 py-1 bg-gray-800 text-cyan-300 rounded-md hover:bg-gray-700 text-sm flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Keyword
                    </button>
                    
                    <button
                      onClick={() => saveKeyword(selectedKeyword)}
                      className="px-3 py-1 bg-cyan-900/30 text-cyan-300 border border-cyan-800 rounded-md hover:bg-cyan-800/30 text-sm flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      Save Keyword
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                      <h3 className="text-cyan-400 font-medium mb-2">Title Optimization</h3>
                      <p className="text-gray-300">
                        Include "{selectedKeyword.keyword}" near the beginning of your title for maximum visibility.
                      </p>
                    </div>
                    
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                      <h3 className="text-cyan-400 font-medium mb-2">Description Tips</h3>
                      <p className="text-gray-300">
                        Use the keyword naturally in your first 2-3 sentences of description.
                      </p>
                    </div>
                    
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                      <h3 className="text-cyan-400 font-medium mb-2">Tags Strategy</h3>
                      <p className="text-gray-300">
                        Add "{selectedKeyword.keyword}" as a primary tag along with variations.
                      </p>
                    </div>
                    
                    <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                      <h3 className="text-cyan-400 font-medium mb-2">Content Focus</h3>
                      <p className="text-gray-300">
                        Say the keyword in the first 30 seconds of your video for retention.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Saved Keywords Panel */}
            {savedKeywords.length > 0 && (
              <div className="cyberpunk-panel p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-cyan-400">Saved Keywords</h2>
                  
                  <button
                    onClick={exportSavedKeywords}
                    className="text-xs px-3 py-1 bg-gray-800 text-cyan-300 rounded hover:bg-gray-700 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export as CSV
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="cyberpunk-table w-full">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left">Keyword</th>
                        <th className="px-4 py-2 text-center">Search Volume</th>
                        <th className="px-4 py-2 text-center">Competition</th>
                        <th className="px-4 py-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedKeywords.map((keyword, index) => (
                        <tr key={index} className="hover:bg-gray-800/30">
                          <td className="px-4 py-3 text-gray-300">{keyword.keyword}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-cyan-300 font-mono">
                              {formatNumber(keyword.searchVolume)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={getCompetitionColor(keyword.competition)}>
                              {keyword.competition || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => removeSavedKeyword(keyword.keyword)}
                              className="text-xs px-2 py-1 bg-red-900/30 border border-red-800 text-red-400 rounded hover:bg-red-800/30"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="cyberpunk-panel p-6">
              <h2 className="text-xl font-bold text-cyan-400 mb-4">Keyword Research Best Practices</h2>
              
              <div className="space-y-4 text-gray-300">
                <p>
                  Effective keyword research helps your videos rank higher in YouTube search results and suggested videos.
                  Here are some tips to maximize your keyword strategy:
                </p>
                
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <span className="font-medium text-cyan-300">Find long-tail keywords</span> - More specific phrases with less competition
                  </li>
                  <li>
                    <span className="font-medium text-cyan-300">Check search volume</span> - Balance between popular terms and competition
                  </li>
                  <li>
                    <span className="font-medium text-cyan-300">Analyze top-ranking videos</span> - Study how they use keywords in title, description, tags
                  </li>
                  <li>
                    <span className="font-medium text-cyan-300">Use keyword variations</span> - Include synonyms and related terms
                  </li>
                  <li>
                    <span className="font-medium text-cyan-300">Stay current with trends</span> - Regularly update your keyword research
                  </li>
                </ul>
                
                <p>
                  Remember that high-quality content that delivers on what the keyword promises is still the most important ranking factor.
                </p>
              </div>
            </div>
          </div>
          
          {/* Recent Searches Panel */}
          <div className="lg:col-span-1">
            <div className="cyberpunk-panel p-6 mb-6 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-cyan-400">Recent Searches</h2>
                
                {keywordHistory.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-gray-300"
                  >
                    Clear All
                  </button>
                )}
              </div>
              
              {keywordHistory.length > 0 ? (
                <div className="space-y-3">
                  {keywordHistory.map((keyword, index) => (
                    <div
                      key={index}
                      className="p-3 bg-gray-800 border border-gray-700 rounded-md hover:bg-gray-700 group"
                    >
                      <div className="flex justify-between mb-1">
                        <div 
                          className="text-cyan-300 cursor-pointer"
                          onClick={() => setSelectedKeyword(keyword)}
                        >
                          {keyword.keyword}
                        </div>
                        <button
                          onClick={() => saveKeyword(keyword)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-1.5 py-0.5 bg-cyan-900/30 text-cyan-300 rounded"
                        >
                          Save
                        </button>
                      </div>
                      
                      {keyword.searchVolume && (
                        <div className="text-xs text-gray-400">
                          <span className="text-cyan-300 font-mono">{formatNumber(keyword.searchVolume)}</span> searches • 
                          <span className={`ml-1 ${getCompetitionColor(keyword.competition)}`}>
                            {keyword.competition} competition
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500 italic border border-dashed border-gray-700 rounded-md p-6 text-center">
                  <svg 
                    className="w-10 h-10 mx-auto mb-2 text-gray-600" 
                    xmlns="http://www.w3.org/2000/svg" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <p>No recent searches</p>
                  <p className="text-xs mt-2">Your search history will appear here</p>
                </div>
              )}
              
              <div className="mt-6 bg-gray-900/60 p-4 rounded-md border border-cyan-900/50">
                <h3 className="text-cyan-400 font-medium mb-2">Pro Tip</h3>
                <p className="text-gray-400 text-sm">
                  Save your best performing keywords for quick reference and tracking. 
                  Compare search trends over time to identify seasonal opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 