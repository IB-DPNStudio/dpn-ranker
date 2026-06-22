import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { calculateDPNScoreBreakdown } from '../src/lib/score';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
  const adminDbClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const youtubeUrl = 'https://www.youtube.com/@MoS-Pod';
  const apiKey = process.env.YOUTUBE_API_KEY;
  const cleanUrl = youtubeUrl.trim().replace(/\/+$/, '');
  let showName = cleanUrl.split('/').pop() || youtubeUrl;
  let description = "";
  let coverArt = "";
  let subscriberCount = 0;
  let totalViews = 0;
  let totalVideos = 0;
  let dpnScore = 0;
  let genre = "General";
  let latestVideoUrl = "";
  let latestShortUrl = "";
  
  if (apiKey) {
    let channelIdOrHandle = cleanUrl.split('/').pop()?.split('?')[0] || '';
    let endpoint = '';
    
    if (channelIdOrHandle.startsWith('@')) {
      endpoint = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,topicDetails,contentDetails&forHandle=${encodeURIComponent(channelIdOrHandle)}&key=${apiKey}`;
    }

    if (endpoint) {
      const res = await fetch(endpoint);
      if (res.ok) {
         const data = await res.json();
         if (data.items && data.items.length > 0) {
            const ch = data.items[0];
            showName = ch.snippet.title;
            description = ch.snippet.description;
            coverArt = ch.snippet.thumbnails?.high?.url || ch.snippet.thumbnails?.default?.url;
            subscriberCount = parseInt(ch.statistics?.subscriberCount || '0');
            totalViews = parseInt(ch.statistics?.viewCount || '0');
            totalVideos = parseInt(ch.statistics?.videoCount || '0');
            
            const calc = calculateDPNScoreBreakdown(subscriberCount, totalViews, totalVideos);
            dpnScore = calc.score;
            
            if (ch.topicDetails?.topicCategories?.length > 0) {
              const topicUrl = ch.topicDetails.topicCategories[0];
              const topicRaw = topicUrl.split('/').pop()?.replace(/_/g, ' ').replace(/\(sociology\)/g, '').trim() || 'General';
              const lowerTopic = topicRaw.toLowerCase();
              if (lowerTopic.includes('music')) genre = 'Music';
              else if (lowerTopic.includes('game') || lowerTopic.includes('gaming')) genre = 'Gaming';
              else if (lowerTopic.includes('lifestyle')) genre = 'Lifestyle';
              else if (lowerTopic.includes('entertainment')) genre = 'Entertainment';
              else if (lowerTopic.includes('technology')) genre = 'Technology';
              else if (lowerTopic.includes('business')) genre = 'Business';
              else if (lowerTopic.includes('society')) genre = 'Society & Culture';
              else if (lowerTopic.includes('sports')) genre = 'Sports';
              else if (lowerTopic.includes('knowledge') || lowerTopic.includes('education')) genre = 'Education';
              else genre = topicRaw;
            }

            // Fetch latest shorts and longs
            try {
              const uploadsId = ch.contentDetails?.relatedPlaylists?.uploads;
              if (uploadsId) {
                const pRes = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=20&key=${apiKey}`);
                const pData = await pRes.json();
                if (pData.items && pData.items.length > 0) {
                  const videoIds = pData.items.map((i:any) => i.contentDetails.videoId).join(',');
                  const vRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds}&key=${apiKey}`);
                  const vData = await vRes.json();
                  
                  if (vData.items) {
                    for (const v of vData.items) {
                      const durationStr = v.contentDetails?.duration || '';
                      const title = v.snippet?.title || '';
                      
                      const parseDuration = (d: string) => {
                        const match = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
                        if (!match) return 0;
                        return parseInt(match[1] || '0') * 3600 + parseInt(match[2] || '0') * 60 + parseInt(match[3] || '0');
                      };
                      
                      const durationSec = parseDuration(durationStr);
                      const isShort = durationSec <= 60 || title.toLowerCase().includes('#shorts');
                      
                      if (isShort && !latestShortUrl) {
                        latestShortUrl = `https://www.youtube.com/watch?v=${v.id}`;
                      } else if (!isShort && !latestVideoUrl) {
                        latestVideoUrl = `https://www.youtube.com/watch?v=${v.id}`;
                      }
                      if (latestShortUrl && latestVideoUrl) break;
                    }
                  }
                }
              }
            } catch (err) {
              console.error("Failed to fetch latest videos", err);
            }
         }
      }
    }
  }
  
  await adminDbClient.from("podcasts").delete().eq("youtube_url", youtubeUrl);
  try {
    const { error } = await adminDbClient.from("podcasts").insert({
      status: 'seeded',
      youtube_url: youtubeUrl,
      show_name: showName,
      description: description,
      cover_art_url: coverArt,
      thumbnail_url: coverArt,
      subscriber_count: subscriberCount,
      total_views: totalViews,
      total_videos: totalVideos,
      dpn_score: dpnScore,
      primary_language: 'Unknown',
      genre: genre,
      latest_video_url: latestVideoUrl,
      latest_short_url: latestShortUrl
    });
    
    if (error) {
      console.error("Supabase Error:", error);
    } else {
      console.log("Success! Re-seeded @MoS-Pod");
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

run();
