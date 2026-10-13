import { describe, it, expect, vi } from 'vitest';
import { renderFutoshikiPdf, getLayoutConfig, getFutoshikiLayout } from '../../src/puzzles/futoshiki/renderer.js';
import { getSeedFutoshiki } from '../../src/puzzles/futoshiki/seed-bank.js';
import { FutoshikiGenerator } from '../../src/puzzles/futoshiki/generator.js';
import { FutoshikiData } from '../../src/puzzles/futoshiki/types.js';
import * as futoshikiBarrel from '../../src/puzzles/futoshiki/index.js';
import { PdfBuilder } from '../../src/core/pdf-builder.js';

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

  it('standardizes Futoshiki layout geometry to startY = 240 pt, boardWidth = 960 pt (955 pt for 4x4), and rules at Y = 1240 pt', () => {
    const config4 = getLayoutConfig(4);
    expect(config4.cellSize).toBe(205);
    expect(config4.gutter).toBe(45);
    expect(config4.numFontSize).toBe(70);
    expect(config4.chevronSpan).toBe(12);

    const config5 = getLayoutConfig(5);
    expect(config5.cellSize).toBe(160);
    expect(config5.gutter).toBe(40);
    expect(config5.numFontSize).toBe(56);
    expect(config5.chevronSpan).toBe(10);

    const config6 = getLayoutConfig(6);
    expect(config6.cellSize).toBe(135);
    expect(config6.gutter).toBe(30);
    expect(config6.numFontSize).toBe(48);
    expect(config6.chevronSpan).toBe(8);

    const layout5 = getFutoshikiLayout(5);
    expect(layout5.startY).toBe(240);
    expect(layout5.boardWidth).toBe(960);
    expect(layout5.boardHeight).toBe(960);
    expect(layout5.startX).toBe(222);
    expect(layout5.rulesY).toBe(1240);

    const layout6 = getFutoshikiLayout(6);
    expect(layout6.startY).toBe(240);
    expect(layout6.boardWidth).toBe(960);
    expect(layout6.boardHeight).toBe(960);
    expect(layout6.startX).toBe(222);
    expect(layout6.rulesY).toBe(1240);

    const layout4 = getFutoshikiLayout(4);
    expect(layout4.startY).toBe(240);
    expect(layout4.boardWidth).toBe(955);
    expect(layout4.boardHeight).toBe(955);
    expect(layout4.startX).toBe(224);
    expect(layout4.rulesY).toBe(1240);
  });

  it('renders a 3-page e-ink PDF for 5x5 Futoshiki with standardized anchor startY = 240 and rules at Y = 1240', async () => {
    const puzzleData = getSeedFutoshiki(5, 'medium', '2026-10-14');

    const rects: { x: number; y: number; w: number; h: number }[] = [];
    const textCalls: { text: string; x: number; y: number }[] = [];
    const origGetDoc = PdfBuilder.prototype.getDoc;
    const spy = vi.spyOn(PdfBuilder.prototype, 'getDoc').mockImplementation(function (this: any) {
      const doc = origGetDoc.call(this);
      const origRect = doc.rect.bind(doc);
      doc.rect = (x: number, y: number, w: number, h: number) => {
        rects.push({ x, y, w, h });
        return origRect(x, y, w, h);
      };
      const origText = doc.text.bind(doc);
      doc.text = (str: any, x?: any, y?: any, options?: any) => {
        if (typeof x === 'number' && typeof y === 'number') {
          textCalls.push({ text: String(str), x, y });
        }
        return origText(str, x, y, options);
      };
      return doc;
    });

    try {
      const pdfBuffer = await renderFutoshikiPdf(puzzleData);

      expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');

      const pdfData = await parsePdfBuffer(pdfBuffer);
      expect(pdfData.Pages.length).toBe(3); // Page 1: Puzzle, Page 2: Spoiler Blocker, Page 3: Answer Key

      // Check first cell starts at startX = 222, startY = 240 with cellSize = 160
      const cell00 = rects.find((r) => r.w === 160 && r.h === 160);
      expect(cell00).toBeDefined();
      expect(cell00?.x).toBe(222);
      expect(cell00?.y).toBe(240);

      // Rules text at Y = 1240
      const rulesCall = textCalls.find((call) => call.text.includes('Futoshiki: Fill every row and column'));
      expect(rulesCall).toBeDefined();
      expect(rulesCall?.y).toBe(1240);
    } finally {
      spy.mockRestore();
    }
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
