import { describe, it, expect } from 'vitest';
import { KAKURO_TEMPLATES, extractKakuroRuns } from '../../src/puzzles/kakuro/templates.ts';

describe('Kakuro Templates & Run Extractor', () => {
  it('defines 180-degree symmetric templates for sizes 6, 8, and 10', () => {
    for (const tmpl of KAKURO_TEMPLATES) {
      expect([6, 8, 10]).toContain(tmpl.size);
      const rows = tmpl.grid.length;
      const cols = tmpl.grid[0].length;
      expect(rows).toBe(tmpl.size);
      expect(cols).toBe(tmpl.size);

      // Verify 180° symmetry of white vs clue/block cells
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const isWhite = tmpl.grid[r][c].type === 'white';
          const oppIsWhite = tmpl.grid[rows - 1 - r][cols - 1 - c].type === 'white';
          expect(isWhite).toBe(oppIsWhite);
        }
      }
    }
  });

  it('extracts runs where every white cell belongs to exactly 1 Across and 1 Down run', () => {
    for (const tmpl of KAKURO_TEMPLATES) {
      const runs = extractKakuroRuns(tmpl.grid);
      expect(runs.length).toBeGreaterThan(0);

      const cellCounts = new Map<string, { across: number; down: number }>();
      for (let r = 0; r < tmpl.size; r++) {
        for (let c = 0; c < tmpl.size; c++) {
          if (tmpl.grid[r][c].type === 'white') {
            cellCounts.set(`${r},${c}`, { across: 0, down: 0 });
          }
        }
      }

      for (const run of runs) {
        expect(run.cells.length).toBeGreaterThanOrEqual(2);
        expect(run.cells.length).toBeLessThanOrEqual(6);
        for (const [r, c] of run.cells) {
          const entry = cellCounts.get(`${r},${c}`);
          expect(entry).toBeDefined();
          if (run.direction === 'across') entry!.across++;
          else entry!.down++;
        }
      }

      for (const [coord, counts] of cellCounts.entries()) {
        expect(counts.across, `Cell ${coord} must have exactly 1 across run`).toBe(1);
        expect(counts.down, `Cell ${coord} must have exactly 1 down run`).toBe(1);
      }
    }
  });
});
