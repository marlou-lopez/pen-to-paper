import { KenKenCage } from './types.js';

export function isCageSatisfied(cage: KenKenCage, grid: number[][]): boolean {
  const vals: number[] = [];
  for (const c of cage.cells) {
    const val = grid[c.row][c.col];
    if (val === 0) return true; // not fully filled yet
    vals.push(val);
  }

  if (vals.length < cage.cells.length) return true;

  if (cage.op === 'none') {
    return vals[0] === cage.target;
  }
  if (cage.op === '+') {
    return vals.reduce((a, b) => a + b, 0) === cage.target;
  }
  if (cage.op === '*') {
    return vals.reduce((a, b) => a * b, 1) === cage.target;
  }
  if (cage.op === '-') {
    return Math.abs(vals[0] - vals[1]) === cage.target;
  }
  if (cage.op === '/') {
    const max = Math.max(vals[0], vals[1]);
    const min = Math.min(vals[0], vals[1]);
    return min !== 0 && max % min === 0 && max / min === cage.target;
  }
  return true;
}

function isCagePartiallyValid(cage: KenKenCage, grid: number[][], size: number): boolean {
  const vals: number[] = [];
  let emptyCount = 0;
  for (const c of cage.cells) {
    const val = grid[c.row][c.col];
    if (val === 0) {
      emptyCount++;
    } else {
      vals.push(val);
    }
  }

  if (emptyCount === 0) {
    return isCageSatisfied(cage, grid);
  }

  if (vals.length === 0) {
    return true;
  }

  if (cage.op === '+') {
    const currentSum = vals.reduce((a, b) => a + b, 0);
    if (currentSum + emptyCount > cage.target) return false;
    if (currentSum + emptyCount * size < cage.target) return false;
    return true;
  }

  if (cage.op === '*') {
    const currentProd = vals.reduce((a, b) => a * b, 1);
    if (cage.target % currentProd !== 0) return false;
    if (currentProd > cage.target) return false;
    if (currentProd * Math.pow(size, emptyCount) < cage.target) return false;
    return true;
  }

  if (cage.op === '-') {
    if (vals.length === 1) {
      const a = vals[0];
      const target = cage.target;
      const canBeLower = a - target >= 1;
      const canBeHigher = a + target <= size;
      return canBeLower || canBeHigher;
    }
    return true;
  }

  if (cage.op === '/') {
    if (vals.length === 1) {
      const a = vals[0];
      const target = cage.target;
      const canDivide = a % target === 0 && a / target >= 1;
      const canBeDivided = a * target <= size;
      return canDivide || canBeDivided;
    }
    return true;
  }

  return true;
}

export function solveKenKen(
  cages: KenKenCage[],
  size: number,
  maxSolutions = 2
): number[][][] {
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const cellToCage = new Map<string, KenKenCage>();
  for (const cage of cages) {
    for (const cell of cage.cells) {
      cellToCage.set(`${cell.row},${cell.col}`, cage);
    }
  }

  const solutions: number[][][] = [];

  function isSafe(row: number, col: number, num: number): boolean {
    for (let c = 0; c < size; c++) {
      if (grid[row][c] === num) return false;
    }
    for (let r = 0; r < size; r++) {
      if (grid[r][col] === num) return false;
    }

    grid[row][col] = num;
    const cage = cellToCage.get(`${row},${col}`);
    const valid = cage ? isCagePartiallyValid(cage, grid, size) : true;
    grid[row][col] = 0;

    return valid;
  }

  function search(row: number, col: number): boolean {
    if (row === size) {
      solutions.push(grid.map((r) => [...r]));
      return solutions.length >= maxSolutions;
    }

    const nextRow = col === size - 1 ? row + 1 : row;
    const nextCol = col === size - 1 ? 0 : col + 1;

    for (let num = 1; num <= size; num++) {
      if (isSafe(row, col, num)) {
        grid[row][col] = num;
        if (search(nextRow, nextCol)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  search(0, 0);
  return solutions;
}
