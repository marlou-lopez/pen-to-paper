import { describe, it, expect } from 'vitest';
import {
  createEmptyCrosswordGrid,
  isCrosswordSolved,
  CELL_CLUE_NUMBERS,
  SAMPLE_PUZZLES,
} from '../../web/src/utils/crossword.ts';

describe('Crossword Web Utilities', () => {
  it('creates an empty 5x5 grid with empty strings (solutions hidden)', () => {
    const grid = createEmptyCrosswordGrid();
    expect(grid).toHaveLength(5);
    for (let r = 0; r < 5; r++) {
      expect(grid[r]).toHaveLength(5);
      for (let c = 0; c < 5; c++) {
        expect(grid[r][c]).toBe('');
      }
    }
  });

  it('verifies all 5 sample puzzles have valid 5x5 grids and 5 across + 5 down clues', () => {
    expect(SAMPLE_PUZZLES.length).toBeGreaterThanOrEqual(5);
    for (const puzzle of SAMPLE_PUZZLES) {
      expect(puzzle.grid).toHaveLength(5);
      expect(puzzle.acrossClues).toHaveLength(5);
      expect(puzzle.downClues).toHaveLength(5);
      for (let r = 0; r < 5; r++) {
        expect(puzzle.grid[r]).toHaveLength(5);
      }
    }
  });

  it('correctly maps clue numbers for standard 5x5 mini crossword positions', () => {
    expect(CELL_CLUE_NUMBERS['0,0']).toBe(1);
    expect(CELL_CLUE_NUMBERS['0,1']).toBe(2);
    expect(CELL_CLUE_NUMBERS['0,4']).toBe(5);
    expect(CELL_CLUE_NUMBERS['1,0']).toBe(6);
    expect(CELL_CLUE_NUMBERS['4,0']).toBe(9);
    expect(CELL_CLUE_NUMBERS['1,1']).toBeUndefined();
  });

  it('evaluates crossword completion status correctly', () => {
    const puzzle = SAMPLE_PUZZLES[0];
    const emptyGrid = createEmptyCrosswordGrid();
    expect(isCrosswordSolved(emptyGrid, puzzle.grid)).toBe(false);

    // Partially filled grid
    const partialGrid = createEmptyCrosswordGrid();
    partialGrid[0] = [...puzzle.grid[0]];
    expect(isCrosswordSolved(partialGrid, puzzle.grid)).toBe(false);

    // Completely filled matching grid (case-insensitive)
    const solvedGrid = puzzle.grid.map((row) => row.map((char) => char.toLowerCase()));
    expect(isCrosswordSolved(solvedGrid, puzzle.grid)).toBe(true);

    // Completely filled but with wrong letter
    const wrongGrid = puzzle.grid.map((row) => [...row]);
    wrongGrid[4][4] = 'Z';
    expect(isCrosswordSolved(wrongGrid, puzzle.grid)).toBe(false);
  });
});
