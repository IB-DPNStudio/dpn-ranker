import fetch from 'node-fetch';
import fs from 'fs';

async function test() {
  const handle = "zahrajanishow";
  console.log(`Fetching @${handle}...`);
  const res = await fetch(`https://www.youtube.com/@${handle}/about`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });
  const html = await res.text();
  
  // Find channelId
  const channelIdMatch = html.match(/"channelId":"(UC[^"]+)"/);
  console.log("Channel ID Match:", channelIdMatch ? channelIdMatch[1] : "None");
  
  // Let's print some lines matching metadata or search for ytInitialData
  const ytInitialDataMatch = html.match(/var ytInitialData = ({.*?});<\/script>/);
  if (ytInitialDataMatch) {
    console.log("Found ytInitialData! Parsing...");
    try {
      const data = JSON.parse(ytInitialDataMatch[1]);
      
      // Let's write the JSON to a file for manual inspection
      fs.writeFileSync('yt_data.json', JSON.stringify(data, null, 2));
      console.log("Wrote data to yt_data.json");
      
      // Find aboutChannelViewModel recursively
      let aboutViewModel: any = null;
      function findAbout(obj: any) {
        if (!obj) return;
        if (typeof obj === 'object') {
          if ('aboutChannelViewModel' in obj) {
            aboutViewModel = obj.aboutChannelViewModel;
            return;
          }
          for (const key in obj) {
            findAbout(obj[key]);
          }
        }
      }
      findAbout(data);
      // Helper parsers
      function parseSubsCount(text: string): number {
        const clean = text.replace(/subscribers/i, '').trim();
        if (clean.endsWith('M')) {
          return parseFloat(clean.replace('M', '')) * 1000000;
        }
        if (clean.endsWith('K')) {
          return parseFloat(clean.replace('K', '')) * 1000;
        }
        return parseInt(clean.replace(/,/g, ''), 10) || 0;
      }

      function parseVideosCount(text: string): number {
        const clean = text.replace(/videos/i, '').replace(/,/g, '').trim();
        return parseInt(clean, 10) || 0;
      }

      function parseViewsCount(text: string): number {
        const clean = text.replace(/views/i, '').replace(/,/g, '').trim();
        return parseInt(clean, 10) || 0;
      }

      function classifyGenreAndLanguage(tags: string[], description: string, title: string) {
        const allText = (tags.join(' ') + ' ' + description + ' ' + title).toLowerCase();
        let language = "English";
        if (allText.includes("hindi") || allText.includes("हिंदी") || allText.includes("devanagari")) {
          language = "Hindi";
        } else if (allText.includes("marathi") || allText.includes("मराठी")) {
          language = "Marathi";
        } else if (allText.includes("tamil") || allText.includes("தமிழ்")) {
          language = "Tamil";
        }
        
        let genre = "Society & Culture";
        const financeKeywords = ["finance", "money", "investing", "stock", "mutual fund", "groww", "market", "startup", "business", "economics", "tax", "income"];
        const techKeywords = ["tech", "gadget", "technology", "mobile", "ai", "coding", "software", "review", "iphone", "android"];
        const healthKeywords = ["health", "diet", "fitness", "doctor", "workout", "nutrition", "weight loss", "gym", "medical", "disease", "cure"];
        const spiritualKeywords = ["spiritual", "meditation", "god", "wisdom", "soul", "yoga", "peace", "bk shivani", "guru", "life lessons"];
        const comedyKeywords = ["comedy", "funny", "standup", "roast", "joke", "entertainment", "bhadipa", "chalchitra"];
        const newsKeywords = ["news", "politics", "current affairs", "print", "deshbhakt", "lallantop", "journalist", "reporter", "govt", "government"];
        const musicKeywords = ["music", "song", "zee music", "singer", "album", "lyrics", "dance", "audio", "track"];
        const selfHelpKeywords = ["motivation", "self help", "growth", "think school", "mindset", "success", "habits", "productivity"];

        if (financeKeywords.some(kw => allText.includes(kw))) {
          genre = "Business & Finance";
        } else if (techKeywords.some(kw => allText.includes(kw))) {
          genre = "Technology";
        } else if (healthKeywords.some(kw => allText.includes(kw))) {
          genre = "Health & Wellness";
        } else if (spiritualKeywords.some(kw => allText.includes(kw))) {
          genre = "Spirituality";
        } else if (comedyKeywords.some(kw => allText.includes(kw))) {
          genre = "Comedy & Entertainment";
        } else if (newsKeywords.some(kw => allText.includes(kw))) {
          genre = "News & Politics";
        } else if (musicKeywords.some(kw => allText.includes(kw))) {
          genre = "Music";
        } else if (selfHelpKeywords.some(kw => allText.includes(kw))) {
          genre = "Self-Improvement";
        }
        return { genre, language };
      }

      // Extract metadata tags
      const metaTags = html.match(/<meta property="og:video:tag" content="([^"]+)">/g) || [];
      const tags = metaTags.map(tag => {
        const m = tag.match(/content="([^"]+)"/);
        return m ? m[1] : "";
      }).filter(Boolean);

      // Extract details
      const title = data.metadata?.channelMetadataRenderer?.title || "";
      const description = data.metadata?.channelMetadataRenderer?.description || "";
      const avatar = data.metadata?.channelMetadataRenderer?.avatar?.thumbnails?.[0]?.url || "";
      const channelId = data.metadata?.channelMetadataRenderer?.externalId || "";
      
      let subsText = "";
      let videosText = "";
      const pageHeader = data.header?.pageHeaderRenderer;
      if (pageHeader) {
        const vm = pageHeader.content?.pageHeaderViewModel;
        const rows = vm?.metadata?.contentMetadataViewModel?.metadataRows || [];
        for (const row of rows) {
          const parts = row.metadataParts || [];
          for (const part of parts) {
            const text = part.text?.content || "";
            if (text.includes("subscribers")) subsText = text;
            if (text.includes("videos")) videosText = text;
          }
        }
      }

      const viewsText = aboutViewModel?.viewCountText || "";
      
      const subscriber_count = parseSubsCount(subsText);
      const total_videos = parseVideosCount(videosText);
      const total_views = parseViewsCount(viewsText);
      const { genre, language } = classifyGenreAndLanguage(tags, description, title);

      console.log("--- Result Scraped ---");
      console.log({
        channelId,
        title,
        description: description.substring(0, 100) + "...",
        avatar,
        subscriber_count,
        total_videos,
        total_views,
        genre,
        language
      });

    } catch (e: any) {
      console.log("Failed to parse ytInitialData JSON:", e.message);
    }
  } else {
    console.log("Could not find ytInitialData in HTML");
  }
}

test();
