import { describe, it, expect, vi } from 'vitest';
import { renderKakuroPdf, getKakuroLayout } from '../../src/puzzles/kakuro/renderer.js';
import { getSeedKakuro } from '../../src/puzzles/kakuro/seed-bank.js';
import { KakuroGenerator } from '../../src/puzzles/kakuro/generator.js';
import { PdfBuilder } from '../../src/core/pdf-builder.js';

describe('Kakuro E-Ink PDF Renderer', () => {
  it('standardizes Kakuro layout geometry to startY = 240 pt, boardSize = 960 pt, and startX = 222 pt across sizes 6, 8, 10', () => {
    const layout6 = getKakuroLayout(6);
    expect(layout6.startY).toBe(240);
    expect(layout6.boardSize).toBe(960);
    expect(layout6.cellSize).toBe(160);
    expect(layout6.startX).toBe(222);
    expect(layout6.clueFontSize).toBe(28);
    expect(layout6.solutionFontSize).toBe(56);
    expect(layout6.rulesY).toBe(1240);

    const layout8 = getKakuroLayout(8);
    expect(layout8.startY).toBe(240);
    expect(layout8.boardSize).toBe(960);
    expect(layout8.cellSize).toBe(120);
    expect(layout8.startX).toBe(222);
    expect(layout8.clueFontSize).toBe(24);
    expect(layout8.solutionFontSize).toBe(48);
    expect(layout8.rulesY).toBe(1240);

    const layout10 = getKakuroLayout(10);
    expect(layout10.startY).toBe(240);
    expect(layout10.boardSize).toBe(960);
    expect(layout10.cellSize).toBe(96);
    expect(layout10.startX).toBe(222);
    expect(layout10.clueFontSize).toBe(20);
    expect(layout10.solutionFontSize).toBe(40);
    expect(layout10.rulesY).toBe(1240);
  });

  it('renders a valid 3-page e-ink PDF with diagonal clue cells and answer key', async () => {
    const data = getSeedKakuro(8, 'medium', '2026-10-13');
    const buffer = await renderKakuroPdf(data);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');

    // Page count check: exactly 3 pages
    const pdfText = buffer.toString('latin1');
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches?.length).toBe(3);
  });

  it('renders valid 3-page PDFs for sizes 6x6, 8x8, and 10x10', async () => {
    for (const size of [6, 8, 10]) {
      const data = getSeedKakuro(size, 'easy', '2026-10-13');
      const buffer = await renderKakuroPdf(data);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
      const pdfText = buffer.toString('latin1');
      const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
      expect(pageMatches?.length).toBe(3);
    }
  });

  it('accepts GeneratedPuzzle input and integrates with KakuroGenerator', async () => {
    const generator = new KakuroGenerator();
    const puzzle = await generator.generate({ size: 6, difficulty: 'medium', date: '2026-10-13' });

    expect(puzzle.pdfBuffer).toBeDefined();
    expect(puzzle.pdfBuffer!.length).toBeGreaterThan(1000);
    expect(puzzle.pdfBuffer!.subarray(0, 4).toString()).toBe('%PDF');

    const manualBuffer = await generator.renderPdf(puzzle);
    expect(manualBuffer.length).toBeGreaterThan(1000);
    expect(manualBuffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('renders Kakuro 8x8 with standardized startY = 240 pt anchor, 960 pt boardSize, and rules at Y = 1240', async () => {
    const data = getSeedKakuro(8, 'medium', '2026-10-13');

    let outerFrameRect: { x: number; y: number; w: number; h: number } | undefined;
    const textCalls: { text: string; x: number; y: number }[] = [];
    const origGetDoc = PdfBuilder.prototype.getDoc;
    const spy = vi.spyOn(PdfBuilder.prototype, 'getDoc').mockImplementation(function (this: any) {
      const doc = origGetDoc.call(this);
      const origRect = doc.rect.bind(doc);
      doc.rect = (x: number, y: number, w: number, h: number) => {
        if (w >= 900 && h >= 900) {
          outerFrameRect = { x, y, w, h };
        }
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
      const pdfBuffer = await renderKakuroPdf(data);
      expect(pdfBuffer).toBeInstanceOf(Buffer);

      // Verify outer frame geometry
      expect(outerFrameRect).toBeDefined();
      expect(outerFrameRect?.x).toBe(222); // startX = Math.floor((1404 - 960) / 2) = 222
      expect(outerFrameRect?.y).toBe(240); // startY = 240
      expect(outerFrameRect?.w).toBe(960); // boardSize = 960
      expect(outerFrameRect?.h).toBe(960);

      // Verify rules prompt at Y = 1240 (startY + boardSize + 40)
      const rulesCall = textCalls.find((call) => call.text.includes('Kakuro: Fill white cells'));
      expect(rulesCall).toBeDefined();
      expect(rulesCall?.y).toBe(1240);

      // Verify 3 pages generated cleanly
      const pdfText = pdfBuffer.toString('binary');
      const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
      expect(pageMatches?.length).toBe(3);
    } finally {
      spy.mockRestore();
    }
  });

  it('scales diagonal split clue badges and solution digits dynamically based on grid size', async () => {
    for (const size of [6, 8, 10]) {
      const fontSizes: number[] = [];
      const origGetDoc = PdfBuilder.prototype.getDoc;
      const spy = vi.spyOn(PdfBuilder.prototype, 'getDoc').mockImplementation(function (this: any) {
        const doc = origGetDoc.call(this);
        const origFontSize = doc.fontSize.bind(doc);
        doc.fontSize = (sizePt: number) => {
          fontSizes.push(sizePt);
          return origFontSize(sizePt);
        };
        return doc;
      });

      try {
        const data = getSeedKakuro(size, 'easy', '2026-10-13');
        await renderKakuroPdf(data);

        const expectedClueSize = size === 6 ? 28 : size === 8 ? 24 : 20;
        const expectedSolutionSize = size === 6 ? 56 : size === 8 ? 48 : 40;

        expect(fontSizes).toContain(expectedClueSize);
        expect(fontSizes).toContain(expectedSolutionSize);
      } finally {
        spy.mockRestore();
      }
    }
  });
});
