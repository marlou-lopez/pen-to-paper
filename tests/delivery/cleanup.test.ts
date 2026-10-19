import { describe, it, expect, vi } from 'vitest';
import {
  getPuzzleCategory,
  isCompleted,
  extractPuzzleDate,
  isStaleDaily,
  cleanupPuzzles,
  CleanupOptions,
} from '../../src/delivery/cleanup.js';
import { CleanupClient, RemoteDocument } from '../../src/delivery/types.js';

describe('Cleanup Module', () => {
  describe('getPuzzleCategory', () => {
    it('correctly maps all 6 puzzle types', () => {
      expect(getPuzzleCategory('WordSearch_2026-10-19_DeepSpace.pdf')).toBe('Word Search');
      expect(getPuzzleCategory('Sudoku_Medium_2026-10-19.pdf')).toBe('Sudoku');
      expect(getPuzzleCategory('MiniCrossword_2026-10-19.pdf')).toBe('Mini Crossword');
      expect(getPuzzleCategory('KenKen_4x4_2026-10-19.pdf')).toBe('KenKen');
      expect(getPuzzleCategory('Kakuro_9x9_2026-10-19.pdf')).toBe('Kakuro');
      expect(getPuzzleCategory('Futoshiki_5x5_2026-10-19.pdf')).toBe('Futoshiki');
    });

    it('handles [DONE] prefix case-insensitively and with varying spaces', () => {
      expect(getPuzzleCategory('[DONE] MiniCrossword_2026-10-13')).toBe('Mini Crossword');
      expect(getPuzzleCategory('[done] Sudoku_2026-10-12')).toBe('Sudoku');
      expect(getPuzzleCategory('[Done]WordSearch_2026-10-11')).toBe('Word Search');
      expect(getPuzzleCategory('[DONE]   KenKen_2026-10-10')).toBe('KenKen');
    });

    it('returns Other for unknown puzzle names', () => {
      expect(getPuzzleCategory('RandomNotes_2026-10-19')).toBe('Other');
      expect(getPuzzleCategory('[DONE] Unknown_2026-10-19')).toBe('Other');
    });
  });

  describe('isCompleted', () => {
    it('returns true when DONE is present in tags case-insensitively', () => {
      expect(isCompleted({ name: 'Sudoku_1', folder: '/Puzzles', path: '/Puzzles/Sudoku_1', tags: ['DONE'] })).toBe(true);
      expect(isCompleted({ name: 'Sudoku_1', folder: '/Puzzles', path: '/Puzzles/Sudoku_1', tags: ['done'] })).toBe(true);
      expect(isCompleted({ name: 'Sudoku_1', folder: '/Puzzles', path: '/Puzzles/Sudoku_1', tags: ['Done'] })).toBe(true);
      expect(isCompleted({ name: 'Sudoku_1', folder: '/Puzzles', path: '/Puzzles/Sudoku_1', tags: ['  DONE  '] })).toBe(true);
    });

    it('returns true when document name starts with [DONE]', () => {
      expect(isCompleted({ name: '[DONE] Sudoku_2026-10-12', folder: '/Puzzles', path: '/Puzzles/[DONE] Sudoku_2026-10-12', tags: [] })).toBe(true);
      expect(isCompleted({ name: '[done] MiniCrossword_2026-10-12', folder: '/Puzzles', path: '/Puzzles/[done] MiniCrossword_2026-10-12', tags: [] })).toBe(true);
    });

    it('returns false when document is untagged and has no [DONE] prefix', () => {
      expect(isCompleted({ name: 'Sudoku_2026-10-12', folder: '/Puzzles', path: '/Puzzles/Sudoku_2026-10-12', tags: [] })).toBe(false);
    });

    it('returns false for other tags', () => {
      expect(isCompleted({ name: 'Sudoku_2026-10-12', folder: '/Puzzles', path: '/Puzzles/Sudoku_2026-10-12', tags: ['STARRED', 'IN_PROGRESS'] })).toBe(false);
    });

    it('returns false when tags is undefined or not an array', () => {
      expect(isCompleted({ name: 'Sudoku_2026-10-12', folder: '/Puzzles', path: '/Puzzles/Sudoku_2026-10-12' } as any)).toBe(false);
    });
  });

  describe('extractPuzzleDate', () => {
    it('extracts ISO date from filenames', () => {
      expect(extractPuzzleDate('Sudoku_Medium_2026-10-13.pdf')).toBe('2026-10-13');
      expect(extractPuzzleDate('[DONE] MiniCrossword_2026-10-13')).toBe('2026-10-13');
      expect(extractPuzzleDate('WordSearch_2026-10-19_DeepSpace.pdf')).toBe('2026-10-19');
    });

    it('returns null if no date pattern found', () => {
      expect(extractPuzzleDate('Sudoku_Medium.pdf')).toBeNull();
      expect(extractPuzzleDate('20261019_NoDashes')).toBeNull();
    });
  });

  describe('isStaleDaily', () => {
    const referenceDate = '2026-10-19';

    it('identifies stale and non-stale puzzles with default retentionDays = 2', () => {
      // 2 days old -> stale
      expect(isStaleDaily('Sudoku_2026-10-17', 2, referenceDate)).toBe(true);
      // 3 days old -> stale
      expect(isStaleDaily('Sudoku_2026-10-16', 2, referenceDate)).toBe(true);
      // 1 day old -> not stale
      expect(isStaleDaily('Sudoku_2026-10-18', 2, referenceDate)).toBe(false);
      // 0 days old (today) -> not stale
      expect(isStaleDaily('Sudoku_2026-10-19', 2, referenceDate)).toBe(false);
      // Future date -> not stale
      expect(isStaleDaily('Sudoku_2026-10-20', 2, referenceDate)).toBe(false);
    });

    it('returns false when filename has no date', () => {
      expect(isStaleDaily('Sudoku_NoDate.pdf', 2, referenceDate)).toBe(false);
    });

    it('respects custom retentionDays', () => {
      // 1 day diff: with retentionDays=1 -> stale; with retentionDays=2 -> not stale
      expect(isStaleDaily('Sudoku_2026-10-18', 1, referenceDate)).toBe(true);
      // 2 days diff: with retentionDays=3 -> not stale
      expect(isStaleDaily('Sudoku_2026-10-17', 3, referenceDate)).toBe(false);
    });

    it('uses current date when referenceDate is omitted', () => {
      const today = new Date().toISOString().slice(0, 10);
      expect(isStaleDaily(`Sudoku_${today}.pdf`)).toBe(false);

      const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      expect(isStaleDaily(`Sudoku_${pastDate}.pdf`)).toBe(true);
    });
  });

  describe('cleanupPuzzles', () => {
    function createMockClient(docs: RemoteDocument[]): CleanupClient {
      return {
        listDocuments: vi.fn().mockResolvedValue(docs),
        moveDocument: vi.fn().mockResolvedValue(undefined),
        deliver: vi.fn().mockResolvedValue('/dummy'),
      };
    }

    it('executes two-pass cleanup: archives completed and sweeps stale dailies', async () => {
      const docs: RemoteDocument[] = [
        // Completed in /Puzzles/Daily -> should be archived
        {
          id: '1',
          name: '[DONE] MiniCrossword_2026-10-13',
          path: '/Puzzles/Daily/[DONE] MiniCrossword_2026-10-13',
          folder: '/Puzzles/Daily',
          tags: ['DONE'],
        },
        // Completed in /Puzzles/Word Search -> should be archived
        {
          id: '2',
          name: 'WordSearch_2026-10-10_DeepSpace',
          path: '/Puzzles/Word Search/WordSearch_2026-10-10_DeepSpace',
          folder: '/Puzzles/Word Search',
          tags: ['done'],
        },
        // Completed already in archive -> should be skipped
        {
          id: '3',
          name: 'Sudoku_2026-10-09',
          path: '/Puzzles/Archive/Sudoku/Sudoku_2026-10-09',
          folder: '/Puzzles/Archive/Sudoku',
          tags: ['DONE'],
        },
        // Stale daily (uncompleted, 2+ days old) -> should be moved to category folder
        {
          id: '4',
          name: 'Sudoku_2026-10-16',
          path: '/Puzzles/Daily/Sudoku_2026-10-16',
          folder: '/Puzzles/Daily',
          tags: [],
        },
        // Recent daily (uncompleted, within retention window) -> should stay
        {
          id: '5',
          name: 'Sudoku_2026-10-19',
          path: '/Puzzles/Daily/Sudoku_2026-10-19',
          folder: '/Puzzles/Daily',
          tags: [],
        },
        // Uncompleted puzzle outside /Puzzles/Daily -> should be untouched
        {
          id: '6',
          name: 'Kakuro_2026-10-15',
          path: '/Puzzles/Kakuro/Kakuro_2026-10-15',
          folder: '/Puzzles/Kakuro',
          tags: [],
        },
      ];

      const client = createMockClient(docs);
      const summary = await cleanupPuzzles({
        client,
        retentionDays: 2,
        referenceDate: '2026-10-19',
        dryRun: false,
      });

      // Pass 1: Archived
      expect(summary.archived).toHaveLength(2);
      expect(summary.archived).toEqual([
        {
          name: '[DONE] MiniCrossword_2026-10-13',
          from: '/Puzzles/Daily',
          to: '/Puzzles/Archive/Mini Crossword',
        },
        {
          name: 'WordSearch_2026-10-10_DeepSpace',
          from: '/Puzzles/Word Search',
          to: '/Puzzles/Archive/Word Search',
        },
      ]);

      // Pass 2: Stale dailies moved
      expect(summary.staleMoved).toHaveLength(1);
      expect(summary.staleMoved).toEqual([
        {
          name: 'Sudoku_2026-10-16',
          from: '/Puzzles/Daily',
          to: '/Puzzles/Sudoku',
        },
      ]);

      // Skipped items
      expect(summary.skipped).toContainEqual({
        name: 'Sudoku_2026-10-09',
        reason: 'Already in archive',
      });
      expect(summary.skipped).toContainEqual({
        name: 'Sudoku_2026-10-19',
        reason: 'Within retention window',
      });

      // Check moveDocument invocations
      expect(client.moveDocument).toHaveBeenCalledTimes(3);
      expect(client.moveDocument).toHaveBeenCalledWith(
        '/Puzzles/Daily/[DONE] MiniCrossword_2026-10-13',
        '/Puzzles/Archive/Mini Crossword'
      );
      expect(client.moveDocument).toHaveBeenCalledWith(
        '/Puzzles/Word Search/WordSearch_2026-10-10_DeepSpace',
        '/Puzzles/Archive/Word Search'
      );
      expect(client.moveDocument).toHaveBeenCalledWith(
        '/Puzzles/Daily/Sudoku_2026-10-16',
        '/Puzzles/Sudoku'
      );
    });

    it('dryRun mode records actions in summary but does not call moveDocument', async () => {
      const docs: RemoteDocument[] = [
        {
          id: '1',
          name: 'Sudoku_2026-10-16',
          path: '/Puzzles/Daily/Sudoku_2026-10-16',
          folder: '/Puzzles/Daily',
          tags: ['DONE'],
        },
        {
          id: '2',
          name: 'KenKen_2026-10-16',
          path: '/Puzzles/Daily/KenKen_2026-10-16',
          folder: '/Puzzles/Daily',
          tags: [],
        },
      ];

      const client = createMockClient(docs);
      const summary = await cleanupPuzzles({
        client,
        retentionDays: 2,
        referenceDate: '2026-10-19',
        dryRun: true,
      });

      expect(summary.archived).toHaveLength(1);
      expect(summary.staleMoved).toHaveLength(1);
      expect(client.moveDocument).not.toHaveBeenCalled();
    });

    it('is error resilient: failure on one move does not halt cleanup of remaining documents', async () => {
      const docs: RemoteDocument[] = [
        {
          id: '1',
          name: '[DONE] Sudoku_2026-10-15',
          path: '/Puzzles/Daily/[DONE] Sudoku_2026-10-15',
          folder: '/Puzzles/Daily',
          tags: ['DONE'],
        },
        {
          id: '2',
          name: '[DONE] KenKen_2026-10-15',
          path: '/Puzzles/Daily/[DONE] KenKen_2026-10-15',
          folder: '/Puzzles/Daily',
          tags: ['DONE'],
        },
      ];

      const client = createMockClient(docs);
      (client.moveDocument as any).mockImplementation(async (src: string) => {
        if (src.includes('Sudoku')) {
          throw new Error('Disk write failed');
        }
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const summary = await cleanupPuzzles({
        client,
        referenceDate: '2026-10-19',
      });

      // KenKen should succeed
      expect(summary.archived).toHaveLength(1);
      expect(summary.archived[0].name).toBe('[DONE] KenKen_2026-10-15');

      // Sudoku should be recorded in skipped with error reason
      expect(summary.skipped).toContainEqual(
        expect.objectContaining({
          name: '[DONE] Sudoku_2026-10-15',
          reason: expect.stringContaining('Disk write failed'),
        })
      );

      consoleErrorSpy.mockRestore();
    });

    it('is error resilient in Pass 2: failure on stale daily move does not halt cleanup of remaining dailies', async () => {
      const docs: RemoteDocument[] = [
        {
          id: '1',
          name: 'Sudoku_2026-10-15',
          path: '/Puzzles/Daily/Sudoku_2026-10-15',
          folder: '/Puzzles/Daily',
          tags: [],
        },
        {
          id: '2',
          name: 'KenKen_2026-10-15',
          path: '/Puzzles/Daily/KenKen_2026-10-15',
          folder: '/Puzzles/Daily',
          tags: [],
        },
      ];

      const client = createMockClient(docs);
      (client.moveDocument as any).mockImplementation(async (src: string) => {
        if (src.includes('Sudoku')) {
          throw new Error('Network timeout');
        }
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const summary = await cleanupPuzzles({
        client,
        referenceDate: '2026-10-19',
      });

      expect(summary.staleMoved).toHaveLength(1);
      expect(summary.staleMoved[0].name).toBe('KenKen_2026-10-15');

      expect(summary.skipped).toContainEqual(
        expect.objectContaining({
          name: 'Sudoku_2026-10-15',
          reason: expect.stringContaining('Network timeout'),
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
