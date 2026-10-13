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

export interface RawKakuroSeed {
  title: string;
  size: number;
  difficulty: KakuroDifficulty;
  layout: string[];
}

export function extractKakuroRuns(grid: KakuroCell[][]): KakuroRun[] {
  const runs: KakuroRun[] = [];
  const rows = grid.length;
  if (rows === 0) return runs;
  const cols = grid[0].length;

  // Extract Across runs
  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      if (grid[r][c].type === 'white') {
        const startC = c;
        const cells: [number, number][] = [];
        while (c < cols && grid[r][c].type === 'white') {
          cells.push([r, c]);
          c++;
        }

        const clueRow = r;
        const clueCol = startC - 1;
        const clueCell = clueCol >= 0 ? grid[clueRow][clueCol] : undefined;
        let targetSum = clueCell?.acrossSum ?? 0;
        if (
          targetSum === 0 &&
          cells.length > 0 &&
          cells.every(([cr, cc]) => grid[cr][cc].solution !== undefined)
        ) {
          targetSum = cells.reduce(
            (sum, [cr, cc]) => sum + (grid[cr][cc].solution ?? 0),
            0
          );
        }

        runs.push({
          id: `across-${clueRow}-${clueCol}`,
          direction: 'across',
          clueRow,
          clueCol,
          targetSum,
          cells,
        });
      } else {
        c++;
      }
    }
  }

  // Extract Down runs
  for (let c = 0; c < cols; c++) {
    let r = 0;
    while (r < rows) {
      if (grid[r][c].type === 'white') {
        const startR = r;
        const cells: [number, number][] = [];
        while (r < rows && grid[r][c].type === 'white') {
          cells.push([r, c]);
          r++;
        }

        const clueRow = startR - 1;
        const clueCol = c;
        const clueCell = clueRow >= 0 ? grid[clueRow][clueCol] : undefined;
        let targetSum = clueCell?.downSum ?? 0;
        if (
          targetSum === 0 &&
          cells.length > 0 &&
          cells.every(([cr, cc]) => grid[cr][cc].solution !== undefined)
        ) {
          targetSum = cells.reduce(
            (sum, [cr, cc]) => sum + (grid[cr][cc].solution ?? 0),
            0
          );
        }

        runs.push({
          id: `down-${clueRow}-${clueCol}`,
          direction: 'down',
          clueRow,
          clueCol,
          targetSum,
          cells,
        });
      } else {
        r++;
      }
    }
  }

  return runs;
}

export function buildKakuroData(
  title: string,
  size: number,
  difficulty: KakuroDifficulty,
  layout: string[]
): KakuroData {
  const grid: KakuroCell[][] = layout.map((row) =>
    row.split('').map((ch): KakuroCell => {
      if (ch === '#') {
        return { type: 'block' };
      }
      return {
        type: 'white',
        solution: parseInt(ch, 10),
      };
    })
  );

  const runs = extractKakuroRuns(grid);
  for (const run of runs) {
    const clueCell = grid[run.clueRow][run.clueCol];
    clueCell.type = 'clue';
    if (run.direction === 'across') {
      clueCell.acrossSum = run.targetSum;
    } else {
      clueCell.downSum = run.targetSum;
    }
  }

  return {
    title,
    date: '2026-10-13',
    size,
    difficulty,
    grid,
    runs,
  };
}

const RAW_SEEDS: RawKakuroSeed[] = [
  // 6x6
  {
    title: 'Cascade Six Alpha',
    size: 6,
    difficulty: 'easy',
    layout: [
      '######',
      '#89###',
      '#537##',
      '##142#',
      '###94#',
      '######',
    ],
  },
  {
    title: 'Cross Sum Echo',
    size: 6,
    difficulty: 'medium',
    layout: [
      '######',
      '#83###',
      '#419##',
      '##279#',
      '###31#',
      '######',
    ],
  },
  {
    title: 'Summit Six',
    size: 6,
    difficulty: 'hard',
    layout: [
      '######',
      '#79###',
      '#968##',
      '##729#',
      '###67#',
      '######',
    ],
  },
  // 8x8
  {
    title: 'Cascade Eight Alpha',
    size: 8,
    difficulty: 'easy',
    layout: [
      '########',
      '#12#####',
      '#749####',
      '##142###',
      '###142##',
      '####985#',
      '#####51#',
      '########',
    ],
  },
  {
    title: 'River Eight',
    size: 8,
    difficulty: 'medium',
    layout: [
      '########',
      '#59#####',
      '#153####',
      '##762###',
      '###876##',
      '####876#',
      '#####95#',
      '########',
    ],
  },
  {
    title: 'Summit Eight',
    size: 8,
    difficulty: 'hard',
    layout: [
      '########',
      '#61#####',
      '#987####',
      '##953###',
      '###819##',
      '####234#',
      '#####89#',
      '########',
    ],
  },
  // 10x10
  {
    title: 'Cascade Ten Alpha',
    size: 10,
    difficulty: 'easy',
    layout: [
      '##########',
      '#71#######',
      '#973######',
      '##869#####',
      '###145####',
      '####315###',
      '#####893##',
      '######894#',
      '#######86#',
      '##########',
    ],
  },
  {
    title: 'Mountain Ten',
    size: 10,
    difficulty: 'medium',
    layout: [
      '##########',
      '#21#######',
      '#485######',
      '##986#####',
      '###917####',
      '####768###',
      '#####198##',
      '######697#',
      '#######56#',
      '##########',
    ],
  },
  {
    title: 'Pinnacle Ten',
    size: 10,
    difficulty: 'hard',
    layout: [
      '##########',
      '#98#######',
      '#753######',
      '##956#####',
      '###986####',
      '####986###',
      '#####759##',
      '######489#',
      '#######53#',
      '##########',
    ],
  },
];

export const SAMPLE_KAKURO_PUZZLES: KakuroData[] = RAW_SEEDS.map((s) =>
  buildKakuroData(s.title, s.size, s.difficulty, s.layout)
);

export function getSampleKakuroBySize(
  size: number,
  difficulty?: KakuroDifficulty
): KakuroData {
  const matches = SAMPLE_KAKURO_PUZZLES.filter(
    (p) => p.size === size && (!difficulty || p.difficulty === difficulty)
  );
  if (matches.length > 0) {
    return matches[0];
  }
  const sizeMatches = SAMPLE_KAKURO_PUZZLES.filter((p) => p.size === size);
  if (sizeMatches.length > 0) {
    return sizeMatches[0];
  }
  return SAMPLE_KAKURO_PUZZLES[0];
}

export function createEmptyKakuroGrid(
  gridOrSize: KakuroCell[][] | number
): (number | null)[][] {
  const size = Array.isArray(gridOrSize) ? gridOrSize.length : gridOrSize;
  const cols =
    Array.isArray(gridOrSize) && gridOrSize.length > 0
      ? gridOrSize[0].length
      : size;
  return Array.from({ length: size }, () => Array(cols).fill(null));
}

export function computeRunSums(
  userGrid: (number | null)[][],
  runs: KakuroRun[]
): Record<string, number> {
  const sums: Record<string, number> = {};
  for (const run of runs) {
    let total = 0;
    for (const [r, c] of run.cells) {
      const val = userGrid[r]?.[c];
      if (typeof val === 'number' && !isNaN(val)) {
        total += val;
      }
    }
    sums[run.id] = total;
  }
  return sums;
}

export function findDuplicateRunDigits(
  userGrid: (number | null)[][],
  runs: KakuroRun[]
): Set<string> {
  const duplicates = new Set<string>();
  for (const run of runs) {
    const digitCells = new Map<number, [number, number][]>();
    for (const [r, c] of run.cells) {
      const val = userGrid[r]?.[c];
      if (typeof val === 'number' && !isNaN(val)) {
        const existing = digitCells.get(val);
        if (existing) {
          existing.push([r, c]);
        } else {
          digitCells.set(val, [[r, c]]);
        }
      }
    }
    for (const [, cells] of digitCells.entries()) {
      if (cells.length > 1) {
        for (const [r, c] of cells) {
          duplicates.add(`${r},${c}`);
        }
      }
    }
  }
  return duplicates;
}

export function isKakuroSolved(
  userGrid: (number | null)[][],
  runs: KakuroRun[]
): boolean {
  if (!userGrid || !runs || runs.length === 0) return false;

  for (const run of runs) {
    let sum = 0;
    const seen = new Set<number>();

    for (const [r, c] of run.cells) {
      const val = userGrid[r]?.[c];
      if (
        val === null ||
        val === undefined ||
        typeof val !== 'number' ||
        val < 1 ||
        val > 9
      ) {
        return false;
      }
      if (seen.has(val)) {
        return false;
      }
      seen.add(val);
      sum += val;
    }

    if (sum !== run.targetSum) {
      return false;
    }
  }

  return true;
}
