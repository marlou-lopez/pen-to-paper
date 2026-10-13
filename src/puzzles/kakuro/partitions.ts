export function getKakuroPartitions(length: number, sum: number): number[][] {
  if (length <= 0 || length > 9 || sum <= 0) return [];
  const minSum = (length * (length + 1)) / 2;
  const maxSum = (length * (19 - length)) / 2;
  if (sum < minSum || sum > maxSum) return [];

  const results: number[][] = [];

  function backtrack(startDigit: number, current: number[], currentSum: number) {
    if (current.length === length) {
      if (currentSum === sum) {
        results.push([...current]);
      }
      return;
    }

    const remainingCount = length - current.length;
    for (let d = startDigit; d <= 9; d++) {
      const minPossible = currentSum + d + (remainingCount - 1) * (2 * d + remainingCount) / 2;
      if (minPossible > sum) break;

      backtrack(d + 1, [...current, d], currentSum + d);
    }
  }

  backtrack(1, [], 0);
  return results;
}
