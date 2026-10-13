import { KakuroCell, KakuroRun } from './types.js';

export interface KakuroTemplate {
  id: string;
  name: string;
  size: number;
  grid: KakuroCell[][];
}

interface RawTemplate {
  id: string;
  name: string;
  size: number;
  layout: string[];
}

const RAW_TEMPLATES: RawTemplate[] = [
  // 6x6 Template A: Diagonal Cascade A
  {
    id: 'kakuro-6-a',
    name: 'Cascade 6x6 A',
    size: 6,
    layout: [
      '######',
      '#..###',
      '#...##',
      '##...#',
      '###..#',
      '######',
    ],
  },
  // 6x6 Template B: Diagonal Cascade B
  {
    id: 'kakuro-6-b',
    name: 'Cascade 6x6 B',
    size: 6,
    layout: [
      '######',
      '###..#',
      '##...#',
      '#...##',
      '#..###',
      '######',
    ],
  },
  // 8x8 Template A: Diagonal Cascade A
  {
    id: 'kakuro-8-a',
    name: 'Cascade 8x8 A',
    size: 8,
    layout: [
      '########',
      '#..#####',
      '#...####',
      '##...###',
      '###...##',
      '####...#',
      '#####..#',
      '########',
    ],
  },
  // 8x8 Template B: Diagonal Cascade B
  {
    id: 'kakuro-8-b',
    name: 'Cascade 8x8 B',
    size: 8,
    layout: [
      '########',
      '#####..#',
      '####...#',
      '###...##',
      '##...###',
      '#...####',
      '#..#####',
      '########',
    ],
  },
  // 10x10 Template A: Diagonal Cascade A
  {
    id: 'kakuro-10-a',
    name: 'Cascade 10x10 A',
    size: 10,
    layout: [
      '##########',
      '#..#######',
      '#...######',
      '##...#####',
      '###...####',
      '####...###',
      '#####...##',
      '######...#',
      '#######..#',
      '##########',
    ],
  },
  // 10x10 Template B: Diagonal Cascade B
  {
    id: 'kakuro-10-b',
    name: 'Cascade 10x10 B',
    size: 10,
    layout: [
      '##########',
      '#######..#',
      '######...#',
      '#####...##',
      '####...###',
      '###...####',
      '##...#####',
      '#...######',
      '#..#######',
      '##########',
    ],
  },
];

function buildTemplateGrid(layout: string[]): KakuroCell[][] {
  return layout.map((row) =>
    row.split('').map((ch): KakuroCell => {
      if (ch === '.') {
        return { type: 'white' };
      }
      return { type: 'block' };
    })
  );
}

export const KAKURO_TEMPLATES: KakuroTemplate[] = RAW_TEMPLATES.map((raw) => ({
  id: raw.id,
  name: raw.name,
  size: raw.size,
  grid: buildTemplateGrid(raw.layout),
}));

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
        if (targetSum === 0 && cells.length > 0 && cells.every(([cr, cc]) => grid[cr][cc].solution !== undefined)) {
          targetSum = cells.reduce((sum, [cr, cc]) => sum + (grid[cr][cc].solution ?? 0), 0);
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
        if (targetSum === 0 && cells.length > 0 && cells.every(([cr, cc]) => grid[cr][cc].solution !== undefined)) {
          targetSum = cells.reduce((sum, [cr, cc]) => sum + (grid[cr][cc].solution ?? 0), 0);
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
