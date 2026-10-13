import { describe, it, expect } from 'vitest';
import { renderKakuroPdf } from '../../src/puzzles/kakuro/renderer.js';
import { getSeedKakuro } from '../../src/puzzles/kakuro/seed-bank.js';
import { KakuroGenerator } from '../../src/puzzles/kakuro/generator.js';

describe('Kakuro E-Ink PDF Renderer', () => {
  it('renders a valid 3-page e-ink PDF with diagonal clue cells and answer key', async () => {
    const data = getSeedKakuro(8, 'medium', '2026-10-13');
    const buffer = await renderKakuroPdf(data);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');

    // Page count check: exactly 3 pages
    const pdfText = buffer.toString('latin1');
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches?.length).toBe(3);
  });

  it('renders valid 3-page PDFs for sizes 6x6, 8x8, and 10x10', async () => {
    for (const size of [6, 8, 10]) {
      const data = getSeedKakuro(size, 'easy', '2026-10-13');
      const buffer = await renderKakuroPdf(data);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
      const pdfText = buffer.toString('latin1');
      const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
      expect(pageMatches?.length).toBe(3);
    }
  });

  it('accepts GeneratedPuzzle input and integrates with KakuroGenerator', async () => {
    const generator = new KakuroGenerator();
    const puzzle = await generator.generate({ size: 6, difficulty: 'medium', date: '2026-10-13' });

    expect(puzzle.pdfBuffer).toBeDefined();
    expect(puzzle.pdfBuffer!.length).toBeGreaterThan(1000);
    expect(puzzle.pdfBuffer!.subarray(0, 4).toString()).toBe('%PDF');

    const manualBuffer = await generator.renderPdf(puzzle);
    expect(manualBuffer.length).toBeGreaterThan(1000);
    expect(manualBuffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
