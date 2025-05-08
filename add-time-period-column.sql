-- Add time_period column to the youtube_videos table
ALTER TABLE youtube_videos 
ADD COLUMN IF NOT EXISTS time_period TEXT;

-- Create an index for the new column
CREATE INDEX IF NOT EXISTS idx_youtube_videos_time_period 
ON youtube_videos(time_period);

-- Confirm the column has been added
SELECT 
  column_name, 
  data_type 
FROM 
  information_schema.columns 
WHERE 
  table_name = 'youtube_videos' 
  AND column_name = 'time_period'; 