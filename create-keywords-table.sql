-- Create keywords table for YouTube Trend Analyzer
CREATE TABLE IF NOT EXISTS keywords (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  search_volume INTEGER,
  competition TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_keywords_keyword ON keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_keywords_created_at ON keywords(created_at);

-- Create policy to allow authenticated users to read data
CREATE POLICY "Allow public read access" 
  ON keywords 
  FOR SELECT 
  USING (true);

-- Create policy to allow authenticated users to insert data
CREATE POLICY "Allow public insert access" 
  ON keywords 
  FOR INSERT 
  WITH CHECK (true);

-- Create policy to allow authenticated users to update data
CREATE POLICY "Allow public update access" 
  ON keywords 
  FOR UPDATE 
  USING (true);

-- Create policy to allow authenticated users to delete data
CREATE POLICY "Allow public delete access" 
  ON keywords 
  FOR DELETE 
  USING (true);

-- Enable RLS on the table
ALTER TABLE keywords ENABLE ROW LEVEL SECURITY; 