import { describe, it, expect } from 'vitest';
import {
  createEmptyGrid,
  gridToNotation,
  notationToGrid,
  getConflicts,
  countClues,
  validateAndSolve,
} from '../../web/src/utils/sudoku.ts';

describe('Web Sudoku Studio Utilities', () => {
  const sampleNotation =
    '53xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79';

  it('creates an empty 9x9 grid of nulls', () => {
    const grid = createEmptyGrid();
    expect(grid).toHaveLength(9);
    for (let r = 0; r < 9; r++) {
      expect(grid[r]).toHaveLength(9);
      for (let c = 0; c < 9; c++) {
        expect(grid[r][c]).toBeNull();
      }
    }
  });

  it('serializes grid to x notation and parses back', () => {
    const parsed = notationToGrid(sampleNotation);
    expect(countClues(parsed)).toBe(30);

    const serialized = gridToNotation(parsed);
    expect(serialized).toBe(sampleNotation);
  });

  it('detects row, column, and 3x3 box conflicts', () => {
    const grid = createEmptyGrid();
    // Row conflict: same number in row 0
    grid[0][0] = 5;
    grid[0][4] = 5;

    // Col conflict: same number in col 8
    grid[2][8] = 9;
    grid[7][8] = 9;

    // Box conflict: same number in box (0, 0)
    grid[1][1] = 2;
    grid[2][2] = 2;

    const conflicts = getConflicts(grid);
    expect(conflicts.has('0,0')).toBe(true);
    expect(conflicts.has('0,4')).toBe(true);
    expect(conflicts.has('2,8')).toBe(true);
    expect(conflicts.has('7,8')).toBe(true);
    expect(conflicts.has('1,1')).toBe(true);
    expect(conflicts.has('2,2')).toBe(true);
    expect(conflicts.size).toBe(6);
  });

  it('validates and solves solvable grid', () => {
    const parsed = notationToGrid(sampleNotation);
    const result = validateAndSolve(parsed);

    expect(result.valid).toBe(true);
    expect(result.solvable).toBe(true);
    expect(result.solution).toBeDefined();
    expect(result.solution![0][0]).toBe(5);
    expect(result.solution![0][1]).toBe(3);
    expect(result.solution![0][2]).toBe(4);
  });

  it('rejects unsolvable board with error message', () => {
    // Putting 1 at (0, 2) has no duplicate conflicts with any clue, but has no valid Sudoku solution
    const unsolvableNotation =
      '531x7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79';
    const grid = notationToGrid(unsolvableNotation);
    expect(getConflicts(grid).size).toBe(0);
    const result = validateAndSolve(grid);

    expect(result.valid).toBe(true);
    expect(result.solvable).toBe(false);
    expect(result.error).toContain('no valid solution');
  });

  it('rejects conflicted board before solving', () => {
    const conflicted =
      '55xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79';
    const grid = notationToGrid(conflicted);
    const result = validateAndSolve(grid);

    expect(result.valid).toBe(false);
    expect(result.solvable).toBe(false);
    expect(result.error).toContain('conflicting');
  });
});
