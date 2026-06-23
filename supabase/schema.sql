-- Dentsu Podcast Network (DPN) Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE user_role AS ENUM ('creator', 'creator_manager', 'agency_user', 'dpn_sales', 'super_admin');
CREATE TYPE podcast_status AS ENUM ('seeded', 'verified', 'approved_partner', 'featured_partner');
CREATE TYPE eoi_status AS ENUM ('draft', 'submitted', 'under_review', 'in_discussion', 'qualified', 'closed_won', 'closed_lost');
CREATE TYPE agency_status AS ENUM ('pending', 'approved', 'rejected');

-- PROFILES (Extended User Data linked to auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'creator',
  full_name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGENCIES
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  job_title TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  annual_media_spend TEXT,
  agency_type TEXT, -- Agency or Brand
  status agency_status DEFAULT 'pending',
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PODCASTS
CREATE TABLE podcasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES profiles(id), -- Null if seeded
  status podcast_status DEFAULT 'seeded',
  
  -- Basic Info
  show_name TEXT NOT NULL,
  description TEXT,
  host_name TEXT,
  primary_language TEXT,
  secondary_language TEXT,
  genre TEXT,
  categories TEXT[],
  network TEXT,
  country TEXT,
  
  -- Links & Identifiers
  youtube_url TEXT UNIQUE,
  channel_id TEXT UNIQUE,
  contact_email TEXT,
  spotify_url TEXT,
  apple_url TEXT,
  website_url TEXT,
  rss_feed TEXT,
  instagram_url TEXT,
  linkedin_url TEXT,
  
  -- Auto-Fetched / Seeded Metrics
  cover_art_url TEXT,
  thumbnail_url TEXT,
  subscriber_count BIGINT DEFAULT 0,
  follower_count BIGINT DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  total_videos INT DEFAULT 0,
  average_views BIGINT DEFAULT 0,
  engagement_rate DECIMAL(5,2),
  episode_count INT DEFAULT 0,
  estimated_reach BIGINT DEFAULT 0,
  
  -- Inventory Availability (JSONB to store boolean flags or details)
  inventory_availability JSONB DEFAULT '{"sponsorship": false, "host_read": false, "pre_roll": false, "mid_roll": false, "l_band": false, "lower_third": false}'::jsonb,
  
  -- Ranking
  dpn_score DECIMAL(10,2) DEFAULT 0,
  current_rank INT,
  previous_rank INT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- EXPRESSIONS OF INTEREST (EOIs)
CREATE TABLE eois (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id),
  status eoi_status DEFAULT 'draft',
  
  campaign_name TEXT NOT NULL,
  brand TEXT,
  agency TEXT,
  campaign_objective TEXT,
  start_date DATE,
  end_date DATE,
  target_audience TEXT,
  languages TEXT[],
  genres TEXT[],
  
  -- Target Podcasts
  desired_podcasts UUID[], -- Array of podcast IDs
  
  -- Requirements
  inventory_requested JSONB,
  budget_range TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RANKINGS HISTORY
CREATE TABLE ranking_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  podcast_id UUID REFERENCES podcasts(id),
  week_date DATE NOT NULL,
  rank INT NOT NULL,
  dpn_score DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Stub)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE podcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE eois ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_history ENABLE ROW LEVEL SECURITY;

-- Note: Actual RLS policies to be added based on the RBAC matrix.
