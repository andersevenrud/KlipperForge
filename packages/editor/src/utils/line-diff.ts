/**
 * Computes 1-based line numbers in `current` that differ from `baseline`
 * using an LCS (Longest Common Subsequence) approach.
 */
export function computeChangedLines(baseline: string, current: string): number[] {
  if (baseline === current) return [];

  const baseLines = baseline.split("\n");
  const currLines = current.split("\n");
  const m = baseLines.length;
  const n = currLines.length;

  // Build LCS DP table
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (baseLines[i - 1] === currLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to find which lines in current are NOT part of the LCS
  const inLCS = new Set<number>();
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (baseLines[i - 1] === currLines[j - 1]) {
      inLCS.add(j);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  // Lines not in LCS are changed/added — return as 1-based line numbers
  const changed: number[] = [];
  for (let line = 1; line <= n; line++) {
    if (!inLCS.has(line)) {
      changed.push(line);
    }
  }

  return changed;
}
