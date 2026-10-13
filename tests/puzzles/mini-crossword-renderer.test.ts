import zlib from 'node:zlib';
import { describe, it, expect, vi } from 'vitest';
import { MiniCrosswordGenerator } from '../../src/puzzles/mini-crossword/generator.ts';
import { getSeedCrosswordForDate } from '../../src/puzzles/mini-crossword/seed-bank.ts';
import { renderMiniCrosswordPdf, MINI_CROSSWORD_LAYOUT } from '../../src/puzzles/mini-crossword/renderer.ts';
import { GeneratedPuzzle } from '../../src/core/types.ts';
import { MiniCrosswordData } from '../../src/puzzles/mini-crossword/types.ts';
import { PdfBuilder } from '../../src/core/pdf-builder.ts';

describe('Mini Crossword PDF Renderer', () => {
  it('renders a valid 3-page e-ink PDF with blocked grid', async () => {
    const puzzle = getSeedCrosswordForDate('2026-10-13');
    const pdfBuffer = await renderMiniCrosswordPdf(puzzle);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // Check %PDF magic header
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');

    // Page count check: /Type /Page occurs at least 3 times
    const pdfText = pdfBuffer.toString('latin1');
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches?.length).toBe(3);
  });

  it('renders solid black blocker squares without letters or clue numbers', async () => {
    const puzzle = getSeedCrosswordForDate('2026-10-13');
    const pdfBuffer = await renderMiniCrosswordPdf(puzzle);

    const regex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
    let match: RegExpExecArray | null;
    let decompressedContent = '';
    while ((match = regex.exec(pdfBuffer.toString('binary'))) !== null) {
      try {
        decompressedContent += zlib.inflateSync(Buffer.from(match[1], 'binary')).toString('utf8') + '\n';
      } catch {
        // non-flate stream
      }
    }

    // Hex <23> corresponds to '#' character in PDFKit font encoding (should never appear)
    expect(decompressedContent).not.toContain('<23>');

    // Fill operator 'f' should be present for solid black blocker squares on page 1 and page 3
    const fillMatches = decompressedContent.match(/\bf\b/g);
    expect(fillMatches).not.toBeNull();
    expect(fillMatches!.length).toBeGreaterThanOrEqual(12);
  });

  it('renders a 3-page e-ink PDF buffer for a mini crossword', async () => {
    const data = getSeedCrosswordForDate('2026-10-12');
    const puzzle: GeneratedPuzzle<MiniCrosswordData> = {
      metadata: {
        id: 'mini-crossword',
        displayName: 'Mini Crossword',
        targetFolder: '/Puzzles/Mini Crossword',
      },
      type: 'mini-crossword',
      title: data.title,
      filename: 'MiniCrossword_2026-10-12.pdf',
      puzzleData: data,
    };
    const buffer = await renderMiniCrosswordPdf(puzzle);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // PDF Magic bytes
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');

    // Verify 3 distinct pages are present in the PDF document
    const pageMatches = buffer.toString('latin1').match(/\/Type\s*\/Page\b/g);
    expect(pageMatches).toHaveLength(3);
  });

  it('renders correctly when passed MiniCrosswordData directly', async () => {
    const data = getSeedCrosswordForDate('2026-10-12');
    const buffer = await renderMiniCrosswordPdf(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    const pageMatches = buffer.toString('latin1').match(/\/Type\s*\/Page\b/g);
    expect(pageMatches).toHaveLength(3);
  });

  it('generator produces complete PuzzleResult with filename and 3-page PDF buffer', async () => {
    const generator = new MiniCrosswordGenerator();
    const result = await generator.generate({ date: '2026-10-12' });
    expect(result.type).toBe('mini-crossword');
    expect(result.filename).toMatch(/^MiniCrossword_2026-10-12.*\.pdf$/);
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(result.metadata.date).toBe('2026-10-12');

    const pageMatches = result.buffer.toString('latin1').match(/\/Type\s*\/Page\b/g);
    expect(pageMatches).toHaveLength(3);
  });

  it('generator includes theme in filename when theme option is provided', async () => {
    const generator = new MiniCrosswordGenerator();
    const result = await generator.generate({ theme: 'Deep Space', date: '2026-10-12' });
    expect(result.filename).toBe('MiniCrossword_2026-10-12_Deep_Space.pdf');
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('defines unified MINI_CROSSWORD_LAYOUT with startY = 240, boardSize = 900, cellSize = 180', () => {
    expect(MINI_CROSSWORD_LAYOUT.startY).toBe(240);
    expect(MINI_CROSSWORD_LAYOUT.cellSize).toBe(180);
    expect(MINI_CROSSWORD_LAYOUT.boardSize).toBe(900);
    expect(MINI_CROSSWORD_LAYOUT.startX).toBe(252);
    expect(MINI_CROSSWORD_LAYOUT.cluesY).toBe(1180);
    expect(MINI_CROSSWORD_LAYOUT.acrossX).toBe(140);
    expect(MINI_CROSSWORD_LAYOUT.downX).toBe(744);
    expect(MINI_CROSSWORD_LAYOUT.colWidth).toBe(520);
    expect(MINI_CROSSWORD_LAYOUT.clueNumberFontSize).toBe(28);
    expect(MINI_CROSSWORD_LAYOUT.letterFontSize).toBe(64);
    expect(MINI_CROSSWORD_LAYOUT.clueHeaderFontSize).toBe(24);
    expect(MINI_CROSSWORD_LAYOUT.cluePrefixFontSize).toBe(22);
    expect(MINI_CROSSWORD_LAYOUT.clueFontSize).toBe(20);
  });

  it('renders mini crossword with 900pt grid at startY = 240, 28pt cell clue numbers, 64pt solved letters, and clues at Y = 1180 across 3 pages', async () => {
    const puzzle = getSeedCrosswordForDate('2026-10-13');

    let outerFrameRect: { x: number; y: number; w: number; h: number } | undefined;
    const cellRects: { x: number; y: number; w: number; h: number }[] = [];
    const textCalls: { text: string; x?: number; y?: number; options?: any; fontSize?: number; fontName?: string }[] = [];
    let currentFontSize = 0;
    let currentFontName = '';

    const origGetDoc = PdfBuilder.prototype.getDoc;
    const spy = vi.spyOn(PdfBuilder.prototype, 'getDoc').mockImplementation(function (this: any) {
      const doc = origGetDoc.call(this);

      const origRect = doc.rect.bind(doc);
      doc.rect = (x: number, y: number, w: number, h: number) => {
        if (w >= 900 && h >= 900) {
          outerFrameRect = { x, y, w, h };
        } else if (w === 180 && h === 180) {
          cellRects.push({ x, y, w, h });
        }
        return origRect(x, y, w, h);
      };

      const origFontSize = doc.fontSize.bind(doc);
      doc.fontSize = (size: number) => {
        currentFontSize = size;
        return origFontSize(size);
      };

      const origFont = doc.font.bind(doc);
      doc.font = (name: string) => {
        currentFontName = name;
        return origFont(name);
      };

      const origText = doc.text.bind(doc);
      doc.text = (str: any, x?: any, y?: any, options?: any) => {
        if (typeof x === 'number' && typeof y === 'number') {
          textCalls.push({
            text: String(str),
            x,
            y,
            options,
            fontSize: currentFontSize,
            fontName: currentFontName,
          });
        } else {
          textCalls.push({
            text: String(str),
            options: x,
            fontSize: currentFontSize,
            fontName: currentFontName,
          });
        }
        return origText(str, x, y, options);
      };

      return doc;
    });

    try {
      const pdfBuffer = await renderMiniCrosswordPdf(puzzle);
      expect(pdfBuffer).toBeInstanceOf(Buffer);

      // Verify outer frame rect
      expect(outerFrameRect).toBeDefined();
      expect(outerFrameRect?.x).toBe(250); // startX (252) - 2
      expect(outerFrameRect?.y).toBe(238); // startY (240) - 2
      expect(outerFrameRect?.w).toBe(904); // boardSize (900) + 4
      expect(outerFrameRect?.h).toBe(904);

      // Verify cells rendered with 180pt size
      expect(cellRects.length).toBeGreaterThan(0);
      expect(cellRects[0].w).toBe(180);
      expect(cellRects[0].h).toBe(180);

      // Verify cell clue numbers: 28pt font at cellX + 8, cellY + 8
      const clueNumber1 = textCalls.find((c) => c.text === '1' && c.fontSize === 28);
      expect(clueNumber1).toBeDefined();
      // Cell (0,0) is at startX = 252, startY = 240, so cell clue number is at (252 + 8 = 260, 240 + 8 = 248)
      expect(clueNumber1?.x).toBe(260);
      expect(clueNumber1?.y).toBe(248);
      expect(clueNumber1?.fontSize).toBe(28);

      // Verify clue list headers at Y = 1180
      const acrossHeader = textCalls.find((c) => c.text === 'ACROSS' && c.y === 1180);
      expect(acrossHeader).toBeDefined();
      expect(acrossHeader?.x).toBe(140);
      expect(acrossHeader?.fontSize).toBe(24);

      const downHeader = textCalls.find((c) => c.text === 'DOWN' && c.y === 1180);
      expect(downHeader).toBeDefined();
      expect(downHeader?.x).toBe(744);
      expect(downHeader?.fontSize).toBe(24);

      // Verify clue prefix rendered with 22pt bold font
      const cluePrefixCall = textCalls.find((c) => c.text === '1. ' && c.fontSize === 22);
      expect(cluePrefixCall).toBeDefined();
      expect(cluePrefixCall?.fontName).toBe('Helvetica-Bold');

      // Verify solved letter on answer key (page 3): 64pt bold at cellY + 45
      const solvedLetterCall = textCalls.find((c) => c.fontSize === 64 && c.fontName === 'Helvetica-Bold');
      expect(solvedLetterCall).toBeDefined();
      expect(solvedLetterCall?.y).toBe(240 + 45); // Row 0 is at startY + 45 = 285

      // Verify 3 pages generated cleanly
      const pdfText = pdfBuffer.toString('binary');
      const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
      expect(pageMatches?.length).toBe(3);
    } finally {
      spy.mockRestore();
    }
  });
});
