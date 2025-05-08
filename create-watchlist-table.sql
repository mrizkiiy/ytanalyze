-- Create watchlist table for YouTube Trend Analyzer
CREATE TABLE IF NOT EXISTS watchlist (
  id SERIAL PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES youtube_videos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  channel TEXT NOT NULL,
  views INTEGER NOT NULL,
  niche TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT,
  UNIQUE(video_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_watchlist_video_id ON watchlist(video_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_created_at ON watchlist(created_at);

-- Create policy to allow authenticated users to read data
CREATE POLICY "Allow public read access" 
  ON watchlist 
  FOR SELECT 
  USING (true);

-- Create policy to allow authenticated users to insert data
CREATE POLICY "Allow public insert access" 
  ON watchlist 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow authenticated users to update data
CREATE POLICY "Allow public update access" 
  ON watchlist 
  FOR UPDATE 
  USING (true);

-- Create policy to allow authenticated users to delete data
CREATE POLICY "Allow public delete access" 
  ON watchlist 
  FOR DELETE 
  USING (true);

-- Enable RLS on the table
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY; 