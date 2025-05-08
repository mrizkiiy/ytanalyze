'use client';

import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine
} from 'recharts';

interface ForecastPoint {
  period: string;
  value: number;
  lowerBound?: number;
  upperBound?: number;
}

interface ForecastChartProps {
  historicalData: { period: string; value: number }[];
  forecastData: ForecastPoint[];
  metricName: string;
  isPercentage: boolean;
}

const ForecastChart: React.FC<ForecastChartProps> = ({
  historicalData,
  forecastData,
  metricName,
  isPercentage
}) => {
  // Format date for better display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  
  // Format numbers with commas for thousands and handle percentages
  const formatYAxisTick = (value: number) => {
    if (isPercentage) return `${value.toFixed(1)}%`;
    
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };
  
  // Combine data for the chart
  const chartData = [
    ...historicalData.map(point => ({
      period: point.period,
      value: point.value,
      type: 'historical'
    })),
    ...forecastData.map(point => ({
      period: point.period,
      value: point.value,
      lowerBound: point.lowerBound,
      upperBound: point.upperBound,
      type: 'forecast'
    }))
  ];
  
  // Find the dividing point between historical and forecast data
  const dividerDate = forecastData.length > 0 ? forecastData[0].period : '';
  
  // Calculate min and max for Y axis with some padding
  const allValues = [
    ...historicalData.map(d => d.value),
    ...forecastData.map(d => d.value),
    ...forecastData.map(d => d.upperBound || d.value),
    ...forecastData.map(d => d.lowerBound || d.value)
  ].filter(Boolean);
  
  const minValue = Math.min(...allValues) * 0.8;
  const maxValue = Math.max(...allValues) * 1.2;
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      payload: {
        period: string;
        value: number;
        type: string;
        lowerBound?: number;
        upperBound?: number;
      };
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isForecasted = data.type === 'forecast';
      
      return (
        <div className="bg-gray-900/90 border border-gray-700 rounded p-3 text-sm shadow-lg">
          <p className="font-medium text-white">{formatDate(label || '')}</p>
          <p className="text-cyan-400">
            {metricName}: {isPercentage 
              ? `${data.value.toFixed(2)}%` 
              : data.value.toLocaleString()}
          </p>
          
          {isForecasted && data.lowerBound && data.upperBound && (
            <p className="text-gray-400 text-xs mt-1">
              Range: {isPercentage 
                ? `${data.lowerBound.toFixed(2)}% - ${data.upperBound.toFixed(2)}%` 
                : `${data.lowerBound.toLocaleString()} - ${data.upperBound.toLocaleString()}`}
            </p>
          )}
          
          <p className="text-gray-400 text-xs mt-1">
            {isForecasted ? '🔮 Forecast' : '📊 Historical'}
          </p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.5} />
        <XAxis 
          dataKey="period" 
          tickFormatter={formatDate}
          stroke="#999" 
          tick={{ fill: '#999', fontSize: 12 }}
        />
        <YAxis 
          domain={[minValue, maxValue]} 
          tickFormatter={formatYAxisTick}
          stroke="#999" 
          tick={{ fill: '#999', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ bottom: 0 }}
          formatter={(value) => {
            if (value === 'value') return 'Actual/Predicted';
            if (value === 'upperBound') return 'Upper Range';
            if (value === 'lowerBound') return 'Lower Range';
            return value;
          }}
        />
        
        {/* Reference line for the current date */}
        <ReferenceLine
          x={dividerDate}
          stroke="#00bcd4"
          strokeDasharray="3 3"
          label={{ value: 'Today', position: 'top', fill: '#00bcd4' }}
        />
        
        {/* Forecast confidence range as area */}
        <Area
          type="monotone"
          dataKey="upperBound"
          stroke="none"
          fill="#00b0ff"
          fillOpacity={0.1}
        />
        <Area
          type="monotone"
          dataKey="lowerBound"
          stroke="none"
          fill="#00b0ff"
          fillOpacity={0.1}
        />
        
        {/* Historical data as a bar */}
        <Bar
          dataKey="value"
          fill="#2196f3"
          fillOpacity={0.5}
          stroke="#2196f3"
          barSize={4}
        />
        
        {/* Historical line */}
        <Line
          type="monotone"
          dataKey="value"
          stroke="#4caf50"
          strokeWidth={2}
          dot={{ r: 3, fill: '#4caf50', strokeWidth: 1 }}
          activeDot={{ r: 5, fill: '#4caf50', strokeWidth: 2 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default ForecastChart; 