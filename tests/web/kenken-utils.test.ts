import { describe, it, expect } from 'vitest';
import {
  createEmptyKenKenGrid,
  isKenKenSolved,
  SAMPLE_KENKEN_PUZZLES,
} from '../../web/src/utils/kenken.ts';

describe('KenKen Web Utilities', () => {
  it('creates an empty grid with nulls/zeros keeping solutions hidden by default', () => {
    const grid = createEmptyKenKenGrid(6);
    expect(grid).toHaveLength(6);
    for (let r = 0; r < 6; r++) {
      expect(grid[r]).toHaveLength(6);
      for (let c = 0; c < 6; c++) {
        expect(grid[r][c]).toBeNull();
      }
    }
  });

  it('provides verified sample puzzles from size 3 to 9', () => {
    for (let size = 3; size <= 9; size++) {
      const puzzle = SAMPLE_KENKEN_PUZZLES[size];
      expect(puzzle).toBeDefined();
      expect(puzzle.size).toBe(size);
      expect(puzzle.grid).toHaveLength(size);
      expect(puzzle.cages.length).toBeGreaterThan(1);
    }
  });

  it('evaluates solved status correctly', () => {
    const puzzle = SAMPLE_KENKEN_PUZZLES[4];
    const emptyGrid = createEmptyKenKenGrid(4);
    expect(isKenKenSolved(emptyGrid, puzzle)).toBe(false);

    expect(isKenKenSolved(puzzle.grid, puzzle)).toBe(true);
  });
});
