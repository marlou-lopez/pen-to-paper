/**
 * Simple Linear Congruential Generator for reproducible pseudo-random numbers.
 */
function createRng(seedInput?: number | string): () => number {
  let seed = 123456789;
  if (typeof seedInput === 'number') {
    seed = seedInput;
  } else if (typeof seedInput === 'string') {
    let hash = 0;
    for (let i = 0; i < seedInput.length; i++) {
      hash = (hash << 5) - hash + seedInput.charCodeAt(i);
      hash |= 0;
    }
    seed = Math.abs(hash) || 123456789;
  } else {
    seed = Math.floor(Math.random() * 2147483647);
  }

  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle using seeded RNG.
 */
function shuffle<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates an N x N Latin square using backtracking.
 */
export function generateLatinSquare(size: number, seed?: number | string): number[][] {
  const clampedSize = Math.max(3, Math.min(9, size));
  const rng = createRng(seed);

  const grid: number[][] = Array.from({ length: clampedSize }, () =>
    Array(clampedSize).fill(0)
  );

  const numbers = Array.from({ length: clampedSize }, (_, i) => i + 1);

  function isSafe(row: number, col: number, num: number): boolean {
    for (let c = 0; c < clampedSize; c++) {
      if (grid[row][c] === num) return false;
    }
    for (let r = 0; r < clampedSize; r++) {
      if (grid[r][col] === num) return false;
    }
    return true;
  }

  function solve(row: number, col: number): boolean {
    if (row === clampedSize) return true;
    const nextRow = col === clampedSize - 1 ? row + 1 : row;
    const nextCol = col === clampedSize - 1 ? 0 : col + 1;

    const candidateNumbers = shuffle(numbers, rng);
    for (const num of candidateNumbers) {
      if (isSafe(row, col, num)) {
        grid[row][col] = num;
        if (solve(nextRow, nextCol)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  solve(0, 0);
  return grid;
}
