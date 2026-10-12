import { CrosswordSlot } from './types.js';

export interface NumberingResult {
  gridNumbers: (number | null)[][];
  acrossSlots: CrosswordSlot[];
  downSlots: CrosswordSlot[];
}

export function calculateCrosswordNumbering(grid: string[][]): NumberingResult {
  const gridNumbers: (number | null)[][] = Array.from({ length: 5 }, () => Array(5).fill(null));
  const acrossSlots: CrosswordSlot[] = [];
  const downSlots: CrosswordSlot[] = [];
  let currentNumber = 1;

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid[r][c] === '#') continue;

      const isAcrossStart =
        (c === 0 || grid[r][c - 1] === '#') &&
        c + 1 < 5 &&
        grid[r][c + 1] !== '#';

      const isDownStart =
        (r === 0 || grid[r - 1][c] === '#') &&
        r + 1 < 5 &&
        grid[r + 1][c] !== '#';

      if (isAcrossStart || isDownStart) {
        gridNumbers[r][c] = currentNumber;

        if (isAcrossStart) {
          const coords: [number, number][] = [];
          let colIdx = c;
          while (colIdx < 5 && grid[r][colIdx] !== '#') {
            coords.push([r, colIdx]);
            colIdx++;
          }
          acrossSlots.push({
            number: currentNumber,
            direction: 'across',
            startRow: r,
            startCol: c,
            length: coords.length,
            coords,
          });
        }

        if (isDownStart) {
          const coords: [number, number][] = [];
          let rowIdx = r;
          while (rowIdx < 5 && grid[rowIdx][c] !== '#') {
            coords.push([rowIdx, c]);
            rowIdx++;
          }
          downSlots.push({
            number: currentNumber,
            direction: 'down',
            startRow: r,
            startCol: c,
            length: coords.length,
            coords,
          });
        }

        currentNumber++;
      }
    }
  }

  return { gridNumbers, acrossSlots, downSlots };
}
