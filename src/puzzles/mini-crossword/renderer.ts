import { PdfBuilder, PAGE_WIDTH } from '../../core/pdf-builder.js';
import { GeneratedPuzzle } from '../../core/types.js';
import { CrosswordClue, MiniCrosswordData } from './types.js';

export const MINI_CROSSWORD_LAYOUT = {
  cellSize: 180,
  boardSize: 180 * 5, // 900
  startX: Math.floor((PAGE_WIDTH - 900) / 2), // 252
  startY: 240,
  cluesY: 1180,
  acrossX: 140,
  downX: 744,
  colWidth: 520,
  clueNumberFontSize: 28,
  letterFontSize: 64,
  clueHeaderFontSize: 24,
  cluePrefixFontSize: 22,
  clueFontSize: 20,
} as const;

function getClueNumbersMap(acrossClues: CrosswordClue[], downClues: CrosswordClue[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const clue of acrossClues) {
    map.set(`${clue.startRow},${clue.startCol}`, clue.number);
  }
  for (const clue of downClues) {
    if (!map.has(`${clue.startRow},${clue.startCol}`)) {
      map.set(`${clue.startRow},${clue.startCol}`, clue.number);
    }
  }
  return map;
}

function drawCrosswordGrid(
  doc: PDFKit.PDFDocument,
  grid: string[][],
  clueNumbers: Map<string, number>,
  showLetters = false
): void {
  const cellSize = MINI_CROSSWORD_LAYOUT.cellSize;
  const boardSize = MINI_CROSSWORD_LAYOUT.boardSize;
  const startX = MINI_CROSSWORD_LAYOUT.startX;
  const startY = MINI_CROSSWORD_LAYOUT.startY;

  // Outer border: 3pt black stroke
  doc
    .rect(startX - 2, startY - 2, boardSize + 4, boardSize + 4)
    .lineWidth(3)
    .strokeColor('#000000')
    .stroke();

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cellX = startX + c * cellSize;
      const cellY = startY + r * cellSize;

      if (grid[r][c] === '#') {
        doc.rect(cellX, cellY, cellSize, cellSize).fillColor('#000000').fill();
        continue;
      }

      // Cell square: 1pt line stroke (#555555)
      doc
        .rect(cellX, cellY, cellSize, cellSize)
        .lineWidth(1)
        .strokeColor('#555555')
        .stroke();

      // Cell clue number in top-left corner
      const clueNumber = clueNumbers.get(`${r},${c}`);
      if (clueNumber !== undefined) {
        doc
          .font('Helvetica')
          .fontSize(MINI_CROSSWORD_LAYOUT.clueNumberFontSize)
          .fillColor('#222222')
          .text(clueNumber.toString(), cellX + 8, cellY + 8, { lineBreak: false });
      }

      // Solved bold capital letter centered in cell
      if (showLetters) {
        const char = grid[r][c]?.toUpperCase() ?? '';
        doc
          .font('Helvetica-Bold')
          .fontSize(MINI_CROSSWORD_LAYOUT.letterFontSize)
          .fillColor('#000000')
          .text(char, cellX, cellY + 45, { width: cellSize, align: 'center', lineBreak: false });
      }
    }
  }
}

function renderClueList(
  doc: PDFKit.PDFDocument,
  clues: CrosswordClue[],
  startX: number,
  startY: number,
  colWidth: number,
  showSolution = false
): void {
  let currentY = startY;

  for (const clue of clues) {
    const numPrefix = `${clue.number}. `;

    doc.font('Helvetica-Bold').fontSize(MINI_CROSSWORD_LAYOUT.cluePrefixFontSize);
    const numWidth = doc.widthOfString(numPrefix);
    const textWidth = colWidth - numWidth;

    doc
      .font('Helvetica-Bold')
      .fontSize(MINI_CROSSWORD_LAYOUT.cluePrefixFontSize)
      .fillColor('#000000')
      .text(numPrefix, startX, currentY, { lineBreak: false });

    if (showSolution) {
      doc
        .font('Helvetica')
        .fontSize(MINI_CROSSWORD_LAYOUT.clueFontSize)
        .fillColor('#222222')
        .text(`${clue.clue} — `, startX + numWidth, currentY, {
          width: textWidth,
          lineGap: 4,
          continued: true,
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(MINI_CROSSWORD_LAYOUT.clueFontSize)
        .fillColor('#000000')
        .text(clue.word.toUpperCase(), {
          width: textWidth,
          lineGap: 4,
          continued: false,
        });
    } else {
      doc
        .font('Helvetica')
        .fontSize(MINI_CROSSWORD_LAYOUT.clueFontSize)
        .fillColor('#222222')
        .text(clue.clue, startX + numWidth, currentY, {
          width: textWidth,
          lineGap: 4,
        });
    }

    currentY = Math.max(currentY + 44, doc.y + 18);
  }
}

export function renderMiniCrosswordPdf(
  puzzle: GeneratedPuzzle<MiniCrosswordData> | MiniCrosswordData
): Promise<Buffer> {
  const data: MiniCrosswordData = 'puzzleData' in puzzle ? puzzle.puzzleData : puzzle;
  const title = 'title' in puzzle && puzzle.title ? puzzle.title : data.title;
  const filename = 'filename' in puzzle && puzzle.filename ? puzzle.filename : `MiniCrossword_${data.date}.pdf`;

  const dateStr = data.date || (filename.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? new Date().toISOString().slice(0, 10));
  const subtitle = title.includes(' - ') ? title.split(' - ')[1] : 'Daily 5x5';

  const builder = new PdfBuilder('Mini Crossword', subtitle, dateStr);
  const doc = builder.getDoc();

  const cluesY = MINI_CROSSWORD_LAYOUT.cluesY;
  const colWidth = MINI_CROSSWORD_LAYOUT.colWidth;
  const col1X = MINI_CROSSWORD_LAYOUT.acrossX;
  const col2X = MINI_CROSSWORD_LAYOUT.downX;

  const clueNumbers = getClueNumbersMap(data.acrossClues, data.downClues);

  // -------------------------------------------------------------
  // Page 1: The Puzzle
  // -------------------------------------------------------------
  drawCrosswordGrid(doc, data.grid, clueNumbers, false);

  // Clue section headers
  doc
    .font('Helvetica-Bold')
    .fontSize(MINI_CROSSWORD_LAYOUT.clueHeaderFontSize)
    .fillColor('#000000')
    .text('ACROSS', col1X, cluesY);

  doc
    .font('Helvetica-Bold')
    .fontSize(MINI_CROSSWORD_LAYOUT.clueHeaderFontSize)
    .fillColor('#000000')
    .text('DOWN', col2X, cluesY);

  // Header underlines
  doc
    .strokeColor('#000000')
    .lineWidth(1.5)
    .moveTo(col1X, cluesY + 30)
    .lineTo(col1X + colWidth, cluesY + 30)
    .stroke();

  doc
    .strokeColor('#000000')
    .lineWidth(1.5)
    .moveTo(col2X, cluesY + 30)
    .lineTo(col2X + colWidth, cluesY + 30)
    .stroke();

  // Clue lists
  renderClueList(doc, data.acrossClues, col1X, cluesY + 45, colWidth, false);
  renderClueList(doc, data.downClues, col2X, cluesY + 45, colWidth, false);

  // -------------------------------------------------------------
  // Page 2: Spoiler Blocker
  // -------------------------------------------------------------
  builder.addBufferPage();

  // -------------------------------------------------------------
  // Page 3: Answer Key
  // -------------------------------------------------------------
  builder.addAnswerKeyPage('Mini Crossword');
  const keyDoc = builder.getDoc();

  // Draw solved grid
  drawCrosswordGrid(keyDoc, data.grid, clueNumbers, true);

  // Solution clue headers
  keyDoc
    .font('Helvetica-Bold')
    .fontSize(MINI_CROSSWORD_LAYOUT.clueHeaderFontSize)
    .fillColor('#000000')
    .text('ACROSS', col1X, cluesY);

  keyDoc
    .font('Helvetica-Bold')
    .fontSize(MINI_CROSSWORD_LAYOUT.clueHeaderFontSize)
    .fillColor('#000000')
    .text('DOWN', col2X, cluesY);

  // Header underlines
  keyDoc
    .strokeColor('#000000')
    .lineWidth(1.5)
    .moveTo(col1X, cluesY + 30)
    .lineTo(col1X + colWidth, cluesY + 30)
    .stroke();

  keyDoc
    .strokeColor('#000000')
    .lineWidth(1.5)
    .moveTo(col2X, cluesY + 30)
    .lineTo(col2X + colWidth, cluesY + 30)
    .stroke();

  // Clue lists with solutions
  renderClueList(keyDoc, data.acrossClues, col1X, cluesY + 45, colWidth, true);
  renderClueList(keyDoc, data.downClues, col2X, cluesY + 45, colWidth, true);

  return builder.build();
}
