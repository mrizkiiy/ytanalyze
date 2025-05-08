// Test view count formatting function
function formatViewCount(num) {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  } else {
    return num.toString();
  }
}

// Test different values
console.log('View count formatting examples:');
console.log('500 -> ' + formatViewCount(500));
console.log('1000 -> ' + formatViewCount(1000));  // Should show 1.0K
console.log('1500 -> ' + formatViewCount(1500));  // Should show 1.5K
console.log('10000 -> ' + formatViewCount(10000)); // Should show 10.0K
console.log('1000000 -> ' + formatViewCount(1000000)); // Should show 1.0M
console.log('1234567 -> ' + formatViewCount(1234567)); // Should show 1.2M 