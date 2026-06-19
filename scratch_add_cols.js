require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  console.log("Please run this in your Supabase SQL editor:");
  console.log("ALTER TABLE podcasts ADD COLUMN IF NOT EXISTS latest_video_id TEXT;");
  console.log("ALTER TABLE podcasts ADD COLUMN IF NOT EXISTS latest_short_id TEXT;");
}
run();
