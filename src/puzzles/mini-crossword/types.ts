export interface CrosswordClue {
  number: number;
  direction: 'across' | 'down';
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  length: number;
}

export interface CrosswordSlot {
  number: number;
  direction: 'across' | 'down';
  startRow: number;
  startCol: number;
  length: number;
  coords: [number, number][];
}

export interface MiniCrosswordData {
  title: string;
  date: string;
  templateId?: string;
  grid: string[][];
  acrossClues: CrosswordClue[];
  downClues: CrosswordClue[];
}

export interface MiniCrosswordOptions {
  theme?: string;
  date?: string;
}
