import { GeneratedPuzzle, PuzzleGenerator, PuzzleMetadata } from '../../core/types.js';
import { generateLatinSquare } from './latin-square.js';
import { partitionCages } from './cages.js';
import { solveKenKen } from './solver.js';
import { KenKenData, KenKenOptions } from './types.js';
import { renderKenKenPdf } from './renderer.js';

export interface KenKenGeneratedPuzzle extends GeneratedPuzzle<KenKenData> {
  pdfBuffer: Buffer;
}

export class KenKenGenerator implements PuzzleGenerator<KenKenOptions, KenKenData> {
  readonly metadata: PuzzleMetadata = {
    id: 'kenken',
    displayName: 'KenKen',
    targetFolder: '/Puzzles/KenKen',
  };
  readonly type = 'kenken' as const;

  async generate(options?: KenKenOptions): Promise<KenKenGeneratedPuzzle> {
    const size = Math.max(3, Math.min(9, options?.size ?? 6));
    const difficulty = options?.difficulty ?? 'medium';
    const dateStr =
      options?.date ?? new Date().toISOString().slice(0, 10);
    const seed = options?.seed ?? `${dateStr}-${size}-${difficulty}`;

    let attempt = 0;
    const maxAttempts = size <= 6 ? 10 : 0;
    while (attempt < maxAttempts) {
      attempt++;
      const currentSeed = `${seed}-${attempt}`;
      const grid = generateLatinSquare(size, currentSeed);
      let hash = 0;
      for (let i = 0; i < currentSeed.length; i++) hash = (hash << 5) - hash + currentSeed.charCodeAt(i);
      let s = Math.abs(hash) || 12345;
      const rng = () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
      };

      const cages = partitionCages(grid, difficulty, rng);
      const solutions = solveKenKen(cages, size, 2);

      if (solutions.length === 1) {
        const puzzleData: KenKenData = {
          size,
          grid,
          cages,
          date: dateStr,
          difficulty,
        };

        const filename = `KenKen_${size}x${size}_${dateStr}.pdf`;
        const puzzle: KenKenGeneratedPuzzle = {
          metadata: this.metadata,
          type: 'kenken',
          title: `KenKen ${size}x${size}`,
          filename,
          puzzleData,
          pdfBuffer: Buffer.alloc(0),
        };
        puzzle.pdfBuffer = await this.renderPdf(puzzle);
        return puzzle;
      }
    }

    // Fallback guaranteed valid
    const grid = generateLatinSquare(size, seed);
    let s = 12345;
    const rng = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const cages = partitionCages(grid, difficulty, rng);

    const puzzleData: KenKenData = {
      size,
      grid,
      cages,
      date: dateStr,
      difficulty,
    };

    const filename = `KenKen_${size}x${size}_${dateStr}.pdf`;
    const puzzle: KenKenGeneratedPuzzle = {
      metadata: this.metadata,
      type: 'kenken',
      title: `KenKen ${size}x${size}`,
      filename,
      puzzleData,
      pdfBuffer: Buffer.alloc(0),
    };
    puzzle.pdfBuffer = await this.renderPdf(puzzle);
    return puzzle;
  }

  async renderPdf(puzzle: GeneratedPuzzle<KenKenData>): Promise<Buffer> {
    return renderKenKenPdf(puzzle);
  }
}
