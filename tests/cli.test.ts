import { describe, it, expect, afterAll, vi } from 'vitest';
import fs from 'fs/promises';
import { runGenerator } from '../src/index';
import { RmapiDeliveryClient } from '../src/delivery/rmapi-client';

describe('Orchestrator runGenerator', () => {
  afterAll(async () => {
    await fs.rm('./test-cli-output', { recursive: true, force: true });
  });

  it('generates both word-search and sudoku puzzles in local mode', async () => {
    const results = await runGenerator({
      type: 'all',
      difficulty: 'medium',
      date: '2026-10-11',
      upload: false,
      outputDir: './test-cli-output',
    });

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.puzzle.metadata.id)).toEqual(['word-search', 'sudoku']);
    expect(results[0].deliveredPath).toContain('test-cli-output');
  });

  it('filters by puzzle type when specified', async () => {
    const results = await runGenerator({
      type: 'sudoku',
      difficulty: 'hard',
      date: '2026-10-11',
      upload: false,
      outputDir: './test-cli-output',
    });

    expect(results).toHaveLength(1);
    expect(results[0].puzzle.metadata.id).toBe('sudoku');
  });

  it('throws for unknown puzzle type', async () => {
    await expect(
      runGenerator({
        type: 'non-existent' as any,
        outputDir: './test-cli-output',
      })
    ).rejects.toThrow('Unknown puzzle type: non-existent');
  });

  it('warns when upload is requested but rmapi is not available', async () => {
    const isAvailableSpy = vi.spyOn(RmapiDeliveryClient.prototype, 'isAvailable').mockReturnValue(false);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const results = await runGenerator({
      type: 'sudoku',
      upload: true,
      outputDir: './test-cli-output',
    });

    expect(results).toHaveLength(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[WARN] --upload requested but rmapi is not available on PATH; falling back to local delivery.'
    );
    warnSpy.mockRestore();
    isAvailableSpy.mockRestore();
  });

  it('routes to /Puzzles/Daily when daily option is true', async () => {
    const results = await runGenerator({
      type: 'word-search',
      daily: true,
      outputDir: './test-cli-output',
    });

    expect(results).toHaveLength(1);
    expect(results[0].deliveredPath).toContain('Puzzles/Daily');
  });

  it('routes to custom folder when folder option is provided', async () => {
    const results = await runGenerator({
      type: 'sudoku',
      folder: '/Puzzles/CustomTesting',
      outputDir: './test-cli-output',
    });

    expect(results).toHaveLength(1);
    expect(results[0].deliveredPath).toContain('Puzzles/CustomTesting');
  });

  it('routes to default category folder when daily is false or omitted', async () => {
    const results = await runGenerator({
      type: 'word-search',
      daily: false,
      outputDir: './test-cli-output',
    });

    expect(results).toHaveLength(1);
    expect(results[0].deliveredPath).toContain('Puzzles/Word Search');
  });
});
