import { describe, it, expect } from 'vitest';
import { solveKakuro } from '../../src/puzzles/kakuro/solver.ts';
import { KakuroCell, KakuroRun } from '../../src/puzzles/kakuro/types.ts';

describe('Kakuro Constraint Solver', () => {
  it('solves a simple 3x3 mini Kakuro grid with a unique solution', () => {
    // Grid:
    // [block]     [clue D:4]  [clue D:3]
    // [clue A:3]  [white]     [white]
    // [clue A:4]  [white]     [white]
    // Unique solution: (1,1)=1, (1,2)=2, (2,1)=3, (2,2)=1
    const grid: KakuroCell[][] = [
      [{ type: 'block' }, { type: 'clue', downSum: 4 }, { type: 'clue', downSum: 3 }],
      [{ type: 'clue', acrossSum: 3 }, { type: 'white' }, { type: 'white' }],
      [{ type: 'clue', acrossSum: 4 }, { type: 'white' }, { type: 'white' }],
    ];

    const runs: KakuroRun[] = [
      { id: 'A1', direction: 'across', clueRow: 1, clueCol: 0, targetSum: 3, cells: [[1, 1], [1, 2]] },
      { id: 'A2', direction: 'across', clueRow: 2, clueCol: 0, targetSum: 4, cells: [[2, 1], [2, 2]] },
      { id: 'D1', direction: 'down', clueRow: 0, clueCol: 1, targetSum: 4, cells: [[1, 1], [2, 1]] },
      { id: 'D2', direction: 'down', clueRow: 0, clueCol: 2, targetSum: 3, cells: [[1, 2], [2, 2]] },
    ];

    const solutions = solveKakuro(grid, runs, 2);
    expect(solutions).toHaveLength(1);
    expect(solutions[0][1][1]).toBe(1);
    expect(solutions[0][1][2]).toBe(2);
    expect(solutions[0][2][1]).toBe(3);
    expect(solutions[0][2][2]).toBe(1);
  });

  it('detects multiple solutions when ambiguous clues are provided', () => {
    // 2x2 white cell loop without unique constraints
    const grid: KakuroCell[][] = [
      [{ type: 'block' }, { type: 'clue', downSum: 6 }, { type: 'clue', downSum: 6 }],
      [{ type: 'clue', acrossSum: 6 }, { type: 'white' }, { type: 'white' }],
      [{ type: 'clue', acrossSum: 6 }, { type: 'white' }, { type: 'white' }],
    ];

    const runs: KakuroRun[] = [
      { id: 'A1', direction: 'across', clueRow: 1, clueCol: 0, targetSum: 6, cells: [[1, 1], [1, 2]] },
      { id: 'A2', direction: 'across', clueRow: 2, clueCol: 0, targetSum: 6, cells: [[2, 1], [2, 2]] },
      { id: 'D1', direction: 'down', clueRow: 0, clueCol: 1, targetSum: 6, cells: [[1, 1], [2, 1]] },
      { id: 'D2', direction: 'down', clueRow: 0, clueCol: 2, targetSum: 6, cells: [[1, 2], [2, 2]] },
    ];

    const solutions = solveKakuro(grid, runs, 2);
    expect(solutions.length).toBeGreaterThan(1);
  });
});
