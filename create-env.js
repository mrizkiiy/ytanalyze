const fs = require('fs');
const path = require('path');

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local');
const envExamplePath = path.join(__dirname, '.env.example');

if (fs.existsSync(envPath)) {
  console.log('✅ .env.local file already exists');
  console.log('If you\'re having connection issues, check if your Supabase credentials are correct.');
} else {
  try {
    // Create a template .env.local file
    const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Instructions:
# 1. Go to https://supabase.com/ and create an account if you don't have one
# 2. Create a new project
# 3. Go to Project Settings > API
# 4. Copy the URL and paste it after NEXT_PUBLIC_SUPABASE_URL=
# 5. Copy the anon public key and paste it after NEXT_PUBLIC_SUPABASE_ANON_KEY=
# 6. Save this file
# 7. Run 'npm run dev' again
`;

    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local file template');
    console.log('Please open the file and add your Supabase credentials.');
    console.log('Then run npm run dev again.');
    
    // Also create .env.example
    fs.writeFileSync(envExamplePath, envContent);
    console.log('✅ Created .env.example file for reference');
  } catch (error) {
    console.error('❌ Error creating .env files:', error);
  }
}

// Check database-setup.sql
const sqlPath = path.join(__dirname, 'database-setup.sql');
if (!fs.existsSync(sqlPath)) {
  console.log('❌ database-setup.sql not found');
  console.log('Please make sure the database schema file exists and is properly set up.');
}

console.log('\n🔍 Environment Setup Check Complete');
console.log('If you continue to experience issues, please check:');
console.log('1. Your Supabase project is properly set up');
console.log('2. The youtube_videos table exists in your database');
console.log('3. Your network connection to Supabase is working');
console.log('4. Your browser console for any client-side errors'); 