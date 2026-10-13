import { GeneratedPuzzle, PuzzleGenerator, PuzzleMetadata } from '../../core/types.js';
import { getSeedKakuro } from './seed-bank.js';
import { solveKakuro } from './solver.js';
import { extractKakuroRuns, KAKURO_TEMPLATES } from './templates.js';
import { KakuroCell, KakuroData, KakuroDifficulty, KakuroOptions, KakuroRun } from './types.js';

export interface KakuroGeneratedPuzzle extends GeneratedPuzzle<KakuroData> {
  pdfBuffer?: Buffer;
}

export class KakuroGenerator implements PuzzleGenerator<KakuroOptions, KakuroData> {
  readonly metadata: PuzzleMetadata = {
    id: 'kakuro',
    displayName: 'Kakuro',
    targetFolder: '/Puzzles/Kakuro',
  };
  readonly type = 'kakuro' as const;

  async generate(options?: KakuroOptions): Promise<KakuroGeneratedPuzzle> {
    const validSizes = [6, 8, 10];
    let size = options?.size ?? 8;
    if (!validSizes.includes(size)) {
      if (size <= 6) size = 6;
      else if (size <= 8) size = 8;
      else size = 10;
    }

    const validDifficulties: KakuroDifficulty[] = ['easy', 'medium', 'hard'];
    const difficulty: KakuroDifficulty =
      options?.difficulty && validDifficulties.includes(options.difficulty)
        ? options.difficulty
        : 'medium';

    const dateStr = options?.date ?? new Date().toISOString().slice(0, 10);

    // Procedural generation attempt
    const matchingTemplates = KAKURO_TEMPLATES.filter((t) => t.size === size);
    const maxAttempts = size === 6 ? 25 : size === 8 ? 10 : 3;

    if (matchingTemplates.length > 0) {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const tmpl = matchingTemplates[attempt % matchingTemplates.length];
        const runs = extractKakuroRuns(tmpl.grid);

        const whiteCells: [number, number][] = [];
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (tmpl.grid[r][c].type === 'white') {
              whiteCells.push([r, c]);
            }
          }
        }

        const cellRuns = new Map<string, KakuroRun[]>();
        for (const [r, c] of whiteCells) {
          cellRuns.set(
            `${r},${c}`,
            runs.filter((run) =>
              run.cells.some(([cr, cc]) => cr === r && cc === c)
            )
          );
        }

        const digitGrid: number[][] = Array.from({ length: size }, () =>
          Array(size).fill(0)
        );

        function fill(cIdx: number): boolean {
          if (cIdx === whiteCells.length) return true;
          const [r, c] = whiteCells[cIdx];
          const touching = cellRuns.get(`${r},${c}`)!;
          const used = new Set<number>();
          for (const run of touching) {
            for (const [cr, cc] of run.cells) {
              if (digitGrid[cr][cc] !== 0) used.add(digitGrid[cr][cc]);
            }
          }
          const pool = [1, 2, 3, 4, 5, 6, 7, 8, 9].filter((d) => !used.has(d));
          for (let k = pool.length - 1; k > 0; k--) {
            const j = Math.floor(Math.random() * (k + 1));
            [pool[k], pool[j]] = [pool[j], pool[k]];
          }
          for (const d of pool) {
            digitGrid[r][c] = d;
            if (fill(cIdx + 1)) return true;
            digitGrid[r][c] = 0;
          }
          return false;
        }

        if (!fill(0)) continue;

        const testRuns: KakuroRun[] = runs.map((r) => ({
          ...r,
          targetSum: r.cells.reduce((s, [cr, cc]) => s + digitGrid[cr][cc], 0),
        }));

        const testGrid: KakuroCell[][] = Array.from({ length: size }, (_, r) =>
          Array.from({ length: size }, (_, c) => {
            if (tmpl.grid[r][c].type === 'white') {
              return { type: 'white', solution: digitGrid[r][c] };
            }
            return { type: 'block' };
          })
        );

        for (const r of testRuns) {
          const cell = testGrid[r.clueRow][r.clueCol];
          cell.type = 'clue';
          if (r.direction === 'across') cell.acrossSum = r.targetSum;
          else cell.downSum = r.targetSum;
        }

        const sols = solveKakuro(testGrid, testRuns, 2);
        if (sols.length === 1) {
          const puzzleData: KakuroData = {
            title: `Kakuro ${size}x${size}`,
            date: dateStr,
            size,
            difficulty,
            grid: testGrid,
            runs: testRuns,
          };
          const filename = `Kakuro_${size}x${size}_${difficulty}_${dateStr}.pdf`;
          return {
            metadata: {
              ...this.metadata,
              date: dateStr,
            },
            type: 'kakuro',
            title: puzzleData.title,
            filename,
            puzzleData,
          };
        }
      }
    }

    // Fallback to verified seed puzzle
    const seedPuzzle = getSeedKakuro(size, difficulty, dateStr);
    const filename = `Kakuro_${size}x${size}_${difficulty}_${dateStr}.pdf`;
    return {
      metadata: {
        ...this.metadata,
        date: dateStr,
      },
      type: 'kakuro',
      title: seedPuzzle.title,
      filename,
      puzzleData: seedPuzzle,
    };
  }

  async renderPdf(puzzle: GeneratedPuzzle<KakuroData>): Promise<Buffer> {
    // Placeholder: full PDFKit rendering implemented in Task 3
    return Buffer.alloc(0);
  }
}
