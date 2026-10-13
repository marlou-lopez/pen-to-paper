import { GeneratedPuzzle, PuzzleGenerator, PuzzleMetadata } from '../../core/types.js';
import { FutoshikiData, FutoshikiDifficulty, FutoshikiInequality, FutoshikiOptions } from './types.js';
import { solveFutoshiki } from './solver.js';
import { getSeedFutoshiki } from './seed-bank.js';

export interface FutoshikiGeneratedPuzzle extends GeneratedPuzzle<FutoshikiData> {
  pdfBuffer?: Buffer;
}

export class FutoshikiGenerator implements PuzzleGenerator<FutoshikiOptions, FutoshikiData> {
  readonly metadata: PuzzleMetadata = {
    id: 'futoshiki',
    displayName: 'Futoshiki',
    targetFolder: '/Puzzles/Futoshiki',
  };
  readonly type = 'futoshiki' as const;

  async generate(options?: FutoshikiOptions): Promise<FutoshikiGeneratedPuzzle> {
    const rawSize = options?.size ?? 5;
    const size = (rawSize <= 4 ? 4 : rawSize >= 6 ? 6 : 5) as 4 | 5 | 6;

    const validDifficulties: FutoshikiDifficulty[] = ['easy', 'medium', 'hard'];
    const difficulty: FutoshikiDifficulty =
      options?.difficulty && validDifficulties.includes(options.difficulty as FutoshikiDifficulty)
        ? (options.difficulty as FutoshikiDifficulty)
        : 'medium';

    const dateStr = options?.date ?? new Date().toISOString().slice(0, 10);

    // Procedural generation with fallback to verified seed bank
    let puzzleData: FutoshikiData | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      puzzleData = this.generateProcedural(size, difficulty, dateStr);
      if (puzzleData) break;
    }

    if (!puzzleData) {
      puzzleData = getSeedFutoshiki(size, difficulty, dateStr);
    }

    const filename = `Futoshiki_${size}x${size}_${difficulty}_${dateStr}.pdf`;

    return {
      metadata: {
        ...this.metadata,
        date: dateStr,
      },
      type: 'futoshiki',
      title: `Futoshiki ${size}x${size}`,
      filename,
      puzzleData,
    };
  }

  async renderPdf(puzzle: GeneratedPuzzle<FutoshikiData> | FutoshikiData): Promise<Buffer> {
    try {
      // @ts-ignore
      const { renderFutoshikiPdf } = await import('./renderer.js');
      return renderFutoshikiPdf(puzzle);
    } catch {
      return Buffer.from('');
    }
  }

  private generateProcedural(
    size: 4 | 5 | 6,
    difficulty: FutoshikiDifficulty,
    dateStr: string
  ): FutoshikiData | null {
    const sol = this.generateLatinSquare(size);
    if (!sol) return null;

    // Collect all adjacent inequalities
    const allIneqs: FutoshikiInequality[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size - 1; c++) {
        allIneqs.push({
          row1: r,
          col1: c,
          row2: r,
          col2: c + 1,
          relation: sol[r][c] < sol[r][c + 1] ? '<' : '>',
        });
      }
    }
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size; c++) {
        allIneqs.push({
          row1: r,
          col1: c,
          row2: r + 1,
          col2: c,
          relation: sol[r][c] < sol[r + 1][c] ? '<' : '>',
        });
      }
    }

    // Select subset of inequalities based on difficulty
    const ineqKeepRatio = difficulty === 'easy' ? 0.45 : difficulty === 'medium' ? 0.35 : 0.30;
    const ineqCount = Math.floor(allIneqs.length * ineqKeepRatio);
    const shuffledIneqs = [...allIneqs].sort(() => Math.random() - 0.5).slice(0, ineqCount);

    // Initial numbers
    const initialGrid = sol.map((row) => [...row]);
    const numKeepRatio = difficulty === 'easy' ? 0.35 : difficulty === 'medium' ? 0.20 : 0.08;
    const numCellsToKeep = Math.max(1, Math.floor(size * size * numKeepRatio));

    // Carve cells in random order while preserving uniqueness
    const cellIndices: [number, number][] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        cellIndices.push([r, c]);
      }
    }
    cellIndices.sort(() => Math.random() - 0.5);

    let filledCount = size * size;
    for (const [r, c] of cellIndices) {
      if (filledCount <= numCellsToKeep) break;
      const backup = initialGrid[r][c];
      initialGrid[r][c] = 0;
      const sols = solveFutoshiki(initialGrid, shuffledIneqs, 2);
      if (sols.length === 1) {
        filledCount--;
      } else {
        initialGrid[r][c] = backup; // Restore if uniqueness was lost
      }
    }

    // Ensure final grid is unique
    const finalSols = solveFutoshiki(initialGrid, shuffledIneqs, 2);
    if (finalSols.length !== 1) {
      return null;
    }

    return {
      size,
      initialGrid,
      solution: sol,
      inequalities: shuffledIneqs,
      difficulty,
      dateStr,
    };
  }

  private generateLatinSquare(size: number): number[][] | null {
    const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
    const numbers = Array.from({ length: size }, (_, i) => i + 1);

    function isSafe(row: number, col: number, num: number): boolean {
      for (let c = 0; c < size; c++) {
        if (grid[row][c] === num) return false;
      }
      for (let r = 0; r < size; r++) {
        if (grid[r][col] === num) return false;
      }
      return true;
    }

    function shuffle<T>(arr: T[]): T[] {
      const res = [...arr];
      for (let i = res.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [res[i], res[j]] = [res[j], res[i]];
      }
      return res;
    }

    function solve(row: number, col: number): boolean {
      if (row === size) return true;
      const nextRow = col === size - 1 ? row + 1 : row;
      const nextCol = col === size - 1 ? 0 : col + 1;

      for (const num of shuffle(numbers)) {
        if (isSafe(row, col, num)) {
          grid[row][col] = num;
          if (solve(nextRow, nextCol)) return true;
          grid[row][col] = 0;
        }
      }
      return false;
    }

    return solve(0, 0) ? grid : null;
  }
}
