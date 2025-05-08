import React from 'react';

interface SuccessFactorsProps {
  keyword: string;
  factors: {
    title: string;
    description: string;
    importance: 'high' | 'medium' | 'low';
  }[];
}

const SuccessFactors: React.FC<SuccessFactorsProps> = ({ keyword, factors }) => {
  // Map importance to colors
  const importanceColors = {
    high: 'text-red-400 border-red-600',
    medium: 'text-yellow-400 border-yellow-600',
    low: 'text-green-400 border-green-600'
  };

  // If no factors provided, show some default ones
  const defaultFactors = [
    {
      title: 'Engaging Thumbnail',
      description: `Create eye-catching thumbnails with bright colors, clear text, and emotional faces to increase click-through rates for "${keyword}" videos.`,
      importance: 'high' as const
    },
    {
      title: 'First 15 Seconds',
      description: `Hook viewers immediately by stating the value they'll get and showing a preview of the key points related to "${keyword}".`,
      importance: 'high' as const
    },
    {
      title: 'Trending Format',
      description: `Use popular formats like listicles, how-to guides, or reaction videos that are currently working well for "${keyword}" content.`,
      importance: 'medium' as const
    },
    {
      title: 'Searchable Title',
      description: `Include "${keyword}" and related search terms in your title while keeping it under 60 characters for better discoverability.`,
      importance: 'medium' as const
    },
    {
      title: 'Call to Action',
      description: `Include clear calls to action throughout the video, especially at the 70% mark when discussing "${keyword}" topics.`,
      importance: 'low' as const
    }
  ];

  const displayFactors = factors && factors.length > 0 ? factors : defaultFactors;

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <h2 className="text-xl text-cyan-400 font-bold mb-4">Success Factors for "{keyword}"</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayFactors.map((factor, index) => (
          <div 
            key={index} 
            className={`p-4 bg-gray-800/60 border-l-4 rounded-md shadow-md ${importanceColors[factor.importance]}`}
          >
            <div className="flex items-center mb-2">
              <span className={`text-lg font-semibold ${importanceColors[factor.importance]}`}>{factor.title}</span>
              <span className={`ml-auto text-xs px-2 py-1 rounded-full bg-gray-900 ${importanceColors[factor.importance]}`}>
                {factor.importance.charAt(0).toUpperCase() + factor.importance.slice(1)}
              </span>
            </div>
            <p className="text-gray-300 text-sm">{factor.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuccessFactors; 