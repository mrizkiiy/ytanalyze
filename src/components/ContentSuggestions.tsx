import React, { useState } from 'react';

interface ContentSuggestion {
  title: string;
  description: string;
  estimatedViews: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}

interface ContentSuggestionsProps {
  keyword: string;
  suggestions?: ContentSuggestion[];
}

type SortField = 'title' | 'views' | 'difficulty';
type SortDirection = 'asc' | 'desc';

const ContentSuggestions: React.FC<ContentSuggestionsProps> = ({ keyword, suggestions }) => {
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Default suggestions if none provided
  const defaultSuggestions: ContentSuggestion[] = [
    {
      title: `Top 10 Tips for ${keyword}`,
      description: `Comprehensive guide covering the most effective strategies and insider tips for mastering ${keyword}. This listicle format performs well for beginners seeking quick wins.`,
      estimatedViews: '50K-100K',
      difficulty: 'Easy',
      tags: ['beginner', 'tutorial', 'listicle', 'tips and tricks']
    },
    {
      title: `${keyword} Tutorial for Beginners (2023)`,
      description: `Step-by-step walkthrough for complete beginners to ${keyword}. This detailed guide breaks down complex concepts into simple, actionable steps.`,
      estimatedViews: '75K-150K',
      difficulty: 'Medium',
      tags: ['tutorial', 'beginner-friendly', 'step-by-step', 'comprehensive']
    },
    {
      title: `I Tried ${keyword} for 30 Days - Here's What Happened`,
      description: `Personal journey and transformation story focused on ${keyword}. This challenge/results format creates high engagement through emotional connection and curiosity.`,
      estimatedViews: '100K-250K',
      difficulty: 'Medium',
      tags: ['challenge', 'personal journey', 'results', 'transformation']
    },
    {
      title: `${keyword} vs. [Alternative] - Which is Better?`,
      description: `In-depth comparison between ${keyword} and its popular alternatives. This debate format drives engagement through controversy and clear decision support.`,
      estimatedViews: '40K-90K',
      difficulty: 'Medium',
      tags: ['comparison', 'debate', 'review', 'analysis']
    },
    {
      title: `The Truth About ${keyword} Nobody Tells You`,
      description: `Myth-busting and revealing unknown facts about ${keyword}. This contrarian content leverages curiosity and exclusivity to drive high click-through rates.`,
      estimatedViews: '120K-300K',
      difficulty: 'Hard',
      tags: ['myth-busting', 'insider secrets', 'controversy', 'educational']
    },
    {
      title: `How to ${keyword} (Advanced Techniques)`,
      description: `Advanced strategies and techniques for those already familiar with ${keyword}. This expert-level content attracts a dedicated niche audience seeking mastery.`,
      estimatedViews: '30K-80K',
      difficulty: 'Hard',
      tags: ['advanced', 'expert-level', 'techniques', 'masterclass']
    }
  ];

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

  const displaySuggestions = suggestions || defaultSuggestions;

  // Function to sort suggestions
  const getSortedSuggestions = () => {
    return [...displaySuggestions].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'views') {
        // Extract first number from view string for comparison
        const getViewNumber = (views: string) => {
          const match = views.match(/(\d+)/);
          return match ? parseInt(match[0], 10) : 0;
        };
        comparison = getViewNumber(a.estimatedViews) - getViewNumber(b.estimatedViews);
      } else if (sortField === 'difficulty') {
        // Map difficulty to numeric value for sorting
        const difficultyMap: {[key: string]: number} = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
        comparison = difficultyMap[a.difficulty] - difficultyMap[b.difficulty];
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  };

  // Helper function to get difficulty badge color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-900/50 text-green-400 border-green-700';
      case 'Medium':
        return 'bg-yellow-900/50 text-yellow-400 border-yellow-700';
      case 'Hard':
        return 'bg-red-900/50 text-red-400 border-red-700';
      default:
        return 'bg-gray-900/50 text-gray-400 border-gray-700';
    }
  };

  // Helper function to get views badge color based on estimated views
  const getViewsColor = (views: string) => {
    const viewsLower = views.toLowerCase();
    
    if (viewsLower.includes('100k') || viewsLower.includes('million')) {
      return 'bg-purple-900/50 text-purple-400 border-purple-700';
    } else if (viewsLower.includes('50k') || viewsLower.includes('75k')) {
      return 'bg-blue-900/50 text-blue-400 border-blue-700';
    } else {
      return 'bg-teal-900/50 text-teal-400 border-teal-700';
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl text-cyan-400 font-bold">Content Ideas for "{keyword}"</h2>
        <div className="flex items-center gap-2">
          <div className="text-sm text-gray-400 mr-2">
            <span>{displaySuggestions.length} suggestions</span>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => handleSort('title')}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${sortField === 'title' ? 'bg-gray-800 text-cyan-400' : 'text-gray-400 hover:bg-gray-800/50'}`}
            >
              <span>Title</span>
              {getSortIcon('title')}
            </button>
            <button 
              onClick={() => handleSort('difficulty')}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${sortField === 'difficulty' ? 'bg-gray-800 text-cyan-400' : 'text-gray-400 hover:bg-gray-800/50'}`}
            >
              <span>Difficulty</span>
              {getSortIcon('difficulty')}
            </button>
            <button 
              onClick={() => handleSort('views')}
              className={`flex items-center space-x-1 px-2 py-1 rounded text-sm ${sortField === 'views' ? 'bg-gray-800 text-cyan-400' : 'text-gray-400 hover:bg-gray-800/50'}`}
            >
              <span>Views</span>
              {getSortIcon('views')}
            </button>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {getSortedSuggestions().map((suggestion, index) => (
          <div 
            key={index} 
            className="bg-gray-800/60 border border-gray-700 rounded-lg overflow-hidden hover:border-cyan-800 transition-colors"
          >
            <div className="flex items-center justify-between border-b border-gray-700 p-3">
              <h3 className="font-bold text-white">{suggestion.title}</h3>
              <div className={`px-2 py-1 rounded text-xs border ${getDifficultyColor(suggestion.difficulty)}`}>
                {suggestion.difficulty}
              </div>
            </div>
            
            <div className="p-3">
              <p className="text-gray-300 text-sm mb-3">{suggestion.description}</p>
              
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex flex-wrap gap-1">
                  {suggestion.tags.map((tag, tagIndex) => (
                    <span 
                      key={tagIndex} 
                      className="bg-gray-700 text-gray-300 rounded-full px-2 py-0.5 text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className={`px-2 py-1 rounded text-xs border ${getViewsColor(suggestion.estimatedViews)}`}>
                  ~{suggestion.estimatedViews} views
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 bg-cyan-900/20 border border-cyan-800/40 rounded-lg p-3 text-sm text-gray-300">
        <p className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>
            These suggestions are optimized based on current YouTube trends. Titles that include specificity (numbers, years, clear outcomes) typically perform 43% better than generic alternatives.
          </span>
        </p>
      </div>
    </div>
  );
};

export default ContentSuggestions; 