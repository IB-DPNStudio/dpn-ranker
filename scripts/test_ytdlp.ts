import { execSync } from 'child_process';

function testYtDlp(channelUrl: string) {
  console.log(`Testing yt-dlp on ${channelUrl}`);
  try {
    // We get the first 5 entries from the channel.
    // Using --flat-playlist is faster, but --dump-json without flat-playlist gets full metadata.
    // However, getting 5 full videos metadata from a channel is fast enough.
    const command = `python -m yt_dlp --dump-json --playlist-end 5 "${channelUrl}"`;
    const output = execSync(command, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'], maxBuffer: 10 * 1024 * 1024 });
    
    const lines = output.trim().split('\n');
    const videos = lines.filter(l => l.trim().length > 0).map(l => JSON.parse(l));

    console.log(`Successfully fetched ${videos.length} videos!`);
    
    videos.forEach((v, idx) => {
      console.log(`\nVideo ${idx + 1}: ${v.title}`);
      console.log(`  ID: ${v.id}`);
      console.log(`  Views: ${v.view_count}`);
      console.log(`  Duration: ${v.duration}s`);
      console.log(`  Likes: ${v.like_count}`);
      console.log(`  Comments: ${v.comment_count}`);
      console.log(`  Uploaded: ${v.upload_date}`);
      
      // Heuristic for short: if it's less than 60s or marked as a short
      const isShort = v.duration <= 60;
      console.log(`  Is Short? ${isShort}`);
    });

  } catch (error: any) {
    console.error("Error executing yt-dlp:", error.message);
  }
}

// Test with Ranveer Allahbadia's channel
testYtDlp("https://www.youtube.com/channel/UCPxMZIFE856tbTfdkdjzTSQ");
