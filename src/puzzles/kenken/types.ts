export type KenKenOp = '+' | '-' | '*' | '/' | 'none';

export type KenKenDifficulty = 'easy' | 'medium' | 'hard';

export interface KenKenCellCoord {
  row: number; // 0 to size - 1
  col: number; // 0 to size - 1
}

export interface KenKenCage {
  id: number;
  op: KenKenOp;
  target: number;
  cells: KenKenCellCoord[];
}

export interface KenKenData {
  size: number; // 3 to 9 (default 6)
  grid: number[][]; // N x N Latin square solution matrix
  cages: KenKenCage[];
  date: string;
  difficulty: KenKenDifficulty;
}

export interface KenKenOptions {
  size?: number; // 3 to 9, defaults to 6
  difficulty?: KenKenDifficulty; // easy | medium | hard, defaults to medium
  date?: string;
  seed?: number | string;
}
