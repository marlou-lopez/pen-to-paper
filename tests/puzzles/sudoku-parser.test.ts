import { describe, it, expect } from 'vitest';
import { parseSudokuGrid } from '../../src/puzzles/sudoku/parser.js';
import { solveSudoku } from '../../src/puzzles/sudoku/solver.js';

describe('Sudoku Parser & Solver', () => {
  const sampleNotation = '53xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79';

  it('parses valid x notation into 9x9 matrix', () => {
    const grid = parseSudokuGrid(sampleNotation);
    expect(grid).toHaveLength(9);
    expect(grid[0]).toHaveLength(9);
    expect(grid[0][0]).toBe(5);
    expect(grid[0][1]).toBe(3);
    expect(grid[0][2]).toBeNull();
    expect(grid[0][4]).toBe(7);
  });

  it('tolerates dots, zeros, and newlines', () => {
    const multiLine = '53..7....\n6..195...\n.98....6.\n8...6...3\n4..8.3..1\n7...2...6\n.6....28.\n...419..5\n....8..79';
    const grid = parseSudokuGrid(multiLine);
    expect(grid[0][0]).toBe(5);
    expect(grid[0][2]).toBeNull();
  });

  it('throws helpful error when row count is invalid', () => {
    expect(() => parseSudokuGrid('53xx7xxxx/6xx195xxx')).toThrow('Expected 9 rows separated by \'/\', but found 2');
  });

  it('throws helpful error when row length is not 9', () => {
    expect(() => parseSudokuGrid('53xx7xxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79')).toThrow('Row 1 has 8 cells instead of 9');
  });

  it('throws helpful error on duplicate clue in row/col/box', () => {
    // Row 1 has duplicate 5
    const duplicate = '55xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79';
    expect(() => parseSudokuGrid(duplicate)).toThrow('duplicate number 5');
  });

  it('solves valid sudoku puzzle', () => {
    const grid = parseSudokuGrid(sampleNotation);
    const solution = solveSudoku(grid);
    expect(solution).toHaveLength(9);
    expect(solution[0]).toHaveLength(9);
    expect(solution[0][0]).toBe(5);
    expect(solution[0][1]).toBe(3);
    expect(solution[0][2]).toBe(4);
    // Verify no nulls in solution
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(typeof solution[r][c]).toBe('number');
      }
    }
  });

  it('throws error for unsolvable puzzle', () => {
    // Contrived unsolvable board: row 0 has 1-8, col 0 has 9, so (0,0) has no candidate
    const unsolvable = 'x12345678/xxxxxxxxx/xxxxxxxxx/xxxxxxxxx/xxxxxxxxx/xxxxxxxxx/xxxxxxxxx/xxxxxxxxx/9xxxxxxxx';
    const grid = parseSudokuGrid(unsolvable);
    expect(() => solveSudoku(grid)).toThrow('The provided Sudoku has no valid solution');
  });
});
