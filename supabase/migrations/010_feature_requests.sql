-- Feature Requests Table
-- Stores user-submitted feature requests from the landing page

CREATE TABLE IF NOT EXISTS feature_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT NOT NULL,
  category TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE feature_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for landing page form)
CREATE POLICY "Allow anonymous inserts" ON feature_requests
  FOR INSERT
  WITH CHECK (true);

-- Only allow service role to read (for admin dashboard)
CREATE POLICY "Service role can read" ON feature_requests
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Add index for querying by date
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_at ON feature_requests(created_at DESC);

-- Add index for querying by category
CREATE INDEX IF NOT EXISTS idx_feature_requests_category ON feature_requests(category);
