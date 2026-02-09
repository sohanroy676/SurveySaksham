
-- SQL for Supabase Table Definitions

-- 1. Surveys Table
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  questions JSONB NOT NULL, -- Stores array of Question objects with logic
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id)
);

-- 2. Responses Table
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  answers JSONB NOT NULL, -- Key-value pairs of q_id: value
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Paradata Table (Auditability)
CREATE TABLE paradata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
  total_time_seconds FLOAT,
  question_timings JSONB, -- q_id: seconds_spent
  device_info JSONB,
  latitude FLOAT,
  longitude FLOAT
);
