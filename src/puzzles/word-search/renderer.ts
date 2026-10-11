import { PdfBuilder, PAGE_MARGIN, PAGE_WIDTH } from '../../core/pdf-builder.js';
import { WordSearchData } from './generator.js';
import { GeneratedPuzzle } from '../../core/types.js';

export function renderWordSearchPdf(puzzle: GeneratedPuzzle<WordSearchData>): Promise<Buffer> {
  const { theme, grid, words, solution } = puzzle.puzzleData;
  const dateStr = puzzle.filename.split('_')[1];
  const builder = new PdfBuilder('Word Search', `Theme: ${theme}`, dateStr);
  const doc = builder.getDoc();

  // Draw Page 1 Grid
  const cellSize = 54;
  const gridWidth = cellSize * 15;
  const startX = (PAGE_WIDTH - gridWidth) / 2;
  const startY = PAGE_MARGIN + 120;

  // Draw outer grid border
  doc.rect(startX - 2, startY - 2, gridWidth + 4, gridWidth + 4).lineWidth(3).strokeColor('#000000').stroke();

  // Draw cells and letters
  doc.font('Helvetica-Bold').fontSize(26).fillColor('#000000');
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const cellX = startX + c * cellSize;
      const cellY = startY + r * cellSize;
      doc.rect(cellX, cellY, cellSize, cellSize).lineWidth(0.75).strokeColor('#888888').stroke();
      doc.text(grid[r][c], cellX, cellY + 14, { width: cellSize, align: 'center' });
    }
  }

  // Draw Word Checklist (3 columns)
  const checklistY = startY + gridWidth + 40;
  doc.fontSize(22).font('Helvetica-Bold').fillColor('#000000').text('Words to Find:', PAGE_MARGIN, checklistY);

  const colWidth = (PAGE_WIDTH - PAGE_MARGIN * 2) / 3;
  const itemsPerCol = Math.ceil(words.length / 3);
  doc.font('Helvetica').fontSize(18).fillColor('#222222');

  words.forEach((word, index) => {
    const col = Math.floor(index / itemsPerCol);
    const row = index % itemsPerCol;
    const x = PAGE_MARGIN + col * colWidth;
    const y = checklistY + 40 + row * 32;
    doc.text(`[  ]  ${word}`, x, y);
  });

  // Page 2: Spoiler Blocker
  builder.addBufferPage();

  // Page 3: Answer Key
  builder.addAnswerKeyPage(`Word Search (${theme})`);

  // Draw solution grid with highlighted words
  const keyDoc = builder.getDoc();
  keyDoc.rect(startX - 2, startY - 2, gridWidth + 4, gridWidth + 4).lineWidth(3).strokeColor('#000000').stroke();

  // Collect solution coordinates
  const solutionCells = new Set<string>();
  solution.forEach((s) => {
    s.cells.forEach(([r, c]) => solutionCells.add(`${r},${c}`));
  });

  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const cellX = startX + c * cellSize;
      const cellY = startY + r * cellSize;
      const isSolved = solutionCells.has(`${r},${c}`);

      if (isSolved) {
        keyDoc.rect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4).fillColor('#E0E0E0').fill();
        keyDoc.rect(cellX, cellY, cellSize, cellSize).lineWidth(1.5).strokeColor('#000000').stroke();
        keyDoc.font('Helvetica-Bold').fontSize(26).fillColor('#000000');
      } else {
        keyDoc.rect(cellX, cellY, cellSize, cellSize).lineWidth(0.5).strokeColor('#CCCCCC').stroke();
        keyDoc.font('Helvetica').fontSize(22).fillColor('#888888');
      }

      keyDoc.text(grid[r][c], cellX, cellY + (isSolved ? 14 : 16), { width: cellSize, align: 'center' });
    }
  }

  return builder.build();
}
