import { describe, it, expect } from 'vitest';
import { CROSSWORD_TEMPLATES } from '../../src/puzzles/mini-crossword/templates.ts';
import { calculateCrosswordNumbering } from '../../src/puzzles/mini-crossword/numbering.ts';

describe('Mini Crossword Templates & Numbering', () => {
  it('defines 9 verified 180-degree symmetric templates', () => {
    expect(CROSSWORD_TEMPLATES.length).toBe(9);
    for (const tmpl of CROSSWORD_TEMPLATES) {
      expect(tmpl.grid).toHaveLength(5);
      for (let r = 0; r < 5; r++) {
        expect(tmpl.grid[r]).toHaveLength(5);
        for (let c = 0; c < 5; c++) {
          // 180-deg rotational symmetry: cell (r, c) == cell (4-r, 4-c)
          expect(tmpl.grid[r][c]).toBe(tmpl.grid[4 - r][4 - c]);
        }
      }
    }
  });

  it('guarantees every template has strictly word lengths >= 3 and no 1- or 2-letter words', () => {
    for (const tmpl of CROSSWORD_TEMPLATES) {
      const { acrossSlots, downSlots } = calculateCrosswordNumbering(tmpl.grid);
      expect(acrossSlots.length).toBeGreaterThanOrEqual(4);
      expect(downSlots.length).toBeGreaterThanOrEqual(4);

      for (const slot of [...acrossSlots, ...downSlots]) {
        expect(slot.length).toBeGreaterThanOrEqual(3);
        expect(slot.length).toBeLessThanOrEqual(5);
        expect(slot.coords).toHaveLength(slot.length);
      }
    }
  });

  it('correctly numbers a known 5x5 template with 2 corner blockers', () => {
    // Template 1: blockers at (0, 4) and (4, 0)
    const grid = [
      ['.', '.', '.', '.', '#'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['#', '.', '.', '.', '.'],
    ];
    const { gridNumbers, acrossSlots, downSlots } = calculateCrosswordNumbering(grid);

    // Row 0 starts at (0, 0), length 4
    expect(gridNumbers[0][0]).toBe(1);
    expect(acrossSlots.find((s) => s.number === 1)?.length).toBe(4);

    // (0, 4) is blocker, so no number
    expect(gridNumbers[0][4]).toBeNull();

    // Down words start at (0,0), (0,1), (0,2), (0,3)
    expect(downSlots.find((s) => s.startRow === 0 && s.startCol === 0)?.length).toBe(4);
    expect(downSlots.find((s) => s.startRow === 0 && s.startCol === 1)?.length).toBe(5);
  });
});
