# reMarkable Daily Puzzle Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modular TypeScript puzzle generation engine that creates daily e-ink optimized 3-page PDFs (Word Search and Sudoku) and automatically uploads them to dedicated folders on the reMarkable Cloud via GitHub Actions and Android shortcuts.

**Architecture:** A uniform `PuzzleGenerator` interface decouples generation logic from rendering and delivery. Word Search uses `@blex41/word-search` with curated offline thematic word banks. Sudoku uses `sudoku-gen` with workflow-configurable or rotating difficulty. A reusable `PdfBuilder` renders high-contrast 1404x1872 pt 3-page documents (`pdfkit`). An `RmapiClient` handles sync to reMarkable Cloud, with local disk fallback.

**Tech Stack:** Node.js 20+, TypeScript, `pdfkit`, `@blex41/word-search`, `sudoku-gen`, `vitest`, `rmapi` CLI, GitHub Actions.

## Global Constraints

- Language: TypeScript (strict mode enabled, ES2022 target).
- Dimensions: reMarkable native 1404 x 1872 pt (3:4 aspect ratio) with >= 50pt safe margins.
- Page Structure: Exactly 3 pages per puzzle (Page 1: Puzzle, Page 2: Buffer/Spoiler Blocker, Page 3: Answer Key).
- Palette: High-contrast monochrome e-ink (#000000 text and outer borders, #666666 subtle grid lines, #FFFFFF background).
- Delivery Target Folders: `/Puzzles/Word Search/` and `/Puzzles/Sudoku/`.
- File Naming: Dated filenames `WordSearch_YYYY-MM-DD_<Theme>.pdf` and `Sudoku_<Difficulty>_YYYY-MM-DD.pdf`.

---

### Task 1: Project Scaffolding, Core Types & Registry

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `src/core/types.ts`
- Create: `src/core/registry.ts`
- Test: `tests/core/registry.test.ts`

**Interfaces:**
- Consumes: None (root configuration)
- Produces:
  - `PuzzleMetadata`: `{ id: string; displayName: string; targetFolder: string; }`
  - `GeneratedPuzzle<TData>`: `{ metadata: PuzzleMetadata; title: string; filename: string; puzzleData: TData; }`
  - `PuzzleGenerator<TOptions, TData>`: `generate(options?: TOptions): Promise<GeneratedPuzzle<TData>>; renderPdf(puzzle: GeneratedPuzzle<TData>): Promise<Buffer>;`
  - `PuzzleRegistry`: `register(generator: PuzzleGenerator): void; get(id: string): PuzzleGenerator | undefined; getAll(): PuzzleGenerator[];`

- [ ] **Step 1: Write the failing registry test**

```typescript
// tests/core/registry.test.ts
import { describe, it, expect } from 'vitest';
import { PuzzleRegistry } from '../../src/core/registry';
import { PuzzleGenerator, GeneratedPuzzle } from '../../src/core/types';

describe('PuzzleRegistry', () => {
  it('registers and retrieves puzzle generators', () => {
    const registry = new PuzzleRegistry();
    const mockGenerator: PuzzleGenerator = {
      metadata: {
        id: 'mock-puzzle',
        displayName: 'Mock Puzzle',
        targetFolder: '/Puzzles/Mock',
      },
      generate: async () => ({
        metadata: { id: 'mock-puzzle', displayName: 'Mock Puzzle', targetFolder: '/Puzzles/Mock' },
        title: 'Mock Title',
        filename: 'Mock.pdf',
        puzzleData: {},
      }),
      renderPdf: async () => Buffer.from('mock-pdf'),
    };

    registry.register(mockGenerator);
    expect(registry.get('mock-puzzle')).toBe(mockGenerator);
    expect(registry.getAll()).toHaveLength(1);
    expect(registry.get('non-existent')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/registry.test.ts`  
Expected: FAIL (files and dependencies not installed/defined)

- [ ] **Step 3: Create configuration and implementation files**

`package.json`:
```json
{
  "name": "pen-to-paper",
  "version": "1.0.0",
  "description": "Daily e-ink puzzle generator for reMarkable tablet",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "generate": "tsx src/cli.ts"
  },
  "dependencies": {
    "@blex41/word-search": "^1.4.1",
    "pdfkit": "^0.15.0",
    "sudoku-gen": "^1.0.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/pdfkit": "^0.13.4",
    "tsx": "^4.7.1",
    "typescript": "^5.3.3",
    "vitest": "^1.3.1"
  }
}
```

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

`src/core/types.ts`:
```typescript
export interface PuzzleMetadata {
  id: string;
  displayName: string;
  targetFolder: string;
}

export interface GeneratedPuzzle<TData = unknown> {
  metadata: PuzzleMetadata;
  title: string;
  filename: string;
  puzzleData: TData;
}

export interface PuzzleGenerator<TOptions = unknown, TData = unknown> {
  readonly metadata: PuzzleMetadata;
  generate(options?: TOptions): Promise<GeneratedPuzzle<TData>>;
  renderPdf(puzzle: GeneratedPuzzle<TData>): Promise<Buffer>;
}
```

`src/core/registry.ts`:
```typescript
import { PuzzleGenerator } from './types.js';

export class PuzzleRegistry {
  private generators = new Map<string, PuzzleGenerator>();

  register(generator: PuzzleGenerator): void {
    this.generators.set(generator.metadata.id, generator);
  }

  get(id: string): PuzzleGenerator | undefined {
    return this.generators.get(id);
  }

  getAll(): PuzzleGenerator[] {
    return Array.from(this.generators.values());
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm install && npx vitest run tests/core/registry.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts src/core/ tests/core/
git commit -m "feat: scaffold project with core types and puzzle registry"
```

---

### Task 2: PDF Builder (E-ink 3-Page Layout Engine)

**Files:**
- Create: `src/core/pdf-builder.ts`
- Test: `tests/core/pdf-builder.test.ts`

**Interfaces:**
- Consumes: `pdfkit`
- Produces:
  - `class PdfBuilder`:
    - `constructor(title: string, subtitle: string, dateStr: string)`
    - `getPage1Doc(): PDFKit.PDFDocument`
    - `renderBufferPage(): void` (Page 2)
    - `renderAnswerKeyHeader(): void` (Page 3)
    - `build(): Promise<Buffer>`
  - Layout constants: `PAGE_WIDTH = 1404`, `PAGE_HEIGHT = 1872`, `MARGIN = 60`

- [ ] **Step 1: Write the failing PDF builder test**

```typescript
// tests/core/pdf-builder.test.ts
import { describe, it, expect } from 'vitest';
import { PdfBuilder, PAGE_WIDTH, PAGE_HEIGHT } from '../../src/core/pdf-builder';

describe('PdfBuilder', () => {
  it('generates a 3-page valid PDF buffer', async () => {
    const builder = new PdfBuilder('Test Puzzle', 'Theme: Sample', '2026-10-11');
    const doc = builder.getDoc();

    // Page 1 content
    doc.fontSize(24).text('Custom Puzzle Grid Here', 100, 200);

    // Page 2: Buffer page
    builder.addBufferPage();

    // Page 3: Answer key
    builder.addAnswerKeyPage('Test Puzzle Solution');
    doc.fontSize(24).text('Custom Answer Key Grid Here', 100, 200);

    const buffer = await builder.build();

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // Valid PDF starts with %PDF-
    expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
  });

  it('exposes correct dimensions for reMarkable', () => {
    expect(PAGE_WIDTH).toBe(1404);
    expect(PAGE_HEIGHT).toBe(1872);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/pdf-builder.test.ts`  
Expected: FAIL (`PdfBuilder` does not exist)

- [ ] **Step 3: Implement `PdfBuilder`**

`src/core/pdf-builder.ts`:
```typescript
import PDFDocument from 'pdfkit';

export const PAGE_WIDTH = 1404;
export const PAGE_HEIGHT = 1872;
export const PAGE_MARGIN = 60;

export class PdfBuilder {
  private doc: PDFKit.PDFDocument;
  private chunks: Buffer[] = [];

  constructor(
    private title: string,
    private subtitle: string,
    private dateStr: string
  ) {
    this.doc = new PDFDocument({
      size: [PAGE_WIDTH, PAGE_HEIGHT],
      margin: PAGE_MARGIN,
      autoFirstPage: true,
      info: {
        Title: title,
        Author: 'Pen to Paper Generator',
      },
    });

    this.doc.on('data', (chunk) => this.chunks.push(chunk));
    this.renderHeader(this.title, this.subtitle, this.dateStr);
  }

  getDoc(): PDFKit.PDFDocument {
    return this.doc;
  }

  private renderHeader(title: string, subtitle: string, dateStr: string): void {
    this.doc
      .fillColor('#000000')
      .fontSize(42)
      .font('Helvetica-Bold')
      .text(title, PAGE_MARGIN, PAGE_MARGIN, { align: 'center' });

    this.doc
      .fontSize(24)
      .font('Helvetica')
      .fillColor('#444444')
      .text(`${subtitle}  •  ${dateStr}`, PAGE_MARGIN, PAGE_MARGIN + 55, { align: 'center' });

    // Header divider line
    this.doc
      .strokeColor('#000000')
      .lineWidth(2)
      .moveTo(PAGE_MARGIN, PAGE_MARGIN + 95)
      .lineTo(PAGE_WIDTH - PAGE_MARGIN, PAGE_MARGIN + 95)
      .stroke();
  }

  addBufferPage(): void {
    this.doc.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: PAGE_MARGIN });

    const centerY = PAGE_HEIGHT / 2 - 40;
    this.doc
      .fillColor('#000000')
      .fontSize(36)
      .font('Helvetica-Bold')
      .text('Answer Key on Next Page', PAGE_MARGIN, centerY, { align: 'center' });

    this.doc
      .fontSize(22)
      .font('Helvetica')
      .fillColor('#666666')
      .text('[ Swipe to reveal solution ]', PAGE_MARGIN, centerY + 55, { align: 'center' });
  }

  addAnswerKeyPage(solutionTitle: string): void {
    this.doc.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: PAGE_MARGIN });

    this.renderHeader(`Answer Key: ${solutionTitle}`, this.subtitle, this.dateStr);
  }

  build(): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      this.doc.on('end', () => resolve(Buffer.concat(this.chunks)));
      this.doc.on('error', reject);
      this.doc.end();
    });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/pdf-builder.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/pdf-builder.ts tests/core/pdf-builder.test.ts
git commit -m "feat: implement e-ink 3-page PdfBuilder"
```

---

### Task 3: Word Search Generator & Curated Themes

**Files:**
- Create: `src/puzzles/word-search/word-bank.ts`
- Create: `src/puzzles/word-search/renderer.ts`
- Create: `src/puzzles/word-search/generator.ts`
- Create: `src/puzzles/word-search/index.ts`
- Test: `tests/puzzles/word-search.test.ts`

**Interfaces:**
- Consumes: `@blex41/word-search`, `PdfBuilder`, `PuzzleGenerator`
- Produces:
  - `WordSearchData`: `{ theme: string; grid: string[][]; words: string[]; solution: Array<{ word: string; start: [number, number]; end: [number, number]; }>; }`
  - `WordSearchGenerator`: implements `PuzzleGenerator<WordSearchOptions, WordSearchData>`

- [ ] **Step 1: Write the failing Word Search generator test**

```typescript
// tests/puzzles/word-search.test.ts
import { describe, it, expect } from 'vitest';
import { WordSearchGenerator } from '../../src/puzzles/word-search/generator';

describe('WordSearchGenerator', () => {
  it('generates a 15x15 grid with placed words and valid solution coordinates', async () => {
    const generator = new WordSearchGenerator();
    const result = await generator.generate({ date: '2026-10-11' });

    expect(result.metadata.id).toBe('word-search');
    expect(result.metadata.targetFolder).toBe('/Puzzles/Word Search');
    expect(result.puzzleData.grid).toHaveLength(15);
    expect(result.puzzleData.grid[0]).toHaveLength(15);
    expect(result.puzzleData.words.length).toBeGreaterThanOrEqual(10);
    expect(result.filename).toMatch(/^WordSearch_2026-10-11_.+\.pdf$/);

    // Verify PDF rendering
    const pdfBuffer = await generator.renderPdf(result);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.toString('utf8', 0, 5)).toBe('%PDF-');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzles/word-search.test.ts`  
Expected: FAIL (`WordSearchGenerator` not found)

- [ ] **Step 3: Implement Word Bank, Generator, and Renderer**

`src/puzzles/word-search/word-bank.ts`:
```typescript
export interface WordTheme {
  name: string;
  words: string[];
}

export const WORD_THEMES: WordTheme[] = [
  {
    name: 'Astronomy',
    words: ['GALAXY', 'NEBULA', 'PLANET', 'COMET', 'ASTEROID', 'ECLIPSE', 'PULSAR', 'QUASAR', 'ORBIT', 'SUPERNOVA', 'TELESCOPE', 'CONSTELLATION', 'SOLAR', 'ZENITH', 'AURORA'],
  },
  {
    name: 'Ocean Life',
    words: ['DOLPHIN', 'OCTOPUS', 'JELLYFISH', 'STARFISH', 'CORAL', 'WHALE', 'SEAHORSE', 'ANEMONE', 'BARNACLE', 'LOBSTER', 'MANTA', 'PLANKTON', 'STINGRAY', 'WALRUS', 'TURTLE'],
  },
  {
    name: 'Ancient History',
    words: ['PYRAMID', 'PHARAOH', 'EMPIRE', 'GLADIATOR', 'PAPYRUS', 'ACROPOLIS', 'COLOSSEUM', 'CHARIOT', 'TEMPLE', 'DYNASTY', 'SARCOPHAGUS', 'SPHINX', 'CENTURION', 'HIEROGLYPH'],
  },
  {
    name: 'Inventions',
    words: ['COMPASS', 'PRINTING', 'TELEGRAPH', 'STEAM', 'ELECTRIC', 'AIRPLANE', 'BICYCLE', 'BATTERY', 'MICROSCOPE', 'CAMERA', 'TRANSISTOR', 'SUBMARINE', 'SATELLITE', 'RADAR'],
  },
  {
    name: 'World Geography',
    words: ['ARCHIPELAGO', 'PENINSULA', 'PLATEAU', 'GLACIER', 'CANYON', 'VOLCANO', 'ESTUARY', 'TUNDRA', 'SAVANNA', 'FJORD', 'ATOLL', 'CATARACT', 'STRAIT', 'OASIS', 'DELTA'],
  },
];
```

`src/puzzles/word-search/renderer.ts`:
```typescript
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
```

`src/puzzles/word-search/generator.ts`:
```typescript
// @ts-expect-error blex41 word search library has no bundled types
import WordSearch from '@blex41/word-search';
import { GeneratedPuzzle, PuzzleGenerator, PuzzleMetadata } from '../../core/types.js';
import { WORD_THEMES, WordTheme } from './word-bank.js';
import { renderWordSearchPdf } from './renderer.js';

export interface WordSearchOptions {
  date?: string;
  theme?: string;
}

export interface PlacedWordSolution {
  word: string;
  cells: [number, number][];
}

export interface WordSearchData {
  theme: string;
  grid: string[][];
  words: string[];
  solution: PlacedWordSolution[];
}

export class WordSearchGenerator implements PuzzleGenerator<WordSearchOptions, WordSearchData> {
  readonly metadata: PuzzleMetadata = {
    id: 'word-search',
    displayName: 'Word Search',
    targetFolder: '/Puzzles/Word Search',
  };

  async generate(options?: WordSearchOptions): Promise<GeneratedPuzzle<WordSearchData>> {
    const dateStr = options?.date ?? new Date().toISOString().slice(0, 10);
    const themeObj: WordTheme = options?.theme
      ? WORD_THEMES.find((t) => t.name.toLowerCase() === options.theme?.toLowerCase()) || WORD_THEMES[0]
      : WORD_THEMES[Math.floor(Math.random() * WORD_THEMES.length)];

    let ws: any;
    let attempts = 0;
    while (attempts < 5) {
      ws = new WordSearch({
        cols: 15,
        rows: 15,
        dictionary: themeObj.words,
        maxWords: 15,
        backwardsProbability: 0.3,
        upperCase: true,
      });
      if (ws.words && ws.words.length >= 10) break;
      attempts++;
    }

    const grid: string[][] = ws.grid;
    const placedWords: string[] = ws.words.map((w: any) => w.clean);

    // Map solution coordinate paths
    const solution: PlacedWordSolution[] = ws.words.map((w: any) => {
      const cells: [number, number][] = [];
      const dr = Math.sign(w.endY - w.startY);
      const dc = Math.sign(w.endX - w.startX);
      let r = w.startY;
      let c = w.startX;
      const len = w.clean.length;
      for (let i = 0; i < len; i++) {
        cells.push([r, c]);
        r += dr;
        c += dc;
      }
      return { word: w.clean, cells };
    });

    const sanitizedTheme = themeObj.name.replace(/\s+/g, '');
    const filename = `WordSearch_${dateStr}_${sanitizedTheme}.pdf`;

    return {
      metadata: this.metadata,
      title: `Word Search - ${themeObj.name}`,
      filename,
      puzzleData: {
        theme: themeObj.name,
        grid,
        words: placedWords,
        solution,
      },
    };
  }

  renderPdf(puzzle: GeneratedPuzzle<WordSearchData>): Promise<Buffer> {
    return renderWordSearchPdf(puzzle);
  }
}
```

`src/puzzles/word-search/index.ts`:
```typescript
export * from './generator.js';
export * from './renderer.js';
export * from './word-bank.js';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/puzzles/word-search.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/word-search/ tests/puzzles/word-search.test.ts
git commit -m "feat: implement 15x15 Word Search generator and renderer"
```

---

### Task 4: Sudoku Generator & Difficulty Rotation

**Files:**
- Create: `src/puzzles/sudoku/renderer.ts`
- Create: `src/puzzles/sudoku/generator.ts`
- Create: `src/puzzles/sudoku/index.ts`
- Test: `tests/puzzles/sudoku.test.ts`

**Interfaces:**
- Consumes: `sudoku-gen`, `PdfBuilder`, `PuzzleGenerator`
- Produces:
  - `SudokuDifficulty`: `'easy' | 'medium' | 'hard' | 'expert'`
  - `SudokuData`: `{ difficulty: SudokuDifficulty; puzzleGrid: (number | null)[][]; solutionGrid: number[][]; }`
  - `SudokuGenerator`: implements `PuzzleGenerator<SudokuOptions, SudokuData>`

- [ ] **Step 1: Write the failing Sudoku generator test**

```typescript
// tests/puzzles/sudoku.test.ts
import { describe, it, expect } from 'vitest';
import { SudokuGenerator, resolveSudokuDifficulty } from '../../src/puzzles/sudoku/generator';

describe('SudokuGenerator', () => {
  it('resolves difficulty rotating by day-of-week when set to random', () => {
    // 2026-10-12 is Monday -> easy
    expect(resolveSudokuDifficulty('random', new Date('2026-10-12'))).toBe('easy');
    // 2026-10-13 is Tuesday -> medium
    expect(resolveSudokuDifficulty('random', new Date('2026-10-13'))).toBe('medium');
    // 2026-10-15 is Thursday -> hard
    expect(resolveSudokuDifficulty('random', new Date('2026-10-15'))).toBe('hard');
    // 2026-10-17 is Saturday -> expert
    expect(resolveSudokuDifficulty('random', new Date('2026-10-17'))).toBe('expert');
    // Explicit override
    expect(resolveSudokuDifficulty('hard', new Date('2026-10-12'))).toBe('hard');
  });

  it('generates a valid 9x9 board and renders 3-page PDF', async () => {
    const generator = new SudokuGenerator();
    const result = await generator.generate({ date: '2026-10-11', difficulty: 'medium' });

    expect(result.metadata.id).toBe('sudoku');
    expect(result.metadata.targetFolder).toBe('/Puzzles/Sudoku');
    expect(result.filename).toBe('Sudoku_Medium_2026-10-11.pdf');
    expect(result.puzzleData.puzzleGrid).toHaveLength(9);
    expect(result.puzzleData.solutionGrid).toHaveLength(9);

    const pdfBuffer = await generator.renderPdf(result);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.toString('utf8', 0, 5)).toBe('%PDF-');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzles/sudoku.test.ts`  
Expected: FAIL (`SudokuGenerator` not found)

- [ ] **Step 3: Implement Sudoku Generator and Renderer**

`src/puzzles/sudoku/renderer.ts`:
```typescript
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
```

`src/puzzles/sudoku/generator.ts`:
```typescript
import { getSudoku } from 'sudoku-gen';
import { GeneratedPuzzle, PuzzleGenerator, PuzzleMetadata } from '../../core/types.js';
import { renderSudokuPdf } from './renderer.js';

export type SudokuDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

export interface SudokuOptions {
  date?: string;
  difficulty?: string;
}

export interface SudokuData {
  difficulty: SudokuDifficulty;
  puzzleGrid: (number | null)[][];
  solutionGrid: number[][];
}

export function resolveSudokuDifficulty(inputDifficulty?: string, dateObj = new Date()): SudokuDifficulty {
  if (inputDifficulty && inputDifficulty !== 'random') {
    const valid: SudokuDifficulty[] = ['easy', 'medium', 'hard', 'expert'];
    if (valid.includes(inputDifficulty as SudokuDifficulty)) {
      return inputDifficulty as SudokuDifficulty;
    }
  }

  // Rotating by day of week:
  // 1: Mon (easy), 2: Tue (medium), 3: Wed (medium), 4: Thu (hard), 5: Fri (hard), 6/0: Sat/Sun (expert)
  const day = dateObj.getDay();
  switch (day) {
    case 1:
      return 'easy';
    case 2:
    case 3:
      return 'medium';
    case 4:
    case 5:
      return 'hard';
    case 0:
    case 6:
    default:
      return 'expert';
  }
}

export class SudokuGenerator implements PuzzleGenerator<SudokuOptions, SudokuData> {
  readonly metadata: PuzzleMetadata = {
    id: 'sudoku',
    displayName: 'Sudoku',
    targetFolder: '/Puzzles/Sudoku',
  };

  async generate(options?: SudokuOptions): Promise<GeneratedPuzzle<SudokuData>> {
    const dateStr = options?.date ?? new Date().toISOString().slice(0, 10);
    const dateObj = new Date(dateStr + 'T12:00:00Z');
    const difficulty = resolveSudokuDifficulty(options?.difficulty, dateObj);

    const sudoku = getSudoku(difficulty);

    const puzzleGrid: (number | null)[][] = [];
    const solutionGrid: number[][] = [];

    for (let r = 0; r < 9; r++) {
      const pRow: (number | null)[] = [];
      const sRow: number[] = [];
      for (let c = 0; c < 9; c++) {
        const idx = r * 9 + c;
        const pChar = sudoku.puzzle[idx];
        const sChar = sudoku.solution[idx];
        pRow.push(pChar === '-' ? null : parseInt(pChar, 10));
        sRow.push(parseInt(sChar, 10));
      }
      puzzleGrid.push(pRow);
      solutionGrid.push(sRow);
    }

    const capDiff = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    const filename = `Sudoku_${capDiff}_${dateStr}.pdf`;

    return {
      metadata: this.metadata,
      title: `Sudoku - ${capDiff}`,
      filename,
      puzzleData: {
        difficulty,
        puzzleGrid,
        solutionGrid,
      },
    };
  }

  renderPdf(puzzle: GeneratedPuzzle<SudokuData>): Promise<Buffer> {
    return renderSudokuPdf(puzzle);
  }
}
```

`src/puzzles/sudoku/index.ts`:
```typescript
export * from './generator.js';
export * from './renderer.js';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/puzzles/sudoku.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/sudoku/ tests/puzzles/sudoku.test.ts
git commit -m "feat: implement Sudoku generator with difficulty rotation and renderer"
```

---

### Task 5: Delivery Layer (`rmapi` & Local Fallback)

**Files:**
- Create: `src/delivery/types.ts`
- Create: `src/delivery/local-client.ts`
- Create: `src/delivery/rmapi-client.ts`
- Test: `tests/delivery/clients.test.ts`

**Interfaces:**
- Consumes: `fs/promises`, `child_process`
- Produces:
  - `interface DeliveryClient`: `deliver(filename: string, targetFolder: string, buffer: Buffer): Promise<string>`
  - `class LocalDeliveryClient`: writes to target directory (default `./output/`)
  - `class RmapiDeliveryClient`: checks `rmapi` CLI and uploads to remote folder

- [ ] **Step 1: Write the failing delivery client test**

```typescript
// tests/delivery/clients.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { LocalDeliveryClient } from '../../src/delivery/local-client';
import { RmapiDeliveryClient } from '../../src/delivery/rmapi-client';

describe('Delivery Clients', () => {
  const testDir = path.join(__dirname, '../../test-output');

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('LocalDeliveryClient writes PDF to configured directory', async () => {
    const client = new LocalDeliveryClient(testDir);
    const buffer = Buffer.from('test-pdf-data');
    const savedPath = await client.deliver('Test.pdf', '/Puzzles/Test', buffer);

    expect(savedPath).toContain('Test.pdf');
    const readData = await fs.readFile(savedPath);
    expect(readData.toString()).toBe('test-pdf-data');
  });

  it('RmapiDeliveryClient falls back gracefully when rmapi binary is missing', async () => {
    const client = new RmapiDeliveryClient();
    expect(client.isAvailable()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/delivery/clients.test.ts`  
Expected: FAIL (`LocalDeliveryClient` not found)

- [ ] **Step 3: Implement Delivery Clients**

`src/delivery/types.ts`:
```typescript
export interface DeliveryClient {
  deliver(filename: string, targetFolder: string, buffer: Buffer): Promise<string>;
}
```

`src/delivery/local-client.ts`:
```typescript
import fs from 'fs/promises';
import path from 'path';
import { DeliveryClient } from './types.js';

export class LocalDeliveryClient implements DeliveryClient {
  constructor(private baseDir = './output') {}

  async deliver(filename: string, targetFolder: string, buffer: Buffer): Promise<string> {
    const sanitizedFolder = targetFolder.replace(/^\/+/, '');
    const fullDirPath = path.join(this.baseDir, sanitizedFolder);
    await fs.mkdir(fullDirPath, { recursive: true });

    const fullFilePath = path.join(fullDirPath, filename);
    await fs.writeFile(fullFilePath, buffer);
    return fullFilePath;
  }
}
```

`src/delivery/rmapi-client.ts`:
```typescript
import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { DeliveryClient } from './types.js';

export class RmapiDeliveryClient implements DeliveryClient {
  isAvailable(): boolean {
    try {
      execSync('which rmapi', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  async deliver(filename: string, targetFolder: string, buffer: Buffer): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('rmapi CLI is not found on PATH. Install rmapi or use --local mode.');
    }

    // Write buffer to temporary file for upload
    const tempFilePath = path.join(os.tmpdir(), filename);
    await fs.writeFile(tempFilePath, buffer);

    try {
      // Ensure target folders exist (ignore error if exists)
      const folderParts = targetFolder.split('/').filter(Boolean);
      let currentPath = '';
      for (const part of folderParts) {
        currentPath += '/' + part;
        try {
          execSync(`rmapi mkdir "${currentPath}"`, { stdio: 'ignore' });
        } catch {
          // Folder already exists or was created
        }
      }

      // Upload file
      execSync(`rmapi put "${tempFilePath}" "${targetFolder}"`, { stdio: 'inherit' });
      return `${targetFolder}/${filename}`;
    } finally {
      await fs.unlink(tempFilePath).catch(() => {});
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/delivery/clients.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/delivery/ tests/delivery/
git commit -m "feat: implement local and rmapi cloud delivery clients"
```

---

### Task 6: CLI Orchestrator & Entrypoint

**Files:**
- Create: `src/cli.ts`
- Create: `src/index.ts`
- Test: `tests/cli.test.ts`

**Interfaces:**
- Consumes: `PuzzleRegistry`, `WordSearchGenerator`, `SudokuGenerator`, `DeliveryClient`
- Produces:
  - Command line flags:
    - `--type=<all|word-search|sudoku>`
    - `--difficulty=<random|easy|medium|hard|expert>`
    - `--date=YYYY-MM-DD`
    - `--upload` (uploads via `rmapi` if present, otherwise warns and saves locally)
    - `--dest=<folder>` (destination for local output, defaults to `./output`)

- [ ] **Step 1: Write the failing CLI orchestrator test**

```typescript
// tests/cli.test.ts
import { describe, it, expect } from 'vitest';
import { runGenerator } from '../src/index';

describe('Orchestrator runGenerator', () => {
  it('generates both word-search and sudoku puzzles in local mode', async () => {
    const results = await runGenerator({
      type: 'all',
      difficulty: 'medium',
      date: '2026-10-11',
      upload: false,
      outputDir: './test-cli-output',
    });

    expect(results).toHaveLength(2);
    expect(results.map((r) => r.puzzle.metadata.id)).toEqual(['word-search', 'sudoku']);
    expect(results[0].deliveredPath).toContain('test-cli-output');
  });

  it('filters by puzzle type when specified', async () => {
    const results = await runGenerator({
      type: 'sudoku',
      difficulty: 'hard',
      date: '2026-10-11',
      upload: false,
      outputDir: './test-cli-output',
    });

    expect(results).toHaveLength(1);
    expect(results[0].puzzle.metadata.id).toBe('sudoku');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/cli.test.ts`  
Expected: FAIL (`runGenerator` not defined)

- [ ] **Step 3: Implement `src/index.ts` and `src/cli.ts`**

`src/index.ts`:
```typescript
import { PuzzleRegistry } from './core/registry.js';
import { WordSearchGenerator } from './puzzles/word-search/index.js';
import { SudokuGenerator } from './puzzles/sudoku/index.js';
import { LocalDeliveryClient } from './delivery/local-client.js';
import { RmapiDeliveryClient } from './delivery/rmapi-client.js';
import { DeliveryClient } from './delivery/types.js';
import { GeneratedPuzzle } from './core/types.js';

export interface RunOptions {
  type?: 'all' | 'word-search' | 'sudoku';
  difficulty?: string;
  date?: string;
  upload?: boolean;
  outputDir?: string;
}

export interface GeneratedResult {
  puzzle: GeneratedPuzzle;
  deliveredPath: string;
}

export function createRegistry(): PuzzleRegistry {
  const registry = new PuzzleRegistry();
  registry.register(new WordSearchGenerator());
  registry.register(new SudokuGenerator());
  return registry;
}

export async function runGenerator(options: RunOptions = {}): Promise<GeneratedResult[]> {
  const registry = createRegistry();
  const selectedType = options.type || 'all';

  const generators = selectedType === 'all'
    ? registry.getAll()
    : [registry.get(selectedType)].filter(Boolean);

  if (generators.length === 0) {
    throw new Error(`Unknown puzzle type: ${selectedType}`);
  }

  const rmapi = new RmapiDeliveryClient();
  const useRmapi = options.upload && rmapi.isAvailable();
  const deliveryClient: DeliveryClient = useRmapi
    ? rmapi
    : new LocalDeliveryClient(options.outputDir || './output');

  const results: GeneratedResult[] = [];

  for (const gen of generators) {
    console.log(`Generating ${gen.metadata.displayName}...`);
    const puzzle = await gen.generate({
      date: options.date,
      difficulty: options.difficulty,
    });

    console.log(`Rendering PDF for ${puzzle.title}...`);
    const pdfBuffer = await gen.renderPdf(puzzle);

    console.log(`Delivering ${puzzle.filename} to ${puzzle.metadata.targetFolder}...`);
    const deliveredPath = await deliveryClient.deliver(puzzle.filename, puzzle.metadata.targetFolder, pdfBuffer);

    results.push({ puzzle, deliveredPath });
  }

  return results;
}
```

`src/cli.ts`:
```typescript
#!/usr/bin/env node
import { runGenerator, RunOptions } from './index.js';

function parseArgs(): RunOptions {
  const args = process.argv.slice(2);
  const options: RunOptions = {
    type: 'all',
    difficulty: 'random',
    upload: false,
    outputDir: './output',
  };

  for (const arg of args) {
    if (arg.startsWith('--type=')) {
      options.type = arg.split('=')[1] as any;
    } else if (arg.startsWith('--difficulty=')) {
      options.difficulty = arg.split('=')[1];
    } else if (arg.startsWith('--date=')) {
      options.date = arg.split('=')[1];
    } else if (arg.startsWith('--dest=')) {
      options.outputDir = arg.split('=')[1];
    } else if (arg === '--upload') {
      options.upload = true;
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  console.log(`--- Pen to Paper Daily Puzzle Generator ---`);
  console.log(`Type: ${options.type} | Difficulty: ${options.difficulty} | Upload: ${options.upload}`);

  try {
    const results = await runGenerator(options);
    console.log(`\nSuccessfully generated ${results.length} puzzle(s):`);
    results.forEach((r) => {
      console.log(`- [${r.puzzle.metadata.displayName}] ${r.deliveredPath}`);
    });
  } catch (err: any) {
    console.error('Error generating puzzles:', err.message);
    process.exit(1);
  }
}

main();
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/cli.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/index.ts src/cli.ts tests/cli.test.ts
git commit -m "feat: implement CLI runner and orchestration pipeline"
```

---

### Task 7: GitHub Actions Workflow & Setup Documentation

**Files:**
- Create: `.github/workflows/daily-puzzles.yml`
- Create: `README.md`
- Test: Validate build and run CLI with `--help` / local execution

**Interfaces:**
- Consumes: All modules from Tasks 1-6
- Produces:
  - Working GitHub Actions CI/CD pipeline
  - Clear user onboarding for `RMAPI_AUTH_TOKEN` and Android shortcut webhook configuration

- [ ] **Step 1: Create GitHub Actions workflow file**

`.github/workflows/daily-puzzles.yml`:
```yaml
name: Daily reMarkable Puzzle Generator

on:
  schedule:
    # Runs at 21:00 UTC (05:00/06:00 AM local morning time)
    - cron: '0 21 * * *'
  workflow_dispatch:
    inputs:
      puzzle_type:
        description: 'Type of puzzle to generate'
        required: true
        default: 'all'
        type: choice
        options:
          - all
          - word-search
          - sudoku
      sudoku_difficulty:
        description: 'Sudoku difficulty'
        required: true
        default: 'random'
        type: choice
        options:
          - random
          - easy
          - medium
          - hard
          - expert

jobs:
  generate-and-upload:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install rmapi
        run: |
          mkdir -p $HOME/bin
          curl -L -s https://github.com/juruen/rmapi/releases/download/v0.0.26/rmapi-linuxx64.tar.gz | tar xz -C $HOME/bin
          chmod +x $HOME/bin/rmapi
          echo "$HOME/bin" >> $GITHUB_PATH

      - name: Setup rmapi auth
        if: "${{ env.RMAPI_AUTH_TOKEN != '' }}"
        env:
          RMAPI_AUTH_TOKEN: ${{ secrets.RMAPI_AUTH_TOKEN }}
        run: |
          mkdir -p ~/.config/rmapi
          echo "$RMAPI_AUTH_TOKEN" > ~/.rmapi

      - name: Run puzzle generation & upload
        env:
          RMAPI_AUTH_TOKEN: ${{ secrets.RMAPI_AUTH_TOKEN }}
        run: |
          npm run generate -- \
            --type=${{ inputs.puzzle_type || 'all' }} \
            --difficulty=${{ inputs.sudoku_difficulty || 'random' }} \
            --upload
```

- [ ] **Step 2: Create comprehensive `README.md`**

`README.md`:
```markdown
# Pen to Paper: reMarkable Puzzle Generator

An automated daily puzzle generator producing e-ink formatted 3-page PDFs for the reMarkable tablet, syncing directly to `/Puzzles/Word Search/` and `/Puzzles/Sudoku/`.

## Features
- **Word Search**: 15x15 grids using curated offline themes (Astronomy, Ocean Life, History, etc.).
- **Sudoku**: 9x9 grids with difficulty settings (`random`, `easy`, `medium`, `hard`, `expert`) that rotate automatically or can be specified on-demand.
- **E-Ink Optimized Layout**: 1404x1872 pt (3:4 aspect ratio) with high-contrast monochrome design and generous margins.
- **3-Page Structure**: Page 1 (The Puzzle), Page 2 (Spoiler Blocker), Page 3 (The Answer Key).
- **Dual Trigger**: Daily GitHub Actions schedule + On-Demand Android HTTP webhook.

## Local Development
```bash
npm install
npm test
# Generate puzzles locally to ./output/ for preview:
npm run generate -- --type=all --difficulty=medium
```

## Cloud Setup (reMarkable)
1. Generate an authentication code at [my.remarkable.com/device/desktop/connect](https://my.remarkable.com/device/desktop/connect).
2. Authenticate `rmapi` locally once to obtain your token file (`~/.rmapi`).
3. Copy the token into your GitHub repository secrets as `RMAPI_AUTH_TOKEN`.

## Android Trigger Setup
Use the **HTTP Request Shortcuts** Android app:
- **Method**: `POST`
- **URL**: `https://api.github.com/repos/<OWNER>/pen-to-paper/actions/workflows/daily-puzzles.yml/dispatches`
- **Headers**:
  - `Authorization: Bearer <GITHUB_PAT>`
  - `Accept: application/vnd.github.v3+json`
- **Body**:
  ```json
  {
    "ref": "main",
    "inputs": {
      "puzzle_type": "all",
      "sudoku_difficulty": "random"
    }
  }
  ```
```

- [ ] **Step 3: Run full test suite and verify build**

Run: `npm test && npm run build`  
Expected: All tests PASS and TypeScript builds without errors

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/daily-puzzles.yml README.md
git commit -m "ci: add GitHub Actions daily workflow and documentation"
```
