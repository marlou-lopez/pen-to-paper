export interface CrosswordCell {
  row: number;
  col: number;
  char: string;
  clueNumber?: number;
  isBlocked: boolean;
}

export interface CrosswordClue {
  number: number;
  direction: 'across' | 'down';
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  length: number;
}

export interface MiniCrosswordData {
  title: string;
  date: string;
  grid: string[][];
  acrossClues: CrosswordClue[];
  downClues: CrosswordClue[];
}

export interface MiniCrosswordOptions {
  theme?: string;
  date?: string;
  seed?: number;
}
