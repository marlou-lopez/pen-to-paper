import { describe, it, expect } from 'vitest';
import {
  createEmptyCrosswordGrid,
  isCrosswordSolved,
  calculateCrosswordNumbering,
  SAMPLE_PUZZLES,
} from '../../web/src/utils/crossword.ts';

describe('Web Crossword Utilities', () => {
  it('creates empty grid preserving black blocker tiles', () => {
    const sample = SAMPLE_PUZZLES[0];
    const emptyGrid = createEmptyCrosswordGrid(sample.grid);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (sample.grid[r][c] === '#') {
          expect(emptyGrid[r][c]).toBe('#');
        } else {
          expect(emptyGrid[r][c]).toBe('');
        }
      }
    }
  });

  it('creates empty 5x5 grid without template', () => {
    const emptyGrid = createEmptyCrosswordGrid();
    expect(emptyGrid).toHaveLength(5);
    for (let r = 0; r < 5; r++) {
      expect(emptyGrid[r]).toHaveLength(5);
      for (let c = 0; c < 5; c++) {
        expect(emptyGrid[r][c]).toBe('');
      }
    }
  });

  it('correctly verifies solved status ignoring blocker tiles', () => {
    const sample = SAMPLE_PUZZLES[0];
    const emptyGrid = createEmptyCrosswordGrid(sample.grid);
    expect(isCrosswordSolved(emptyGrid, sample.grid)).toBe(false);

    // Fill playable cells
    const solvedUserGrid = sample.grid.map((row) =>
      row.map((cell) => (cell === '#' ? '#' : cell.toLowerCase()))
    );
    expect(isCrosswordSolved(solvedUserGrid, sample.grid)).toBe(true);

    // Wrong letter in one playable cell
    const wrongGrid = solvedUserGrid.map((row) => [...row]);
    // find a playable cell
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (sample.grid[r][c] !== '#') {
          wrongGrid[r][c] = wrongGrid[r][c] === 'Z' ? 'A' : 'Z';
          expect(isCrosswordSolved(wrongGrid, sample.grid)).toBe(false);
          return;
        }
      }
    }
  });

  it('guarantees all sample puzzles have blockers and distinct words', () => {
    for (const puzzle of SAMPLE_PUZZLES) {
      // Check blockers exist
      const blockerCount = puzzle.grid.flat().filter((cell) => cell === '#').length;
      expect(blockerCount).toBeGreaterThanOrEqual(2);

      const across = puzzle.acrossClues.map((c) => c.word);
      const down = puzzle.downClues.map((c) => c.word);
      const overlap = across.filter((w) => down.includes(w));
      expect(overlap).toEqual([]);
    }
  });

  it('computes dynamic numbering for grid with blockers', () => {
    const sample = SAMPLE_PUZZLES[0]; // Autumn Harvest: [0,4] and [4,0] are '#'
    const { gridNumbers, acrossSlots, downSlots } = calculateCrosswordNumbering(sample.grid);
    expect(gridNumbers[0][0]).toBe(1);
    expect(gridNumbers[0][4]).toBeNull();
    expect(gridNumbers[4][0]).toBeNull();
    expect(acrossSlots.length).toBe(5);
    expect(downSlots.length).toBe(5);
  });
});
