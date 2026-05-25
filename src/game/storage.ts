const HIGH_SCORE_KEY = "bug-squasher:high-score";

export function loadHighScore(): number {
  try {
    const stored = window.localStorage.getItem(HIGH_SCORE_KEY);
    return stored ? Number.parseInt(stored, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): void {
  try {
    window.localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // LocalStorage can be unavailable in private browsing modes.
  }
}
