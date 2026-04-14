/**
 * OSCAR Scoring — Display Score Smoothing
 *
 * Formula: 60% today + 25% yesterday + 15% two days ago
 * Prevents wild swings from one day to the next.
 */

export function smoothScore(
  todayRaw: number,
  yesterdayDisplay: number | null,
  twoDaysAgoDisplay: number | null,
): number {
  // If no history, use raw score
  if (yesterdayDisplay === null) return Math.round(todayRaw);

  const yesterday = yesterdayDisplay;
  const twoDaysAgo = twoDaysAgoDisplay ?? yesterdayDisplay;

  const smoothed = (0.60 * todayRaw) + (0.25 * yesterday) + (0.15 * twoDaysAgo);
  return Math.round(Math.max(0, Math.min(100, smoothed)));
}
