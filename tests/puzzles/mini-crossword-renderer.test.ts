import zlib from 'node:zlib';
import { describe, it, expect } from 'vitest';
import { MiniCrosswordGenerator } from '../../src/puzzles/mini-crossword/generator.ts';
import { getSeedCrosswordForDate } from '../../src/puzzles/mini-crossword/seed-bank.ts';
import { renderMiniCrosswordPdf } from '../../src/puzzles/mini-crossword/renderer.ts';
import { GeneratedPuzzle } from '../../src/core/types.ts';
import { MiniCrosswordData } from '../../src/puzzles/mini-crossword/types.ts';

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
});
