import { PdfBuilder, PAGE_MARGIN, PAGE_WIDTH } from '../../core/pdf-builder.js';
import { GeneratedPuzzle } from '../../core/types.js';
import { KakuroData } from './types.js';

export function renderKakuroPdf(
  puzzle: GeneratedPuzzle<KakuroData> | KakuroData
): Promise<Buffer> {
  const data: KakuroData = 'puzzleData' in puzzle ? puzzle.puzzleData : puzzle;
  const size = data.size;
  const dateStr = data.date ?? new Date().toISOString().slice(0, 10);
  const difficulty =
    data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1);

  const builder = new PdfBuilder('Kakuro', `${size}x${size} • ${difficulty}`, dateStr);
  const doc = builder.getDoc();

  // Dynamic cell sizing: 6x6 -> 110 pt, 8x8 -> 90 pt, 10x10 -> 75 pt
  const cellSize =
    size === 6 ? 110 : size === 8 ? 90 : size === 10 ? 75 : Math.floor((PAGE_WIDTH - PAGE_MARGIN * 2) / size);
  const boardSize = cellSize * size;
  const startX = Math.floor((PAGE_WIDTH - boardSize) / 2);
  const startY = size === 6 ? 380 : size === 8 ? 350 : size === 10 ? 330 : 350;

  const clueFontSize = cellSize >= 100 ? 20 : cellSize >= 85 ? 18 : 16;
  const solutionFontSize = cellSize >= 100 ? 44 : cellSize >= 85 ? 40 : 36;

  function drawGrid(isSolution = false) {
    const activeDoc = isSolution ? builder.getDoc() : doc;

    // Rules prompt on Page 1
    if (!isSolution) {
      const rulesY = startY + boardSize + 70;
      activeDoc
        .font('Helvetica')
        .fontSize(22)
        .fillColor('#444444')
        .text(
          'Kakuro: Fill white cells with digits 1–9. Digits within each run cannot repeat and must sum to the clue.',
          PAGE_MARGIN,
          rulesY,
          {
            width: PAGE_WIDTH - PAGE_MARGIN * 2,
            align: 'center',
          }
        );
    }

    // Draw cells
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const cell = data.grid[r][c];
        const cellX = startX + c * cellSize;
        const cellY = startY + r * cellSize;

        if (cell.type === 'block') {
          activeDoc
            .rect(cellX, cellY, cellSize, cellSize)
            .fillColor('#000000')
            .fill();
        } else if (cell.type === 'clue') {
          // Dark charcoal background
          activeDoc
            .rect(cellX, cellY, cellSize, cellSize)
            .fillColor('#222222')
            .fill();

          // Diagonal divider stroke \ from top-left to bottom-right
          activeDoc
            .moveTo(cellX, cellY)
            .lineTo(cellX + cellSize, cellY + cellSize)
            .lineWidth(1)
            .strokeColor('#777777')
            .stroke();

          // Across sum in upper-right triangle
          if (cell.acrossSum !== undefined && cell.acrossSum !== null) {
            activeDoc
              .font('Helvetica-Bold')
              .fontSize(clueFontSize)
              .fillColor('#FFFFFF')
              .text(
                String(cell.acrossSum),
                cellX + Math.round(cellSize * 0.38),
                cellY + Math.round(cellSize * 0.08),
                {
                  width: Math.round(cellSize * 0.54),
                  align: 'right',
                  lineBreak: false,
                }
              );
          }

          // Down sum in lower-left triangle
          if (cell.downSum !== undefined && cell.downSum !== null) {
            activeDoc
              .font('Helvetica-Bold')
              .fontSize(clueFontSize)
              .fillColor('#FFFFFF')
              .text(
                String(cell.downSum),
                cellX + Math.round(cellSize * 0.08),
                cellY + Math.round(cellSize * 0.52),
                {
                  width: Math.round(cellSize * 0.54),
                  align: 'left',
                  lineBreak: false,
                }
              );
          }

          // Cell border
          activeDoc
            .rect(cellX, cellY, cellSize, cellSize)
            .lineWidth(1)
            .strokeColor('#000000')
            .stroke();
        } else {
          // White cell
          activeDoc
            .rect(cellX, cellY, cellSize, cellSize)
            .fillColor('#FFFFFF')
            .fill();

          activeDoc
            .rect(cellX, cellY, cellSize, cellSize)
            .lineWidth(1)
            .strokeColor('#000000')
            .stroke();

          if (isSolution && cell.solution !== undefined && cell.solution !== null) {
            const digitYOffset = Math.round((cellSize - solutionFontSize) / 2) - 2;
            activeDoc
              .font('Helvetica-Bold')
              .fontSize(solutionFontSize)
              .fillColor('#000000')
              .text(
                String(cell.solution),
                cellX,
                cellY + digitYOffset,
                {
                  width: cellSize,
                  align: 'center',
                  lineBreak: false,
                }
              );
          }
        }
      }
    }

    // Outer frame (bold)
    activeDoc
      .rect(startX, startY, boardSize, boardSize)
      .lineWidth(3)
      .strokeColor('#000000')
      .stroke();
  }

  // Page 1: Puzzle
  drawGrid(false);

  // Page 2: Synchronized Spoiler Blocker
  builder.addBufferPage();

  // Page 3: Answer Key
  builder.addAnswerKeyPage('Kakuro');
  drawGrid(true);

  return builder.build();
}
