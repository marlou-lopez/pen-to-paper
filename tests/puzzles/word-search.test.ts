import { describe, it, expect } from 'vitest';
import { WordSearchGenerator } from '../../src/puzzles/word-search/generator.js';
import { WORD_THEMES } from '../../src/puzzles/word-search/word-bank.js';

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
});
