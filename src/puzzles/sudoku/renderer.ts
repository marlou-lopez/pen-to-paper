import { PdfBuilder, PAGE_MARGIN, PAGE_WIDTH } from '../../core/pdf-builder.js';
import { GeneratedPuzzle } from '../../core/types.js';
import { SudokuData } from './generator.js';

export function renderSudokuPdf(puzzle: GeneratedPuzzle<SudokuData>): Promise<Buffer> {
  const { difficulty, puzzleGrid, solutionGrid } = puzzle.puzzleData;
  const capitalizedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const dateStr = puzzle.filename.split('_')[2].replace('.pdf', '');

  const builder = new PdfBuilder('Sudoku', `Difficulty: ${capitalizedDifficulty}`, dateStr);
  const doc = builder.getDoc();

  const cellSize = 110;
  const boardSize = cellSize * 9;
  const startX = (PAGE_WIDTH - boardSize) / 2;
  const startY = PAGE_MARGIN + 220;

  function drawBoard(grid: (number | null)[][], isSolution = false) {
    const activeDoc = isSolution ? builder.getDoc() : doc;

    // Draw outer frame
    activeDoc.rect(startX - 2, startY - 2, boardSize + 4, boardSize + 4).lineWidth(4).strokeColor('#000000').stroke();

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cellX = startX + c * cellSize;
        const cellY = startY + r * cellSize;
        const val = grid[r][c];

        // Draw inner grid lines
        const isBoldBottom = (r + 1) % 3 === 0 && r < 8;
        const isBoldRight = (c + 1) % 3 === 0 && c < 8;

        activeDoc.rect(cellX, cellY, cellSize, cellSize).lineWidth(1).strokeColor('#888888').stroke();

        if (isBoldRight) {
          activeDoc.moveTo(cellX + cellSize, cellY).lineTo(cellX + cellSize, cellY + cellSize).lineWidth(3).strokeColor('#000000').stroke();
        }
        if (isBoldBottom) {
          activeDoc.moveTo(cellX, cellY + cellSize).lineTo(cellX + cellSize, cellY + cellSize).lineWidth(3).strokeColor('#000000').stroke();
        }

        if (val !== null) {
          const isGiven = puzzleGrid[r][c] !== null;
          if (isSolution && !isGiven) {
            activeDoc.font('Helvetica').fontSize(50).fillColor('#555555');
          } else {
            activeDoc.font('Helvetica-Bold').fontSize(54).fillColor('#000000');
          }
          activeDoc.text(val.toString(), cellX, cellY + 30, { width: cellSize, align: 'center' });
        }
      }
    }
  }

  // Draw Page 1 Puzzle Grid
  drawBoard(puzzleGrid, false);

  // Page 2: Buffer Page
  builder.addBufferPage();

  // Page 3: Answer Key
  builder.addAnswerKeyPage(`Sudoku (${capitalizedDifficulty})`);
  drawBoard(solutionGrid, true);

  return builder.build();
}
