'use client';

import { useState, useEffect } from 'react';
import Loading from '@/components/Loading';
import dynamic from 'next/dynamic';
import { MetricForecast } from '../api/forecasts/route';

// Dynamically import chart component with no SSR
const ForecastChart = dynamic(
  () => import('@/app/forecasts/components/ForecastChart'),
  { ssr: false }
);

// Historical metrics type
interface HistoricalMetrics {
  period: string;
  views: number;
  subscribers: number;
  engagementRate: number;
  watchTime: number;
  videosPublished: number;
}

export default function ForecastsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forecasts, setForecasts] = useState<MetricForecast[]>([]);
  const [historicalData, setHistoricalData] = useState<HistoricalMetrics[]>([]);
  const [period, setPeriod] = useState<string>('90days');
  const [forecastLength, setForecastLength] = useState<string>('30days');
  const [selectedMetric, setSelectedMetric] = useState<string>('views');
  
  // Options for the dropdowns
  const periodOptions = [
    { value: '30days', label: 'Last 30 Days' },
    { value: '60days', label: 'Last 60 Days' },
    { value: '90days', label: 'Last 90 Days' }
  ];
  
  const forecastOptions = [
    { value: '30days', label: 'Next 30 Days' },
    { value: '60days', label: 'Next 60 Days' },
    { value: '90days', label: 'Next 90 Days' }
  ];
  
  // Fetch forecast data when parameters change
  useEffect(() => {
    fetchForecastData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, forecastLength]);
  
  // Fetch data from the API
  const fetchForecastData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/forecasts?period=${period}&forecastLength=${forecastLength}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch forecast data');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Unknown error fetching forecasts');
      }
      
      setForecasts(data.forecasts || []);
      setHistoricalData(data.historicalData || []);
      
      // Set selected metric to first one if not already in the list
      if (data.forecasts && data.forecasts.length > 0) {
        const metrics = data.forecasts.map((f: MetricForecast) => f.metric);
        if (!metrics.includes(selectedMetric)) {
          setSelectedMetric(metrics[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get the currently selected forecast
  const selectedForecast = forecasts.find(f => f.metric === selectedMetric);
  
  // Get relevant historical data for the selected metric
  const relevantHistoricalData = historicalData.map(day => {
    return {
      period: day.period,
      value: day[selectedMetric as keyof typeof day] as number
    };
  });
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black relative pt-2">
      {/* Cyberpunk background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.03),transparent_80%)]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 relative z-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold cyberpunk-title">PERFORMANCE FORECASTS</h1>
          <p className="text-gray-400 mt-2">AI-powered predictions of your future YouTube metrics</p>
        </div>
        
        {/* Control Panel */}
        <div className="cyberpunk-panel p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col">
                <label htmlFor="historical-period" className="mb-2 text-sm text-gray-300">
                  Historical Data:
                </label>
                <select
                  id="historical-period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="cyberpunk-input pl-3 pr-10 py-2 text-base rounded-md"
                >
                  {periodOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col">
                <label htmlFor="forecast-length" className="mb-2 text-sm text-gray-300">
                  Forecast Length:
                </label>
                <select
                  id="forecast-length"
                  value={forecastLength}
                  onChange={(e) => setForecastLength(e.target.value)}
                  className="cyberpunk-input pl-3 pr-10 py-2 text-base rounded-md"
                >
                  {forecastOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={fetchForecastData}
              className="cyberpunk-button bg-cyan-900/50 hover:bg-cyan-800/50 border border-cyan-500 px-6 py-2 rounded-md text-cyan-300 font-medium"
            >
              Regenerate Forecast
            </button>
          </div>
          
          {/* AI Explainer */}
          <div className="bg-indigo-900/20 border border-indigo-800 p-4 rounded-md mb-6">
            <h3 className="text-indigo-300 font-medium mb-1 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
              AI-Powered Performance Forecasting
            </h3>
            <p className="text-gray-300 text-sm">
              Our advanced AI analyzes your historical YouTube performance data using Google&apos;s Gemini AI, incorporating factors 
              like publishing patterns, audience behavior, and platform trends to forecast future metrics. 
              These predictions include confidence intervals and actionable recommendations to help you optimize your strategy.
            </p>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="cyberpunk-panel p-6">
          {isLoading ? (
            <Loading />
          ) : error ? (
            <div className="p-4 rounded-md bg-red-900/30 border border-red-700 text-red-400">
              <p>{error}</p>
              <button
                onClick={fetchForecastData}
                className="mt-2 underline text-red-400 hover:text-red-300"
              >
                Try again
              </button>
            </div>
          ) : (
            <div>
              {/* Metric Selection Tabs */}
              <div className="flex flex-wrap gap-2 mb-6">
                {forecasts.map((forecast) => (
                  <button
                    key={forecast.metric}
                    onClick={() => setSelectedMetric(forecast.metric)}
                    className={`px-4 py-2 rounded-md ${
                      selectedMetric === forecast.metric
                        ? 'bg-cyan-900/30 border border-cyan-500 text-cyan-300'
                        : 'bg-gray-800/30 border border-gray-700 text-gray-400 hover:text-cyan-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="mr-2">{forecast.description}</span>
                      <span 
                        className={`px-2 py-1 text-xs rounded-full ${
                          forecast.forecastedGrowth > 0 
                            ? 'bg-green-900/30 text-green-400 border border-green-700'
                            : 'bg-red-900/30 text-red-400 border border-red-700'
                        }`}
                      >
                        {forecast.forecastedGrowth > 0 ? '+' : ''}{forecast.forecastedGrowth.toFixed(1)}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              
              {selectedForecast && (
                <>
                  {/* Current Metric and Forecast */}
                  <div className="flex flex-col md:flex-row gap-6 mb-6">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-md p-5 flex-1">
                      <h3 className="text-xl font-medium text-cyan-300 mb-3">Current Performance</h3>
                      <div className="flex items-end gap-3">
                        <div className="text-4xl font-bold text-white">
                          {selectedForecast.metric === 'engagementRate' 
                            ? selectedForecast.currentValue.toFixed(2) + '%'
                            : selectedForecast.currentValue.toLocaleString()}
                        </div>
                        <div 
                          className={`px-3 py-1 text-sm rounded-full ${
                            selectedForecast.forecastedGrowth > 0 
                              ? 'bg-green-900/30 text-green-400 border border-green-700'
                              : 'bg-red-900/30 text-red-400 border border-red-700'
                          }`}
                        >
                          {selectedForecast.forecastedGrowth > 0 ? '↑' : '↓'} {Math.abs(selectedForecast.forecastedGrowth).toFixed(1)}% expected growth
                        </div>
                      </div>
                      <div className="mt-4 text-gray-400">
                        <div className="flex items-center mb-2">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                          </svg>
                          <span>Confidence Score: <span className="text-white">{selectedForecast.confidenceScore}%</span></span>
                        </div>
                        <div className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path>
                          </svg>
                          <span>Forecast Period: <span className="text-white">{forecastLength === '30days' ? '30' : forecastLength === '60days' ? '60' : '90'} days</span></span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-900/50 border border-gray-800 rounded-md p-5 flex-1">
                      <h3 className="text-xl font-medium text-cyan-300 mb-3">Projected End Value</h3>
                      {selectedForecast.forecastPoints.length > 0 && (
                        <div className="flex items-end gap-3">
                          <div className="text-4xl font-bold text-white">
                            {selectedForecast.metric === 'engagementRate'
                              ? selectedForecast.forecastPoints[selectedForecast.forecastPoints.length - 1].value.toFixed(2) + '%'
                              : selectedForecast.forecastPoints[selectedForecast.forecastPoints.length - 1].value.toLocaleString()}
                          </div>
                          <div className="text-gray-400">
                            by {selectedForecast.forecastPoints[selectedForecast.forecastPoints.length - 1].period}
                          </div>
                        </div>
                      )}
                      <div className="mt-4 text-gray-400">
                        {selectedForecast.forecastPoints.length > 0 && selectedForecast.forecastPoints[0].lowerBound && (
                          <div className="flex items-center mb-2">
                            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                            </svg>
                            <span>
                              Range: <span className="text-white">
                                {selectedForecast.metric === 'engagementRate'
                                  ? selectedForecast.forecastPoints[selectedForecast.forecastPoints.length - 1].lowerBound?.toFixed(2) + '%'
                                  : selectedForecast.forecastPoints[selectedForecast.forecastPoints.length - 1].lowerBound?.toLocaleString()}
                                {' - '}
                                {selectedForecast.metric === 'engagementRate'
                                  ? selectedForecast.forecastPoints[selectedForecast.forecastPoints.length - 1].upperBound?.toFixed(2) + '%'
                                  : selectedForecast.forecastPoints[selectedForecast.forecastPoints.length - 1].upperBound?.toLocaleString()}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Chart */}
                  <div className="mb-8">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-md p-5 h-[400px]">
                      <ForecastChart 
                        historicalData={relevantHistoricalData}
                        forecastData={selectedForecast.forecastPoints}
                        metricName={selectedForecast.description}
                        isPercentage={selectedForecast.metric === 'engagementRate'}
                      />
                    </div>
                  </div>
                  
                  {/* Insights and Recommendations */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-md p-5">
                      <h3 className="text-lg font-medium text-cyan-300 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"></path>
                        </svg>
                        AI-Generated Insights
                      </h3>
                      <ul className="space-y-3">
                        {selectedForecast.insights.map((insight, index) => (
                          <li key={index} className="flex">
                            <span className="text-cyan-400 mr-2">•</span>
                            <span className="text-gray-300">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-gray-900/50 border border-gray-800 rounded-md p-5">
                      <h3 className="text-lg font-medium text-cyan-300 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z"></path>
                        </svg>
                        Strategic Recommendations
                      </h3>
                      <ul className="space-y-3">
                        {selectedForecast.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex">
                            <span className="text-pink-400 mr-2">•</span>
                            <span className="text-gray-300">{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
} 