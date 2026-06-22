-- Run this script in your Supabase SQL Editor to support latest video tracking.

ALTER TABLE podcasts
ADD COLUMN IF NOT EXISTS latest_video_url TEXT,
ADD COLUMN IF NOT EXISTS latest_short_url TEXT;
