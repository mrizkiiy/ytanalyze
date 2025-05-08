import React, { useState } from 'react';

interface DemographicGroup {
  name: string;
  percentage: number;
  description: string;
}

interface AudienceInsightsProps {
  keyword: string;
  demographics?: {
    age?: DemographicGroup[];
    gender?: DemographicGroup[];
    location?: DemographicGroup[];
    interests?: DemographicGroup[];
  };
}

type SortDirection = 'asc' | 'desc';

const AudienceInsights: React.FC<AudienceInsightsProps> = ({ keyword, demographics }) => {
  const [sortDirections, setSortDirections] = useState<Record<string, SortDirection>>({
    age: 'desc',
    gender: 'desc',
    location: 'desc',
    interests: 'desc'
  });

  // Default demographics if none provided
  const defaultDemographics = {
    age: [
      { name: '18-24', percentage: 35, description: 'Young adults interested in trending content' },
      { name: '25-34', percentage: 40, description: 'Primary consumers with purchasing power' },
      { name: '35-44', percentage: 15, description: 'Established viewers with specific interests' },
      { name: '45+', percentage: 10, description: 'Niche audience seeking educational content' },
    ],
    gender: [
      { name: 'Male', percentage: 55, description: 'Tech and gaming focused' },
      { name: 'Female', percentage: 45, description: 'Lifestyle and educational content focused' },
    ],
    location: [
      { name: 'United States', percentage: 40, description: 'English-speaking primary market' },
      { name: 'Europe', percentage: 25, description: 'Growing secondary market' },
      { name: 'Asia', percentage: 20, description: 'Emerging market with high engagement' },
      { name: 'Other', percentage: 15, description: 'Diverse viewership across other regions' },
    ],
    interests: [
      { name: 'Entertainment', percentage: 30, description: 'Seeking fun, engaging content' },
      { name: 'Education', percentage: 25, description: 'Looking to learn new skills' },
      { name: 'Technology', percentage: 20, description: 'Interested in new tech developments' },
      { name: 'Lifestyle', percentage: 15, description: 'Focused on personal improvement' },
      { name: 'Gaming', percentage: 10, description: 'Gaming enthusiasts and players' },
    ]
  };

  // Use provided demographics or default to our preset data
  const data = {
    age: demographics?.age || defaultDemographics.age,
    gender: demographics?.gender || defaultDemographics.gender,
    location: demographics?.location || defaultDemographics.location,
    interests: demographics?.interests || defaultDemographics.interests
  };

  // Toggle sort direction for a category
  const toggleSort = (category: string) => {
    setSortDirections(prev => ({
      ...prev,
      [category]: prev[category] === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Get sorted data for a category
  const getSortedData = (category: string, data: DemographicGroup[]) => {
    return [...data].sort((a, b) => {
      const direction = sortDirections[category] === 'asc' ? 1 : -1;
      return (a.percentage - b.percentage) * direction;
    });
  };

  // Get sort icon based on current direction
  const getSortIcon = (category: string) => {
    return sortDirections[category] === 'asc' ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const getBarColor = (category: string, percentage: number): string => {
    switch (category) {
      case 'age':
        return `rgba(52, 211, 153, ${0.5 + percentage/100})`;
      case 'gender':
        return `rgba(96, 165, 250, ${0.5 + percentage/100})`;
      case 'location':
        return `rgba(251, 146, 60, ${0.5 + percentage/100})`;
      case 'interests':
        return `rgba(167, 139, 250, ${0.5 + percentage/100})`;
      default:
        return `rgba(209, 213, 219, ${0.5 + percentage/100})`;
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4">
      <h2 className="text-xl text-cyan-400 font-bold mb-4">Audience Insights for "{keyword}"</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Age Demographics */}
        <div className="bg-gray-800/60 p-4 rounded-md">
          <h3 className="text-lg text-emerald-400 font-semibold mb-3 flex items-center cursor-pointer" onClick={() => toggleSort('age')}>
            Age Demographics
            <button className="ml-2 flex items-center text-emerald-400 text-xs px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-700">
              <span>Sort by %</span>
              {getSortIcon('age')}
            </button>
          </h3>
          <div className="space-y-3">
            {getSortedData('age', data.age).map((group, index) => (
              <div key={`age-${index}`} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white">{group.name}</span>
                  <span className="text-emerald-300">{group.percentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{ 
                      width: `${group.percentage}%`,
                      backgroundColor: getBarColor('age', group.percentage)
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">{group.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gender Demographics */}
        <div className="bg-gray-800/60 p-4 rounded-md">
          <h3 className="text-lg text-blue-400 font-semibold mb-3 flex items-center cursor-pointer" onClick={() => toggleSort('gender')}>
            Gender Demographics
            <button className="ml-2 flex items-center text-blue-400 text-xs px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-700">
              <span>Sort by %</span>
              {getSortIcon('gender')}
            </button>
          </h3>
          <div className="space-y-3">
            {getSortedData('gender', data.gender).map((group, index) => (
              <div key={`gender-${index}`} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white">{group.name}</span>
                  <span className="text-blue-300">{group.percentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{ 
                      width: `${group.percentage}%`,
                      backgroundColor: getBarColor('gender', group.percentage)
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">{group.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Location Demographics */}
        <div className="bg-gray-800/60 p-4 rounded-md">
          <h3 className="text-lg text-orange-400 font-semibold mb-3 flex items-center cursor-pointer" onClick={() => toggleSort('location')}>
            Geographic Distribution
            <button className="ml-2 flex items-center text-orange-400 text-xs px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-700">
              <span>Sort by %</span>
              {getSortIcon('location')}
            </button>
          </h3>
          <div className="space-y-3">
            {getSortedData('location', data.location).map((group, index) => (
              <div key={`location-${index}`} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white">{group.name}</span>
                  <span className="text-orange-300">{group.percentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{ 
                      width: `${group.percentage}%`,
                      backgroundColor: getBarColor('location', group.percentage)
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">{group.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Interest Demographics */}
        <div className="bg-gray-800/60 p-4 rounded-md">
          <h3 className="text-lg text-purple-400 font-semibold mb-3 flex items-center cursor-pointer" onClick={() => toggleSort('interests')}>
            Audience Interests
            <button className="ml-2 flex items-center text-purple-400 text-xs px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-700">
              <span>Sort by %</span>
              {getSortIcon('interests')}
            </button>
          </h3>
          <div className="space-y-3">
            {getSortedData('interests', data.interests).map((group, index) => (
              <div key={`interest-${index}`} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-white">{group.name}</span>
                  <span className="text-purple-300">{group.percentage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="h-2.5 rounded-full" 
                    style={{ 
                      width: `${group.percentage}%`,
                      backgroundColor: getBarColor('interests', group.percentage)
                    }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400">{group.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-800/40 rounded border border-gray-700 text-sm text-gray-300">
        <p>
          <span className="font-semibold text-cyan-400">Key Takeaway:</span> Content about "{keyword}" is most popular with 
          {data.age.sort((a, b) => b.percentage - a.percentage)[0].name} year olds, with a slight 
          {data.gender[0].percentage > data.gender[1].percentage 
            ? ` ${data.gender[0].name.toLowerCase()} bias` 
            : ` ${data.gender[1].name.toLowerCase()} bias`}. 
          Focus on {data.interests.sort((a, b) => b.percentage - a.percentage)[0].name.toLowerCase()} 
          content to maximize engagement in {data.location.sort((a, b) => b.percentage - a.percentage)[0].name}.
        </p>
      </div>
    </div>
  );
};

export default AudienceInsights; 