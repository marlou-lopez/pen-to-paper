export type KakuroCellType = 'white' | 'clue' | 'block';

export interface KakuroCell {
  type: KakuroCellType;
  value?: number;
  solution?: number;
  acrossSum?: number;
  downSum?: number;
}

export interface KakuroRun {
  id: string;
  direction: 'across' | 'down';
  clueRow: number;
  clueCol: number;
  targetSum: number;
  cells: [number, number][];
}

export type KakuroDifficulty = 'easy' | 'medium' | 'hard';

export interface KakuroData {
  title: string;
  date: string;
  size: number;
  difficulty: KakuroDifficulty;
  grid: KakuroCell[][];
  runs: KakuroRun[];
}

export interface KakuroOptions {
  size?: number;
  difficulty?: KakuroDifficulty;
  date?: string;
}
