import { describe, it, expect } from 'vitest';
import { getSeedCrosswordForDate, SEED_CROSSWORDS } from '../../src/puzzles/mini-crossword/seed-bank.ts';
import { calculateCrosswordNumbering } from '../../src/puzzles/mini-crossword/numbering.ts';

describe('Mini Crossword Seed Bank', () => {
  it('contains at least 20 verified 5x5 seed puzzles', () => {
    expect(SEED_CROSSWORDS.length).toBeGreaterThanOrEqual(20);
  });

  it('guarantees every seed puzzle has blockers and strictly distinct across and down words', () => {
    for (const puzzle of SEED_CROSSWORDS) {
      expect(puzzle.grid).toHaveLength(5);
      let blockerCount = 0;
      for (let r = 0; r < 5; r++) {
        expect(puzzle.grid[r]).toHaveLength(5);
        for (let c = 0; c < 5; c++) {
          if (puzzle.grid[r][c] === '#') {
            blockerCount++;
            // 180-deg symmetry
            expect(puzzle.grid[r][c]).toBe(puzzle.grid[4 - r][4 - c]);
          }
        }
      }
      expect(blockerCount).toBeGreaterThanOrEqual(2);

      const acrossWords = puzzle.acrossClues.map((c) => c.word.toUpperCase());
      const downWords = puzzle.downClues.map((c) => c.word.toUpperCase());

      // No duplicate words within Across or Down
      expect(new Set(acrossWords).size).toBe(acrossWords.length);
      expect(new Set(downWords).size).toBe(downWords.length);

      // Across and Down words must NEVER intersect identically (no shared words)
      const commonWords = acrossWords.filter((w) => downWords.includes(w));
      expect(commonWords).toEqual([]);

      // Verify numbering matches calculateCrosswordNumbering
      const { acrossSlots, downSlots } = calculateCrosswordNumbering(puzzle.grid);
      expect(puzzle.acrossClues.length).toBe(acrossSlots.length);
      expect(puzzle.downClues.length).toBe(downSlots.length);
      for (let i = 0; i < acrossSlots.length; i++) {
        expect(puzzle.acrossClues[i].number).toBe(acrossSlots[i].number);
        expect(puzzle.acrossClues[i].length).toBe(acrossSlots[i].length);
        expect(puzzle.acrossClues[i].word).toHaveLength(acrossSlots[i].length);
        expect(puzzle.acrossClues[i].clue.trim().length).toBeGreaterThan(3);

        const reconstructed = acrossSlots[i].coords.map(([r, c]) => puzzle.grid[r][c]).join('');
        expect(puzzle.acrossClues[i].word).toBe(reconstructed);
      }
      for (let i = 0; i < downSlots.length; i++) {
        expect(puzzle.downClues[i].number).toBe(downSlots[i].number);
        expect(puzzle.downClues[i].length).toBe(downSlots[i].length);
        expect(puzzle.downClues[i].word).toHaveLength(downSlots[i].length);
        expect(puzzle.downClues[i].clue.trim().length).toBeGreaterThan(3);

        const reconstructed = downSlots[i].coords.map(([r, c]) => puzzle.grid[r][c]).join('');
        expect(puzzle.downClues[i].word).toBe(reconstructed);
      }
    }
  });

  it('provides deterministic date-based seed lookup', () => {
    const p1 = getSeedCrosswordForDate('2026-10-13');
    const p2 = getSeedCrosswordForDate('2026-10-13');
    expect(p1.title).toBe(p2.title);
    expect(p1.grid).toEqual(p2.grid);
  });
});
