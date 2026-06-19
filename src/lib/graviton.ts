export function calculateCustomRanking(
  video: { viewCount: number; publishedAt: string; engagementRate: number; viewsVelocity: number }, 
  subscriberCount: number
): number {
  if (subscriberCount === 0) return 0;

  // Estimate the 7-day cumulative views for this specific video
  const daysOld = Math.max(1, (Date.now() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
  const estimated7DayViews = video.viewsVelocity * Math.min(7, daysOld);

  // 1. Views Score (50 points) - Logarithmic scale (10M views = 50 points)
  // log10(10M) = 7. Let's use 7 as the max denominator.
  const rawLogViews = Math.log10(Math.max(1, estimated7DayViews));
  const viewsScore = Math.min(50, (rawLogViews / 7.0) * 50);
  
  // 2. Engagement Score (50 points) - Linear scale (8% = 50 points)
  const engScore = Math.min(50, (video.engagementRate / 8.0) * 50);
  
  const rawScore = viewsScore + engScore;
  
  return parseFloat(rawScore.toFixed(2));
}

// Aggregator that takes an array of recent videos, optionally VidIQ metrics, and outputs the final DPN score
export function calculateChannelGravitonScore(videos: any[], subscriberCount: number, vidiqCtr?: number) {
  if (!videos || videos.length === 0) {
    return { score: 0, views: 0, engagement: 0 };
  }

  let totalScore = 0;
  let totalViewsScore = 0;
  let totalEngScore = 0;

  for (const v of videos) {
    const daysOld = Math.max(1, (Date.now() - new Date(v.publishedAt).getTime()) / (1000 * 60 * 60 * 24));
    const estimated7DayViews = v.viewsVelocity * Math.min(7, daysOld);

    const rawLogViews = Math.log10(Math.max(1, estimated7DayViews));
    const viewsScore = Math.min(50, (rawLogViews / 7.0) * 50);
    
    const engScore = Math.min(50, (v.engagementRate / 8.0) * 50);

    totalViewsScore += viewsScore;
    totalEngScore += engScore;
    totalScore += (viewsScore + engScore);
  }

  const count = videos.length;
  
  // Return averages mapped back to 100 max points per category to display in UI
  return {
    score: parseFloat((totalScore / count).toFixed(1)),
    views: parseFloat((totalViewsScore / count).toFixed(1)),
    engagement: parseFloat((totalEngScore / count).toFixed(1)),
    // To not break existing UI that might be rendering these fields, return 0 for them
    recency: 0,
    velocity: 0
  };
}
