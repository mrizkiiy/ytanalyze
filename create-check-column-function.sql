-- Function to check if a column exists in a table
CREATE OR REPLACE FUNCTION public.check_column_exists(
  table_name text,
  column_name text
) RETURNS boolean AS $$
DECLARE
  result boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 