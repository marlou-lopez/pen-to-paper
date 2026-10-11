import { describe, it, expect } from 'vitest';
import { PdfBuilder, PAGE_WIDTH, PAGE_HEIGHT } from '../../src/core/pdf-builder';

describe('PdfBuilder', () => {
  it('generates a 3-page valid PDF buffer', async () => {
    const builder = new PdfBuilder('Test Puzzle', 'Theme: Sample', '2026-10-11');
    const doc = builder.getDoc();

    // Page 1 content
    doc.fontSize(24).text('Custom Puzzle Grid Here', 100, 200);

    // Page 2: Buffer page
    builder.addBufferPage();

    // Page 3: Answer key
    builder.addAnswerKeyPage('Test Puzzle Solution');
    doc.fontSize(24).text('Custom Answer Key Grid Here', 100, 200);

    const buffer = await builder.build();

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // Valid PDF starts with %PDF-
    expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
  });

  it('exposes correct dimensions for reMarkable', () => {
    expect(PAGE_WIDTH).toBe(1404);
    expect(PAGE_HEIGHT).toBe(1872);
  });
});
