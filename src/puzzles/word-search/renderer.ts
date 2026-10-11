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
  doc.fontSize(24).font('Helvetica-Bold').fillColor('#000000').text('Words to Find:', PAGE_MARGIN, checklistY);

  const colWidth = (PAGE_WIDTH - PAGE_MARGIN * 2) / 3;
  const itemsPerCol = Math.ceil(words.length / 3);
  doc.font('Helvetica').fontSize(22).fillColor('#222222');

  words.forEach((word, index) => {
    const col = Math.floor(index / itemsPerCol);
    const row = index % itemsPerCol;
    const x = PAGE_MARGIN + col * colWidth;
    const y = checklistY + 40 + row * 38;
    doc.text(`[  ]  ${word}`, x, y);
  });

  // Page 2: Spoiler Blocker
  builder.addBufferPage();

  // Page 3: Answer Key
  builder.addAnswerKeyPage(`Word Search (${theme})`);

  // Draw solution grid
  const keyDoc = builder.getDoc();
  keyDoc.rect(startX - 2, startY - 2, gridWidth + 4, gridWidth + 4).lineWidth(3).strokeColor('#000000').stroke();

  // Collect solution coordinates
  const solutionCells = new Set<string>();
  solution.forEach((s) => {
    s.cells.forEach(([r, c]) => solutionCells.add(`${r},${c}`));
  });

  // Draw cells and letters
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const cellX = startX + c * cellSize;
      const cellY = startY + r * cellSize;
      const isSolved = solutionCells.has(`${r},${c}`);

      keyDoc.rect(cellX, cellY, cellSize, cellSize).lineWidth(0.5).strokeColor('#D0D0D0').stroke();

      if (isSolved) {
        keyDoc.font('Helvetica-Bold').fontSize(26).fillColor('#000000');
        keyDoc.text(grid[r][c], cellX, cellY + 14, { width: cellSize, align: 'center' });
      } else {
        keyDoc.font('Helvetica').fontSize(22).fillColor('#888888');
        keyDoc.text(grid[r][c], cellX, cellY + 16, { width: cellSize, align: 'center' });
      }
    }
  }

  // Draw rounded pill capsules circling each placed word
  const pillRadius = cellSize * 0.44;
  solution.forEach((s) => {
    if (!s.cells || s.cells.length === 0) return;
    const first = s.cells[0];
    const last = s.cells[s.cells.length - 1];

    const p1 = {
      x: startX + (first[1] + 0.5) * cellSize,
      y: startY + (first[0] + 0.5) * cellSize,
    };
    const p2 = {
      x: startX + (last[1] + 0.5) * cellSize,
      y: startY + (last[0] + 0.5) * cellSize,
    };

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

    keyDoc.save();
    keyDoc.translate(p1.x, p1.y);
    keyDoc.rotate(angleDeg);
    keyDoc
      .roundedRect(-pillRadius, -pillRadius, length + 2 * pillRadius, 2 * pillRadius, pillRadius)
      .lineWidth(2.5)
      .strokeColor('#000000')
      .stroke();
    keyDoc.restore();
  });

  // Draw Solutions list below the grid on Page 3
  keyDoc.fontSize(24).font('Helvetica-Bold').fillColor('#000000').text('Solutions:', PAGE_MARGIN, checklistY);
  keyDoc.font('Helvetica').fontSize(22).fillColor('#222222');
  words.forEach((word, index) => {
    const col = Math.floor(index / itemsPerCol);
    const row = index % itemsPerCol;
    const x = PAGE_MARGIN + col * colWidth;
    const y = checklistY + 40 + row * 38;
    keyDoc.text(`[X]  ${word}`, x, y);
  });

  return builder.build();
}
