import { describe, it, expect } from 'vitest';
import { SudokuGenerator, resolveSudokuDifficulty } from '../../src/puzzles/sudoku/generator';

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
});
