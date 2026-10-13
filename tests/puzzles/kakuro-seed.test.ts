import { describe, it, expect } from 'vitest';
import { getSeedKakuro, SEED_KAKURO_PUZZLES } from '../../src/puzzles/kakuro/seed-bank.ts';
import { solveKakuro } from '../../src/puzzles/kakuro/solver.ts';

describe('Kakuro Seed Bank', () => {
  it('contains at least 18 verified puzzles (across 6, 8, 10 sizes and easy/medium/hard)', () => {
    expect(SEED_KAKURO_PUZZLES.length).toBeGreaterThanOrEqual(18);
  });

  it('guarantees every seed puzzle has unique solutions matching target clue sums', () => {
    for (const puzzle of SEED_KAKURO_PUZZLES) {
      const solutions = solveKakuro(puzzle.grid, puzzle.runs, 2);
      expect(solutions, `Puzzle ${puzzle.title} must have exactly 1 solution`).toHaveLength(1);

      // Verify digits in each run sum to targetSum without duplicates
      for (const run of puzzle.runs) {
        const digits = run.cells.map(([r, c]) => puzzle.grid[r][c].solution!);
        expect(new Set(digits).size).toBe(digits.length);
        const sum = digits.reduce((a, b) => a + b, 0);
        expect(sum).toBe(run.targetSum);
      }
    }
  });

  it('returns deterministic puzzle copies on getSeedKakuro', () => {
    const p1 = getSeedKakuro(8, 'medium', '2026-10-13');
    const p2 = getSeedKakuro(8, 'medium', '2026-10-13');
    expect(p1.title).toBe(p2.title);
    expect(p1.size).toBe(8);
    expect(p1.difficulty).toBe('medium');
    // Ensure deep clone (modifying p1 value does not affect p2)
    p1.grid[1][1].value = 9;
    expect(p2.grid[1][1].value).toBeUndefined();
  });
});
