import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelEndpoint = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,topicDetails,contentDetails&forHandle=@MoS-Pod&key=${apiKey}`;
  const res = await fetch(channelEndpoint);
  const data = await res.json();
  const uploadsId = data.items[0].contentDetails.relatedPlaylists.uploads;

  const playlistEndpoint = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${uploadsId}&maxResults=10&key=${apiKey}`;
  const pRes = await fetch(playlistEndpoint);
  const pData = await pRes.json();
  
  const videoIds = pData.items.map((i:any) => i.contentDetails.videoId).join(',');
  const videosEndpoint = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${apiKey}`;
  const vRes = await fetch(videosEndpoint);
  const vData = await vRes.json();
  
  for (const v of vData.items) {
    console.log(`Video: ${v.snippet.title}, Duration: ${v.contentDetails.duration}`);
  }
}

run();
