async function testFetchChannelId() {
  const handle = "zahrajanishow";
  try {
    const url = `https://www.youtube.com/@${handle}/about`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    });
    const htmlText = await res.text();
    const ytInitialDataMatch = htmlText.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!ytInitialDataMatch) {
      console.log("no initial data");
      return;
    }
    const data = JSON.parse(ytInitialDataMatch[1]);
    const channelId = data.metadata?.channelMetadataRenderer?.externalId;
    console.log("Channel ID:", channelId);
  } catch (err) {
    console.error(err);
  }
}
testFetchChannelId();
