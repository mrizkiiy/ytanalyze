'use client';

import { useState, useEffect } from 'react';
import Loading from '@/components/Loading';

export default function NicheCustomizer() {
  const [currentNiches, setCurrentNiches] = useState<string[]>([]);
  const [customNiches, setCustomNiches] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

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
    setIsLoading(true);
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
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to fetch niches'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save custom niches
  const saveCustomNiches = async () => {
    setIsSaving(true);
    setStatus({ type: null, message: '' });

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
      setStatus({
        type: 'success',
        message: 'Niches updated successfully'
      });
    } catch (error) {
      console.error('Error saving niches:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update niches'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default niches
  const resetToDefault = async () => {
    setIsSaving(true);
    setStatus({ type: null, message: '' });

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
      setStatus({
        type: 'success',
        message: 'Reset to default niches successfully'
      });
    } catch (error) {
      console.error('Error resetting niches:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to reset niches'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Run scraper with current niches
  const runScraper = async () => {
    setIsSaving(true);
    setStatus({ type: null, message: '' });

    try {
      const response = await fetch('/api/scheduler/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          timePeriods: ['day'],
          niches: customNiches
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start scraper');
      }

      setStatus({
        type: 'success',
        message: 'Scraper started successfully'
      });
    } catch (error) {
      console.error('Error starting scraper:', error);
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to start scraper'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loading />
      </div>
    );
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-md p-6">
      <h3 className="text-lg font-medium text-cyan-400 mb-4">
        Custom Niches Configuration
      </h3>

      <div className="mb-6">
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
            rows={3}
            placeholder="e.g. music, gaming, tech, fashion"
            value={customNiches}
            onChange={(e) => setCustomNiches(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">
            General trending will always be included automatically.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={saveCustomNiches}
            disabled={isSaving}
            className="px-4 py-2 bg-cyan-900/30 border border-cyan-700 text-cyan-300 rounded-md hover:bg-cyan-800/30 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Custom Niches'}
          </button>

          <button
            onClick={resetToDefault}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-md hover:bg-gray-700/70 disabled:opacity-50"
          >
            Reset to Default
          </button>

          <button
            onClick={runScraper}
            disabled={isSaving}
            className="px-4 py-2 bg-green-900/30 border border-green-700 text-green-300 rounded-md hover:bg-green-800/30 disabled:opacity-50"
          >
            Run Scraper Now
          </button>
        </div>

        {status.type && (
          <div 
            className={`mt-4 p-3 rounded-md ${
              status.type === 'success' 
                ? 'bg-green-900/30 border border-green-700 text-green-400'
                : 'bg-red-900/30 border border-red-700 text-red-400'
            }`}
          >
            <p className="text-sm">{status.message}</p>
          </div>
        )}
      </div>

      <div className="bg-gray-800/50 border border-gray-700 rounded-md p-4 text-sm text-gray-300">
        <h4 className="font-medium text-cyan-400 mb-2">How It Works</h4>
        <ul className="list-disc list-inside space-y-1 text-gray-400">
          <li>Enter niches separated by commas (e.g., "music, gaming, fashion")</li>
          <li>General trending will always be included automatically</li>
          <li>The scheduler will scrape YouTube trends for each niche</li>
          <li>Changes will affect future scheduled and on-demand runs</li>
          <li>Click "Run Scraper Now" to immediately test with your custom niches</li>
        </ul>
      </div>
    </div>
  );
} 