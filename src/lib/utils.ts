/**
 * Utility functions for the application
 */

/**
 * Format a number with K, M, and B suffixes
 * e.g., 1000 -> 1.0K, 1000000 -> 1.0M, 1000000000 -> 1.0B
 */
export function formatViewCount(num: number): string {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  } else if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else {
    return num.toString();
  }
}

/**
 * Format a number with commas
 * e.g., 1000 -> 1,000, 1000000 -> 1,000,000
 */
export function formatNumberWithCommas(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format a percentage value
 * e.g., 12.34 -> 12.3%
 */
export function formatPercentage(percent: number): string {
  return percent.toFixed(1) + '%';
}

/**
 * Format a date relative to the current date
 * Shows "Today", "Yesterday", "X days ago" for recent dates
 * Shows full date for older dates
 */
export function formatRelativeDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Unknown date';
    }
    
    // Get current date for comparison
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Format options for full date
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    // If date is within last 7 days, show relative time
    if (diffDays <= 7) {
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else {
        return `${diffDays} days ago`;
      }
    }
    
    // Otherwise show full date
    return date.toLocaleDateString(undefined, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Unknown date';
  }
} 