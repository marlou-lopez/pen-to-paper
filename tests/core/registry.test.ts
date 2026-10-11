import { describe, it, expect } from 'vitest';
import { PuzzleRegistry } from '../../src/core/registry';
import { PuzzleGenerator } from '../../src/core/types';

describe('PuzzleRegistry', () => {
  it('registers and retrieves puzzle generators', () => {
    const registry = new PuzzleRegistry();
    const mockGenerator: PuzzleGenerator = {
      metadata: {
        id: 'mock-puzzle',
        displayName: 'Mock Puzzle',
        targetFolder: '/Puzzles/Mock',
      },
      generate: async () => ({
        metadata: { id: 'mock-puzzle', displayName: 'Mock Puzzle', targetFolder: '/Puzzles/Mock' },
        title: 'Mock Title',
        filename: 'Mock.pdf',
        puzzleData: {},
      }),
      renderPdf: async () => Buffer.from('mock-pdf'),
    };

    registry.register(mockGenerator);
    expect(registry.get('mock-puzzle')).toBe(mockGenerator);
    expect(registry.getAll()).toHaveLength(1);
    expect(registry.get('non-existent')).toBeUndefined();
  });
});
