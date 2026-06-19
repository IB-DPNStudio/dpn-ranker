import { chromium } from 'playwright';

export async function scrapeVidIQData(videoUrl: string) {
  const VIDIQ_EMAIL = "asg.ashwin@gmail.com";
  const VIDIQ_PASSWORD = process.env.VIDIQ_PASSWORD || "Goodboy*****";

  if (!VIDIQ_PASSWORD) {
    throw new Error("VIDIQ_PASSWORD environment variable is missing.");
  }

  // To run headless efficiently
  const browser = await chromium.launch({ 
    headless: true 
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('https://app.vidiq.com/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"], input[name="email"]', VIDIQ_EMAIL);
    await page.fill('input[type="password"], input[name="password"]', VIDIQ_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    await page.goto(`https://app.vidiq.com/videos/insights?url=${encodeURIComponent(videoUrl)}`);
    await page.waitForTimeout(3000); 

    // We use mocked data here for stability in the backend pipeline until the exact DOM selectors are identified
    const mockData = {
      ctr: parseFloat((Math.random() * 10 + 2).toFixed(2)), // 2-12%
      watchTimeHours: parseFloat((Math.random() * 1000 + 100).toFixed(1)),
      seoScore: Math.floor(Math.random() * 30 + 70), // 70-100
    };

    return mockData;

  } catch (error) {
    console.error("Error scraping vidIQ:", error);
    throw error;
  } finally {
    await browser.close();
  }
}
