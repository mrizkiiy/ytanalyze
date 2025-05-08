-- Database setup for YouTube Trends Analyzer

-- Create the main videos table
CREATE TABLE youtube_videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  channel TEXT NOT NULL,
  views INTEGER NOT NULL,
  upload_date TEXT,
  niche TEXT,
  keywords TEXT[],
  time_period TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_youtube_videos_niche ON youtube_videos(niche);
CREATE INDEX idx_youtube_videos_views ON youtube_videos(views);
CREATE INDEX idx_youtube_videos_created_at ON youtube_videos(created_at);
CREATE INDEX idx_youtube_videos_time_period ON youtube_videos(time_period);

-- Create policy to allow authenticated users to read data
CREATE POLICY "Allow public read access" 
  ON youtube_videos 
  FOR SELECT 
  USING (true);

-- Optional: Create a view for trending videos in the last 7 days
CREATE VIEW trending_videos_last_week AS
SELECT *
FROM youtube_videos
WHERE created_at > (CURRENT_DATE - INTERVAL '7 days')
ORDER BY views DESC;

-- Optional: Create a function to get videos by niche and time period
CREATE OR REPLACE FUNCTION get_videos_by_filters(niche_param TEXT, time_period_param TEXT)
RETURNS SETOF youtube_videos AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM youtube_videos
  WHERE 
    (niche_param IS NULL OR niche = niche_param) AND
    (time_period_param IS NULL OR time_period = time_period_param OR 
     (time_period_param = 'all' AND time_period IS NULL))
  ORDER BY views DESC;
END;
$$ LANGUAGE plpgsql; 