import { KakuroCell, KakuroRun } from './types.js';

export function solveKakuro(
  grid: KakuroCell[][],
  runs: KakuroRun[],
  maxSolutions = 2
): number[][][] {
  if (!grid.length || !grid[0].length) return [];

  const rows = grid.length;
  const cols = grid[0].length;

  const currentGrid: (number | null)[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) =>
      grid[r][c].type === 'white' ? (grid[r][c].value ?? null) : null
    )
  );

  const whiteCells: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type === 'white') {
        whiteCells.push([r, c]);
      }
    }
  }

  // Pre-index runs touching each cell
  const cellRuns = new Map<string, { across?: KakuroRun; down?: KakuroRun }>();
  for (const cell of whiteCells) {
    const key = `${cell[0]},${cell[1]}`;
    cellRuns.set(key, {});
  }
  for (const run of runs) {
    for (const [r, c] of run.cells) {
      const entry = cellRuns.get(`${r},${c}`);
      if (entry) {
        if (run.direction === 'across') entry.across = run;
        else entry.down = run;
      }
    }
  }

  const solutions: number[][][] = [];

  function isRunValid(run: KakuroRun): boolean {
    const digits: number[] = [];
    let sum = 0;
    let unfilled = 0;

    for (const [r, c] of run.cells) {
      const val = currentGrid[r][c];
      if (val === null) {
        unfilled++;
      } else {
        if (digits.includes(val)) return false; // Duplicate digit
        digits.push(val);
        sum += val;
      }
    }

    if (sum > run.targetSum) return false;
    if (unfilled === 0 && sum !== run.targetSum) return false;

    // Feasibility check: Can remaining unfilled cells mathematically reach targetSum?
    if (unfilled > 0) {
      const remainingSum = run.targetSum - sum;
      const availableDigits: number[] = [];
      for (let d = 1; d <= 9; d++) {
        if (!digits.includes(d)) availableDigits.push(d);
      }
      if (availableDigits.length < unfilled) return false;

      let minPossible = 0;
      for (let i = 0; i < unfilled; i++) minPossible += availableDigits[i];
      if (minPossible > remainingSum) return false;

      let maxPossible = 0;
      for (let i = 0; i < unfilled; i++) {
        maxPossible += availableDigits[availableDigits.length - 1 - i];
      }
      if (maxPossible < remainingSum) return false;
    }

    return true;
  }

  function getCandidates(r: number, c: number): number[] {
    const entry = cellRuns.get(`${r},${c}`);
    const usedDigits = new Set<number>();

    if (entry?.across) {
      for (const [ar, ac] of entry.across.cells) {
        const v = currentGrid[ar][ac];
        if (v !== null) usedDigits.add(v);
      }
    }
    if (entry?.down) {
      for (const [dr, dc] of entry.down.cells) {
        const v = currentGrid[dr][dc];
        if (v !== null) usedDigits.add(v);
      }
    }

    const candidates: number[] = [];
    for (let d = 1; d <= 9; d++) {
      if (usedDigits.has(d)) continue;
      currentGrid[r][c] = d;
      let valid = true;
      if (entry?.across && !isRunValid(entry.across)) valid = false;
      if (valid && entry?.down && !isRunValid(entry.down)) valid = false;
      currentGrid[r][c] = null;
      if (valid) candidates.push(d);
    }

    return candidates;
  }

  function backtrack() {
    if (solutions.length >= maxSolutions) return;

    // Pick unassigned cell with MRV (fewest candidates)
    let bestCell: [number, number] | null = null;
    let bestCandidates: number[] | null = null;

    for (const [r, c] of whiteCells) {
      if (currentGrid[r][c] !== null) continue;
      const candidates = getCandidates(r, c);
      if (candidates.length === 0) return; // Dead end

      if (bestCandidates === null || candidates.length < bestCandidates.length) {
        bestCell = [r, c];
        bestCandidates = candidates;
        if (candidates.length === 1) break; // Optimal choice
      }
    }

    if (bestCell === null) {
      // All white cells filled successfully!
      const sol: number[][] = currentGrid.map((row) =>
        row.map((val) => (val === null ? 0 : val))
      );
      solutions.push(sol);
      return;
    }

    const [br, bc] = bestCell;
    for (const val of bestCandidates!) {
      currentGrid[br][bc] = val;
      backtrack();
      currentGrid[br][bc] = null;
      if (solutions.length >= maxSolutions) return;
    }
  }

  backtrack();
  return solutions;
}
