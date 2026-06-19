import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

async function test() {
  const channelId = "UCm_x0I3U8W7aF1WkM5x1Jng"; // Example channel
  console.log("Fetching for:", channelId);
  const res = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=5`);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

test();
