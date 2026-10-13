import { describe, it, expect } from 'vitest';
import { FUTOSHIKI_SEED_BANK, getSeedFutoshiki } from '../../src/puzzles/futoshiki/seed-bank.js';
import { solveFutoshiki } from '../../src/puzzles/futoshiki/solver.js';

describe('Futoshiki Seed Bank', () => {
  it('contains at least 18 seed puzzles covering sizes 4, 5, 6 across all difficulties', () => {
    expect(FUTOSHIKI_SEED_BANK.length).toBeGreaterThanOrEqual(18);
    const sizes = new Set(FUTOSHIKI_SEED_BANK.map(p => p.size));
    expect(sizes).toContain(4);
    expect(sizes).toContain(5);
    expect(sizes).toContain(6);

    for (const size of [4, 5, 6] as const) {
      for (const diff of ['easy', 'medium', 'hard'] as const) {
        const matches = FUTOSHIKI_SEED_BANK.filter(p => p.size === size && p.difficulty === diff);
        expect(matches.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('verifies every seed puzzle has strictly 1 unique solution matching its declared solution', () => {
    for (const puzzle of FUTOSHIKI_SEED_BANK) {
      const solutions = solveFutoshiki(puzzle.initialGrid, puzzle.inequalities, 2);
      expect(solutions).toHaveLength(1);
      expect(solutions[0]).toEqual(puzzle.solution);

      // Verify all inequality relations hold on solution
      for (const ineq of puzzle.inequalities) {
        const val1 = puzzle.solution[ineq.row1][ineq.col1];
        const val2 = puzzle.solution[ineq.row2][ineq.col2];
        if (ineq.relation === '<') {
          expect(val1).toBeLessThan(val2);
        } else {
          expect(val1).toBeGreaterThan(val2);
        }
      }
    }
  });

  it('getSeedFutoshiki returns deep copies and deterministically cycles seeds by date', () => {
    const seed1 = getSeedFutoshiki(5, 'medium', '2026-10-14');
    const seed2 = getSeedFutoshiki(5, 'medium', '2026-10-14');
    expect(seed1).toEqual(seed2);
    expect(seed1).not.toBe(seed2);
    expect(seed1.initialGrid).not.toBe(seed2.initialGrid);
  });
});
