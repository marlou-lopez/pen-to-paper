import { describe, it, expect } from 'vitest';
import { solveFutoshiki } from '../../src/puzzles/futoshiki/solver.js';
import { FutoshikiInequality } from '../../src/puzzles/futoshiki/types.js';

describe('Futoshiki Constraint Solver', () => {
  it('solves a known 4x4 Futoshiki puzzle with unique solution', () => {
    // 4x4 grid:
    // . . . .
    // . . . .
    // . . . .
    // . . . .
    // Inequalities:
    // (0,0) < (0,1), (0,2) > (0,3)
    // (1,1) > (2,1)
    // (2,2) < (2,3)
    // (3,0) > (3,1)
    // Given clues: (0,0)=1, (3,3)=2
    const initialGrid = [
      [1, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 2],
    ];
    const inequalities: FutoshikiInequality[] = [
      { row1: 0, col1: 0, row2: 0, col2: 1, relation: '<' },
      { row1: 0, col1: 2, row2: 0, col2: 3, relation: '>' },
      { row1: 1, col1: 1, row2: 2, col2: 1, relation: '>' },
      { row1: 2, col1: 2, row2: 2, col2: 3, relation: '<' },
      { row1: 3, col1: 0, row2: 3, col2: 1, relation: '>' },
    ];

    const solutions = solveFutoshiki(initialGrid, inequalities);
    expect(solutions.length).toBeGreaterThanOrEqual(1);
    const sol = solutions[0];
    expect(sol.length).toBe(4);
    expect(sol[0][0]).toBe(1);
    expect(sol[0][0]).toBeLessThan(sol[0][1]);
    expect(sol[0][2]).toBeGreaterThan(sol[0][3]);
    expect(sol[1][1]).toBeGreaterThan(sol[2][1]);
    expect(sol[2][2]).toBeLessThan(sol[2][3]);
    expect(sol[3][0]).toBeGreaterThan(sol[3][1]);

    // Verify row & col Latin square property
    for (let r = 0; r < 4; r++) {
      expect(new Set(sol[r]).size).toBe(4);
      expect(new Set([sol[0][r], sol[1][r], sol[2][r], sol[3][r]]).size).toBe(4);
    }
  });

  it('detects multiple solutions and respects maxSolutions limit', () => {
    // Completely unconstrained 4x4 grid has many solutions
    const emptyGrid = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const solutions = solveFutoshiki(emptyGrid, [], 2);
    expect(solutions).toHaveLength(2);
  });

  it('detects impossible/contradictory boards and returns empty array', () => {
    const grid = [
      [4, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    // Contradiction: (0,0) is 4, but rule says (0,0) < (0,1) where max digit is 4
    const impossibleInequalities: FutoshikiInequality[] = [
      { row1: 0, col1: 0, row2: 0, col2: 1, relation: '<' },
    ];
    // And if (0,1) is forced to be 1:
    grid[0][1] = 1;
    const solutions = solveFutoshiki(grid, impossibleInequalities);
    expect(solutions).toHaveLength(0);
  });

  it('detects contradictory inequality cycles and returns empty array', () => {
    const grid = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    // Contradiction: (0,0) < (0,1) and (0,1) < (0,0)
    const cycleInequalities: FutoshikiInequality[] = [
      { row1: 0, col1: 0, row2: 0, col2: 1, relation: '<' },
      { row1: 0, col1: 1, row2: 0, col2: 0, relation: '<' },
    ];
    const solutions = solveFutoshiki(grid, cycleInequalities);
    expect(solutions).toHaveLength(0);
  });

  it('detects duplicate clues in row or column and returns empty array', () => {
    const duplicateRowGrid = [
      [2, 2, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(solveFutoshiki(duplicateRowGrid, [])).toHaveLength(0);

    const duplicateColGrid = [
      [3, 0, 0, 0],
      [3, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(solveFutoshiki(duplicateColGrid, [])).toHaveLength(0);
  });

  it('handles empty and invalid input dimensions gracefully', () => {
    expect(solveFutoshiki([], [])).toEqual([]);
    expect(solveFutoshiki([[1, 2], [3]], [])).toEqual([]);
  });

  it('solves a 5x5 and 6x6 puzzle correctly', () => {
    const grid5 = [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ];
    const ineq5: FutoshikiInequality[] = [
      { row1: 0, col1: 0, row2: 0, col2: 1, relation: '<' },
      { row1: 0, col1: 1, row2: 0, col2: 2, relation: '<' },
      { row1: 0, col1: 2, row2: 0, col2: 3, relation: '<' },
      { row1: 0, col1: 3, row2: 0, col2: 4, relation: '<' },
    ];
    const sols5 = solveFutoshiki(grid5, ineq5, 1);
    expect(sols5).toHaveLength(1);
    expect(sols5[0][0]).toEqual([1, 2, 3, 4, 5]);

    const grid6 = [
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ];
    const ineq6: FutoshikiInequality[] = [
      { row1: 1, col1: 0, row2: 1, col2: 1, relation: '>' },
      { row1: 1, col1: 1, row2: 1, col2: 2, relation: '>' },
      { row1: 1, col1: 2, row2: 1, col2: 3, relation: '>' },
      { row1: 1, col1: 3, row2: 1, col2: 4, relation: '>' },
      { row1: 1, col1: 4, row2: 1, col2: 5, relation: '>' },
    ];
    const sols6 = solveFutoshiki(grid6, ineq6, 1);
    expect(sols6).toHaveLength(1);
    expect(sols6[0][1]).toEqual([6, 5, 4, 3, 2, 1]);
  });
});
