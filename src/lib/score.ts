export function calculateDPNScoreBreakdown(subs: number, views: number, videos: number) {
  if (!subs || subs < 1) return { score: 0, reach: 0, volume: 0, quality: 0 };
  
  const v = views || 0;
  const vid = videos || 1; // avoid division by zero
  
  const avg_views = v / vid;
  const ratio = avg_views / subs;

  // A: Reach (40 pts max)
  // 10k subs (log 4) = 0 pts. 10M subs (log 7) = 40 pts.
  let logSubs = Math.log10(subs);
  let reachScore = ((logSubs - 4) / 3) * 40;
  reachScore = Math.max(0, Math.min(40, reachScore));

  // B: Volume (30 pts max)
  // 1k avg views (log 3) = 0 pts. 1M avg views (log 6) = 30 pts.
  let logAvgViews = avg_views > 0 ? Math.log10(avg_views) : 0;
  let volScore = ((logAvgViews - 3) / 3) * 30;
  volScore = Math.max(0, Math.min(30, volScore));

  // C: Quality (30 pts max)
  // Ratio of 0.5 (50%) = 30 pts.
  let qualScore = (ratio / 0.5) * 30;
  qualScore = Math.max(0, Math.min(30, qualScore));

  const totalScore = reachScore + volScore + qualScore;
  const finalScore = parseFloat(Math.min(99.9, Math.max(1.0, totalScore)).toFixed(1));

  return {
     score: finalScore,
     reach: parseFloat(reachScore.toFixed(1)),
     volume: parseFloat(volScore.toFixed(1)),
     quality: parseFloat(qualScore.toFixed(1))
  };
}
