export type SudokuCell = number | null;
export type SudokuGrid = SudokuCell[][];

export function createEmptyGrid(): SudokuGrid {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => null));
}

/**
 * Converts a 9x9 Sudoku grid to custom x notation.
 * Empty cells are represented by 'x', rows are separated by '/'.
 * Example: "53xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79"
 */
export function gridToNotation(grid: SudokuGrid): string {
  return grid
    .map((row) =>
      row
        .map((cell) => (cell === null || cell === undefined || cell === 0 ? 'x' : String(cell)))
        .join('')
    )
    .join('/');
}

/**
 * Parses x notation or newline-separated notation into a 9x9 matrix.
 */
export function notationToGrid(notation: string): SudokuGrid {
  const rawRows = notation.includes('/') ? notation.split('/') : notation.split(/\r?\n/);
  const rows = rawRows.map((r) => r.trim()).filter((r) => r.length > 0);

  if (rows.length !== 9) {
    throw new Error(`Expected 9 rows separated by '/', but found ${rows.length}.`);
  }

  const grid: SudokuGrid = [];
  for (let r = 0; r < 9; r++) {
    const rowStr = rows[r];
    if (rowStr.length !== 9) {
      throw new Error(`Row ${r + 1} has ${rowStr.length} cells instead of 9.`);
    }

    const row: SudokuCell[] = [];
    for (let c = 0; c < 9; c++) {
      const char = rowStr[c];
      if (char.toLowerCase() === 'x' || char === '.' || char === '-' || char === '0') {
        row.push(null);
      } else if (char >= '1' && char <= '9') {
        row.push(parseInt(char, 10));
      } else {
        throw new Error(`Invalid character '${char}' at row ${r + 1}, column ${c + 1}.`);
      }
    }
    grid.push(row);
  }
  return grid;
}

/**
 * Returns a Set of keys ("r,c") of all cells that violate Sudoku rules (duplicates in row, col, or 3x3 box).
 */
export function getConflicts(grid: SudokuGrid): Set<string> {
  const conflicts = new Set<string>();

  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Map<number, number[]>();
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      if (val !== null) {
        const cols = seen.get(val) || [];
        cols.push(c);
        seen.set(val, cols);
      }
    }
    for (const [, cols] of seen) {
      if (cols.length > 1) {
        for (const c of cols) {
          conflicts.add(`${r},${c}`);
        }
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Map<number, number[]>();
    for (let r = 0; r < 9; r++) {
      const val = grid[r][c];
      if (val !== null) {
        const rows = seen.get(val) || [];
        rows.push(r);
        seen.set(val, rows);
      }
    }
    for (const [, rows] of seen) {
      if (rows.length > 1) {
        for (const r of rows) {
          conflicts.add(`${r},${c}`);
        }
      }
    }
  }

  // Check 3x3 boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen = new Map<number, Array<[number, number]>>();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const row = br * 3 + r;
          const col = bc * 3 + c;
          const val = grid[row][col];
          if (val !== null) {
            const cells = seen.get(val) || [];
            cells.push([row, col]);
            seen.set(val, cells);
          }
        }
      }
      for (const [, cells] of seen) {
        if (cells.length > 1) {
          for (const [r, c] of cells) {
            conflicts.add(`${r},${c}`);
          }
        }
      }
    }
  }

  return conflicts;
}

export function countClues(grid: SudokuGrid): number {
  let count = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] !== null) count++;
    }
  }
  return count;
}

export interface SudokuValidationResult {
  valid: boolean;
  solvable: boolean;
  error?: string;
  solution?: number[][];
}

/**
 * Validates the grid and runs a client-side backtracking solver.
 */
export function validateAndSolve(grid: SudokuGrid): SudokuValidationResult {
  const conflicts = getConflicts(grid);
  if (conflicts.size > 0) {
    return {
      valid: false,
      solvable: false,
      error: `Board contains ${conflicts.size} conflicting cell(s). Please fix duplicate numbers.`,
    };
  }

  const clues = countClues(grid);
  if (clues === 0) {
    return {
      valid: false,
      solvable: false,
      error: 'Grid is empty. Please enter at least some clues.',
    };
  }

  // Copy into numeric grid for backtracking
  const board: number[][] = grid.map((row) =>
    row.map((val) => (val === null ? 0 : val))
  );

  function isValidPlacement(r: number, c: number, num: number): boolean {
    for (let i = 0; i < 9; i++) {
      if (board[r][i] === num) return false;
      if (board[i][c] === num) return false;
    }
    const boxRow = Math.floor(r / 3) * 3;
    const boxCol = Math.floor(c / 3) * 3;
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        if (board[boxRow + br][boxCol + bc] === num) return false;
      }
    }
    return true;
  }

  function solve(): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(r, c, num)) {
              board[r][c] = num;
              if (solve()) return true;
              board[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  const solved = solve();
  if (!solved) {
    return {
      valid: true,
      solvable: false,
      error: 'This puzzle has no valid solution. Please check the clues.',
    };
  }

  return {
    valid: true,
    solvable: true,
    solution: board,
  };
}
