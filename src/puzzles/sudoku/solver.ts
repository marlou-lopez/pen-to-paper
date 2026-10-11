export function solveSudoku(initialGrid: (number | null)[][]): number[][] {
  const grid: number[][] = initialGrid.map((row) => row.map((cell) => (cell === null ? 0 : cell)));

  function isValid(r: number, c: number, num: number): boolean {
    for (let i = 0; i < 9; i++) {
      if (grid[r][i] === num) return false;
      if (grid[i][c] === num) return false;
    }

    const boxRow = Math.floor(r / 3) * 3;
    const boxCol = Math.floor(c / 3) * 3;
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        if (grid[boxRow + br][boxCol + bc] === num) return false;
      }
    }

    return true;
  }

  function solve(): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(r, c, num)) {
              grid[r][c] = num;
              if (solve()) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  if (!solve()) {
    throw new Error('The provided Sudoku has no valid solution. Please check the clues from your book.');
  }

  return grid;
}
