import { describe, it, expect, afterAll } from 'vitest';
import fs from 'fs/promises';
import { runGenerator } from '../src/index';

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
});
