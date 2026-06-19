import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Local inline copy since this runs as a TS node script outside Next.js module resolution sometimes
export function calculateDPNScoreBreakdown(subs: number, views: number, videos: number) {
  if (!subs || subs < 1) return { score: 0, reach: 0, volume: 0, quality: 0 };
  
  const v = views || 0;
  const vid = videos || 1;
  const avg_views = v / vid;
  const ratio = avg_views / subs;

  let logSubs = Math.log10(subs);
  let reachScore = ((logSubs - 4) / 3) * 40;
  reachScore = Math.max(0, Math.min(40, reachScore));

  let logAvgViews = avg_views > 0 ? Math.log10(avg_views) : 0;
  let volScore = ((logAvgViews - 3) / 3) * 30;
  volScore = Math.max(0, Math.min(30, volScore));

  let qualScore = (ratio / 0.5) * 30;
  qualScore = Math.max(0, Math.min(30, qualScore));

  const totalScore = reachScore + volScore + qualScore;
  const finalScore = parseFloat(Math.min(99.9, Math.max(1.0, totalScore)).toFixed(1));

  return {
     score: finalScore,
     reach: parseFloat(reachScore.toFixed(1)),
     volume: parseFloat(volScore.toFixed(1)),
     quality: parseFloat(qualScore.toFixed(1))
  };
}

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function recalculate() {
  console.log("Fetching all podcasts...");
  const { data: podcasts, error } = await supabase.from('podcasts').select('id, subscriber_count, total_views, total_videos, show_name');
  
  if (error || !podcasts) {
    console.error("Error fetching:", error);
    return;
  }

  console.log(`Found ${podcasts.length} podcasts to recalculate.`);

  for (const p of podcasts) {
    const calc = calculateDPNScoreBreakdown(p.subscriber_count, p.total_views, p.total_videos);
    
    console.log(`Updating ${p.show_name}: new score ${calc.score} (R:${calc.reach}, V:${calc.volume}, Q:${calc.quality})`);
    
    const { error: updateError } = await supabase
      .from('podcasts')
      .update({ dpn_score: calc.score })
      .eq('id', p.id);
      
    if (updateError) {
      console.error(`Failed to update ${p.show_name}:`, updateError.message);
    }
  }
  
  console.log("Done recalculating!");
}

recalculate();
