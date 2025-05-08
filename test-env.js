require('dotenv').config();

console.log('Checking environment variables...');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Found (not showing for security)' : 'Not found');
 
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('All required environment variables are present.');
} else {
  console.log('Some environment variables are missing. Make sure .env.local exists and has the correct values.');
} 