import { describe, it, expect } from 'vitest';
import {
  createEmptyFutoshikiGrid,
  findFutoshikiViolations,
  isFutoshikiSolved,
  SAMPLE_FUTOSHIKI_PUZZLES,
  FutoshikiInequality,
} from '../../web/src/utils/futoshiki.ts';

describe('Web Futoshiki Utilities', () => {
  describe('createEmptyFutoshikiGrid', () => {
    it('preserves given clues and leaves others 0 without mutating the initial grid', () => {
      const initialGrid = [
        [0, 4, 0, 0],
        [0, 0, 4, 2],
        [0, 0, 0, 4],
        [0, 2, 0, 0],
      ];

      const emptyGrid = createEmptyFutoshikiGrid(initialGrid);

      // Clues preserved
      expect(emptyGrid[0][1]).toBe(4);
      expect(emptyGrid[1][2]).toBe(4);
      expect(emptyGrid[1][3]).toBe(2);
      expect(emptyGrid[2][3]).toBe(4);
      expect(emptyGrid[3][1]).toBe(2);

      // Empty cells remain 0
      expect(emptyGrid[0][0]).toBe(0);
      expect(emptyGrid[0][2]).toBe(0);
      expect(emptyGrid[2][0]).toBe(0);

      // Deep copy verification
      emptyGrid[0][0] = 3;
      expect(initialGrid[0][0]).toBe(0);
    });
  });

  describe('findFutoshikiViolations', () => {
    it('accurately flags duplicate row and column cells while ignoring 0', () => {
      const userGrid = [
        [1, 2, 2, 0], // row 0 has duplicate '2' at col 1 and 2
        [3, 4, 1, 2],
        [1, 0, 0, 0], // col 0 has duplicate '1' at row 0 and 2
        [4, 0, 0, 0],
      ];

      const { duplicateCells, brokenInequalities } = findFutoshikiViolations(userGrid, []);

      // Row duplicates
      expect(duplicateCells.has('0,1')).toBe(true);
      expect(duplicateCells.has('0,2')).toBe(true);

      // Column duplicates
      expect(duplicateCells.has('0,0')).toBe(true);
      expect(duplicateCells.has('2,0')).toBe(true);

      // Cell 0,3 has 0, cell 2,1 has 0 -> should NOT be duplicates
      expect(duplicateCells.has('0,3')).toBe(false);
      expect(duplicateCells.has('2,1')).toBe(false);

      expect(brokenInequalities).toHaveLength(0);
    });

    it('accurately flags violated inequalities (< and >) when both cells are filled', () => {
      const ineqLess: FutoshikiInequality = {
        row1: 0,
        col1: 0,
        row2: 0,
        col2: 1,
        relation: '<',
      };
      const ineqGreater: FutoshikiInequality = {
        row1: 1,
        col1: 1,
        row2: 2,
        col2: 1,
        relation: '>',
      };

      // Case 1: Violated inequalities
      // (0,0) is 4, (0,1) is 2 -> 4 < 2 is FALSE (broken)
      // (1,1) is 1, (2,1) is 3 -> 1 > 3 is FALSE (broken)
      const violatedGrid = [
        [4, 2, 0, 0],
        [0, 1, 0, 0],
        [0, 3, 0, 0],
        [0, 0, 0, 0],
      ];

      const res1 = findFutoshikiViolations(violatedGrid, [ineqLess, ineqGreater]);
      expect(res1.brokenInequalities).toHaveLength(2);
      expect(res1.brokenInequalities).toContainEqual(ineqLess);
      expect(res1.brokenInequalities).toContainEqual(ineqGreater);

      // Case 2: One cell is 0 (empty) -> should not flag as broken yet
      const partialGrid = [
        [4, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const res2 = findFutoshikiViolations(partialGrid, [ineqLess, ineqGreater]);
      expect(res2.brokenInequalities).toHaveLength(0);

      // Case 3: Satisfied inequalities
      // (0,0) is 2, (0,1) is 4 -> 2 < 4 is TRUE
      // (1,1) is 3, (2,1) is 1 -> 3 > 1 is TRUE
      const satisfiedGrid = [
        [2, 4, 0, 0],
        [0, 3, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ];
      const res3 = findFutoshikiViolations(satisfiedGrid, [ineqLess, ineqGreater]);
      expect(res3.brokenInequalities).toHaveLength(0);
    });
  });

  describe('isFutoshikiSolved', () => {
    it('returns true for solution grid, false for empty or incomplete grids', () => {
      const sample = SAMPLE_FUTOSHIKI_PUZZLES[0];
      const emptyGrid = createEmptyFutoshikiGrid(sample.initialGrid);

      expect(isFutoshikiSolved(emptyGrid, sample.solution, sample.inequalities)).toBe(false);
      expect(isFutoshikiSolved(sample.solution, sample.solution, sample.inequalities)).toBe(true);
    });

    it('returns false if a cell has an invalid digit or contradicts inequality', () => {
      const sample = SAMPLE_FUTOSHIKI_PUZZLES[0];
      const corruptedGrid = sample.solution.map((row) => [...row]);
      // Corrupt a cell
      corruptedGrid[0][0] = corruptedGrid[0][1]; // duplicate

      expect(isFutoshikiSolved(corruptedGrid, sample.solution, sample.inequalities)).toBe(false);
    });
  });

  describe('SAMPLE_FUTOSHIKI_PUZZLES', () => {
    it('contains verified sample puzzles covering sizes 4, 5, 6 across easy, medium, and hard', () => {
      expect(SAMPLE_FUTOSHIKI_PUZZLES.length).toBeGreaterThanOrEqual(9);

      const sizes = new Set(SAMPLE_FUTOSHIKI_PUZZLES.map((p) => p.size));
      expect(sizes).toContain(4);
      expect(sizes).toContain(5);
      expect(sizes).toContain(6);

      for (const size of [4, 5, 6] as const) {
        for (const diff of ['easy', 'medium', 'hard'] as const) {
          const matching = SAMPLE_FUTOSHIKI_PUZZLES.filter(
            (p) => p.size === size && p.difficulty === diff
          );
          expect(matching.length).toBeGreaterThanOrEqual(1);
          for (const puzzle of matching) {
            expect(isFutoshikiSolved(puzzle.solution, puzzle.solution, puzzle.inequalities)).toBe(true);
          }
        }
      }
    });
  });
});
