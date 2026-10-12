import { describe, it, expect } from 'vitest';
import { KenKenGenerator } from '../../src/puzzles/kenken/generator.ts';
import { renderKenKenPdf } from '../../src/puzzles/kenken/renderer.ts';

describe('KenKen E-Ink PDF Renderer', () => {
  it('renders a valid 3-page e-ink PDF with %PDF magic bytes for 6x6 puzzle', async () => {
    const generator = new KenKenGenerator();
    const puzzle = await generator.generate({ date: '2026-10-12', size: 6, difficulty: 'medium' });
    const pdfBuffer = await renderKenKenPdf(puzzle);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');

    // Count pages in PDF buffer (matches /Type /Page count)
    const pdfText = pdfBuffer.toString('binary');
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches).not.toBeNull();
    expect(pageMatches?.length).toBe(3);
  });

  it('renders valid PDFs across small (3x3) and large (9x9) sizes', async () => {
    const generator = new KenKenGenerator();
    for (const size of [3, 9]) {
      const puzzle = await generator.generate({ date: '2026-10-12', size, difficulty: 'medium' });
      const pdfBuffer = await renderKenKenPdf(puzzle);
      expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
    }
  });

  it('populates generator.generate with rendered pdfBuffer', async () => {
    const generator = new KenKenGenerator();
    const puzzle = await generator.generate({ date: '2026-10-12', size: 5 });
    expect(puzzle.pdfBuffer.length).toBeGreaterThan(1000);
    expect(puzzle.pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
