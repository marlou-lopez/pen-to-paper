import { describe, it, expect } from 'vitest';
import { renderFutoshikiPdf } from '../../src/puzzles/futoshiki/renderer.js';
import { getSeedFutoshiki } from '../../src/puzzles/futoshiki/seed-bank.js';
import { FutoshikiGenerator } from '../../src/puzzles/futoshiki/generator.js';
import { FutoshikiData } from '../../src/puzzles/futoshiki/types.js';
import * as futoshikiBarrel from '../../src/puzzles/futoshiki/index.js';

function getPdfPageCount(buffer: Buffer): number {
  const pdfText = buffer.toString('latin1');
  const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
  return pageMatches ? pageMatches.length : 0;
}

async function parsePdfBuffer(buffer: Buffer): Promise<{ Pages: unknown[] }> {
  const pageCount = getPdfPageCount(buffer);
  return { Pages: Array.from({ length: pageCount }) };
}

describe('Futoshiki PDF Renderer', () => {
  it('exports renderFutoshikiPdf in barrel file', () => {
    expect(futoshikiBarrel.renderFutoshikiPdf).toBeDefined();
    expect(typeof futoshikiBarrel.renderFutoshikiPdf).toBe('function');
  });

  it('renders a 3-page e-ink PDF for 5x5 Futoshiki', async () => {
    const puzzleData = getSeedFutoshiki(5, 'medium', '2026-10-14');
    const pdfBuffer = await renderFutoshikiPdf(puzzleData);

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');

    const pdfData = await parsePdfBuffer(pdfBuffer);
    expect(pdfData.Pages.length).toBe(3); // Page 1: Puzzle, Page 2: Spoiler Blocker, Page 3: Answer Key
  });

  it('renders 4x4 and 6x6 grids cleanly without layout overlap', async () => {
    const p4 = getSeedFutoshiki(4, 'easy', '2026-10-14');
    const buf4 = await renderFutoshikiPdf(p4);
    expect(buf4.subarray(0, 4).toString()).toBe('%PDF');
    const pdfData4 = await parsePdfBuffer(buf4);
    expect(pdfData4.Pages.length).toBe(3);

    const p6 = getSeedFutoshiki(6, 'hard', '2026-10-14');
    const buf6 = await renderFutoshikiPdf(p6);
    expect(buf6.subarray(0, 4).toString()).toBe('%PDF');
    const pdfData6 = await parsePdfBuffer(buf6);
    expect(pdfData6.Pages.length).toBe(3);
  });

  it('accepts both GeneratedPuzzle<FutoshikiData> and raw FutoshikiData', async () => {
    const generator = new FutoshikiGenerator();
    const generatedPuzzle = await generator.generate({ size: 5, difficulty: 'medium', date: '2026-10-14' });

    // Passing GeneratedPuzzle
    const bufFromGenerated = await renderFutoshikiPdf(generatedPuzzle);
    expect(bufFromGenerated.subarray(0, 4).toString()).toBe('%PDF');
    expect(getPdfPageCount(bufFromGenerated)).toBe(3);

    // Passing raw FutoshikiData
    const bufFromRaw = await renderFutoshikiPdf(generatedPuzzle.puzzleData);
    expect(bufFromRaw.subarray(0, 4).toString()).toBe('%PDF');
    expect(getPdfPageCount(bufFromRaw)).toBe(3);

    // Via generator.renderPdf
    const bufFromGenMethod = await generator.renderPdf(generatedPuzzle);
    expect(bufFromGenMethod.subarray(0, 4).toString()).toBe('%PDF');
    expect(getPdfPageCount(bufFromGenMethod)).toBe(3);
  });

  it('renders all 4 chevron directions (<, >, ^, v) including inverted coordinate order', async () => {
    const customData: FutoshikiData = {
      size: 4,
      initialGrid: [
        [1, 0, 0, 0],
        [0, 2, 0, 0],
        [0, 0, 3, 0],
        [0, 0, 0, 4],
      ],
      solution: [
        [1, 2, 3, 4],
        [2, 3, 4, 1],
        [3, 4, 1, 2],
        [4, 1, 2, 3],
      ],
      inequalities: [
        { row1: 0, col1: 0, row2: 0, col2: 1, relation: '<' }, // horizontal <
        { row1: 0, col1: 3, row2: 0, col2: 2, relation: '>' }, // horizontal > inverted order
        { row1: 0, col1: 1, row2: 1, col2: 1, relation: '<' }, // vertical ^
        { row1: 2, col1: 2, row2: 1, col2: 2, relation: '<' }, // vertical v inverted order
      ],
      difficulty: 'easy',
      dateStr: '2026-10-14',
    };

    const buffer = await renderFutoshikiPdf(customData);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(getPdfPageCount(buffer)).toBe(3);
  });
});
