import { getSudoku } from 'sudoku-gen';
import { GeneratedPuzzle, PuzzleGenerator, PuzzleMetadata } from '../../core/types.js';
import { renderSudokuPdf } from './renderer.js';
import { parseSudokuGrid } from './parser.js';
import { solveSudoku } from './solver.js';

export type SudokuDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface SudokuOptions {
  date?: string;
  difficulty?: string;
  grid?: string;
}

export interface SudokuData {
  difficulty: SudokuDifficulty;
  puzzleGrid: (number | null)[][];
  solutionGrid: number[][];
}

export function resolveSudokuDifficulty(inputDifficulty?: string, dateObj = new Date()): SudokuDifficulty {
  if (inputDifficulty && inputDifficulty !== 'random') {
    const valid: SudokuDifficulty[] = ['easy', 'medium', 'hard', 'expert'];
    if (valid.includes(inputDifficulty as SudokuDifficulty)) {
      return inputDifficulty as SudokuDifficulty;
    }
  }

  // Rotating by day of week:
  // 1: Mon (easy), 2: Tue (medium), 3: Wed (medium), 4: Thu (hard), 5: Fri (hard), 6/0: Sat/Sun (expert)
  const day = dateObj.getUTCDay();
  switch (day) {
    case 1:
      return 'easy';
    case 2:
    case 3:
      return 'medium';
    case 4:
    case 5:
      return 'hard';
    case 0:
    case 6:
    default:
      return 'expert';
  }
}

export class SudokuGenerator implements PuzzleGenerator<SudokuOptions, SudokuData> {
  readonly metadata: PuzzleMetadata = {
    id: 'sudoku',
    displayName: 'Sudoku',
    targetFolder: '/Puzzles/Sudoku',
  };

  async generate(options?: SudokuOptions): Promise<GeneratedPuzzle<SudokuData>> {
    const dateStr = options?.date ?? new Date().toISOString().slice(0, 10);

    if (options?.grid) {
      const puzzleGrid = parseSudokuGrid(options.grid);
      const solutionGrid = solveSudoku(puzzleGrid);
      const filename = `Sudoku_Custom_${dateStr}.pdf`;

      return {
        metadata: this.metadata,
        title: 'Sudoku - Custom',
        filename,
        puzzleData: {
          difficulty: 'expert', // default display weight
          puzzleGrid,
          solutionGrid,
        },
      };
    }

    const dateObj = new Date(dateStr + 'T12:00:00Z');
    const difficulty = resolveSudokuDifficulty(options?.difficulty, dateObj);

    const sudoku = getSudoku(difficulty);

    const puzzleGrid: (number | null)[][] = [];
    const solutionGrid: number[][] = [];

    for (let r = 0; r < 9; r++) {
      const pRow: (number | null)[] = [];
      const sRow: number[] = [];
      for (let c = 0; c < 9; c++) {
        const idx = r * 9 + c;
        const pChar = sudoku.puzzle[idx];
        const sChar = sudoku.solution[idx];
        pRow.push(pChar === '-' ? null : parseInt(pChar, 10));
        sRow.push(parseInt(sChar, 10));
      }
      puzzleGrid.push(pRow);
      solutionGrid.push(sRow);
    }

    const capDiff = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    const filename = `Sudoku_${capDiff}_${dateStr}.pdf`;

    return {
      metadata: this.metadata,
      title: `Sudoku - ${capDiff}`,
      filename,
      puzzleData: {
        difficulty,
        puzzleGrid,
        solutionGrid,
      },
    };
  }

  renderPdf(puzzle: GeneratedPuzzle<SudokuData>): Promise<Buffer> {
    return renderSudokuPdf(puzzle);
  }
}
