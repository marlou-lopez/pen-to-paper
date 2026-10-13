import { PdfBuilder, PAGE_MARGIN, PAGE_WIDTH } from '../../core/pdf-builder.js';
import { GeneratedPuzzle } from '../../core/types.js';
import { KenKenCage, KenKenData } from './types.js';

function formatOpBadge(cage: KenKenCage): string {
  if (cage.op === 'none') return `${cage.target}`;
  // Note: U+2212 (minus) is not in PDFKit's built-in Helvetica (WinAnsi) encoding and
  // renders as a stray quote mark, so use an en dash (U+2013) which is supported.
  const opSymbol =
    cage.op === '+' ? '+' : cage.op === '-' ? '–' : cage.op === '*' ? '×' : '÷';
  return `${cage.target}${opSymbol}`;
}

export function getKenKenLayout(size: number) {
  const targetBoardSize = 960;
  const cellSize = Math.floor(targetBoardSize / size);
  const boardSize = cellSize * size;
  const startX = Math.floor((PAGE_WIDTH - boardSize) / 2);
  const startY = 240;
  const badgeFontSize = size <= 4 ? 30 : size <= 6 ? 24 : 18;
  const digitFontSize = size <= 4 ? 70 : size <= 6 ? 56 : 42;
  const rulesY = startY + boardSize + 40;

  return {
    targetBoardSize,
    cellSize,
    boardSize,
    startX,
    startY,
    badgeFontSize,
    digitFontSize,
    rulesY,
  };
}

export function renderKenKenPdf(
  puzzle: GeneratedPuzzle<KenKenData> | KenKenData
): Promise<Buffer> {
  const data: KenKenData = 'puzzleData' in puzzle ? puzzle.puzzleData : puzzle;
  const size = data.size;
  const dateStr = data.date;
  const difficulty = data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1);

  const builder = new PdfBuilder('KenKen', `${size}x${size} • ${difficulty}`, dateStr);
  const doc = builder.getDoc();

  // Grid sizing calculations
  const {
    cellSize,
    boardSize,
    startX,
    startY,
    badgeFontSize,
    digitFontSize,
    rulesY,
  } = getKenKenLayout(size);

  // Build cell to cage mapping
  const cellToCageId = new Map<string, number>();
  const cageAnchorCells = new Map<number, { row: number; col: number }>();

  for (const cage of data.cages) {
    // Find top-left-most cell for badge placement
    let anchor = cage.cells[0];
    for (const cell of cage.cells) {
      cellToCageId.set(`${cell.row},${cell.col}`, cage.id);
      if (cell.row < anchor.row || (cell.row === anchor.row && cell.col < anchor.col)) {
        anchor = cell;
      }
    }
    cageAnchorCells.set(cage.id, anchor);
  }

  function drawGrid(isSolution = false) {
    const activeDoc = isSolution ? builder.getDoc() : doc;

    // Rules prompt on Page 1
    if (!isSolution) {
      activeDoc
        .font('Helvetica')
        .fontSize(20)
        .fillColor('#444444')
        .text(
          `Fill with digits 1-${size} without repeats in rows/cols. Bold cages must compute to target number.`,
          PAGE_MARGIN,
          rulesY,
          { width: PAGE_WIDTH - PAGE_MARGIN * 2, align: 'center' }
        );
    }

    // Draw inner grid lines (faint)
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;
        activeDoc
          .rect(x, y, cellSize, cellSize)
          .lineWidth(0.5)
          .strokeColor('#D1D5DB')
          .stroke();
      }
    }

    // Draw bold cage borders
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const currentCage = cellToCageId.get(`${r},${c}`);
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;

        // Top border
        const topCage = r > 0 ? cellToCageId.get(`${r - 1},${c}`) : undefined;
        if (topCage !== currentCage) {
          activeDoc
            .moveTo(x, y)
            .lineTo(x + cellSize, y)
            .lineWidth(3)
            .strokeColor('#000000')
            .stroke();
        }

        // Bottom border
        const bottomCage = r < size - 1 ? cellToCageId.get(`${r + 1},${c}`) : undefined;
        if (bottomCage !== currentCage) {
          activeDoc
            .moveTo(x, y + cellSize)
            .lineTo(x + cellSize, y + cellSize)
            .lineWidth(3)
            .strokeColor('#000000')
            .stroke();
        }

        // Left border
        const leftCage = c > 0 ? cellToCageId.get(`${r},${c - 1}`) : undefined;
        if (leftCage !== currentCage) {
          activeDoc
            .moveTo(x, y)
            .lineTo(x, y + cellSize)
            .lineWidth(3)
            .strokeColor('#000000')
            .stroke();
        }

        // Right border
        const rightCage = c < size - 1 ? cellToCageId.get(`${r},${c + 1}`) : undefined;
        if (rightCage !== currentCage) {
          activeDoc
            .moveTo(x + cellSize, y)
            .lineTo(x + cellSize, y + cellSize)
            .lineWidth(3)
            .strokeColor('#000000')
            .stroke();
        }
      }
    }

    // Outer frame (bold)
    activeDoc
      .rect(startX, startY, boardSize, boardSize)
      .lineWidth(3)
      .strokeColor('#000000')
      .stroke();

    // Draw cage clue badges (scaled to cell size so they stay legible on e-ink)
    const badgePadX = Math.round(cellSize * 0.06);
    const badgePadY = Math.round(cellSize * 0.05);
    for (const cage of data.cages) {
      const anchor = cageAnchorCells.get(cage.id);
      if (!anchor) continue;
      const x = startX + anchor.col * cellSize + badgePadX;
      const y = startY + anchor.row * cellSize + badgePadY;
      activeDoc
        .font('Helvetica-Bold')
        .fontSize(badgeFontSize)
        .fillColor(isSolution ? '#555555' : '#000000')
        .text(formatOpBadge(cage), x, y, { lineBreak: false });
    }

    // If solution page, draw numbers centered
    if (isSolution) {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const val = data.grid[r][c];
          const x = startX + c * cellSize;
          const y = startY + r * cellSize + Math.floor(cellSize * 0.22);
          activeDoc
            .font('Helvetica-Bold')
            .fontSize(digitFontSize)
            .fillColor('#000000')
            .text(`${val}`, x, y, { width: cellSize, align: 'center' });
        }
      }
    }
  }

  // Page 1: Puzzle
  drawGrid(false);

  // Page 2: Synchronized Spoiler Blocker
  builder.addBufferPage();

  // Page 3: Answer Key
  builder.addAnswerKeyPage(`KenKen (${size}x${size})`);
  drawGrid(true);

  return builder.build();
}
