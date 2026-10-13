import { FutoshikiInequality } from './types.js';

export function solveFutoshiki(
  initialGrid: number[][],
  inequalities: FutoshikiInequality[],
  maxSolutions: number = 2
): number[][][] {
  if (!Array.isArray(initialGrid) || initialGrid.length === 0 || maxSolutions <= 0) {
    return [];
  }

  const n = initialGrid.length;

  // Validate square dimensions
  for (let r = 0; r < n; r++) {
    if (!Array.isArray(initialGrid[r]) || initialGrid[r].length !== n) {
      return [];
    }
  }

  // Validate inequality cell coordinates
  for (const ineq of inequalities) {
    if (
      ineq.row1 < 0 || ineq.row1 >= n ||
      ineq.col1 < 0 || ineq.col1 >= n ||
      ineq.row2 < 0 || ineq.row2 >= n ||
      ineq.col2 < 0 || ineq.col2 >= n
    ) {
      return [];
    }
  }

  // Initialize domains: Set of numbers 1..n for each cell
  const domains: Set<number>[][] = [];
  for (let r = 0; r < n; r++) {
    domains[r] = [];
    for (let c = 0; c < n; c++) {
      const val = initialGrid[r][c];
      if (val !== 0) {
        if (!Number.isInteger(val) || val < 1 || val > n) {
          return [];
        }
        domains[r][c] = new Set([val]);
      } else {
        const d = new Set<number>();
        for (let v = 1; v <= n; v++) {
          d.add(v);
        }
        domains[r][c] = d;
      }
    }
  }

  // Propagate constraints (Arc Consistency / Forward Checking)
  function propagate(curDomains: Set<number>[][]): boolean {
    let changed = true;
    while (changed) {
      changed = false;

      // 1. Row and Column uniqueness for singletons
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (curDomains[r][c].size === 0) return false;
          if (curDomains[r][c].size === 1) {
            const val = Array.from(curDomains[r][c])[0];
            // Remove val from row peers
            for (let c2 = 0; c2 < n; c2++) {
              if (c2 !== c && curDomains[r][c2].has(val)) {
                curDomains[r][c2].delete(val);
                if (curDomains[r][c2].size === 0) return false;
                changed = true;
              }
            }
            // Remove val from col peers
            for (let r2 = 0; r2 < n; r2++) {
              if (r2 !== r && curDomains[r2][c].has(val)) {
                curDomains[r2][c].delete(val);
                if (curDomains[r2][c].size === 0) return false;
                changed = true;
              }
            }
          }
        }
      }

      // 2. Inequality domain pruning
      for (const ineq of inequalities) {
        const d1 = curDomains[ineq.row1][ineq.col1];
        const d2 = curDomains[ineq.row2][ineq.col2];
        if (d1.size === 0 || d2.size === 0) return false;

        const min1 = Math.min(...d1);
        const max1 = Math.max(...d1);
        const min2 = Math.min(...d2);
        const max2 = Math.max(...d2);

        if (ineq.relation === '<') {
          // Cell 1 < Cell 2 => Cell 1 < max2, Cell 2 > min1
          for (const v1 of Array.from(d1)) {
            if (v1 >= max2) {
              d1.delete(v1);
              if (d1.size === 0) return false;
              changed = true;
            }
          }
          for (const v2 of Array.from(d2)) {
            if (v2 <= min1) {
              d2.delete(v2);
              if (d2.size === 0) return false;
              changed = true;
            }
          }
        } else {
          // Cell 1 > Cell 2 => Cell 1 > min2, Cell 2 < max1
          for (const v1 of Array.from(d1)) {
            if (v1 <= min2) {
              d1.delete(v1);
              if (d1.size === 0) return false;
              changed = true;
            }
          }
          for (const v2 of Array.from(d2)) {
            if (v2 >= max1) {
              d2.delete(v2);
              if (d2.size === 0) return false;
              changed = true;
            }
          }
        }
      }
    }
    return true;
  }

  function cloneDomains(curDomains: Set<number>[][]): Set<number>[][] {
    return curDomains.map(row => row.map(cell => new Set(cell)));
  }

  const solutions: number[][][] = [];

  function backtrack(curDomains: Set<number>[][]): void {
    if (solutions.length >= maxSolutions) return;

    if (!propagate(curDomains)) return;

    // Find cell with MRV (smallest domain > 1)
    let bestR = -1;
    let bestC = -1;
    let minSize = Infinity;
    let allAssigned = true;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const sz = curDomains[r][c].size;
        if (sz === 0) return;
        if (sz > 1) {
          allAssigned = false;
          if (sz < minSize) {
            minSize = sz;
            bestR = r;
            bestC = c;
          }
        }
      }
    }

    if (allAssigned) {
      const solGrid = curDomains.map(row => row.map(cell => Array.from(cell)[0]));
      solutions.push(solGrid);
      return;
    }

    const candidates = Array.from(curDomains[bestR][bestC]);
    for (const val of candidates) {
      if (solutions.length >= maxSolutions) return;
      const nextDomains = cloneDomains(curDomains);
      nextDomains[bestR][bestC] = new Set([val]);
      backtrack(nextDomains);
    }
  }

  backtrack(domains);
  return solutions;
}
