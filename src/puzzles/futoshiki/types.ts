export type FutoshikiDifficulty = 'easy' | 'medium' | 'hard';

export interface FutoshikiInequality {
  row1: number;
  col1: number;
  row2: number;
  col2: number;
  relation: '<' | '>';
}

export interface FutoshikiData {
  size: 4 | 5 | 6;
  initialGrid: number[][];
  solution: number[][];
  inequalities: FutoshikiInequality[];
  difficulty: FutoshikiDifficulty;
  dateStr?: string;
}

export interface FutoshikiOptions {
  size?: number;
  difficulty?: FutoshikiDifficulty | string;
  date?: string;
  theme?: string;
}
