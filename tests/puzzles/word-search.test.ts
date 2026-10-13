import { describe, it, expect, vi } from 'vitest';
import { WordSearchGenerator } from '../../src/puzzles/word-search/generator.js';
import { WORD_THEMES } from '../../src/puzzles/word-search/word-bank.js';
import { getWordSearchLayout, renderWordSearchPdf } from '../../src/puzzles/word-search/renderer.js';
import { PdfBuilder } from '../../src/core/pdf-builder.js';

describe('WordSearchGenerator', () => {
  it('generates a 15x15 grid with placed words and valid solution coordinates', async () => {
    const generator = new WordSearchGenerator();
    const result = await generator.generate({ date: '2026-10-11' });

    expect(result.metadata.id).toBe('word-search');
    expect(result.metadata.targetFolder).toBe('/Puzzles/Word Search');
    expect(result.puzzleData.grid).toHaveLength(15);
    expect(result.puzzleData.grid[0]).toHaveLength(15);
    expect(result.puzzleData.words.length).toBeGreaterThanOrEqual(10);
    expect(result.filename).toMatch(/^WordSearch_2026-10-11_.+\.pdf$/);

    // Verify solution cell coordinates spell the placed words
    for (const sol of result.puzzleData.solution) {
      const letters = sol.cells.map(([r, c]) => result.puzzleData.grid[r][c]).join('');
      expect(letters).toBe(sol.word);
    }

    // Verify PDF rendering
    const pdfBuffer = await generator.renderPdf(result);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.toString('utf8', 0, 5)).toBe('%PDF-');
  });

  it('supports selecting a specific theme by name', async () => {
    const generator = new WordSearchGenerator();
    const result = await generator.generate({ theme: 'Ocean Life', date: '2026-10-12' });

    expect(result.puzzleData.theme).toBe('Ocean Life');
    expect(result.title).toBe('Word Search - Ocean Life');
    expect(result.filename).toBe('WordSearch_2026-10-12_OceanLife.pdf');
  });

  it('contains and supports all 15 curated themes', async () => {
    const generator = new WordSearchGenerator();
    expect(WORD_THEMES).toHaveLength(15);

    const expectedThemes = [
      'Astronomy',
      'Ocean Life',
      'Ancient History',
      'Inventions',
      'World Geography',
      'Chemistry',
      'Architecture',
      'Musical Instruments',
      'Weather & Climate',
      'Forest Wildlife',
      'Board Games',
      'Botany',
      'Deep Space',
      'Minerals & Gems',
      'Aviation',
    ];
    expect(WORD_THEMES.map(t => t.name)).toEqual(expectedThemes);

    for (const theme of WORD_THEMES) {
      const result = await generator.generate({ theme: theme.name, date: '2026-10-11' });
      expect(result.puzzleData.theme).toBe(theme.name);
      expect(result.puzzleData.words.length).toBeGreaterThanOrEqual(10);
      expect(result.puzzleData.grid).toHaveLength(15);
    }
  });

  it('renders valid PDF buffer with enhanced typography sizes', async () => {
    const generator = new WordSearchGenerator();
    const puzzle = await generator.generate({ theme: 'Astronomy' });
    const pdfBuffer = await generator.renderPdf(puzzle);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });

  it('exports getWordSearchLayout returning standardized layout configuration', () => {
    const layout = getWordSearchLayout();
    expect(layout.cellSize).toBe(64);
    expect(layout.gridWidth).toBe(960);
    expect(layout.startX).toBe(222);
    expect(layout.startY).toBe(240);
    expect(layout.checklistY).toBe(1240);
    expect(layout.letterFontSize).toBe(30);
    expect(layout.unsolvedFontSize).toBe(24);
  });

  it('renders a 3-page e-ink PDF with standardized layout geometry at startY = 240 and checklist at Y = 1240', async () => {
    const generator = new WordSearchGenerator();
    const puzzle = await generator.generate({ theme: 'Astronomy', date: '2026-10-14' });

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
      const pdfBuffer = await renderWordSearchPdf(puzzle);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
      expect(pdfBuffer.length).toBeGreaterThan(1000);
      expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');

      const pageMatches = pdfBuffer.toString('latin1').match(/\/Type\s*\/Page\b/g);
      expect(pageMatches ? pageMatches.length : 0).toBe(3);

      // Verify outer frame rect at (220, 238, 964, 964)
      const outerBorder = rects.find((r) => r.x === 220 && r.y === 238 && r.w === 964 && r.h === 964);
      expect(outerBorder).toBeDefined();

      // Verify grid cells start at (222, 240) with size 64x64
      const firstCell = rects.find((r) => r.x === 222 && r.y === 240 && r.w === 64 && r.h === 64);
      expect(firstCell).toBeDefined();

      // Verify checklist heading at Y = 1240
      const checklistHeader = textCalls.find((call) => call.text === 'Words to Find:');
      expect(checklistHeader).toBeDefined();
      expect(checklistHeader?.y).toBe(1240);

      // Verify solutions heading on answer key at Y = 1240
      const solutionsHeader = textCalls.find((call) => call.text === 'Solutions:');
      expect(solutionsHeader).toBeDefined();
      expect(solutionsHeader?.y).toBe(1240);
    } finally {
      spy.mockRestore();
    }
  });
});
