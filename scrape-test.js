// Test script to verify YouTube scraper view count parsing
// Import directly from the file path
const path = require('path');
const fs = require('fs');

// Since the project is using ES modules, we need a different approach to test
// Let's use a simplified version of the parsing logic for testing:

// Function to parse YouTube view counts from text
function parseYouTubeViewCount(viewsText) {
  let views = 0;
  
  if (viewsText) {
    if (viewsText.includes('K')) {
      // Handle thousands (K) - e.g., "15K views" becomes 15,000
      const numMatch = viewsText.match(/([\d.]+)K/);
      if (numMatch) {
        views = Math.round(parseFloat(numMatch[1]) * 1000);
      }
    } else if (viewsText.includes('M')) {
      // Handle millions (M) - e.g., "1.5M views" becomes 1,500,000
      const numMatch = viewsText.match(/([\d.]+)M/);
      if (numMatch) {
        views = Math.round(parseFloat(numMatch[1]) * 1000000);
      }
    } else if (viewsText.includes('B')) {
      // Handle billions (B) - e.g., "1.2B views" becomes 1,200,000,000
      const numMatch = viewsText.match(/([\d.]+)B/);
      if (numMatch) {
        views = Math.round(parseFloat(numMatch[1]) * 1000000000);
      }
    } else {
      // Handle regular numbers with commas like "123,456 views"
      const viewsMatch = viewsText.match(/[\d,]+/);
      views = viewsMatch ? parseInt(viewsMatch[0].replace(/,/g, '')) : 0;
    }
  }
  
  return views;
}

// Format view count function (same as in src/lib/utils.ts)
function formatViewCount(num) {
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

// Test cases
const testCases = [
  "123 views",
  "1,234 views",
  "12K views",
  "12.5K views",
  "1.2M views",
  "1.25M views", 
  "1B views",
  "2.5B views",
  "No views"
];

// Test results
console.log("YouTube View Count Parser Test");
console.log("-----------------------------");
testCases.forEach(test => {
  const result = parseYouTubeViewCount(test);
  console.log(`Input: "${test}" => Output: ${result} (${formatViewCount(result)})`);
});

// Verification of the formatter
console.log("\nView Count Formatter Test");
console.log("----------------------");
[0, 123, 1000, 1500, 12345, 100000, 1000000, 1234567, 1000000000, 2500000000].forEach(num => {
  console.log(`Input: ${num} => Output: ${formatViewCount(num)}`);
}); 