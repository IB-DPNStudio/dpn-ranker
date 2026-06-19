"use server";

export async function fetchLatestYouTubeVideos(channelId: string) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      throw new Error("YouTube API Key is missing");
    }

    if (!channelId || !channelId.startsWith('UC')) {
       // If no valid channel ID, return mock or null
       return { longVideoId: null, shortVideoId: null };
    }

    // The Uploads playlist ID is the channel ID with UC replaced by UU
    const uploadsPlaylistId = channelId.replace('UC', 'UU');

    // 1. Fetch latest 15 videos from the uploads playlist
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=15&key=${apiKey}`;
    const playlistRes = await fetch(playlistUrl, { next: { revalidate: 3600 } });
    if (!playlistRes.ok) {
      console.error("Failed to fetch playlist items:", await playlistRes.text());
      return { longVideoId: null, shortVideoId: null };
    }
    
    const playlistData = await playlistRes.json();
    const items = playlistData.items || [];
    if (items.length === 0) {
      return { longVideoId: null, shortVideoId: null };
    }

    const videoIds = items.map((item: any) => item.snippet.resourceId.videoId).join(',');

    // 2. Fetch video details to get duration
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`;
    const videosRes = await fetch(videosUrl, { next: { revalidate: 3600 } });
    if (!videosRes.ok) {
      console.error("Failed to fetch video details:", await videosRes.text());
      return { longVideoId: null, shortVideoId: null };
    }

    const videosData = await videosRes.json();
    const videos = videosData.items || [];

    let latestLong: string | null = null;
    let latestShort: string | null = null;

    for (const video of videos) {
      const durationStr = video.contentDetails.duration; // e.g. "PT1M15S", "PT45S"
      const isShort = parseISO8601DurationToSeconds(durationStr) <= 60 || video.snippet?.title?.toLowerCase().includes('#shorts');
      
      if (isShort && !latestShort) {
        latestShort = video.id;
      } else if (!isShort && !latestLong) {
        latestLong = video.id;
      }

      if (latestLong && latestShort) break;
    }

    // Fallback if one is missing
    if (!latestLong && videos.length > 0) latestLong = videos[0].id;
    if (!latestShort && videos.length > 0) latestShort = videos[0].id;

    return { longVideoId: latestLong, shortVideoId: latestShort };

  } catch (error) {
    console.error("Error in fetchLatestYouTubeVideos:", error);
    return { longVideoId: null, shortVideoId: null };
  }
}

function parseISO8601DurationToSeconds(duration: string): number {
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;
  
  const hours = (parseInt(match[1]) || 0) * 3600;
  const minutes = (parseInt(match[2]) || 0) * 60;
  const seconds = (parseInt(match[3]) || 0);
  
  return hours + minutes + seconds;
}
