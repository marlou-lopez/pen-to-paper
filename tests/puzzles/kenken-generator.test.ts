import { describe, it, expect } from 'vitest';
import { KenKenGenerator } from '../../src/puzzles/kenken/generator.ts';
import { solveKenKen, isCageSatisfied } from '../../src/puzzles/kenken/solver.ts';
import { partitionCages } from '../../src/puzzles/kenken/cages.ts';

describe('KenKen Generator & Solver', () => {
  it('generates a complete KenKen puzzle for default 6x6 grid', async () => {
    const generator = new KenKenGenerator();
    const puzzle = await generator.generate({ date: '2026-10-12', size: 6, difficulty: 'medium' });

    expect(puzzle.type).toBe('kenken');
    expect(puzzle.filename).toBe('KenKen_6x6_2026-10-12.pdf');
    expect(puzzle.puzzleData.size).toBe(6);
    expect(puzzle.puzzleData.grid).toHaveLength(6);
    expect(puzzle.puzzleData.cages.length).toBeGreaterThan(5);

    // Verify all 36 cells are assigned to exactly one cage
    const visited = new Set<string>();
    for (const cage of puzzle.puzzleData.cages) {
      expect(cage.cells.length).toBeGreaterThanOrEqual(1);
      expect(cage.cells.length).toBeLessThanOrEqual(4);
      for (const cell of cage.cells) {
        const key = `${cell.row},${cell.col}`;
        expect(visited.has(key)).toBe(false);
        visited.add(key);
      }
    }
    expect(visited.size).toBe(36);
  });

  it('correctly evaluates cage arithmetic targets', async () => {
    const generator = new KenKenGenerator();
    const puzzle = await generator.generate({ date: '2026-10-12', size: 5, difficulty: 'hard' });
    const { grid, cages } = puzzle.puzzleData;

    for (const cage of cages) {
      const values = cage.cells.map((c) => grid[c.row][c.col]);
      if (cage.op === 'none') {
        expect(cage.cells).toHaveLength(1);
        expect(cage.target).toBe(values[0]);
      } else if (cage.op === '+') {
        const sum = values.reduce((a, b) => a + b, 0);
        expect(cage.target).toBe(sum);
      } else if (cage.op === '*') {
        const product = values.reduce((a, b) => a * b, 1);
        expect(cage.target).toBe(product);
      } else if (cage.op === '-') {
        expect(cage.cells).toHaveLength(2);
        expect(cage.target).toBe(Math.abs(values[0] - values[1]));
      } else if (cage.op === '/') {
        expect(cage.cells).toHaveLength(2);
        const max = Math.max(values[0], values[1]);
        const min = Math.min(values[0], values[1]);
        expect(max % min).toBe(0);
        expect(cage.target).toBe(max / min);
      }
    }
  });

  it('guarantees unique solutions via the constraint solver', async () => {
    const generator = new KenKenGenerator();
    const puzzle = await generator.generate({ date: '2026-10-12', size: 4, difficulty: 'easy' });
    const solutions = solveKenKen(puzzle.puzzleData.cages, 4, 2);
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toEqual(puzzle.puzzleData.grid);
  });

  it('correctly validates cages with isCageSatisfied', () => {
    const grid = [
      [1, 2],
      [2, 1],
    ];

    expect(
      isCageSatisfied(
        { id: 0, op: 'none', target: 1, cells: [{ row: 0, col: 0 }] },
        grid
      )
    ).toBe(true);

    expect(
      isCageSatisfied(
        { id: 1, op: '+', target: 3, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] },
        grid
      )
    ).toBe(true);

    expect(
      isCageSatisfied(
        { id: 2, op: '-', target: 1, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] },
        grid
      )
    ).toBe(true);

    expect(
      isCageSatisfied(
        { id: 3, op: '*', target: 2, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] },
        grid
      )
    ).toBe(true);

    expect(
      isCageSatisfied(
        { id: 4, op: '/', target: 2, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] },
        grid
      )
    ).toBe(true);

    // Failing cases
    expect(
      isCageSatisfied(
        { id: 5, op: '+', target: 5, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] },
        grid
      )
    ).toBe(false);

    expect(
      isCageSatisfied(
        { id: 6, op: '/', target: 3, cells: [{ row: 0, col: 0 }, { row: 0, col: 1 }] },
        grid
      )
    ).toBe(false);
  });

  it('partitions cages contiguously for small and large grids', () => {
    const grid3 = [
      [1, 2, 3],
      [2, 3, 1],
      [3, 1, 2],
    ];
    let s = 42;
    const rng = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const cages = partitionCages(grid3, 'easy', rng);
    expect(cages.length).toBeGreaterThanOrEqual(3);

    // Check contiguous cells
    for (const cage of cages) {
      if (cage.cells.length > 1) {
        // Every cell in the cage should have at least one neighbor in the cage
        for (const cell of cage.cells) {
          const hasNeighbor = cage.cells.some(
            (other) =>
              other !== cell &&
              Math.abs(other.row - cell.row) + Math.abs(other.col - cell.col) === 1
          );
          expect(hasNeighbor).toBe(true);
        }
      }
    }
  });
});
