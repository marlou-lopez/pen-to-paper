export function parseSudokuGrid(input: string): (number | null)[][] {
  if (!input || typeof input !== 'string') {
    throw new Error('Sudoku grid input is empty or invalid.');
  }

  // Split by slashes or newlines
  const rawRows = input.includes('/') ? input.split('/') : input.split(/\r?\n/);
  const rows = rawRows.map((r) => r.trim()).filter((r) => r.length > 0);

  if (rows.length !== 9) {
    throw new Error(`Expected 9 rows separated by '/', but found ${rows.length}.`);
  }

  const grid: (number | null)[][] = [];

  for (let r = 0; r < 9; r++) {
    const rowStr = rows[r];
    if (rowStr.length !== 9) {
      throw new Error(`Row ${r + 1} has ${rowStr.length} cells instead of 9 ("${rowStr}").`);
    }

    const row: (number | null)[] = [];
    for (let c = 0; c < 9; c++) {
      const char = rowStr[c];
      if (char.toLowerCase() === 'x' || char === '.' || char === '-' || char === '0') {
        row.push(null);
      } else if (char >= '1' && char <= '9') {
        row.push(parseInt(char, 10));
      } else {
        throw new Error(`Invalid character '${char}' in row ${r + 1}, column ${c + 1}.`);
      }
    }
    grid.push(row);
  }

  // Check for duplicate clues
  validateClues(grid);

  return grid;
}

function validateClues(grid: (number | null)[][]): void {
  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Set<number>();
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      if (val !== null) {
        if (seen.has(val)) {
          throw new Error(`Invalid puzzle: duplicate number ${val} in row ${r + 1}.`);
        }
        seen.add(val);
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Set<number>();
    for (let r = 0; r < 9; r++) {
      const val = grid[r][c];
      if (val !== null) {
        if (seen.has(val)) {
          throw new Error(`Invalid puzzle: duplicate number ${val} in column ${c + 1}.`);
        }
        seen.add(val);
      }
    }
  }

  // Check 3x3 boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen = new Set<number>();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const val = grid[br * 3 + r][bc * 3 + c];
          if (val !== null) {
            if (seen.has(val)) {
              throw new Error(`Invalid puzzle: duplicate number ${val} in box (${br + 1}, ${bc + 1}).`);
            }
            seen.add(val);
          }
        }
      }
    }
  }
}
