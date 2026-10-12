import { describe, it, expect } from 'vitest';
import { generateLatinSquare } from '../../src/puzzles/kenken/latin-square.ts';

describe('KenKen Latin Square Generator', () => {
  it('generates valid Latin squares for sizes 3 through 9', () => {
    for (let size = 3; size <= 9; size++) {
      const grid = generateLatinSquare(size, `test-seed-${size}`);
      expect(grid).toHaveLength(size);

      // Verify each row has numbers 1..size exactly once
      for (let r = 0; r < size; r++) {
        expect(grid[r]).toHaveLength(size);
        const rowSet = new Set(grid[r]);
        expect(rowSet.size).toBe(size);
        for (let num = 1; num <= size; num++) {
          expect(rowSet.has(num)).toBe(true);
        }
      }

      // Verify each column has numbers 1..size exactly once
      for (let c = 0; c < size; c++) {
        const colSet = new Set<number>();
        for (let r = 0; r < size; r++) {
          colSet.add(grid[r][c]);
        }
        expect(colSet.size).toBe(size);
        for (let num = 1; num <= size; num++) {
          expect(colSet.has(num)).toBe(true);
        }
      }
    }
  });

  it('produces deterministic output when given the same seed or date string', () => {
    const gridA = generateLatinSquare(6, '2026-10-12');
    const gridB = generateLatinSquare(6, '2026-10-12');
    expect(gridA).toEqual(gridB);

    const gridC = generateLatinSquare(6, '2026-10-13');
    expect(gridA).not.toEqual(gridC);
  });
});
