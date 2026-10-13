import { describe, it, expect, vi } from 'vitest';
import { FutoshikiGenerator } from '../../src/puzzles/futoshiki/generator.js';
import { solveFutoshiki } from '../../src/puzzles/futoshiki/solver.js';
import * as futoshikiBarrel from '../../src/puzzles/futoshiki/index.js';

describe('FutoshikiGenerator', () => {
  const generator = new FutoshikiGenerator();

  it('generates a valid 5x5 medium Futoshiki puzzle with unique solution', async () => {
    const puzzle = await generator.generate({ size: 5, difficulty: 'medium', date: '2026-10-14' });
    expect(puzzle.metadata.id).toBe('futoshiki');
    expect(puzzle.puzzleData.size).toBe(5);
    expect(puzzle.puzzleData.difficulty).toBe('medium');

    const solutions = solveFutoshiki(puzzle.puzzleData.initialGrid, puzzle.puzzleData.inequalities, 2);
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toEqual(puzzle.puzzleData.solution);
  });

  it('generates 4x4 and 6x6 puzzles respecting size clamping', async () => {
    const p4 = await generator.generate({ size: 4, difficulty: 'easy', date: '2026-10-14' });
    expect(p4.puzzleData.size).toBe(4);

    const p6 = await generator.generate({ size: 6, difficulty: 'hard', date: '2026-10-14' });
    expect(p6.puzzleData.size).toBe(6);

    const pClampedSmall = await generator.generate({ size: 2, difficulty: 'easy' });
    expect(pClampedSmall.puzzleData.size).toBe(4);

    const pClamped = await generator.generate({ size: 9, difficulty: 'medium' });
    expect(pClamped.puzzleData.size).toBe(6);
  });

  it('falls back to seed bank if procedural generation fails', async () => {
    const gen = new FutoshikiGenerator();
    // @ts-ignore
    vi.spyOn(gen, 'generateProcedural').mockReturnValue(null);

    const fallbackPuzzle = await gen.generate({ size: 5, difficulty: 'hard', date: '2026-10-14' });
    expect(fallbackPuzzle.puzzleData.size).toBe(5);
    expect(fallbackPuzzle.puzzleData.difficulty).toBe('hard');

    const solutions = solveFutoshiki(fallbackPuzzle.puzzleData.initialGrid, fallbackPuzzle.puzzleData.inequalities, 2);
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toEqual(fallbackPuzzle.puzzleData.solution);
  });

  it('defaults invalid difficulty to medium and supplies default date', async () => {
    const puzzle = await generator.generate({ difficulty: 'extreme' as any });
    expect(puzzle.puzzleData.difficulty).toBe('medium');
    expect(puzzle.metadata.date).toBeDefined();
    expect(puzzle.filename).toMatch(/^Futoshiki_5x5_medium_\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  it('exports all expected symbols from barrel file', () => {
    expect(futoshikiBarrel.FutoshikiGenerator).toBeDefined();
    expect(futoshikiBarrel.FUTOSHIKI_SEED_BANK).toBeDefined();
    expect(futoshikiBarrel.getSeedFutoshiki).toBeDefined();
    expect(futoshikiBarrel.solveFutoshiki).toBeDefined();
  });
});
