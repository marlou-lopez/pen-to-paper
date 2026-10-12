import { describe, it, expect } from 'vitest';
import { MiniCrosswordGenerator } from '../../src/puzzles/mini-crossword/generator.ts';
import { getSeedCrosswordForDate } from '../../src/puzzles/mini-crossword/seed-bank.ts';
import { renderMiniCrosswordPdf } from '../../src/puzzles/mini-crossword/renderer.ts';
import { GeneratedPuzzle } from '../../src/core/types.ts';
import { MiniCrosswordData } from '../../src/puzzles/mini-crossword/types.ts';

describe('Mini Crossword PDF Renderer', () => {
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
});
