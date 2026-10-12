import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { cleanDefinition, fetchWordsWithDefinitions } from '../../src/puzzles/mini-crossword/clue-fetcher.ts';
import { MiniCrosswordGenerator } from '../../src/puzzles/mini-crossword/generator.ts';

describe('Mini Crossword Clue Fetcher', () => {
  it('cleans raw Datamuse definitions correctly', () => {
    expect(cleanDefinition('n\tA firm, round fruit produced by an apple tree.')).toBe('A firm, round fruit produced by an apple tree');
    expect(cleanDefinition('v\t(transitive) To employ or put into service. ')).toBe('To employ or put into service');
    expect(cleanDefinition('adj\tVery large or spacious.')).toBe('Very large or spacious');
  });

  it('handles empty, brackets, and multiple qualifiers gracefully in cleanDefinition', () => {
    expect(cleanDefinition('')).toBe('');
    expect(cleanDefinition('n\t(rare) [archaic] An ancient vessel.')).toBe('An ancient vessel');
    expect(cleanDefinition('n\t[botany] A deciduous shrub;')).toBe('A deciduous shrub');
  });

  it('falls back gracefully to seed bank when network fails', async () => {
    const generator = new MiniCrosswordGenerator();
    const result = await generator.generateData({ theme: 'nonexistent-xyz-theme', date: '2026-10-12' });
    expect(result.grid).toHaveLength(5);
    expect(result.acrossClues).toHaveLength(5);
    expect(result.downClues).toHaveLength(5);
  });

  describe('fetchWordsWithDefinitions network behavior', () => {
    const originalFetch = globalThis.fetch;

    afterEach(() => {
      globalThis.fetch = originalFetch;
    });

    it('returns empty map when fetch fails or times out', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const words = await fetchWordsWithDefinitions('nature');
      expect(words.size).toBe(0);
    });

    it('parses valid 5-letter words with definitions correctly', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { word: 'apple', score: 100, defs: ['n\tRound fruit with seeds.'] },
          { word: 'pear', score: 90, defs: ['n\tSweet fruit.'] }, // 4 letters -> ignored
          { word: 'grape', score: 85, defs: ['n\tSmall juicy fruit.'] },
          { word: 'lemon', score: 80 }, // no defs -> ignored
        ],
      });

      const words = await fetchWordsWithDefinitions('fruit');
      expect(words.size).toBe(2);
      expect(words.get('APPLE')).toBe('Round fruit with seeds');
      expect(words.get('GRAPE')).toBe('Small juicy fruit');
      expect(words.has('PEAR')).toBe(false);
      expect(words.has('LEMON')).toBe(false);
    });
  });
});

describe('MiniCrosswordGenerator Data Generation', () => {
  it('generates a valid 5x5 grid with 5 across and 5 down clues matching character intersections', async () => {
    const generator = new MiniCrosswordGenerator();
    const puzzle = await generator.generateData({ date: '2026-10-12' });

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        expect(puzzle.grid[r][c]).toBe(puzzle.acrossClues[r].word[c]);
        expect(puzzle.grid[r][c]).toBe(puzzle.downClues[c].word[r]);
      }
    }
  });

  it('assigns standard crossword clue numbers (1, 6, 7, 8, 9 across and 1, 2, 3, 4, 5 down)', async () => {
    const generator = new MiniCrosswordGenerator();
    const puzzle = await generator.generateData({ date: '2026-10-12' });
    expect(puzzle.acrossClues.map(c => c.number)).toEqual([1, 6, 7, 8, 9]);
    expect(puzzle.downClues.map(c => c.number)).toEqual([1, 2, 3, 4, 5]);
  });

  it('implements PuzzleGenerator metadata, generate, and renderPdf', async () => {
    const generator = new MiniCrosswordGenerator();
    expect(generator.metadata.id).toBe('mini-crossword');
    expect(generator.type).toBe('mini-crossword');

    const generated = await generator.generate({ date: '2026-10-12' });
    expect(generated.metadata.id).toBe('mini-crossword');
    expect(generated.filename).toBe('MiniCrossword_2026-10-12.pdf');
    expect(generated.puzzleData.grid).toHaveLength(5);

    const pdfBuffer = await generator.renderPdf(generated);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('executes dynamic solving branch when sufficient theme words are returned', async () => {
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { word: 'heart', score: 100, defs: ['n\tVital organ.'] },
          { word: 'ember', score: 95, defs: ['n\tGlowing coal.'] },
          { word: 'abuse', score: 90, defs: ['n\tImproper treatment.'] },
          { word: 'resin', score: 85, defs: ['n\tSticky substance from trees.'] },
          { word: 'trend', score: 80, defs: ['n\tGeneral direction.'] },
          { word: 'crane', score: 75, defs: ['n\tTall bird.'] },
          { word: 'raven', score: 70, defs: ['n\tBlack bird.'] },
          { word: 'adore', score: 65, defs: ['v\tLove deeply.'] },
          { word: 'nerve', score: 60, defs: ['n\tFiber that transmits impulses.'] },
          { word: 'enter', score: 55, defs: ['v\tCome or go into.'] },
        ],
      });

      const generator = new MiniCrosswordGenerator();
      const puzzle = await generator.generateData({ theme: 'Nature', date: '2026-10-12' });
      expect(puzzle.title).toBe('Mini Crossword - Nature');
      expect(puzzle.grid).toHaveLength(5);
      expect(puzzle.acrossClues).toHaveLength(5);
      expect(puzzle.downClues).toHaveLength(5);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
