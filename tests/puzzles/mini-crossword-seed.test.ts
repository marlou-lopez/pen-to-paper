import { describe, it, expect } from 'vitest';
import { getSeedCrosswordForDate, SEED_CROSSWORDS } from '../../src/puzzles/mini-crossword/seed-bank.ts';

describe('Mini Crossword Seed Bank', () => {
  it('contains at least 15 verified 5x5 seed puzzles', () => {
    expect(SEED_CROSSWORDS.length).toBeGreaterThanOrEqual(15);
  });

  it('validates every seed puzzle has a 5x5 grid and 10 total clues (5 across, 5 down)', () => {
    for (const puzzle of SEED_CROSSWORDS) {
      expect(puzzle.grid).toHaveLength(5);
      for (const row of puzzle.grid) {
        expect(row).toHaveLength(5);
      }
      expect(puzzle.acrossClues).toHaveLength(5);
      expect(puzzle.downClues).toHaveLength(5);
      for (const clue of [...puzzle.acrossClues, ...puzzle.downClues]) {
        expect(clue.word.length).toBe(5);
        expect(clue.clue.trim().length).toBeGreaterThan(3);
        expect(clue.number).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('verifies letter intersections between Across and Down words match in seed puzzles', () => {
    for (const puzzle of SEED_CROSSWORDS) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const acrossWord = puzzle.acrossClues[r].word;
          const downWord = puzzle.downClues[c].word;
          expect(acrossWord[c]).toBe(downWord[r]);
          expect(puzzle.grid[r][c]).toBe(acrossWord[c]);
        }
      }
    }
  });

  it('returns a deterministic seed puzzle for a given date string', () => {
    const p1 = getSeedCrosswordForDate('2026-10-12');
    const p2 = getSeedCrosswordForDate('2026-10-12');
    expect(p1.title).toBe(p2.title);
    expect(p1.grid).toEqual(p2.grid);
  });
});
