import { describe, it, expect } from 'vitest';
import {
  createEmptyKakuroGrid,
  isKakuroSolved,
  computeRunSums,
  findDuplicateRunDigits,
  SAMPLE_KAKURO_PUZZLES,
} from '../../web/src/utils/kakuro.ts';

describe('Web Kakuro Utilities', () => {
  it('creates empty user grid matching template dimensions', () => {
    const sample = SAMPLE_KAKURO_PUZZLES[0];
    const userGrid = createEmptyKakuroGrid(sample.grid);
    expect(userGrid).toHaveLength(sample.size);
    expect(userGrid[0]).toHaveLength(sample.size);
    for (let r = 0; r < sample.size; r++) {
      for (let c = 0; c < sample.size; c++) {
        expect(userGrid[r][c]).toBeNull();
      }
    }
  });

  it('correctly calculates live run sums and flags duplicates', () => {
    const sample = SAMPLE_KAKURO_PUZZLES[0];
    const userGrid = createEmptyKakuroGrid(sample.grid);
    const run = sample.runs[0];
    const [c1, c2] = run.cells;
    userGrid[c1[0]][c1[1]] = 3;
    userGrid[c2[0]][c2[1]] = 3;

    const sums = computeRunSums(userGrid, [run]);
    expect(sums[run.id]).toBe(6);

    const dupes = findDuplicateRunDigits(userGrid, [run]);
    expect(dupes.has(`${c1[0]},${c1[1]}`)).toBe(true);
    expect(dupes.has(`${c2[0]},${c2[1]}`)).toBe(true);
  });

  it('verifies solved state only when all runs equal target sum with unique digits', () => {
    const sample = SAMPLE_KAKURO_PUZZLES[0];
    const userGrid = createEmptyKakuroGrid(sample.grid);
    expect(isKakuroSolved(userGrid, sample.runs)).toBe(false);

    // Fill solution digits
    for (let r = 0; r < sample.size; r++) {
      for (let c = 0; c < sample.size; c++) {
        if (sample.grid[r][c].solution !== undefined) {
          userGrid[r][c] = sample.grid[r][c].solution!;
        }
      }
    }
    expect(isKakuroSolved(userGrid, sample.runs)).toBe(true);
  });
});
