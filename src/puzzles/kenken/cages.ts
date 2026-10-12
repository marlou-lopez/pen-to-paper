import { KenKenCage, KenKenCellCoord, KenKenDifficulty, KenKenOp } from './types.js';

export function partitionCages(
  grid: number[][],
  difficulty: KenKenDifficulty,
  rng: () => number
): KenKenCage[] {
  const size = grid.length;
  const cageMap: number[][] = Array.from({ length: size }, () => Array(size).fill(-1));
  const cages: KenKenCage[] = [];
  let nextCageId = 0;

  const maxCageSize = size <= 4 ? 2 : difficulty === 'easy' ? 3 : 4;
  const allowAnchors = size >= 5;
  let remainingAnchors = allowAnchors ? (difficulty === 'easy' ? 2 : 1) : 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cageMap[r][c] !== -1) continue;

      const cells: KenKenCellCoord[] = [{ row: r, col: c }];
      cageMap[r][c] = nextCageId;

      // Check if this should be a 1-cell anchor
      if (remainingAnchors > 0 && rng() < 0.15) {
        remainingAnchors--;
      } else {
        // Expand cage with random adjacent empty neighbors
        const targetCageSize = 2 + Math.floor(rng() * (maxCageSize - 1));
        while (cells.length < targetCageSize) {
          const neighbors: KenKenCellCoord[] = [];
          for (const cell of cells) {
            const deltas = [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
            ];
            for (const [dr, dc] of deltas) {
              const nr = cell.row + dr;
              const nc = cell.col + dc;
              if (
                nr >= 0 &&
                nr < size &&
                nc >= 0 &&
                nc < size &&
                cageMap[nr][nc] === -1 &&
                !neighbors.some((n) => n.row === nr && n.col === nc)
              ) {
                neighbors.push({ row: nr, col: nc });
              }
            }
          }

          if (neighbors.length === 0) break;
          const chosen = neighbors[Math.floor(rng() * neighbors.length)];
          cageMap[chosen.row][chosen.col] = nextCageId;
          cells.push(chosen);
        }
      }

      // Assign operation & target
      const values = cells.map((cell) => grid[cell.row][cell.col]);
      let op: KenKenOp = '+';
      let target = 0;

      if (cells.length === 1) {
        op = 'none';
        target = values[0];
      } else if (cells.length === 2) {
        const [a, b] = values;
        const max = Math.max(a, b);
        const min = Math.min(a, b);
        const candidates: Array<{ op: KenKenOp; target: number }> = [];

        // Division
        if (max % min === 0 && (difficulty !== 'easy' || size >= 5)) {
          candidates.push({ op: '/', target: max / min });
        }
        // Subtraction
        candidates.push({ op: '-', target: max - min });
        // Addition
        candidates.push({ op: '+', target: a + b });
        // Multiplication
        if (difficulty !== 'easy') {
          candidates.push({ op: '*', target: a * b });
        }

        const picked = candidates[Math.floor(rng() * candidates.length)];
        op = picked.op;
        target = picked.target;
      } else {
        // 3 or 4 cells: '+' or '*'
        const sum = values.reduce((acc, v) => acc + v, 0);
        const prod = values.reduce((acc, v) => acc * v, 1);

        if (difficulty !== 'easy' && prod <= 400 && rng() < 0.4) {
          op = '*';
          target = prod;
        } else {
          op = '+';
          target = sum;
        }
      }

      cages.push({
        id: nextCageId++,
        op,
        target,
        cells,
      });
    }
  }

  return cages;
}
