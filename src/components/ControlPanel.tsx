import React, { useState, useEffect } from 'react';
import { TimePeriod } from '@/lib/youtube-scraper';
import CyberpunkAnimation from './CyberpunkAnimation';

interface ControlPanelProps {
  onRefresh: () => void;
  onScrape: () => Promise<void | boolean>;
  isScraping?: boolean;
  selectedTimePeriod?: TimePeriod;
  onTimePeriodChange?: (period: TimePeriod) => void;
}

export default function ControlPanel({ 
  onRefresh, 
  onScrape, 
  isScraping: externalIsScraping,
  selectedTimePeriod = 'all',
  onTimePeriodChange
}: ControlPanelProps) {
  const [internalIsScraping, setInternalIsScraping] = useState(false);
  const [isCustomScraping, setIsCustomScraping] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [message, setMessage] = useState('');
  const [showNicheConfig, setShowNicheConfig] = useState(false);
  const [currentNiches, setCurrentNiches] = useState<string[]>([]);
  const [customNiches, setCustomNiches] = useState('');
  const [isLoadingNiches, setIsLoadingNiches] = useState(false);
  const [isSavingNiches, setIsSavingNiches] = useState(false);
  
  // Time period options
  const timePeriods: { value: TimePeriod; label: string }[] = [
    { value: 'all', label: 'All Time' },
    { value: 'day', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];
  
  // Use external scraping state if provided, otherwise use internal state
  const isScraping = externalIsScraping !== undefined 
    ? externalIsScraping 
    : (internalIsScraping || isCustomScraping);
  
  // Debug isScraping state
  console.log("RENDER - isScraping:", isScraping, "externalIsScraping:", externalIsScraping, 
    "internalIsScraping:", internalIsScraping, "isCustomScraping:", isCustomScraping);

  // Fetch current niches on component mount
  useEffect(() => {
    fetchCurrentNiches();
  }, []);

  // Format niches as comma-separated string
  const formatNiches = (niches: string[]): string => {
    return niches
      .filter(niche => niche !== '') // Remove empty niche (general trending)
      .join(', ');
  };

  // Fetch current niches from API
  const fetchCurrentNiches = async () => {
    setIsLoadingNiches(true);
    try {
      const response = await fetch('/api/scheduler/niches');
      if (!response.ok) {
        throw new Error('Failed to fetch niches');
      }

      const data = await response.json();
      setCurrentNiches(data.niches || []);
      setCustomNiches(formatNiches(data.niches || []));
    } catch (error) {
      console.error('Error fetching niches:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to fetch niches'}`);
    } finally {
      setIsLoadingNiches(false);
    }
  };

  // Save custom niches
  const saveCustomNiches = async () => {
    setIsSavingNiches(true);
    setMessage('');

    try {
      const response = await fetch('/api/scheduler/niches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ niches: customNiches })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update niches');
      }

      const data = await response.json();
      setCurrentNiches(data.niches || []);
      setMessage('Niches updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving niches:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to update niches'}`);
    } finally {
      setIsSavingNiches(false);
    }
  };

  // Reset to default niches
  const resetToDefaultNiches = async () => {
    setIsSavingNiches(true);
    setMessage('');

    try {
      const response = await fetch('/api/scheduler/niches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ niches: '' }) // Empty string resets to default
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reset niches');
      }

      const data = await response.json();
      setCurrentNiches(data.niches || []);
      setCustomNiches(formatNiches(data.niches || []));
      setMessage('Reset to default niches successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error resetting niches:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Failed to reset niches'}`);
    } finally {
      setIsSavingNiches(false);
    }
  };
  
  const handleScrape = async (skipOriginalOnScrape: boolean = false) => {
    // For the regular scraper button (not custom niches)
    if (!skipOriginalOnScrape && externalIsScraping === undefined) {
      setInternalIsScraping(true);
    }
    
    setMessage('Starting YouTube scraping...');
    
    try {
      // Run scraper using the custom API endpoint which supports niches
      const response = await fetch('/api/scheduler/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          timePeriods: [selectedTimePeriod],
          niches: customNiches 
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to run scraper');
      }

      setMessage('Scraping started successfully!');
      
      // If using custom niches but skipping parent onScrape, wait some time and manually refresh
      if (skipOriginalOnScrape) {
        // Wait a reasonable amount of time for scraping to complete
        await new Promise(resolve => setTimeout(resolve, 10000)); // Extended to 10 seconds for better user experience
        setMessage('Refreshing data...');
        onRefresh?.();
        setMessage('Scraping complete! Data refreshed.');
        setTimeout(() => setMessage(''), 3000);
      }
      // Otherwise call the original onScrape function if it exists
      else if (onScrape && !skipOriginalOnScrape) {
        await onScrape();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error in scraping:', errorMessage);
      setMessage(`Error: ${errorMessage}`);
    } finally {
      // Only reset internal scraping state for the regular scraper button
      if (!skipOriginalOnScrape && externalIsScraping === undefined) {
        setInternalIsScraping(false);
      }
      // Custom niche scraping state is managed in the button handler
    }
  };
  
  // Function to clear data
  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all trending videos data? This action cannot be undone.')) {
      return;
    }

    setIsClearing(true);
    setMessage('Clearing data...');

    try {
      // Clear trending videos
      const response = await fetch('/api/trends/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to clear trending videos');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to clear trending videos');
      }

      setMessage('Data cleared successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error clearing data:', errorMessage);
      setMessage(`Error clearing trending videos: ${errorMessage}`);
    } finally {
      setIsClearing(false);
    }
  };
  
  // Get scraping message based on selected time period
  const getScrapingMessage = () => {
    const timePeriodLabel = timePeriods.find(p => p.value === selectedTimePeriod)?.label || 'All Time';
    const isCustom = customNiches && customNiches.trim() !== '';
    
    if (isCustom) {
      return `Scraping YouTube Trends (${timePeriodLabel}) with Custom Niches`;
    }
    
    return `Scraping YouTube Trends (${timePeriodLabel})`;
  };
  
  return (
    <>
      <div className="cyberpunk-panel p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold cyberpunk-title">YOUTUBE TREND ANALYZER</h2>
            <p className="text-gray-300">
              Discover trending videos, niches, and keywords on YouTube
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Time Period Selector for Scraper */}
            <div className="flex items-center">
              <label htmlFor="scraper-time-period" className="sr-only">
                Scraper Time Period
              </label>
              <select
                id="scraper-time-period"
                value={selectedTimePeriod}
                onChange={(e) => onTimePeriodChange?.(e.target.value as TimePeriod)}
                className="cyberpunk-input block w-full pl-3 pr-10 py-2 text-base rounded-md"
                disabled={isScraping || isClearing}
              >
                {timePeriods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              onClick={() => handleScrape(false)}
              disabled={isScraping || isClearing || isSavingNiches}
              className={`cyberpunk-button inline-flex items-center px-4 py-2 rounded-md ${
                isScraping ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isScraping ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  SCRAPING...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  RUN SCRAPER
                </>
              )}
            </button>
            
            {/* Clear Data Button */}
            <button
              onClick={handleClearData}
              disabled={isScraping || isClearing || isSavingNiches}
              className={`cyberpunk-button cyberpunk-button-danger inline-flex items-center px-4 py-2 rounded-md ${
                isClearing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isClearing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  CLEARING...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  CLEAR TRENDING
                </>
              )}
            </button>
            
            {/* Toggle Niche Config Button */}
            <button
              onClick={() => setShowNicheConfig(!showNicheConfig)}
              disabled={isScraping || isClearing}
              className="px-4 py-2 bg-gray-800 border border-cyan-700 text-cyan-300 rounded-md hover:bg-gray-700/70 inline-flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
              </svg>
              {showNicheConfig ? 'HIDE NICHES' : 'CUSTOM NICHES'}
            </button>
          </div>
        </div>
        
        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            message.includes('Error') 
              ? 'bg-red-900/40 text-red-300 border border-red-600' 
              : message.includes('completed') || message.includes('Successfully') || message.includes('successfully')
                ? 'bg-green-900/40 text-green-300 border border-green-600'
                : 'bg-blue-900/40 text-blue-300 border border-blue-600'
          }`}>
            <p className="text-sm">
              {message.includes('Error') ? (
                <span className="cyberpunk-text-glitch">{message}</span>
              ) : (
                <span>{message}</span>
              )}
            </p>
          </div>
        )}
        
        {/* Custom Niches Configuration Section */}
        {showNicheConfig && (
          <div className="mt-6 bg-gray-900/50 border border-gray-800 rounded-md p-4">
            <h3 className="text-lg font-medium text-cyan-400 mb-3">
              Custom Niches Configuration
            </h3>
            
            <div className="mb-4">
              {isLoadingNiches ? (
                <p className="text-gray-400">Loading niches...</p>
              ) : (
                <>
                  <div className="flex flex-col space-y-2 mb-4">
                    <label className="text-sm text-gray-300">
                      Currently Used Niches:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {currentNiches.map((niche, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 bg-gray-800 rounded-full text-sm"
                        >
                          {niche === '' ? 'General Trending' : niche}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label 
                      htmlFor="custom-niches" 
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Enter Custom Niches (comma-separated):
                    </label>
                    <textarea
                      id="custom-niches"
                      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-white"
                      rows={2}
                      placeholder="e.g. music, gaming, tech, fashion"
                      value={customNiches}
                      onChange={(e) => setCustomNiches(e.target.value)}
                      disabled={isSavingNiches}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      General trending will always be included automatically.
                    </p>
                  </div>

                  <div className="mb-4">
                    <label 
                      htmlFor="custom-niche-time-period" 
                      className="block text-sm font-medium text-gray-300 mb-2"
                    >
                      Time Period:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {timePeriods.filter(p => p.value !== 'all').map((period) => (
                        <button
                          key={period.value}
                          type="button"
                          onClick={() => onTimePeriodChange?.(period.value)}
                          className={`px-4 py-2 text-sm rounded-md flex items-center justify-center ${
                            selectedTimePeriod === period.value
                              ? 'bg-cyan-900/50 border border-cyan-500 text-cyan-300'
                              : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
                          }`}
                        >
                          {period.value === 'day' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          )}
                          {period.value === 'week' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                            </svg>
                          )}
                          {period.value === 'month' && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                            </svg>
                          )}
                          {period.value === 'day' ? '24 Hours' : 
                           period.value === 'week' ? '7 Days' : 
                           period.value === 'month' ? '30 Days' : 
                           period.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Select time period for custom niche scraping
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={saveCustomNiches}
                      disabled={isScraping || isClearing || isSavingNiches}
                      className="px-4 py-2 bg-cyan-900/30 border border-cyan-700 text-cyan-300 rounded-md hover:bg-cyan-800/30 disabled:opacity-50"
                    >
                      {isSavingNiches ? 'Saving...' : 'Save Custom Niches'}
                    </button>

                    <button
                      onClick={resetToDefaultNiches}
                      disabled={isScraping || isClearing || isSavingNiches}
                      className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-md hover:bg-gray-700/70 disabled:opacity-50"
                    >
                      Reset to Default
                    </button>
                    
                    <button
                      onClick={async () => {
                        // First save the custom niches
                        await saveCustomNiches();
                        
                        // Set custom scraping state to show animation
                        setIsCustomScraping(true);
                        console.log("CUSTOM SCRAPE: Set isCustomScraping to true");
                        
                        try {
                          // Call handleScrape with skipOriginalOnScrape=true
                          console.log("CUSTOM SCRAPE: Calling handleScrape with skipOriginalOnScrape=true");
                          await handleScrape(true);
                          console.log("CUSTOM SCRAPE: handleScrape completed");
                          
                          // Keep the animation visible for a moment after scraping finishes
                          console.log("CUSTOM SCRAPE: Waiting additional time for animation");
                          await new Promise(resolve => setTimeout(resolve, 2000));
                          console.log("CUSTOM SCRAPE: Additional wait completed");
                        } catch (error) {
                          console.error('Error in custom niche scraping:', error);
                        } finally {
                          // Reset the custom scraping state when finished
                          console.log("CUSTOM SCRAPE: Resetting custom scraping state");
                          setIsCustomScraping(false);
                        }
                      }}
                      disabled={isScraping || isClearing || isSavingNiches}
                      className="cyberpunk-button inline-flex items-center px-4 py-2 rounded-md bg-indigo-900/30 hover:bg-indigo-800/40 disabled:opacity-50"
                      title={`Scrape YouTube for custom niches: ${customNiches || 'default'}`}
                    >
                      {isCustomScraping || isScraping ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          SCRAPING...
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          RUN CUSTOM SCRAPER
                          <span className="ml-1 text-xs font-mono">
                            ({selectedTimePeriod === 'day' ? '24h' : 
                             selectedTimePeriod === 'week' ? '7d' : 
                             selectedTimePeriod === 'month' ? '30d' : 'all'})
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Cyberpunk Animation for processing states */}
      {(() => {
        if (isScraping || isCustomScraping) {
          console.log("ANIMATION - Should show scraping animation, isScraping =", isScraping, "isCustomScraping =", isCustomScraping);
          return (
            <CyberpunkAnimation 
              isActive={true} 
              message={getScrapingMessage()} 
            />
          );
        }
        return null;
      })()}
      
      {(() => {
        if (isClearing) {
          console.log("ANIMATION - Should show clearing animation, isClearing =", isClearing);
          return (
            <CyberpunkAnimation 
              isActive={true} 
              message={`Clearing ${selectedTimePeriod === 'all' ? 'all' : selectedTimePeriod} trending videos...`} 
            />
          );
        }
        return null;
      })()}
    </>
  );
} 