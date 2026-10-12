# 5x5 Mini Crossword Symmetrical Blockers & Distinct Words Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the 5×5 Mini Crossword system to support standard 180° symmetrical black blocker tiles (`#`), strictly distinct Across and Down words (all $\ge 3$ letters), standard American clue numbering, a 20+ puzzle seed bank, resilient Datamuse generation, solid black e-ink PDF rendering, and a zero-scroll mobile PWA studio.

**Architecture:** 
- `templates.ts` defines 9 verified 180°-symmetric 5×5 templates where all words are 3, 4, or 5 letters.
- `numbering.ts` implements standard crossword numbering (`calculateCrosswordNumbering`) shared between Node and web.
- `seed-bank.ts` provides 20+ handcrafted blocked crosswords with distinct Across/Down words and clues.
- `generator.ts` uses template slot filling with Datamuse definitions and seamless offline fallback to the seed bank.
- `renderer.ts` draws solid black blocker squares on reMarkable PDFs with 3-page spoiler protection.
- `web/src/utils/crossword.ts` and `MiniCrosswordStudio.tsx` render dark unclickable blockers, auto-advance over blockers, and validate answers on playable cells only.

**Tech Stack:** TypeScript (strict mode), Node.js, PDFKit, Vitest, React 18, Vite, Tailwind CSS.

## Global Constraints

- Grid dimensions: exactly 5x5 (5 rows, 5 columns).
- Blocker character: `'#'` represents solid black blocker tiles.
- Minimum word length: strictly $\ge 3$ letters (lengths 3, 4, 5; zero 1- or 2-letter words).
- Distinct words: Across and Down words must never be identical ($A_i \neq D_j$).
- Symmetry: 180° rotational symmetry on all grid templates.
- Canvas size: 1404 x 1872 pt portrait canvas (reMarkable format).
- PDF structure: 3 pages (Page 1 = Puzzle, Page 2 = Spoiler Blocker via `builder.addBufferPage()`, Page 3 = Answer Key).
- PWA layout: Zero-scroll mobile layout fitting within `100dvh` with `.safe-bottom` safe area insets. Solutions hidden by default.
- Verification: All tests and TypeScript builds must pass: `npm test && npm run build && npm run build:web`.

---

### Task 1: Core Types, 180°-Symmetric Templates & Standard Numbering

**Files:**
- Modify: `src/puzzles/mini-crossword/types.ts`
- Create: `src/puzzles/mini-crossword/templates.ts`
- Create: `src/puzzles/mini-crossword/numbering.ts`
- Create: `tests/puzzles/mini-crossword-numbering.test.ts`

**Interfaces:**
- Produces: `CrosswordSlot`, `CrosswordClue`, `MiniCrosswordData`, `MiniCrosswordOptions`, `CROSSWORD_TEMPLATES`, `calculateCrosswordNumbering(grid: string[][]): NumberingResult`.

- [ ] **Step 1: Write the failing tests for templates and numbering**

Create `tests/puzzles/mini-crossword-numbering.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { CROSSWORD_TEMPLATES } from '../../src/puzzles/mini-crossword/templates.ts';
import { calculateCrosswordNumbering } from '../../src/puzzles/mini-crossword/numbering.ts';

describe('Mini Crossword Templates & Numbering', () => {
  it('defines 9 verified 180-degree symmetric templates', () => {
    expect(CROSSWORD_TEMPLATES.length).toBe(9);
    for (const tmpl of CROSSWORD_TEMPLATES) {
      expect(tmpl.grid).toHaveLength(5);
      for (let r = 0; r < 5; r++) {
        expect(tmpl.grid[r]).toHaveLength(5);
        for (let c = 0; c < 5; c++) {
          // 180-deg rotational symmetry: cell (r, c) == cell (4-r, 4-c)
          expect(tmpl.grid[r][c]).toBe(tmpl.grid[4 - r][4 - c]);
        }
      }
    }
  });

  it('guarantees every template has strictly word lengths >= 3 and no 1- or 2-letter words', () => {
    for (const tmpl of CROSSWORD_TEMPLATES) {
      const { acrossSlots, downSlots } = calculateCrosswordNumbering(tmpl.grid);
      expect(acrossSlots.length).toBeGreaterThanOrEqual(4);
      expect(downSlots.length).toBeGreaterThanOrEqual(4);

      for (const slot of [...acrossSlots, ...downSlots]) {
        expect(slot.length).toBeGreaterThanOrEqual(3);
        expect(slot.length).toBeLessThanOrEqual(5);
        expect(slot.coords).toHaveLength(slot.length);
      }
    }
  });

  it('correctly numbers a known 5x5 template with 2 corner blockers', () => {
    // Template 1: blockers at (0, 4) and (4, 0)
    const grid = [
      ['.', '.', '.', '.', '#'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['#', '.', '.', '.', '.'],
    ];
    const { gridNumbers, acrossSlots, downSlots } = calculateCrosswordNumbering(grid);

    // Row 0 starts at (0, 0), length 4
    expect(gridNumbers[0][0]).toBe(1);
    expect(acrossSlots.find((s) => s.number === 1)?.length).toBe(4);

    // (0, 4) is blocker, so no number
    expect(gridNumbers[0][4]).toBeNull();

    // Down words start at (0,0), (0,1), (0,2), (0,3)
    expect(downSlots.find((s) => s.startRow === 0 && s.startCol === 0)?.length).toBe(4);
    expect(downSlots.find((s) => s.startRow === 0 && s.startCol === 1)?.length).toBe(5);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzles/mini-crossword-numbering.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Update types, implement templates and numbering**

Update `src/puzzles/mini-crossword/types.ts`:
```typescript
export interface CrosswordClue {
  number: number;
  direction: 'across' | 'down';
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  length: number;
}

export interface CrosswordSlot {
  number: number;
  direction: 'across' | 'down';
  startRow: number;
  startCol: number;
  length: number;
  coords: [number, number][];
}

export interface MiniCrosswordData {
  title: string;
  date: string;
  templateId?: string;
  grid: string[][];
  acrossClues: CrosswordClue[];
  downClues: CrosswordClue[];
}

export interface MiniCrosswordOptions {
  theme?: string;
  date?: string;
}
```

Create `src/puzzles/mini-crossword/templates.ts`:
```typescript
export interface CrosswordTemplate {
  id: string;
  name: string;
  grid: string[][];
  blockerCount: number;
}

export const CROSSWORD_TEMPLATES: CrosswordTemplate[] = [
  {
    id: 'tmpl-2-corners-a',
    name: 'Top-Right & Bottom-Left (2 blockers)',
    blockerCount: 2,
    grid: [
      ['.', '.', '.', '.', '#'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['#', '.', '.', '.', '.'],
    ],
  },
  {
    id: 'tmpl-2-corners-b',
    name: 'Top-Left & Bottom-Right (2 blockers)',
    blockerCount: 2,
    grid: [
      ['#', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '#'],
    ],
  },
  {
    id: 'tmpl-4-quad-corners',
    name: 'Quad Corners (4 blockers)',
    blockerCount: 4,
    grid: [
      ['#', '.', '.', '.', '#'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['#', '.', '.', '.', '#'],
    ],
  },
  {
    id: 'tmpl-4-corner-doublets-a',
    name: 'Corner Doublets Horizontal (4 blockers)',
    blockerCount: 4,
    grid: [
      ['#', '#', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '#', '#'],
    ],
  },
  {
    id: 'tmpl-4-corner-doublets-b',
    name: 'Corner Doublets Reverse Horizontal (4 blockers)',
    blockerCount: 4,
    grid: [
      ['.', '.', '.', '#', '#'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['#', '#', '.', '.', '.'],
    ],
  },
  {
    id: 'tmpl-4-corner-vertical-a',
    name: 'Corner Doublets Vertical (4 blockers)',
    blockerCount: 4,
    grid: [
      ['#', '.', '.', '.', '.'],
      ['#', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '#'],
      ['.', '.', '.', '.', '#'],
    ],
  },
  {
    id: 'tmpl-4-corner-vertical-b',
    name: 'Corner Doublets Reverse Vertical (4 blockers)',
    blockerCount: 4,
    grid: [
      ['.', '.', '.', '.', '#'],
      ['.', '.', '.', '.', '#'],
      ['.', '.', '.', '.', '.'],
      ['#', '.', '.', '.', '.'],
      ['#', '.', '.', '.', '.'],
    ],
  },
  {
    id: 'tmpl-6-corner-l-a',
    name: 'L-Corner Clusters (6 blockers)',
    blockerCount: 6,
    grid: [
      ['#', '#', '.', '.', '.'],
      ['#', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '#'],
      ['.', '.', '.', '#', '#'],
    ],
  },
  {
    id: 'tmpl-6-corner-l-b',
    name: 'Reverse L-Corner Clusters (6 blockers)',
    blockerCount: 6,
    grid: [
      ['.', '.', '.', '#', '#'],
      ['.', '.', '.', '.', '#'],
      ['.', '.', '.', '.', '.'],
      ['#', '.', '.', '.', '.'],
      ['#', '#', '.', '.', '.'],
    ],
  },
];
```

Create `src/puzzles/mini-crossword/numbering.ts`:
```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/puzzles/mini-crossword-numbering.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/mini-crossword/types.ts src/puzzles/mini-crossword/templates.ts src/puzzles/mini-crossword/numbering.ts tests/puzzles/mini-crossword-numbering.test.ts
git commit -m "feat(crossword): add 180-degree symmetric templates and standard crossword numbering"
```

---

### Task 2: Handcrafted 20+ Seed Bank & Backtracking Generator with Seed Fallback

**Files:**
- Modify: `src/puzzles/mini-crossword/seed-bank.ts`
- Modify: `src/puzzles/mini-crossword/generator.ts`
- Modify: `tests/puzzles/mini-crossword-seed.test.ts`
- Modify: `tests/puzzles/mini-crossword-generator.test.ts`

**Interfaces:**
- Consumes: `calculateCrosswordNumbering`, `CROSSWORD_TEMPLATES`, `MiniCrosswordData`.
- Produces: `SEED_CROSSWORDS` (20+ verified puzzles), `getSeedCrosswordForDate(dateStr: string)`, `MiniCrosswordGenerator`.

- [ ] **Step 1: Write failing tests for Seed Bank integrity and Generator**

Update `tests/puzzles/mini-crossword-seed.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { getSeedCrosswordForDate, SEED_CROSSWORDS } from '../../src/puzzles/mini-crossword/seed-bank.ts';
import { calculateCrosswordNumbering } from '../../src/puzzles/mini-crossword/numbering.ts';

describe('Mini Crossword Seed Bank', () => {
  it('contains at least 20 verified 5x5 seed puzzles', () => {
    expect(SEED_CROSSWORDS.length).toBeGreaterThanOrEqual(20);
  });

  it('guarantees every seed puzzle has blockers and strictly distinct across and down words', () => {
    for (const puzzle of SEED_CROSSWORDS) {
      expect(puzzle.grid).toHaveLength(5);
      let blockerCount = 0;
      for (let r = 0; r < 5; r++) {
        expect(puzzle.grid[r]).toHaveLength(5);
        for (let c = 0; c < 5; c++) {
          if (puzzle.grid[r][c] === '#') {
            blockerCount++;
            // 180-deg symmetry
            expect(puzzle.grid[r][c]).toBe(puzzle.grid[4 - r][4 - c]);
          }
        }
      }
      expect(blockerCount).toBeGreaterThanOrEqual(2);

      const acrossWords = puzzle.acrossClues.map((c) => c.word.toUpperCase());
      const downWords = puzzle.downClues.map((c) => c.word.toUpperCase());

      // No duplicate words within Across or Down
      expect(new Set(acrossWords).size).toBe(acrossWords.length);
      expect(new Set(downWords).size).toBe(downWords.length);

      // Across and Down words must NEVER intersect identically (no shared words)
      const commonWords = acrossWords.filter((w) => downWords.includes(w));
      expect(commonWords).toEqual([]);

      // Verify numbering matches calculateCrosswordNumbering
      const { acrossSlots, downSlots } = calculateCrosswordNumbering(puzzle.grid);
      expect(puzzle.acrossClues.length).toBe(acrossSlots.length);
      expect(puzzle.downClues.length).toBe(downSlots.length);
      for (let i = 0; i < acrossSlots.length; i++) {
        expect(puzzle.acrossClues[i].number).toBe(acrossSlots[i].number);
        expect(puzzle.acrossClues[i].length).toBe(acrossSlots[i].length);
        expect(puzzle.acrossClues[i].word).toHaveLength(acrossSlots[i].length);
      }
      for (let i = 0; i < downSlots.length; i++) {
        expect(puzzle.downClues[i].number).toBe(downSlots[i].number);
        expect(puzzle.downClues[i].length).toBe(downSlots[i].length);
        expect(puzzle.downClues[i].word).toHaveLength(downSlots[i].length);
      }
    }
  });

  it('provides deterministic date-based seed lookup', () => {
    const p1 = getSeedCrosswordForDate('2026-10-13');
    const p2 = getSeedCrosswordForDate('2026-10-13');
    expect(p1.title).toBe(p2.title);
    expect(p1.grid).toEqual(p2.grid);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzles/mini-crossword-seed.test.ts`
Expected: FAIL (seed bank currently has word squares with identical across/down words and 0 blockers)

- [ ] **Step 3: Construct the 20+ verified seed puzzles in `seed-bank.ts` and update generator**

In `src/puzzles/mini-crossword/seed-bank.ts`:
Build 20+ authentic 5×5 blocked crosswords using the verified templates.
For each puzzle:
- Grid contains uppercase letters `'A'-'Z'` and `'#'`.
- Across and Down words are distinct.
- Clues are populated with clean, interesting crossword definitions.
- `getSeedCrosswordForDate` selects deterministically by hashing `dateStr`.

In `src/puzzles/mini-crossword/generator.ts`:
- Update `MiniCrosswordGenerator` to extract slots via `calculateCrosswordNumbering`.
- When custom theme is supplied, query Datamuse for words matching slots with definitions.
- If network unavailable or solve fails, fall back to `getSeedCrosswordForDate`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/puzzles/mini-crossword-seed.test.ts tests/puzzles/mini-crossword-generator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/mini-crossword/seed-bank.ts src/puzzles/mini-crossword/generator.ts tests/puzzles/mini-crossword-seed.test.ts tests/puzzles/mini-crossword-generator.test.ts
git commit -m "feat(crossword): add 20+ verified blocked seed crosswords and update generator"
```

---

### Task 3: E-Ink 3-Page PDF Renderer with Black Blocker Squares

**Files:**
- Modify: `src/puzzles/mini-crossword/renderer.ts`
- Modify: `tests/puzzles/mini-crossword-renderer.test.ts`

**Interfaces:**
- Consumes: `MiniCrosswordData`, `calculateCrosswordNumbering`.
- Produces: `renderMiniCrosswordPdf(puzzle): Promise<Buffer>`.

- [ ] **Step 1: Write failing test for PDF renderer with blockers**

Update `tests/puzzles/mini-crossword-renderer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { renderMiniCrosswordPdf } from '../../src/puzzles/mini-crossword/renderer.ts';
import { getSeedCrosswordForDate } from '../../src/puzzles/mini-crossword/seed-bank.ts';

describe('Mini Crossword PDF Renderer', () => {
  it('renders a valid 3-page e-ink PDF with blocked grid', async () => {
    const puzzle = getSeedCrosswordForDate('2026-10-13');
    const pdfBuffer = await renderMiniCrosswordPdf(puzzle);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    // Check %PDF magic header
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');

    // Page count check: /Type /Page occurs at least 3 times
    const pdfText = pdfBuffer.toString('latin1');
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches?.length).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify status**

Run: `npx vitest run tests/puzzles/mini-crossword-renderer.test.ts`

- [ ] **Step 3: Update `renderer.ts` to draw solid black blocker squares**

In `src/puzzles/mini-crossword/renderer.ts`:
- In `drawCrosswordGrid`:
  - If `grid[r][c] === '#'`:
    - Draw a filled rectangle with solid black `#000000`:
      ```typescript
      doc.rect(cellX, cellY, cellSize, cellSize).fillColor('#000000').fill();
      ```
    - Do not draw clue numbers or letters.
  - If playable cell (`grid[r][c] !== '#'`):
    - Draw cell rectangle with 1pt stroke `#555555`.
    - If `clueNumber` exists, render number in top-left (14pt, `#222222`).
    - If `showLetters`, render bold capital letter (46pt Helvetica-Bold, `#000000`).
- Ensure clues below grid are calculated and numbered dynamically matching `acrossClues` and `downClues`.
- Ensure spoiler page (`builder.addBufferPage()`) and answer key page (`builder.addAnswerKeyPage()`) remain intact.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/puzzles/mini-crossword-renderer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/mini-crossword/renderer.ts tests/puzzles/mini-crossword-renderer.test.ts
git commit -m "feat(crossword): render solid black blocker tiles in e-ink pdf"
```

---

### Task 4: Mobile Zero-Scroll PWA Studio & Crossword Utilities

**Files:**
- Modify: `web/src/utils/crossword.ts`
- Modify: `web/src/components/MiniCrosswordStudio.tsx`
- Create: `tests/web/crossword-utils.test.ts`

**Interfaces:**
- Produces: `createEmptyCrosswordGrid(grid?: string[][]): string[][]`, `isCrosswordSolved(userGrid, solutionGrid): boolean`, `MiniCrosswordStudio`.

- [ ] **Step 1: Write failing tests for Web Crossword Utilities**

Create `tests/web/crossword-utils.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  createEmptyCrosswordGrid,
  isCrosswordSolved,
  SAMPLE_PUZZLES,
} from '../../web/src/utils/crossword.ts';

describe('Web Crossword Utilities', () => {
  it('creates empty grid preserving black blocker tiles', () => {
    const sample = SAMPLE_PUZZLES[0];
    const emptyGrid = createEmptyCrosswordGrid(sample.grid);
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        if (sample.grid[r][c] === '#') {
          expect(emptyGrid[r][c]).toBe('#');
        } else {
          expect(emptyGrid[r][c]).toBe('');
        }
      }
    }
  });

  it('correctly verifies solved status ignoring blocker tiles', () => {
    const sample = SAMPLE_PUZZLES[0];
    const emptyGrid = createEmptyCrosswordGrid(sample.grid);
    expect(isCrosswordSolved(emptyGrid, sample.grid)).toBe(false);

    // Fill playable cells
    const solvedUserGrid = sample.grid.map((row) =>
      row.map((cell) => (cell === '#' ? '#' : cell.toLowerCase()))
    );
    expect(isCrosswordSolved(solvedUserGrid, sample.grid)).toBe(true);
  });

  it('guarantees all sample puzzles have blockers and distinct words', () => {
    for (const puzzle of SAMPLE_PUZZLES) {
      const across = puzzle.acrossClues.map((c) => c.word);
      const down = puzzle.downClues.map((c) => c.word);
      const overlap = across.filter((w) => down.includes(w));
      expect(overlap).toEqual([]);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/web/crossword-utils.test.ts`
Expected: FAIL

- [ ] **Step 3: Update `web/src/utils/crossword.ts` and `MiniCrosswordStudio.tsx`**

In `web/src/utils/crossword.ts`:
- Update `SAMPLE_PUZZLES` with verified blocked crosswords with distinct across/down words.
- Update `createEmptyCrosswordGrid(template?: string[][])`: if template provided, copies `'#'` to blocker cells, empty string `''` to playable cells.
- Update `isCrosswordSolved(userGrid, solutionGrid)`: checks playable cells only, ignoring `'#'`.

In `web/src/components/MiniCrosswordStudio.tsx`:
- Compute grid numbering dynamically from `currentPuzzle.grid`.
- In grid cell rendering:
  - If `cell === '#'`:
    - Render `bg-stone-900 border-stone-800 pointer-events-none cursor-default select-none`.
    - No clue number or text.
  - If playable cell:
    - Render dynamic clue number in top-left.
    - Render letter.
    - Click handler only selects playable cells.
- Keyboard / Touch input:
  - When typing a letter into cell $(r, c)$, find the next playable cell in the current word, skipping any `#`.
  - Arrow key navigation: moves to adjacent playable cells, skipping `#`.
  - Clue inspector: next/prev buttons cycle through actual clue indices.
  - Keep solutions hidden by default (`showSolution = false`).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/web/crossword-utils.test.ts`
Expected: PASS

- [ ] **Step 5: Verify web build succeeds**

Run: `npm run build:web`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add web/src/utils/crossword.ts web/src/components/MiniCrosswordStudio.tsx tests/web/crossword-utils.test.ts
git commit -m "feat(pwa): support black blocker tiles and distinct words in mini crossword studio"
```

---

### Task 5: Full Regression Testing, CLI Verification & Production Deployment Check

**Files:**
- Verify: Full test suite (`npm test`)
- Verify: CLI generation (`node dist/cli.js generate --type=mini-crossword`)
- Verify: Production web build (`npm run build:web`)

- [ ] **Step 1: Run complete test suite**

Run: `npm test`
Expected: PASS across all test files.

- [ ] **Step 2: Run build and CLI smoke test**

Run: `npm run build && node dist/cli.js generate --type=mini-crossword`
Expected: Generates a valid 3-page blocked Mini Crossword PDF in `./output/`.

- [ ] **Step 3: Run web build**

Run: `npm run build:web`
Expected: Vite build succeeds with 0 errors.
