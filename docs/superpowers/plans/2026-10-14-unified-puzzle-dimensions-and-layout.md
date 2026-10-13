# Unified Puzzle Dimensions & Page Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize page layout, top grid anchor ($Y = 240\text{ pt}$), and board footprint ($\approx 960\text{–}990\text{ pt}$) across all 6 daily puzzles on reMarkable e-ink PDFs and mobile PWA studios to eliminate visual jumping and enhance legibility.

**Architecture:** Establish a unified design system based on the Sudoku baseline across all PDF renderers in `src/puzzles/*/renderer.ts` and mobile studios in `web/src/components/*Studio.tsx`. Grids share a common $Y = 240\text{ pt}$ top anchor, horizontally centered bounding box ($960\text{–}990\text{ pt}$), scaled cell typography, and a consistent content/clue/rules zone ($Y \ge 1200\text{ pt}$).

**Tech Stack:** TypeScript (strict mode), Node.js, Vitest, PDFKit, React 18, Tailwind CSS.

## Global Constraints

- Target e-ink canvas: exactly 1404 × 1872 pt portrait with 60 pt margins (`PAGE_MARGIN = 60`).
- Unified top grid anchor: strictly **$Y = 240\text{ pt}$** across all puzzle PDF renderers.
- Unified board footprint: strictly **$960\text{–}990\text{ pt}$** (or closest integer cell multiple, e.g. 900 pt for 5×5 crossword with clues below, 960 pt for KenKen, Kakuro, Futoshiki, Word Search, 990 pt for Sudoku).
- Horizontal centering: `startX = Math.floor((1404 - boardWidth) / 2)`.
- Content / clue / rules zone: starts at or after $Y = 1180\text{ pt}$ without overlapping the grid or page margins.
- Mobile PWA studios: strictly zero-scroll fitting within `100dvh` with `.safe-bottom` safe area insets and unified $340\text{–}360\text{ px}$ board width.
- 100% test pass rate and clean compilation (`npm test && npm run build && npm run build:web`).

---

### Task 1: Sudoku & KenKen PDF Layout Standardization

**Files:**
- Modify: `src/puzzles/sudoku/renderer.ts`
- Modify: `src/puzzles/kenken/renderer.ts`
- Test: `tests/puzzles/sudoku.test.ts`
- Test: `tests/puzzles/kenken-renderer.test.ts`

**Interfaces:**
- `renderSudokuPdf(puzzle)`: moves `startY` from `PAGE_MARGIN + 220 = 280 pt` to `240 pt`.
- `renderKenKenPdf(puzzle)`: standardizes `boardSize` to $960\text{ pt}$ (centered at $X = 222\text{ pt}$, $Y = 240\text{ pt}$), adjusts cell sizes ($160\text{ pt}$ for 6×6, $192\text{ pt}$ for 5×5, $240\text{ pt}$ for 4×4), scales cage badge fonts ($24\text{ pt}$ for 6×6), and places rules prompt at $Y = 1240\text{ pt}$.

- [ ] **Step 1: Write/update failing tests for Sudoku and KenKen geometry**

In `tests/puzzles/kenken-renderer.test.ts`, update assertions verifying the new standardized bounding box and page count.
In `tests/puzzles/sudoku.test.ts`, verify PDF rendering with the $Y = 240\text{ pt}$ anchor.

- [ ] **Step 2: Run tests to verify Red phase**

Run: `npx vitest run tests/puzzles/sudoku.test.ts tests/puzzles/kenken-renderer.test.ts`

- [ ] **Step 3: Update `src/puzzles/sudoku/renderer.ts`**

Change `startY = PAGE_MARGIN + 220` (280) to `startY = 240`.
Keep `cellSize = 110`, `boardSize = 990`, `startX = (PAGE_WIDTH - boardSize) / 2` (207).

- [ ] **Step 4: Update `src/puzzles/kenken/renderer.ts`**

Replace maxBoardDim calculation (was 1284 pt) with:
```typescript
const targetBoardSize = 960;
const cellSize = Math.floor(targetBoardSize / size);
const boardSize = cellSize * size;
const startX = Math.floor((PAGE_WIDTH - boardSize) / 2);
const startY = 240;
```
Update cage badge font size dynamically:
```typescript
const badgeFontSize = size <= 4 ? 30 : size <= 6 ? 24 : 18;
const digitFontSize = size <= 4 ? 70 : size <= 6 ? 56 : 42;
```
Place rules prompt at $Y = startY + boardSize + 40$ (which is $Y = 1240\text{ pt}$ for 960 pt grid).

- [ ] **Step 5: Run tests to verify Green phase**

Run: `npx vitest run tests/puzzles/sudoku.test.ts tests/puzzles/kenken-renderer.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/puzzles/sudoku/renderer.ts src/puzzles/kenken/renderer.ts tests/puzzles/sudoku.test.ts tests/puzzles/kenken-renderer.test.ts
git commit -m "style(pdf): standardize sudoku and kenken layout geometry to unified anchor"
```

---

### Task 2: Mini Crossword PDF Enlargement & Clue Typography

**Files:**
- Modify: `src/puzzles/mini-crossword/renderer.ts`
- Test: `tests/puzzles/mini-crossword-renderer.test.ts`

**Interfaces:**
- `renderMiniCrosswordPdf(puzzle)`:
  - Enlarge 5×5 grid from 500 pt to $900 \times 900\text{ pt}$ (`cellSize = 180\text{ pt}`).
  - Center horizontally: `startX = (1404 - 900) / 2 = 252\text{ pt}`.
  - Anchor top: `startY = 240\text{ pt}`.
  - Enlarge cell clue numbers: from 14 pt to **28 pt** (`cellX + 8, cellY + 8`).
  - Enlarge solved letters: from 46 pt to **64 pt bold** (`cellY + 45`).
  - Move Across / Down clue list to start at $Y = 1180\text{ pt}$ in two balanced columns (Across at $X = 140\text{ pt}$, Down at $X = 744\text{ pt}$, width $520\text{ pt}$).

- [ ] **Step 1: Write/update failing tests in `tests/puzzles/mini-crossword-renderer.test.ts`**

Update tests to verify that the PDF renders cleanly with the new grid dimensions and 3-page structure.

- [ ] **Step 2: Run tests to verify Red phase**

Run: `npx vitest run tests/puzzles/mini-crossword-renderer.test.ts`

- [ ] **Step 3: Update `src/puzzles/mini-crossword/renderer.ts`**

1. In `drawCrosswordGrid`:
   ```typescript
   const cellSize = 180;
   const boardSize = cellSize * 5; // 900 pt
   const startX = Math.floor((PAGE_WIDTH - boardSize) / 2); // 252 pt
   const startY = 240;
   ```
   - Clue number: fontSize 28 pt at `cellX + 8, cellY + 8`.
   - Solved letter: fontSize 64 pt bold at `cellX, cellY + 45`, width `cellSize`, align `'center'`.
2. In `renderClueList`:
   - Clue list starts at $Y = 1180\text{ pt}$.
   - Across column: $X = 140\text{ pt}$, width $520\text{ pt}$.
   - Down column: $X = 744\text{ pt}$, width $520\text{ pt}$.
   - Header font size: 24 pt bold (`ACROSS`, `DOWN`).
   - Clue text: 20 pt text with 22 pt bold number prefixes and line height 28 pt.

- [ ] **Step 4: Run tests to verify Green phase**

Run: `npx vitest run tests/puzzles/mini-crossword-renderer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/mini-crossword/renderer.ts tests/puzzles/mini-crossword-renderer.test.ts
git commit -m "style(crossword): enlarge 5x5 mini crossword grid to 900pt with 28pt clue numbers"
```

---

### Task 3: Kakuro & Futoshiki PDF Layout Standardization

**Files:**
- Modify: `src/puzzles/kakuro/renderer.ts`
- Modify: `src/puzzles/futoshiki/renderer.ts`
- Test: `tests/puzzles/kakuro-renderer.test.ts`
- Test: `tests/puzzles/futoshiki-renderer.test.ts`

**Interfaces:**
- `renderKakuroPdf(puzzle)`:
  - Standardize `boardSize` to **$960\text{ pt}$** (`cellSize = 160\text{ pt}` for 6×6, `120\text{ pt}` for 8×8, `96\text{ pt}` for 10×10).
  - Center horizontally: `startX = (1404 - 960) / 2 = 222\text{ pt}`.
  - Anchor top: `startY = 240\text{ pt}`.
  - Scale diagonal split clue badges: $28\text{ pt}$ (6×6), $24\text{ pt}$ (8×8), $20\text{ pt}$ (10×10).
  - Scale solved digits: $56\text{ pt}$ (6×6), $48\text{ pt}$ (8×8), $40\text{ pt}$ (10×10).
  - Rules text centered at $Y = 1240\text{ pt}$.
- `renderFutoshikiPdf(puzzle)`:
  - Standardize `boardWidth / boardHeight` to **$960\text{ pt}$**:
    - 4×4: cell $205\text{ pt}$, gutter $45\text{ pt}$ ($955\text{ pt}$).
    - 5×5: cell $160\text{ pt}$, gutter $40\text{ pt}$ ($960\text{ pt}$).
    - 6×6: cell $135\text{ pt}$, gutter $30\text{ pt}$ ($960\text{ pt}$).
  - Anchor top: `startY = 240\text{ pt}` (moved from $550\text{ pt}$).
  - Center horizontally: `startX = Math.floor((1404 - boardWidth) / 2)`.
  - Rules text centered at $Y = 1240\text{ pt}$.

- [ ] **Step 1: Write/update failing tests in `tests/puzzles/kakuro-renderer.test.ts` and `tests/puzzles/futoshiki-renderer.test.ts`**

Update unit tests to reflect the new dimensions, layout config, and $Y=240\text{ pt}$ anchor.

- [ ] **Step 2: Run tests to verify Red phase**

Run: `npx vitest run tests/puzzles/kakuro-renderer.test.ts tests/puzzles/futoshiki-renderer.test.ts`

- [ ] **Step 3: Update `src/puzzles/kakuro/renderer.ts`**

Update `cellSize` calculation:
```typescript
const cellSize = size === 6 ? 160 : size === 8 ? 120 : size === 10 ? 96 : Math.floor(960 / size);
const boardSize = cellSize * size;
const startX = Math.floor((PAGE_WIDTH - boardSize) / 2); // 222 pt
const startY = 240;
const clueFontSize = size === 6 ? 28 : size === 8 ? 24 : 20;
const solutionFontSize = size === 6 ? 56 : size === 8 ? 48 : 40;
const rulesY = startY + boardSize + 40; // 1240 pt
```

- [ ] **Step 4: Update `src/puzzles/futoshiki/renderer.ts`**

Update `getLayoutConfig`:
```typescript
function getLayoutConfig(size: number) {
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
```
Set `startY = 240`, `startX = Math.floor((PAGE_WIDTH - boardWidth) / 2)`, and rules at `Y = startY + boardHeight + 40` ($1240\text{ pt}$).

- [ ] **Step 5: Run tests to verify Green phase**

Run: `npx vitest run tests/puzzles/kakuro-renderer.test.ts tests/puzzles/futoshiki-renderer.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/puzzles/kakuro/renderer.ts src/puzzles/futoshiki/renderer.ts tests/puzzles/kakuro-renderer.test.ts tests/puzzles/futoshiki-renderer.test.ts
git commit -m "style(pdf): standardize kakuro and futoshiki layout geometry to unified anchor"
```

---

### Task 4: Word Search PDF Layout Standardization

**Files:**
- Modify: `src/puzzles/word-search/renderer.ts`
- Test: `tests/puzzles/word-search.test.ts`

**Interfaces:**
- `renderWordSearchPdf(puzzle)`:
  - Enlarge 15×15 grid from 810 pt to **$960 \times 960\text{ pt}$** (`cellSize = 64\text{ pt}`).
  - Center horizontally: `startX = (1404 - 960) / 2 = 222\text{ pt}`.
  - Anchor top: `startY = 240\text{ pt}`.
  - Enlarge letters: from 26 pt to **30 pt bold**.
  - Word checklist: starts at $Y = 1240\text{ pt}$ in 3 balanced columns with $[ \ ]$ check tags (20 pt font, row height 32 pt).

- [ ] **Step 1: Write/update failing tests in `tests/puzzles/word-search.test.ts`**

Update test to check that the PDF renders with new grid dimensions and letter sizes.

- [ ] **Step 2: Run tests to verify Red phase**

Run: `npx vitest run tests/puzzles/word-search.test.ts`

- [ ] **Step 3: Update `src/puzzles/word-search/renderer.ts`**

Set:
```typescript
const cellSize = 64;
const gridWidth = cellSize * 15; // 960 pt
const startX = Math.floor((PAGE_WIDTH - gridWidth) / 2); // 222 pt
const startY = 240;
```
In cell loop: font size 30 pt bold, centered at `cellY + 18`.
In checklist: starts at `startY + gridWidth + 40` ($1240\text{ pt}$).

- [ ] **Step 4: Run tests to verify Green phase**

Run: `npx vitest run tests/puzzles/word-search.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/word-search/renderer.ts tests/puzzles/word-search.test.ts
git commit -m "style(word-search): enlarge word search grid to 960pt at standard Y=240 anchor"
```

---

### Task 5: Web PWA Studios Container & Grid Harmonization

**Files:**
- Modify: `web/src/components/SudokuStudio.tsx`
- Modify: `web/src/components/MiniCrosswordStudio.tsx`
- Modify: `web/src/components/KenKenStudio.tsx`
- Modify: `web/src/components/KakuroStudio.tsx`
- Modify: `web/src/components/FutoshikiStudio.tsx`
- Test: `tests/web/crossword-utils.test.ts`
- Test: `tests/web/kenken-utils.test.ts`
- Test: `tests/web/kakuro-utils.test.ts`
- Test: `tests/web/futoshiki-utils.test.ts`

**Interfaces:**
- All studios standardize on:
  - Root container: `h-full max-w-md mx-auto flex flex-col justify-between pt-2 pb-2 safe-bottom px-3 select-none touch-manipulation`.
  - Board wrapper: unified container width (`max-w-[340px]` to `max-w-[360px]`) centered horizontally.
  - Interactive cells: balanced proportions matching Sudoku's touch target size.
  - Uniform typography and zero-scroll guarantee.

- [ ] **Step 1: Check existing web studio layout classes across all 5 studios**

Compare `SudokuStudio.tsx`, `MiniCrosswordStudio.tsx`, `KenKenStudio.tsx`, `KakuroStudio.tsx`, and `FutoshikiStudio.tsx`.

- [ ] **Step 2: Update container and board wrapper classes for uniformity**

Ensure each studio uses:
- Board wrapper: `w-full max-w-[350px] mx-auto flex justify-center`.
- Keypad: uniform action buttons and number pills.
- Clean typography for clues and badges.

- [ ] **Step 3: Run web tests and builds**

Run: `npm test && npm run build && npm run build:web`
Expected: PASS with 100% test pass rate and 0 build errors.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/
git commit -m "style(pwa): harmonize studio container widths and touch layouts across all puzzles"
```

---

### Task 6: Whole-Branch Review & Production Deployment

- [ ] **Step 1: Run comprehensive verification**
```bash
npm test && npm run build && npm run build:web
```
- [ ] **Step 2: Verify git status and clean working tree**
```bash
git status
```
- [ ] **Step 3: Request final user review and push to production**
