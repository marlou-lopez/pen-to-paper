import { describe, it, expect, vi } from 'vitest';
import { SudokuGenerator, resolveSudokuDifficulty } from '../../src/puzzles/sudoku/generator';
import { renderSudokuPdf, SUDOKU_LAYOUT } from '../../src/puzzles/sudoku/renderer';
import { PdfBuilder } from '../../src/core/pdf-builder';

describe('SudokuGenerator', () => {
  it('resolves difficulty rotating by day-of-week when set to random', () => {
    // 2026-10-11 is Sunday -> expert
    expect(resolveSudokuDifficulty('random', new Date('2026-10-11T00:00:00Z'))).toBe('expert');
    // 2026-10-12 is Monday -> easy
    expect(resolveSudokuDifficulty('random', new Date('2026-10-12'))).toBe('easy');
    // 2026-10-13 is Tuesday -> medium
    expect(resolveSudokuDifficulty('random', new Date('2026-10-13'))).toBe('medium');
    // 2026-10-14 is Wednesday -> medium
    expect(resolveSudokuDifficulty('random', new Date('2026-10-14'))).toBe('medium');
    // 2026-10-15 is Thursday -> hard
    expect(resolveSudokuDifficulty('random', new Date('2026-10-15'))).toBe('hard');
    // 2026-10-16 is Friday -> hard
    expect(resolveSudokuDifficulty('random', new Date('2026-10-16'))).toBe('hard');
    // 2026-10-17 is Saturday -> expert
    expect(resolveSudokuDifficulty('random', new Date('2026-10-17'))).toBe('expert');
    // Explicit override
    expect(resolveSudokuDifficulty('hard', new Date('2026-10-12'))).toBe('hard');
  });

  it('ensures timezone independence for day-of-week rotation', () => {
    // Construct dates with explicit UTC timestamps and verify getUTCDay rotation
    const mondayUtc = new Date(Date.UTC(2026, 9, 12, 0, 0, 0)); // 2026-10-12 Monday UTC
    expect(resolveSudokuDifficulty('random', mondayUtc)).toBe('easy');

    const thursdayUtc = new Date(Date.UTC(2026, 9, 15, 23, 59, 59)); // 2026-10-15 Thursday UTC
    expect(resolveSudokuDifficulty('random', thursdayUtc)).toBe('hard');

    const sundayUtc = new Date(Date.UTC(2026, 9, 18, 12, 0, 0)); // 2026-10-18 Sunday UTC
    expect(resolveSudokuDifficulty('random', sundayUtc)).toBe('expert');
  });

  it('generates puzzle with rotating difficulty if none provided', async () => {
    const generator = new SudokuGenerator();
    // 2026-10-12 is Monday -> easy
    const result = await generator.generate({ date: '2026-10-12' });
    expect(result.puzzleData.difficulty).toBe('easy');
    expect(result.filename).toBe('Sudoku_Easy_2026-10-12.pdf');
  });

  it('generates a valid 9x9 board and renders 3-page PDF', async () => {
    const generator = new SudokuGenerator();
    const result = await generator.generate({ date: '2026-10-11', difficulty: 'medium' });

    expect(result.metadata.id).toBe('sudoku');
    expect(result.metadata.targetFolder).toBe('/Puzzles/Sudoku');
    expect(result.filename).toBe('Sudoku_Medium_2026-10-11.pdf');
    expect(result.puzzleData.puzzleGrid).toHaveLength(9);
    expect(result.puzzleData.solutionGrid).toHaveLength(9);

    const pdfBuffer = await generator.renderPdf(result);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.toString('utf8', 0, 5)).toBe('%PDF-');
  });

  it('generates custom sudoku puzzle from grid notation', async () => {
    const generator = new SudokuGenerator();
    const puzzle = await generator.generate({
      grid: '53xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79',
      date: '2026-10-12',
    });

    expect(puzzle.filename).toBe('Sudoku_Custom_2026-10-12.pdf');
    expect(puzzle.title).toBe('Sudoku - Custom');
    expect(puzzle.puzzleData.puzzleGrid[0][0]).toBe(5);
    expect(puzzle.puzzleData.solutionGrid[0][2]).toBe(4);
  });

  it('renders with standardized startY = 240 pt anchor and 990 pt boardSize across 3 pages', async () => {
    expect(SUDOKU_LAYOUT.startY).toBe(240);
    expect(SUDOKU_LAYOUT.boardSize).toBe(990);
    expect(SUDOKU_LAYOUT.startX).toBe(207);
    expect(SUDOKU_LAYOUT.cellSize).toBe(110);

    const generator = new SudokuGenerator();
    const result = await generator.generate({ date: '2026-10-11', difficulty: 'medium' });

    let outerFrameRect: { x: number; y: number; w: number; h: number } | undefined;
    const origGetDoc = PdfBuilder.prototype.getDoc;
    const spy = vi.spyOn(PdfBuilder.prototype, 'getDoc').mockImplementation(function (this: any) {
      const doc = origGetDoc.call(this);
      const origRect = doc.rect.bind(doc);
      doc.rect = (x: number, y: number, w: number, h: number) => {
        if (!outerFrameRect) {
          outerFrameRect = { x, y, w, h };
        }
        return origRect(x, y, w, h);
      };
      return doc;
    });

    try {
      const pdfBuffer = await renderSudokuPdf(result);
      expect(pdfBuffer).toBeInstanceOf(Buffer);

      // Outer frame is drawn at startX - 2, startY - 2, boardSize + 4, boardSize + 4
      expect(outerFrameRect).toBeDefined();
      expect(outerFrameRect?.x).toBe(205); // startX = (1404 - 990) / 2 = 207 -> 207 - 2 = 205
      expect(outerFrameRect?.y).toBe(238); // startY = 240 -> 240 - 2 = 238
      expect(outerFrameRect?.w).toBe(994); // boardSize = 990 -> 990 + 4 = 994
      expect(outerFrameRect?.h).toBe(994);

      // Verify 3 pages generated cleanly
      const pdfText = pdfBuffer.toString('binary');
      const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
      expect(pageMatches?.length).toBe(3);
    } finally {
      spy.mockRestore();
    }
  });
});

