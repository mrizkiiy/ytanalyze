# YouTube Trends Analyzer

A web application for scraping and analyzing trending videos from YouTube. The app collects data about trending videos including title, channel, views, niches, and keywords.

## Features

- Scrape trending videos from YouTube without using YouTube API
- Time period filtering (daily, weekly, monthly) for targeted trend analysis
- Store data in Supabase database
- Automatic scraping every 12 hours
- On-demand scraping through the dashboard
- Filter videos by niche and time period
- View statistics and insights
- Responsive dashboard UI

## Tech Stack

- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Puppeteer for web scraping
- Cheerio for HTML parsing
- Supabase for database storage
- Cron for scheduling

## Prerequisites

- Node.js 18.17 or later
- A Supabase account and project

## Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/ytanalyze.git
cd ytanalyze
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Create the database schema in your Supabase project using the `database-setup.sql` file provided in this repository.

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Using Time Period Filtering

The app allows you to filter YouTube trends by different time periods:

- **Daily**: Shows trends from the last 24 hours
- **Weekly**: Shows trends from the last 7 days
- **Monthly**: Shows trends from the last 30 days
- **All Time**: Shows all trends regardless of time period

You can:

1. Select the desired time period from the dropdown menu in the dashboard
2. Trigger scraping for a specific time period by selecting it before clicking "Run Scraper Now"
3. Filter existing data by time period to analyze trends

## Google Trends Feature

The Google Trends feature allows you to scrape and analyze trending search topics on YouTube worldwide. This helps you identify popular topics to create content around.

### Key Features:

- View trending YouTube search topics for different time periods (Today, Past 7 Days, Past 30 Days)
- Data is scraped directly from Google Trends with YouTube filter
- Results are cached for 6 hours to improve performance
- One-click access to search YouTube for any trending topic

### Using Google Trends:

1. Navigate to the Google Trends page from the "Insights" dropdown in the navigation bar
2. Select your desired time period (Today, Past 7 Days, or Past 30 Days)
3. The top trending search topics will be displayed with their ranking
4. Click the "Search" button on any trend to open YouTube search results for that topic
5. Use the "Refresh Data" button to force a fresh scrape of the latest trends

### Database Setup:

To set up the Google Trends database table, run:

```bash
node scripts/setup-db.js
```

This will create the necessary table structure in your Supabase database.

## Production Deployment

1. Build the application:

```bash
npm run build
```

2. Start the production server:

```bash
npm start
```

## API Endpoints

- `GET /api/trends`: Get trending videos (supports filtering by niche and time period)
- `POST /api/trends`: Get statistics about the trending videos (supports time period filtering)
- `POST /api/scrape`: Trigger on-demand scraping with optional time period filtering

## Notes

- The scraper uses Puppeteer, which may require longer processing time, especially when crawling multiple videos and niches
- Time period filtering works by utilizing YouTube's internal search parameters
- YouTube's HTML structure may change over time, which could break the scraper. If this happens, you'll need to update the selectors in the code

## License

MIT
