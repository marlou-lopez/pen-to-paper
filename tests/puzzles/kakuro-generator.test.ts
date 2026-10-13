import { describe, it, expect } from 'vitest';
import { KakuroGenerator } from '../../src/puzzles/kakuro/generator.ts';
import { solveKakuro } from '../../src/puzzles/kakuro/solver.ts';

describe('Kakuro Generator', () => {
  it('generates a valid Kakuro puzzle conforming to PuzzleGenerator interface', async () => {
    const generator = new KakuroGenerator();
    const result = await generator.generate({ size: 8, difficulty: 'medium', date: '2026-10-13' });

    expect(result.type).toBe('kakuro');
    expect(result.puzzleData.size).toBe(8);
    expect(result.puzzleData.difficulty).toBe('medium');
    expect(result.puzzleData.grid).toHaveLength(8);

    // Verify generated puzzle has a unique solution
    const solutions = solveKakuro(result.puzzleData.grid, result.puzzleData.runs, 2);
    expect(solutions).toHaveLength(1);
  });
});
