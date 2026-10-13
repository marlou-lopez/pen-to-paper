import { describe, it, expect, vi } from 'vitest';
import { KenKenGenerator } from '../../src/puzzles/kenken/generator.ts';
import { renderKenKenPdf, getKenKenLayout } from '../../src/puzzles/kenken/renderer.ts';
import { PdfBuilder } from '../../src/core/pdf-builder.ts';

describe('KenKen E-Ink PDF Renderer', () => {
  it('standardizes KenKen layout geometry to startY = 240 and target boardSize = 960', () => {
    const layout6 = getKenKenLayout(6);
    expect(layout6.startY).toBe(240);
    expect(layout6.targetBoardSize).toBe(960);
    expect(layout6.cellSize).toBe(160);
    expect(layout6.boardSize).toBe(960);
    expect(layout6.startX).toBe(222);
    expect(layout6.badgeFontSize).toBe(24);
    expect(layout6.digitFontSize).toBe(56);
    expect(layout6.rulesY).toBe(1240);

    const layout4 = getKenKenLayout(4);
    expect(layout4.startY).toBe(240);
    expect(layout4.cellSize).toBe(240);
    expect(layout4.boardSize).toBe(960);
    expect(layout4.startX).toBe(222);
    expect(layout4.badgeFontSize).toBe(30);
    expect(layout4.digitFontSize).toBe(70);
    expect(layout4.rulesY).toBe(1240);

    const layout8 = getKenKenLayout(8);
    expect(layout8.badgeFontSize).toBe(18);
    expect(layout8.digitFontSize).toBe(42);
  });

  it('renders a valid 3-page e-ink PDF with %PDF magic bytes for 6x6 puzzle', async () => {
    const generator = new KenKenGenerator();
    const puzzle = await generator.generate({ date: '2026-10-12', size: 6, difficulty: 'medium' });
    const pdfBuffer = await renderKenKenPdf(puzzle);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');

    // Count pages in PDF buffer (matches /Type /Page count)
    const pdfText = pdfBuffer.toString('binary');
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches).not.toBeNull();
    expect(pageMatches?.length).toBe(3);
  });

  it('renders valid PDFs across small (3x3) and large (9x9) sizes', async () => {
    const generator = new KenKenGenerator();
    for (const size of [3, 9]) {
      const puzzle = await generator.generate({ date: '2026-10-12', size, difficulty: 'medium' });
      const pdfBuffer = await renderKenKenPdf(puzzle);
      expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
    }
  });

  it('populates generator.generate with rendered pdfBuffer', async () => {
    const generator = new KenKenGenerator();
    const puzzle = await generator.generate({ date: '2026-10-12', size: 5 });
    expect(puzzle.pdfBuffer.length).toBeGreaterThan(1000);
    expect(puzzle.pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('renders KenKen 6x6 with standardized startY = 240 pt anchor, 960 pt boardSize, and rules at Y = 1240', async () => {
    const generator = new KenKenGenerator();
    const puzzle = await generator.generate({ date: '2026-10-12', size: 6, difficulty: 'medium' });

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
      const pdfBuffer = await renderKenKenPdf(puzzle);
      expect(pdfBuffer).toBeInstanceOf(Buffer);

      // Verify outer frame geometry
      expect(outerFrameRect).toBeDefined();
      expect(outerFrameRect?.x).toBe(222); // startX = Math.floor((1404 - 960) / 2) = 222
      expect(outerFrameRect?.y).toBe(240); // startY = 240
      expect(outerFrameRect?.w).toBe(960); // boardSize = 960
      expect(outerFrameRect?.h).toBe(960);

      // Verify rules prompt moved to Y = 1240 (startY + boardSize + 40)
      const rulesCall = textCalls.find((call) => call.text.includes('Fill with digits 1-6'));
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

  it('scales cage badges and solution digits dynamically based on grid size', async () => {
    const generator = new KenKenGenerator();
    for (const size of [4, 6, 8]) {
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
        const puzzle = await generator.generate({ date: '2026-10-12', size, difficulty: 'medium' });
        await renderKenKenPdf(puzzle);

        const expectedBadgeSize = size <= 4 ? 30 : size <= 6 ? 24 : 18;
        const expectedDigitSize = size <= 4 ? 70 : size <= 6 ? 56 : 42;

        expect(fontSizes).toContain(expectedBadgeSize);
        expect(fontSizes).toContain(expectedDigitSize);
      } finally {
        spy.mockRestore();
      }
    }
  });
});

