import { describe, it, expect } from 'vitest';
import { getKakuroPartitions } from '../../src/puzzles/kakuro/partitions.ts';

describe('Kakuro Partitions Helper', () => {
  it('returns exact unique digit combinations for known sums', () => {
    // 2-cell runs
    expect(getKakuroPartitions(2, 3)).toEqual([[1, 2]]);
    expect(getKakuroPartitions(2, 4)).toEqual([[1, 3]]); // 2+2 is forbidden
    expect(getKakuroPartitions(2, 17)).toEqual([[8, 9]]);

    // 3-cell runs
    expect(getKakuroPartitions(3, 6)).toEqual([[1, 2, 3]]);
    expect(getKakuroPartitions(3, 24)).toEqual([[7, 8, 9]]);
  });

  it('returns empty array for impossible sums or lengths', () => {
    expect(getKakuroPartitions(2, 2)).toEqual([]); // min sum for len 2 is 1+2=3
    expect(getKakuroPartitions(2, 18)).toEqual([]); // max sum for len 2 is 8+9=17
    expect(getKakuroPartitions(0, 5)).toEqual([]);
    expect(getKakuroPartitions(10, 50)).toEqual([]); // digits 1..9 only allows max length 9
  });
});
