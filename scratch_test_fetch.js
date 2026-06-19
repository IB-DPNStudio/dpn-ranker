const fetch = require('node-fetch');

async function testFetchVideos() {
  const handle = "zahrajanishow";
  try {
    const url = `https://www.youtube.com/@${handle}/videos`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }
    });
    const htmlText = await res.text();
    const ytInitialDataMatch = htmlText.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!ytInitialDataMatch) {
      console.log("no initial data");
      return;
    }
    const data = JSON.parse(ytInitialDataMatch[1]);
    
    // find video ids
    let latestVideoId = null;
    function findVideoId(obj) {
      if (latestVideoId) return;
      if (!obj) return;
      if (typeof obj === 'object') {
        if (obj.videoId) {
          latestVideoId = obj.videoId;
          return;
        }
        for (const key in obj) {
          findVideoId(obj[key]);
        }
      }
    }
    findVideoId(data);
    console.log("Latest video ID:", latestVideoId);
  } catch (err) {
    console.error(err);
  }
}
testFetchVideos();
