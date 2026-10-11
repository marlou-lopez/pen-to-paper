import { describe, it, expect } from 'vitest';
import { WordSearchGenerator } from '../../src/puzzles/word-search/generator.js';

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
});
