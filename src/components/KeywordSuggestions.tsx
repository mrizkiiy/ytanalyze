'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Loading from './Loading';

interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  competition: 'Low' | 'Medium' | 'High';
}

interface KeywordSuggestionsProps {
  onSelect?: (keyword: string, searchVolume?: number, competition?: 'Low' | 'Medium' | 'High') => void;
  placeholder?: string;
  className?: string;
}

export default function KeywordSuggestions({ 
  onSelect, 
  placeholder = 'Search for keywords...', 
  className = '' 
}: KeywordSuggestionsProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<KeywordSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  
  // Debounced fetch function to avoid too many API calls
  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/keywords/suggestions?q=${encodeURIComponent(searchQuery)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error');
      }
      
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setError('Error loading suggestions. Please try again.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Handle input changes with debounce
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear previous timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    // Set new timeout
    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300); // 300ms debounce
  }, [fetchSuggestions]);
  
  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: KeywordSuggestion) => {
    setQuery(suggestion.keyword);
    setShowSuggestions(false);
    
    if (onSelect) {
      onSelect(suggestion.keyword, suggestion.searchVolume, suggestion.competition);
    }
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };
  
  // Copy all keywords to clipboard
  const copyAllKeywords = () => {
    const keywordsText = suggestions
      .map(k => k.keyword)
      .join(', ');
    
    // Try to use clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(keywordsText)
        .then(() => {
          setCopySuccess('Copied!');
          setTimeout(() => setCopySuccess(null), 2000);
        })
        .catch(() => {
          // Fallback to textarea method if clipboard API fails
          fallbackCopyToClipboard(keywordsText);
        });
    } else {
      // Use fallback method if clipboard API is not available
      fallbackCopyToClipboard(keywordsText);
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
        setCopySuccess('Copied!');
        setTimeout(() => setCopySuccess(null), 2000);
      } else {
        setCopySuccess('Failed to copy');
        setTimeout(() => setCopySuccess(null), 2000);
      }
    } catch (err) {
      setCopySuccess('Failed to copy');
      setTimeout(() => setCopySuccess(null), 2000);
    }
    
    document.body.removeChild(textArea);
  };
  
  // Get competition color
  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'Low': 
        return 'text-green-400';
      case 'Medium': 
        return 'text-yellow-400';
      case 'High': 
        return 'text-red-400';
      default: 
        return 'text-gray-300';
    }
  };
  
  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, []);
  
  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 text-gray-300 rounded-md 
                     focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
        />
        {isLoading && (
          <div className="absolute right-3 top-2.5">
            <div className="w-5 h-5">
              <Loading small />
            </div>
          </div>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full rounded-md shadow-lg bg-gray-900 border border-gray-700 max-h-80 overflow-auto"
          style={{ maxHeight: '400px' }}
        >
          <div className="p-2 border-b border-gray-700 flex justify-between items-center">
            <div className="grid grid-cols-3 w-full text-xs text-gray-500 font-medium px-2">
              <div>Keyword</div>
              <div>Search Volume</div>
              <div>Competition</div>
            </div>
            <button
              onClick={copyAllKeywords}
              className="text-xs px-2 py-1 bg-gray-800 text-cyan-400 rounded hover:bg-gray-700 flex items-center"
            >
              {copySuccess ? (
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {copySuccess}
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy All
                </span>
              )}
            </button>
          </div>
          
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li 
                key={index} 
                className="px-4 py-2 text-gray-300 hover:bg-gray-800 cursor-pointer grid grid-cols-3 items-center"
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-500 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="truncate">{suggestion.keyword}</span>
                </div>
                <div className="text-cyan-300 font-mono text-sm">
                  {formatNumber(suggestion.searchVolume)}
                </div>
                <div className={`${getCompetitionColor(suggestion.competition)}`}>
                  {suggestion.competition}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {error && showSuggestions && (
        <div className="absolute z-50 mt-1 w-full rounded-md shadow-lg bg-red-900/30 border border-red-700 text-red-400 p-3">
          {error}
        </div>
      )}
    </div>
  );
} 