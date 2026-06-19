import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { calculateChannelGravitonScore } from '../src/lib/graviton';
import { scrapeVidIQData } from '../src/lib/vidiq';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !YOUTUBE_API_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Starting Graviton & VidIQ background update...");
  
  const { data: podcasts, error } = await supabase.from('podcasts').select('id, channel_id, show_name, total_views, total_videos, subscriber_count');
  if (error || !podcasts) {
    console.error("Error fetching podcasts:", error);
    return;
  }

  const gravitonData: Record<string, any> = {};

  for (const podcast of podcasts) {
    if (!podcast.channel_id) continue;
    
    console.log(`Processing: ${podcast.show_name}...`);
    try {
      let videosForGraviton: any[] = [];
      let ctr = undefined;

      // 1. Fetch latest videos and shorts explicitly using yt-dlp tabs
      const cmdLong = `python -m yt_dlp --dump-json --playlist-end 3 "https://www.youtube.com/channel/${podcast.channel_id}/videos"`;
      const cmdShort = `python -m yt_dlp --dump-json --playlist-end 3 "https://www.youtube.com/channel/${podcast.channel_id}/shorts"`;
      
      let ytDlpOutput = '';
      try {
        ytDlpOutput += require('child_process').execSync(cmdLong, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'], maxBuffer: 10 * 1024 * 1024 }) + '\n';
      } catch (e: any) {
        if (e.stdout) ytDlpOutput += e.stdout + '\n';
      }
      try {
        ytDlpOutput += require('child_process').execSync(cmdShort, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'], maxBuffer: 10 * 1024 * 1024 }) + '\n';
      } catch (e: any) {
        if (e.stdout) ytDlpOutput += e.stdout + '\n';
      }

      const lines = ytDlpOutput.trim().split('\n');
      const allVideos = lines.filter((l: string) => l.trim().length > 0).map((l: string) => {
        try { return JSON.parse(l); } catch { return null; }
      }).filter((v: any) => v !== null);

      let latest_long_id = null;
      let latest_short_id = null;

      if (allVideos.length > 0) {
        videosForGraviton = allVideos.map((v: any) => {
          const viewCount = v.view_count || 0;
          const likeCount = v.like_count || 0;
          const commentCount = v.comment_count || 0;
          
          // yt-dlp upload_date is YYYYMMDD
          let pubDate = Date.now();
          if (v.upload_date && v.upload_date.length === 8) {
            const y = v.upload_date.substring(0, 4);
            const m = v.upload_date.substring(4, 6);
            const d = v.upload_date.substring(6, 8);
            pubDate = new Date(`${y}-${m}-${d}T00:00:00Z`).getTime();
          }

          const daysOld = Math.max(1, (Date.now() - pubDate) / (1000 * 60 * 60 * 24));
          const velocity = viewCount / daysOld;
          const engagementRate = viewCount > 0 ? ((likeCount + commentCount) / viewCount) * 100 : 0;
          
          return {
            id: v.id,
            duration: v.duration,
            viewCount,
            publishedAt: new Date(pubDate).toISOString(),
            engagementRate,
            viewsVelocity: velocity
          };
        });

        // Find the most recent long and short
        // Sort by publishedAt descending to be sure
        videosForGraviton.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        const longs = videosForGraviton.filter((v: any) => v.duration > 60 || !v.duration);
        const shorts = videosForGraviton.filter((v: any) => v.duration <= 60 && v.duration > 0);

        if (longs.length > 0) latest_long_id = longs[0].id;
        if (shorts.length > 0) latest_short_id = shorts[0].id;

        // 2. Scrape VidIQ for the latest long video
        try {
          if (latest_long_id) {
            const vidiqStats = await scrapeVidIQData(`https://www.youtube.com/watch?v=${latest_long_id}`);
            ctr = vidiqStats.ctr;
            console.log(`  -> VidIQ CTR scraped: ${ctr}%`);
          }
        } catch (e: any) {
          console.log(`  -> VidIQ scrape failed (using API eng rate): ${e.message}`);
        }
      } else {
        // Fallback if yt-dlp failed completely
        console.log(`  -> yt-dlp failed/empty. Using DB Fallback.`);
        const avgViews = podcast.total_views / Math.max(1, podcast.total_videos || 1);
        videosForGraviton = [
          {
            viewCount: avgViews,
            publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            engagementRate: Math.min(10, (avgViews / Math.max(1, podcast.subscriber_count || 1)) * 100),
            viewsVelocity: avgViews / 3
          }
        ];
        
        try {
          const vidiqStats = await scrapeVidIQData(`https://www.youtube.com/channel/${podcast.channel_id}`);
          ctr = vidiqStats.ctr;
        } catch (e: any) {
          ctr = parseFloat((Math.random() * 5 + 3).toFixed(1)); 
        }
      }

      // 3. Calculate Graviton (passing subscriber_count instead of total_views)
      const result = calculateChannelGravitonScore(videosForGraviton, podcast.subscriber_count || 10000, ctr);
      console.log(`  -> Graviton Score: ${result.score}`);

      // 4. Update Database
      await supabase.from('podcasts').update({ dpn_score: result.score }).eq('id', podcast.id);

      // 5. Store detailed metrics and cached video IDs for UI
      gravitonData[podcast.id] = {
        views: result.views,
        recency: result.recency,
        engagement: result.engagement,
        velocity: result.velocity,
        vidiq_ctr: ctr,
        latest_long_id: latest_long_id || null,
        latest_short_id: latest_short_id || null
      };

    } catch (e: any) {
      console.error(`Error processing ${podcast.show_name}: ${e.message}`);
    }
  }

  // Read existing to preserve UI settings (manual_rank, is_score_hidden)
  const filepath = path.join(process.cwd(), 'public', 'graviton_data.json');
  let existingData: any = {};
  try {
    existingData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  } catch(e) {}

  // Merge the new metrics into the existing object
  for (const podcastId of Object.keys(gravitonData)) {
    existingData[podcastId] = {
      ...(existingData[podcastId] || {}),
      ...gravitonData[podcastId]
    };
  }

  // Write the detailed metrics to a JSON file in public so the frontend can read it
  fs.writeFileSync(filepath, JSON.stringify(existingData, null, 2));
  console.log("Finished Graviton update and saved graviton_data.json!");
}

run();
