'use client';

import { useState, useEffect } from 'react';
import { AIPrediction } from '@/lib/gemini-service';
import Loading from '@/components/Loading';

// No dynamic imports here - we'll import them only when the function is called

interface AIPredictionPanelProps {
  isVisible: boolean;
  selectedNiche?: string;
  filteredVideos?: VideoItem[] | null;
}

interface VideoItem {
  id: string;
  title: string;
  velocity: string;
  growthPercentage: number;
  niche?: string;
}

export default function AIPredictionPanel({ 
  isVisible, 
  selectedNiche = 'all',
  filteredVideos = null
}: AIPredictionPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<AIPrediction | null>(null);
  const [analyzedVideos, setAnalyzedVideos] = useState<VideoItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [availableNiches, setAvailableNiches] = useState<string[]>([]);
  const [localSelectedNiche, setLocalSelectedNiche] = useState<string>(selectedNiche);
  const [isLoadingNiches, setIsLoadingNiches] = useState(false);
  
  // Fetch available niches from the API
  useEffect(() => {
    const fetchNiches = async () => {
      if (!isVisible) return;
      
      setIsLoadingNiches(true);
      try {
        const response = await fetch('/api/niches');
        
        if (!response.ok) {
          throw new Error('Failed to fetch niches');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Unknown error fetching niches');
        }
        
        if (data.niches && Array.isArray(data.niches)) {
          setAvailableNiches(['all', ...data.niches]);
        }
      } catch (error) {
        console.error('Error fetching niches:', error);
        // Fallback niches
        setAvailableNiches(['all', 'programming', 'gaming', 'lifestyle', 'technology', 'music', 'education']);
      } finally {
        setIsLoadingNiches(false);
      }
    };
    
    fetchNiches();
  }, [isVisible]);
  
  // Update local niche when parent prop changes, but don't reset predictions unnecessarily
  useEffect(() => {
    // Only update if there's a real change
    if (selectedNiche !== localSelectedNiche) {
      console.log('Syncing local niche with parent:', selectedNiche);
      setLocalSelectedNiche(selectedNiche);
    }
  }, [selectedNiche, localSelectedNiche]);
  
  // Handle niche change
  const handleNicheChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNiche = e.target.value;
    console.log('User manually changed niche to:', newNiche);
    
    // First reset any existing predictions when explicitly changing niches
    if (prediction) {
      setPrediction(null);
      setAnalyzedVideos([]);
    }
    
    // Then update the selected niche
    setLocalSelectedNiche(newNiche);
  };

  // Get AI predictions based on growth data
  const getPredictions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Add the niche parameter to the API request if a specific niche is selected
      const apiUrl = localSelectedNiche !== 'all' 
        ? `/api/predictions?niche=${encodeURIComponent(localSelectedNiche)}` 
        : '/api/predictions';
      
      // If we have filtered videos for a specific niche, use those for predictions
      if (filteredVideos && filteredVideos.length > 0 && localSelectedNiche !== 'all') {
        // Get only viral and fast videos from the filtered set
        const viralAndFastVideos = filteredVideos.filter(
          v => v.velocity === 'viral' || v.velocity === 'fast'
        );
        
        // If we have enough filtered videos to analyze, use a direct API call
        // with the filtered video data in the request body
        if (viralAndFastVideos.length > 0) {
          const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ videos: viralAndFastVideos }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to get AI predictions');
          }
          
          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.error || 'Unknown error getting AI predictions');
          }
          
          console.log('Received AI predictions for filtered niche:', data.predictions);
          setPrediction(data.predictions);
          setAnalyzedVideos(data.analyzedVideos || viralAndFastVideos);
          setIsLoading(false);
          return;
        }
      }
      
      // Regular API call for all niches or when filtered videos aren't available
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error('Failed to get AI predictions');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error getting AI predictions');
      }
      
      console.log('Received AI predictions:', data.predictions);
      setPrediction(data.predictions);
      setAnalyzedVideos(data.analyzedVideos || []);
    } catch (error) {
      console.error('Error getting AI predictions:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };

  // Function to export AI predictions to PDF
  const exportToPDF = async () => {
    if (!prediction) return;
    
    try {
      setIsExporting(true);
      
      // Import necessary modules
      const jspdfModule = await import('jspdf');
      const jsPDF = jspdfModule.default;
      const autoTableModule = await import('jspdf-autotable');
      
      // Create a new PDF document
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(0, 162, 184); // Cyan-like color
      doc.text('YouTube Content AI Predictions', 20, 20);
      
      // Add niche if specified
      if (localSelectedNiche !== 'all') {
        doc.setFontSize(14);
        doc.text(`Niche: ${localSelectedNiche}`, 20, 30);
      }
      
      // Add timestamp
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 40);
      
      // Growth potential
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 162, 184);
      doc.text('Growth Potential', 20, 50);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(14);
      doc.setTextColor(20, 20, 20);
      doc.text(`${prediction.growthPotential}/100`, 20, 58);
      doc.setFontSize(12);
      doc.text(`Predicted Views: ${prediction.predictedViews}`, 20, 65);
      
      // Add analyzed videos
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 162, 184);
      doc.text('Analyzed Videos', 20, 75);
      
      // Create table of analyzed videos
      const videoData = analyzedVideos.slice(0, 5).map(video => [
        video.title.length > 60 ? video.title.substring(0, 57) + '...' : video.title,
        video.velocity?.toUpperCase() || 'N/A',
        `${typeof video.growthPercentage === 'number' ? video.growthPercentage.toFixed(1) : '0'}%`
      ]);
      
      // Use jspdf-autotable to create a table
      autoTableModule.default(doc, {
        startY: 80,
        head: [['Title', 'Growth', '%']],
        body: videoData,
        theme: 'grid',
        headStyles: { fillColor: [0, 162, 184], textColor: [255, 255, 255] },
        margin: { top: 80, left: 20, right: 20 },
        styles: { overflow: 'linebreak', cellWidth: 'auto' }
      });
      
      // Get the Y position after the table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const finalY = (doc as Record<string, any>).lastAutoTable.finalY + 10;
      let currentY = finalY;
      
      // Success Factors
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 162, 184);
      doc.text('Success Factors', 20, currentY);
      currentY += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      
      prediction.successFactors.forEach((factor, index) => {
        // Split long text into multiple lines to prevent overlapping
        const lines = doc.splitTextToSize(`${index + 1}. ${factor}`, doc.internal.pageSize.getWidth() - 40);
        doc.text(lines, 20, currentY);
        currentY += 7 * lines.length;
        
        // Add a new page if we're near the bottom (adjusted for landscape)
        if (currentY > 190) {
          doc.addPage();
          currentY = 20;
        }
      });
      
      currentY += 5;
      
      // Audience Insights
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 162, 184);
      doc.text('Audience Insights', 20, currentY);
      currentY += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      
      prediction.audienceInsights.forEach((insight, index) => {
        // Split long text into multiple lines to prevent overlapping
        const lines = doc.splitTextToSize(`${index + 1}. ${insight}`, doc.internal.pageSize.getWidth() - 40);
        doc.text(lines, 20, currentY);
        currentY += 7 * lines.length;
        
        if (currentY > 190) {
          doc.addPage();
          currentY = 20;
        }
      });
      
      currentY += 5;
      
      // Add a new page for content suggestions
      if (currentY > 190) {
        doc.addPage();
        currentY = 20;
      }
      
      // Content Suggestions
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 162, 184);
      doc.text('Content Suggestions', 20, currentY);
      currentY += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      
      prediction.contentSuggestions.forEach((suggestion, index) => {
        // Split long text into multiple lines to prevent overlapping
        const lines = doc.splitTextToSize(`${index + 1}. ${suggestion}`, doc.internal.pageSize.getWidth() - 40);
        doc.text(lines, 20, currentY);
        currentY += 7 * lines.length;
        
        if (currentY > 190) {
          doc.addPage();
          currentY = 20;
        }
      });
      
      currentY += 5;
      
      // Keyword Recommendations
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(0, 162, 184);
      doc.text('Recommended Keywords', 20, currentY);
      currentY += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      
      const keywordChunks = [];
      
      // Group keywords into chunks of 3 to show side by side
      for (let i = 0; i < prediction.keywordRecommendations.length; i += 3) {
        keywordChunks.push(prediction.keywordRecommendations.slice(i, i + 3));
      }
      
      keywordChunks.forEach((chunk) => {
        const keywordText = chunk.join('   •   ');
        // Split long keyword text into multiple lines if needed
        const lines = doc.splitTextToSize(keywordText, doc.internal.pageSize.getWidth() - 40);
        doc.text(lines, 20, currentY);
        currentY += 7 * lines.length;
      });
      
      // Add footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(
          'Generated by YouTube Trend Analyzer',
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() - 20,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
      }
      
      // Save the PDF
      doc.save(`youtube-ai-predictions${localSelectedNiche !== 'all' ? `-${localSelectedNiche}` : ''}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Show an error notification or message if needed
    } finally {
      setIsExporting(false);
    }
  };
  
  // Effect for handling visibility changes
  useEffect(() => {
    // If panel is not visible, do nothing
    if (!isVisible) {
      return;
    }
    
    // Optionally pre-load predictions when tab becomes visible
    if (!prediction && !isLoading && !error) {
      // Uncomment to auto-load predictions when tab is opened
      // getPredictions();
    }
  }, [isVisible, prediction, isLoading, error]);
  
  if (!isVisible) {
    return null;
  }
  
  // Helper function to ensure we always have valid content to display
  const ensureContentArray = (items: string[] | undefined): string[] => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      return ['No data available'];
    }
    return items;
  };
  
  return (
    <div className="cyberpunk-panel p-6">
      {!prediction ? (
        <div className="flex flex-col items-center justify-center p-10">
          <div className="mb-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-cyan-400">Select Content Niche</h3>
              {isLoadingNiches && <div className="w-5 h-5"><Loading small /></div>}
            </div>
            <div className="mb-6">
              <label htmlFor="niche-filter" className="block text-sm font-medium text-gray-300 mb-2">
                Target Niche for AI Prediction
              </label>
              <select
                id="niche-filter"
                value={localSelectedNiche}
                onChange={handleNicheChange}
                disabled={isLoadingNiches}
                className="cyberpunk-input block w-full pl-3 pr-10 py-2 text-base rounded-md"
              >
                <option value="all">All Niches</option>
                {availableNiches.filter(niche => niche !== 'all').map(niche => (
                  <option key={niche} value={niche}>
                    {niche.charAt(0).toUpperCase() + niche.slice(1)}
                  </option>
                ))}
              </select>
              <p className="text-gray-400 text-sm mt-2">
                {localSelectedNiche === 'all' 
                  ? 'Analyzing all content niches for general predictions'
                  : `Focusing prediction specifically on the "${localSelectedNiche}" niche`}
              </p>
            </div>
          </div>
          
          <div className="text-center max-w-md">
            <div className="flex flex-col items-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-600 mb-4 cyberpunk-glow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h2 className="text-xl font-bold text-cyan-300 mb-2">AI Content Predictions</h2>
              <p className="text-gray-300 mb-4">
                Use machine learning to analyze trending videos and predict content opportunities based on audience behavior.
              </p>
            </div>
            
            <button
              onClick={getPredictions}
              disabled={isLoading}
              className="cyberpunk-button w-full flex justify-center items-center py-3"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 mr-3"><Loading small /></div>
                  Generating AI Predictions...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.672 1.911a1 1 0 10-1.932.518l.259.966a1 1 0 001.932-.518l-.26-.966zM2.429 4.74a1 1 0 10-.517 1.932l.966.259a1 1 0 00.517-1.932l-.966-.26zm8.814-.569a1 1 0 00-1.415-1.414l-.707.707a1 1 0 101.415 1.415l.707-.708zm-7.071 7.072l.707-.707A1 1 0 003.465 9.12l-.708.707a1 1 0 001.415 1.415zm3.2-5.171a1 1 0 00-1.3 1.3l4 10a1 1 0 001.823.075l1.38-2.759 3.018 3.02a1 1 0 001.414-1.415l-3.019-3.02 2.76-1.379a1 1 0 00-.076-1.822l-10-4z" clipRule="evenodd" />
                  </svg>
                  Generate AI Predictions
                  {localSelectedNiche !== 'all' && ` for ${localSelectedNiche}`}
                </>
              )}
            </button>
            
            {error && (
              <div className="mt-4 p-3 rounded-md bg-red-900/30 border border-red-700 text-red-400">
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="cyberpunk-panel p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-cyan-400 mb-1">AI Content Predictions</h2>
              <p className="text-gray-400 text-sm">
                Generate AI insights based on viral and fast-growing videos
                {localSelectedNiche !== 'all' && (
                  <span className="ml-1 text-cyan-300">
                    in the <strong>{localSelectedNiche}</strong> niche
                  </span>
                )}
              </p>
            </div>
            
            {!prediction && !isLoading && (
              <button
                onClick={getPredictions}
                className="px-4 py-2 bg-cyan-900/30 border border-cyan-700 text-cyan-300 rounded-md hover:bg-cyan-800/30"
              >
                Generate Predictions
                {localSelectedNiche !== 'all' && ` for ${localSelectedNiche}`}
              </button>
            )}
            
            {prediction && !isLoading && (
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                className="px-4 py-2 bg-cyan-900/30 border border-cyan-700 text-cyan-300 rounded-md hover:bg-cyan-800/30 flex items-center"
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating PDF...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Export to PDF</span>
                  </>
                )}
              </button>
            )}
          </div>
          
          {isLoading ? (
            <div className="py-10">
              <Loading />
              <p className="text-center text-gray-400 mt-4">
                Analyzing viral patterns
                {localSelectedNiche !== 'all' && ` in the ${localSelectedNiche} niche`}
                and generating predictions...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-md bg-red-900/30 border border-red-700 text-red-400">
              <p>{error}</p>
              <button
                onClick={getPredictions}
                className="mt-2 underline text-red-400 hover:text-red-300"
              >
                Try again
              </button>
            </div>
          ) : prediction ? (
            <div>
              {/* Analyzed Videos */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-300 mb-3">
                  Based on {analyzedVideos.length} Trending Videos
                  {localSelectedNiche !== 'all' && ` in ${localSelectedNiche}`}:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {analyzedVideos.slice(0, 3).map((video) => (
                    <div 
                      key={video.id} 
                      className="bg-gray-900/50 border border-gray-800 rounded-md p-3 text-sm"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="text-xs px-2 py-0.5 rounded-full"
                          style={{ 
                            backgroundColor: video.velocity === 'viral' 
                              ? 'rgba(233, 30, 99, 0.2)' 
                              : 'rgba(255, 152, 0, 0.2)',
                            color: video.velocity === 'viral' ? '#e91e63' : '#ff9800',
                            border: `1px solid ${video.velocity === 'viral' ? '#e91e63' : '#ff9800'}`
                          }}
                        >
                          {video.velocity.toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-400">
                          +{typeof video.growthPercentage === 'number' ? video.growthPercentage.toFixed(1) : '0'}%
                        </div>
                      </div>
                      <a 
                        href={`https://youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-1 text-cyan-300 hover:text-cyan-400"
                      >
                        {video.title}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Growth Potential Score */}
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-medium text-gray-300">Growth Potential:</h3>
                  <div className="ml-3 text-2xl font-bold" style={{ 
                    color: prediction.growthPotential > 75 
                      ? '#e91e63' 
                      : prediction.growthPotential > 50 
                        ? '#ff9800' 
                        : '#4caf50' 
                  }}>
                    {prediction.growthPotential}/100
                  </div>
                </div>
                <div className="text-gray-400">
                  Predicted Views: <span className="text-cyan-300">{prediction.predictedViews || 'Unknown'}</span>
                </div>
              </div>
              
              {/* Success Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-300 mb-3 border-b border-gray-700 pb-2">
                    Success Factors
                  </h3>
                  <ul className="space-y-2">
                    {ensureContentArray(prediction.successFactors).map((factor, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-4 h-4 rounded-full bg-cyan-900 text-cyan-300 text-xs flex items-center justify-center mt-1 mr-2">
                          {index + 1}
                        </span>
                        <span className="text-gray-300">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-300 mb-3 border-b border-gray-700 pb-2">
                    Audience Insights
                  </h3>
                  <ul className="space-y-2">
                    {ensureContentArray(prediction.audienceInsights).map((insight, index) => (
                      <li key={index} className="flex items-start">
                        <span className="inline-block w-4 h-4 rounded-full bg-pink-900 text-pink-300 text-xs flex items-center justify-center mt-1 mr-2">
                          {index + 1}
                        </span>
                        <span className="text-gray-300">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Content Suggestions */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-300 mb-3 border-b border-gray-700 pb-2">
                  Content Suggestions
                  {localSelectedNiche !== 'all' && ` for ${localSelectedNiche}`}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ensureContentArray(prediction.contentSuggestions).map((suggestion, index) => (
                    <div key={index} className="bg-gray-900/50 border border-gray-800 rounded-md p-3 text-sm text-gray-300">
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Keyword Recommendations */}
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-3 border-b border-gray-700 pb-2">
                  Recommended Keywords
                  {localSelectedNiche !== 'all' && ` for ${localSelectedNiche}`}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ensureContentArray(prediction.keywordRecommendations).map((keyword, index) => (
                    <div 
                      key={index} 
                      className="px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-cyan-300 text-sm"
                    >
                      {keyword}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 border border-dashed border-gray-700 rounded-lg">
              <p>
                Click &quot;Generate Predictions&quot; to get AI insights based on viral and fast-growing videos
                {localSelectedNiche !== 'all' && ` in the ${localSelectedNiche} niche`}.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 