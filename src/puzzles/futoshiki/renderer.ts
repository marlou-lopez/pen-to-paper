import { PdfBuilder, PAGE_MARGIN, PAGE_WIDTH } from '../../core/pdf-builder.js';
import { GeneratedPuzzle } from '../../core/types.js';
import { FutoshikiData, FutoshikiInequality } from './types.js';

export interface FutoshikiLayoutConfig {
  cellSize: number;
  gutter: number;
  numFontSize: number;
  chevronSpan: number;
}

export function getLayoutConfig(size: number): FutoshikiLayoutConfig {
  switch (size) {
    case 4:
      return { cellSize: 205, gutter: 45, numFontSize: 70, chevronSpan: 12 };
    case 6:
      return { cellSize: 135, gutter: 30, numFontSize: 48, chevronSpan: 8 };
    case 5:
    default:
      return { cellSize: 160, gutter: 40, numFontSize: 56, chevronSpan: 10 };
  }
}

export function getFutoshikiLayout(size: number) {
  const config = getLayoutConfig(size);
  const boardWidth = size * config.cellSize + (size - 1) * config.gutter;
  const boardHeight = boardWidth;
  const startX = Math.floor((PAGE_WIDTH - boardWidth) / 2);
  const startY = 240;
  const rulesY = 1240;

  return {
    ...config,
    boardWidth,
    boardHeight,
    startX,
    startY,
    rulesY,
  };
}

function drawChevron(
  doc: PDFKit.PDFDocument,
  ineq: FutoshikiInequality,
  startX: number,
  startY: number,
  cellSize: number,
  gutter: number,
  chevronSpan: number
): void {
  const isHorizontal = ineq.row1 === ineq.row2;
  const isVertical = ineq.col1 === ineq.col2;

  if (!isHorizontal && !isVertical) return;

  const spanMain = chevronSpan;
  const spanCross = Math.round(cellSize * 0.12);

  if (isHorizontal) {
    const row = ineq.row1;
    const leftCol = Math.min(ineq.col1, ineq.col2);
    const rightCol = Math.max(ineq.col1, ineq.col2);

    if (rightCol !== leftCol + 1) return;

    const leftIsSmaller = ineq.col1 < ineq.col2 ? ineq.relation === '<' : ineq.relation === '>';

    const gutterCenterX = startX + leftCol * (cellSize + gutter) + cellSize + gutter / 2;
    const gutterCenterY = startY + row * (cellSize + gutter) + cellSize / 2;

    doc.save();
    doc.lineWidth(3).lineCap('round').lineJoin('round').strokeColor('#000000');

    if (leftIsSmaller) {
      // Left is smaller: chevron points left (<)
      doc
        .moveTo(gutterCenterX + spanMain, gutterCenterY - spanCross)
        .lineTo(gutterCenterX - spanMain, gutterCenterY)
        .lineTo(gutterCenterX + spanMain, gutterCenterY + spanCross)
        .stroke();
    } else {
      // Left is larger: chevron points right (>)
      doc
        .moveTo(gutterCenterX - spanMain, gutterCenterY - spanCross)
        .lineTo(gutterCenterX + spanMain, gutterCenterY)
        .lineTo(gutterCenterX - spanMain, gutterCenterY + spanCross)
        .stroke();
    }
    doc.restore();
  } else {
    const col = ineq.col1;
    const topRow = Math.min(ineq.row1, ineq.row2);
    const bottomRow = Math.max(ineq.row1, ineq.row2);

    if (bottomRow !== topRow + 1) return;

    const topIsSmaller = ineq.row1 < ineq.row2 ? ineq.relation === '<' : ineq.relation === '>';

    const gutterCenterX = startX + col * (cellSize + gutter) + cellSize / 2;
    const gutterCenterY = startY + topRow * (cellSize + gutter) + cellSize + gutter / 2;

    doc.save();
    doc.lineWidth(3).lineCap('round').lineJoin('round').strokeColor('#000000');

    if (topIsSmaller) {
      // Top is smaller: chevron points up (^)
      doc
        .moveTo(gutterCenterX - spanCross, gutterCenterY + spanMain)
        .lineTo(gutterCenterX, gutterCenterY - spanMain)
        .lineTo(gutterCenterX + spanCross, gutterCenterY + spanMain)
        .stroke();
    } else {
      // Top is larger: chevron points down (v)
      doc
        .moveTo(gutterCenterX - spanCross, gutterCenterY - spanMain)
        .lineTo(gutterCenterX, gutterCenterY + spanMain)
        .lineTo(gutterCenterX + spanCross, gutterCenterY - spanMain)
        .stroke();
    }
    doc.restore();
  }
}

function drawGrid(
  activeDoc: PDFKit.PDFDocument,
  data: FutoshikiData,
  startX: number,
  startY: number,
  cellSize: number,
  gutter: number,
  numFontSize: number,
  chevronSpan: number,
  isSolution: boolean
): void {
  const size = data.size;

  // Draw cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cellX = startX + c * (cellSize + gutter);
      const cellY = startY + r * (cellSize + gutter);

      activeDoc
        .save()
        .rect(cellX, cellY, cellSize, cellSize)
        .lineWidth(2)
        .fillColor('#FFFFFF')
        .strokeColor('#000000')
        .fillAndStroke()
        .restore();

      const num = isSolution ? data.solution[r][c] : data.initialGrid[r][c];
      if (num > 0) {
        activeDoc.save();
        activeDoc.font('Helvetica-Bold').fontSize(numFontSize).fillColor('#000000');
        const textHeight = activeDoc.heightOfString(String(num));
        const textY = cellY + Math.round((cellSize - textHeight) / 2);
        activeDoc.text(String(num), cellX, textY, {
          width: cellSize,
          align: 'center',
          lineBreak: false,
        });
        activeDoc.restore();
      }
    }
  }

  // Draw inequality chevrons in gutters
  for (const ineq of data.inequalities) {
    drawChevron(activeDoc, ineq, startX, startY, cellSize, gutter, chevronSpan);
  }
}

export function renderFutoshikiPdf(
  puzzle: GeneratedPuzzle<FutoshikiData> | FutoshikiData
): Promise<Buffer> {
  const data: FutoshikiData = 'puzzleData' in puzzle ? puzzle.puzzleData : puzzle;
  const size = data.size;
  const dateStr = data.dateStr ?? new Date().toISOString().slice(0, 10);
  const difficulty = data.difficulty
    ? data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1)
    : 'Medium';

  const builder = new PdfBuilder('Futoshiki', `${size}x${size} • ${difficulty}`, dateStr);
  const doc = builder.getDoc();

  const layout = getFutoshikiLayout(size);
  const { cellSize, gutter, numFontSize, chevronSpan, startX, startY, rulesY } = layout;

  // Page 1: Puzzle
  drawGrid(doc, data, startX, startY, cellSize, gutter, numFontSize, chevronSpan, false);
  doc.save();
  doc
    .font('Helvetica')
    .fontSize(20)
    .fillColor('#444444')
    .text(
      `Futoshiki: Fill every row and column with digits 1–${size} without repeats. All inequality signs (<, >, ^, v) must be satisfied.`,
      PAGE_MARGIN,
      rulesY,
      {
        width: PAGE_WIDTH - PAGE_MARGIN * 2,
        align: 'center',
      }
    );
  doc.restore();

  // Page 2: Synchronized Spoiler Blocker
  builder.addBufferPage();

  // Page 3: Answer Key
  builder.addAnswerKeyPage('Futoshiki');
  const answerDoc = builder.getDoc();
  drawGrid(answerDoc, data, startX, startY, cellSize, gutter, numFontSize, chevronSpan, true);

  return builder.build();
}
