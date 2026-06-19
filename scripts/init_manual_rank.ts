import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Fetching podcasts to initialize manual rank...");
  
  const { data: podcasts, error } = await supabase
    .from('podcasts')
    .select('id, dpn_score')
    .order('dpn_score', { ascending: false });

  if (error || !podcasts) {
    console.error("Error fetching podcasts:", error);
    return;
  }

  const fs = require('fs');
  const filepath = path.join(process.cwd(), 'public', 'graviton_data.json');
  let data: any = {};
  try {
    data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch(e) {}

  for (let i = 0; i < podcasts.length; i++) {
    const podcast = podcasts[i];
    const newRank = (i + 1) * 10;
    
    data[podcast.id] = { ...(data[podcast.id] || {}), manual_rank: newRank, is_score_hidden: false };
  }

  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log("Done initializing manual ranks in graviton_data.json!");
}

run();
