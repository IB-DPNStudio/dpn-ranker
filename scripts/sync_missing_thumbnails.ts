import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  console.log("Fetching podcasts with missing or placeholder thumbnails...");
  const { data: podcasts, error } = await supabase
    .from('podcasts')
    .select('id, show_name, youtube_url, thumbnail_url, channel_id')
    .like('thumbnail_url', '%picsum.photos%');

  if (error || !podcasts) {
    console.error("Error fetching podcasts:", error);
    return;
  }

  console.log(`Found ${podcasts.length} podcasts needing sync.`);

  for (const podcast of podcasts) {
    if (!podcast.youtube_url) {
      console.log(`Skipping ${podcast.show_name} - no youtube_url.`);
      continue;
    }

    console.log(`Syncing ${podcast.show_name} (${podcast.youtube_url})...`);
    
    try {
      const res = await fetch(podcast.youtube_url + '/about', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });
      const html = await res.text();

      // Find channelId
      const channelIdMatch = html.match(/"channelId":"(UC[^"]+)"/);
      const channelId = channelIdMatch ? channelIdMatch[1] : podcast.channel_id;

      // Find avatar
      let avatar = podcast.thumbnail_url;
      const ytInitialDataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);
      if (ytInitialDataMatch) {
        try {
          const data = JSON.parse(ytInitialDataMatch[1]);
          avatar = data.metadata?.channelMetadataRenderer?.avatar?.thumbnails?.[0]?.url || avatar;
        } catch (e) {}
      }

      console.log(`  -> Found ID: ${channelId}`);
      console.log(`  -> Found Avatar: ${avatar}`);

      if (channelId !== podcast.channel_id || avatar !== podcast.thumbnail_url) {
        await supabase
          .from('podcasts')
          .update({ 
            channel_id: channelId,
            thumbnail_url: avatar 
          })
          .eq('id', podcast.id);
        console.log(`  -> Successfully updated DB for ${podcast.show_name}`);
      }

    } catch (e: any) {
      console.error(`  -> Failed to sync ${podcast.show_name}: ${e.message}`);
    }
  }
}

run();
