import { describe, it, expect, afterAll, vi } from 'vitest';
import fs from 'fs/promises';
import { runGenerator, runCleanup, orchestrator as exportedOrchestrator } from '../src/index';
import { parseArgs } from '../src/cli';
import { RmapiDeliveryClient } from '../src/delivery/rmapi-client';

const orchestrator = { runGenerator };

describe('Orchestrator runGenerator', () => {
  afterAll(async () => {
    await fs.rm('./test-cli-output', { recursive: true, force: true });
    await fs.rm('./output', { recursive: true, force: true });
  });

  it('filters by kenken puzzle type when specified with custom size', async () => {
    const result = await orchestrator.runGenerator({ type: 'kenken', size: 5, local: true });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('kenken');
    expect(result[0].puzzleData.size).toBe(5);
  });

  it('filters by kakuro puzzle type when specified with custom size and difficulty', async () => {
    const result = await orchestrator.runGenerator({ type: 'kakuro', size: 6, difficulty: 'easy', local: true });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('kakuro');
    expect(result[0].puzzleData.size).toBe(6);
    expect(result[0].puzzleData.difficulty).toBe('easy');
  });

  it('routes kenken to /Puzzles/KenKen by default and /Puzzles/Daily when daily option is true', async () => {
    const defaultRes = await orchestrator.runGenerator({ type: 'kenken', local: true });
    expect(defaultRes[0].destinationFolder).toBe('/Puzzles/KenKen');

    const dailyRes = await orchestrator.runGenerator({ type: 'kenken', daily: true, local: true });
    expect(dailyRes[0].destinationFolder).toBe('/Puzzles/Daily');
  });

  it('routes kakuro to /Puzzles/Kakuro by default and /Puzzles/Daily when daily option is true', async () => {
    const defaultRes = await orchestrator.runGenerator({ type: 'kakuro', local: true });
    expect(defaultRes[0].destinationFolder).toBe('/Puzzles/Kakuro');

    const dailyRes = await orchestrator.runGenerator({ type: 'kakuro', daily: true, local: true });
    expect(dailyRes[0].destinationFolder).toBe('/Puzzles/Daily');
  });

  it('filters by futoshiki puzzle type when specified with custom size and difficulty', async () => {
    const result = await orchestrator.runGenerator({ type: 'futoshiki', size: 4, difficulty: 'hard', local: true });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('futoshiki');
    expect(result[0].puzzleData.size).toBe(4);
    expect(result[0].puzzleData.difficulty).toBe('hard');
  });

  it('routes futoshiki to /Puzzles/Futoshiki by default and /Puzzles/Daily when daily option is true', async () => {
    const defaultRes = await orchestrator.runGenerator({ type: 'futoshiki', local: true });
    expect(defaultRes[0].destinationFolder).toBe('/Puzzles/Futoshiki');

    const dailyRes = await orchestrator.runGenerator({ type: 'futoshiki', daily: true, local: true });
    expect(dailyRes[0].destinationFolder).toBe('/Puzzles/Daily');
  });

  it('generates word-search, sudoku, mini-crossword, kenken, kakuro, and futoshiki when type is all', async () => {
    const result = await orchestrator.runGenerator({ type: 'all', local: true });
    expect(result).toHaveLength(6);
    const types = result.map((r: any) => r.type);
    expect(types).toContain('word-search');
    expect(types).toContain('sudoku');
    expect(types).toContain('mini-crossword');
    expect(types).toContain('kenken');
    expect(types).toContain('kakuro');
    expect(types).toContain('futoshiki');
  });

  it('generates word-search, sudoku, mini-crossword, kenken, kakuro, and futoshiki puzzles in local mode when type is all', async () => {
    const results = await runGenerator({
      type: 'all',
      difficulty: 'medium',
      date: '2026-10-11',
      upload: false,
      outputDir: './test-cli-output',
    });

    expect(results).toHaveLength(6);
    expect(results.map((r) => r.puzzle.metadata.id)).toEqual(['word-search', 'sudoku', 'mini-crossword', 'kenken', 'kakuro', 'futoshiki']);
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

  it('filters by mini-crossword puzzle type when specified', async () => {
    const results = await runGenerator({
      type: 'mini-crossword',
      date: '2026-10-11',
      upload: false,
      outputDir: './test-cli-output',
    });

    expect(results).toHaveLength(1);
    expect(results[0].puzzle.metadata.id).toBe('mini-crossword');
  });

  it('routes mini-crossword to /Puzzles/Mini Crossword by default and /Puzzles/Daily when daily option is true', async () => {
    const defaultResults = await runGenerator({
      type: 'mini-crossword',
      date: '2026-10-11',
      daily: false,
      outputDir: './test-cli-output',
    });
    expect(defaultResults[0].deliveredPath).toContain('Puzzles/Mini Crossword');

    const dailyResults = await runGenerator({
      type: 'mini-crossword',
      date: '2026-10-11',
      daily: true,
      outputDir: './test-cli-output',
    });
    expect(dailyResults[0].deliveredPath).toContain('Puzzles/Daily');
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

  it('generates custom sudoku when --grid is provided', async () => {
    const results = await runGenerator({
      grid: '53xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79',
      outputDir: './test-cli-output',
      date: '2026-10-12',
    });

    expect(results).toHaveLength(1);
    expect(results[0].puzzle.metadata.id).toBe('sudoku');
    expect(results[0].puzzle.filename).toContain('Sudoku_Custom_');
  });
});

describe('CLI parseArgs', () => {
  it('parses --grid and defaults type to sudoku if not set', () => {
    const options = parseArgs(['--grid=53xx7xxxx/6xx195xxx']);
    expect(options.grid).toBe('53xx7xxxx/6xx195xxx');
    expect(options.type).toBe('sudoku');
  });

  it('preserves explicitly provided type when --grid is passed', () => {
    const options = parseArgs(['--type=sudoku', '--grid=53xx7xxxx/6xx195xxx']);
    expect(options.grid).toBe('53xx7xxxx/6xx195xxx');
    expect(options.type).toBe('sudoku');
  });

  it('parses --size for kenken and defaults to 6 if not provided when type is kenken', () => {
    const options = parseArgs(['--type=kenken']);
    expect(options.size).toBe(6);

    const custom = parseArgs(['--type=kenken', '--size=4']);
    expect(custom.size).toBe(4);
  });

  it('parses --type=kakuro and defaults size to 8 and difficulty to medium', () => {
    const options = parseArgs(['--type=kakuro']);
    expect(options.type).toBe('kakuro');
    expect(options.size).toBe(8);
    expect(options.difficulty).toBe('medium');
  });

  it('parses --size and --difficulty for kakuro', () => {
    const options = parseArgs(['--type=kakuro', '--size=10', '--difficulty=hard']);
    expect(options.type).toBe('kakuro');
    expect(options.size).toBe(10);
    expect(options.difficulty).toBe('hard');
  });

  it('parses --type=futoshiki and defaults size to 5 and difficulty to medium', () => {
    const options = parseArgs(['--type=futoshiki']);
    expect(options.type).toBe('futoshiki');
    expect(options.size).toBe(5);
    expect(options.difficulty).toBe('medium');
  });

  it('parses --size and clamps to 4, 5, or 6 for futoshiki', () => {
    const clampedLow = parseArgs(['--type=futoshiki', '--size=2']);
    expect(clampedLow.size).toBe(4);

    const clampedHigh = parseArgs(['--type=futoshiki', '--size=9']);
    expect(clampedHigh.size).toBe(6);

    const normal = parseArgs(['--type=futoshiki', '--size=5', '--difficulty=hard']);
    expect(normal.size).toBe(5);
    expect(normal.difficulty).toBe('hard');
  });

  it('parses --cleanup and sets options.cleanup = true', () => {
    const options = parseArgs(['--cleanup']);
    expect(options.cleanup).toBe(true);
  });

  it('parses cleanup subcommand and flags', () => {
    const options = parseArgs(['cleanup', '--days=3', '--dry-run', '--local']);
    expect(options.cleanup).toBe(true);
    expect(options.days).toBe(3);
    expect(options.dryRun).toBe(true);
    expect(options.local).toBe(true);
  });

  it('clamps --days=0 or --days=-1 to minimum 1', () => {
    const optionsZero = parseArgs(['--cleanup', '--days=0']);
    expect(optionsZero.days).toBe(1);

    const optionsNegative = parseArgs(['--cleanup', '--days=-1']);
    expect(optionsNegative.days).toBe(1);
  });

  it('defaults --days to 2 if not a valid number', () => {
    const optionsInvalid = parseArgs(['--cleanup', '--days=abc']);
    expect(optionsInvalid.days).toBe(2);
  });
});

describe('Orchestrator runCleanup', () => {
  const testDir = './test-cli-cleanup';

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('executes cleanup in local mode with temporary output dir and returns CleanupSummary', async () => {
    await fs.mkdir(`${testDir}/Puzzles/Daily`, { recursive: true });
    await fs.mkdir(`${testDir}/Puzzles/Sudoku`, { recursive: true });
    await fs.writeFile(`${testDir}/Puzzles/Daily/Sudoku_Medium_2026-10-01.pdf`, 'content');
    await fs.writeFile(`${testDir}/Puzzles/Sudoku/[DONE] Sudoku_Easy_2026-10-18.pdf`, 'content');

    const summary = await runCleanup({
      local: true,
      outputDir: testDir,
      days: 2,
    });

    expect(summary).toBeDefined();
    expect(summary.staleMoved).toHaveLength(1);
    expect(summary.staleMoved[0].name).toBe('Sudoku_Medium_2026-10-01');
    expect(summary.staleMoved[0].to).toBe('/Puzzles/Sudoku');
    expect(summary.archived).toHaveLength(1);
    expect(summary.archived[0].name).toBe('[DONE] Sudoku_Easy_2026-10-18');
    expect(summary.archived[0].to).toBe('/Puzzles/Archive/Sudoku');
  });

  it('supports dry-run mode without moving files', async () => {
    await fs.mkdir(`${testDir}/Puzzles/Daily`, { recursive: true });
    await fs.writeFile(`${testDir}/Puzzles/Daily/Sudoku_Easy_2026-10-02.pdf`, 'content');

    const summary = await runCleanup({
      local: true,
      outputDir: testDir,
      days: 2,
      dryRun: true,
    });

    expect(summary.staleMoved).toHaveLength(1);
    const exists = await fs.stat(`${testDir}/Puzzles/Daily/Sudoku_Easy_2026-10-02.pdf`).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('warns when upload is requested but rmapi is not available', async () => {
    const isAvailableSpy = vi.spyOn(RmapiDeliveryClient.prototype, 'isAvailable').mockReturnValue(false);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const summary = await runCleanup({
      upload: true,
      outputDir: testDir,
    });

    expect(summary).toBeDefined();
    expect(warnSpy).toHaveBeenCalledWith(
      '[WARN] --upload requested but rmapi is not available on PATH; falling back to local delivery.'
    );

    warnSpy.mockRestore();
    isAvailableSpy.mockRestore();
  });

  it('is exported as orchestrator.runCleanup', () => {
    expect(exportedOrchestrator.runCleanup).toBe(runCleanup);
  });
});

