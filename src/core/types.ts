export type PuzzleType = 'word-search' | 'sudoku' | 'mini-crossword' | 'kenken' | 'kakuro';

export interface PuzzleMetadata {
  id: string;
  displayName: string;
  targetFolder: string;
  date?: string;
}

export interface GeneratedPuzzle<TData = unknown> {
  metadata: PuzzleMetadata;
  type?: string;
  title: string;
  filename: string;
  puzzleData: TData;
}

export interface PuzzleResult<TData = unknown> extends GeneratedPuzzle<TData> {
  type: string;
  buffer: Buffer;
  metadata: PuzzleMetadata & { date?: string };
}

export interface PuzzleGenerator<TOptions = unknown, TData = unknown> {
  readonly metadata: PuzzleMetadata;
  generate(options?: TOptions): Promise<GeneratedPuzzle<TData>>;
  renderPdf(puzzle: GeneratedPuzzle<TData>): Promise<Buffer>;
}


