# Mini Crossword: Symmetrical Blockers, Distinct Words & Mobile Studio Design

**Date:** 2026-10-13  
**Status:** Approved  
**Author:** AI Agent (Pair Programming with User)

---

## 1. Executive Summary & Goals

### 1.1 Problem Statement
The initial 5×5 Mini Crossword generator created symmetric word squares where row $i$ matched column $i$. As a consequence:
1. Solving Across automatically solved Down because the words were identical.
2. The puzzle contained no black blocker tiles (`#`), which are the defining feature of standard crosswords.
3. Solvers only found 5 words instead of 10 distinct intersecting words.

### 1.2 Target Experience
1. **Authentic Mini Crossword Structure:** Standard 5×5 grid with 180° rotational symmetry containing 2 to 6 black blocker tiles (`#`).
2. **Strictly Distinct Words:** Across and Down words are completely distinct. Every white playable cell belongs to both an Across word and a Down word.
3. **Strict Minimum Word Length:** All words must have length 3, 4, or 5 letters. Strictly **zero** 1-letter or 2-letter words anywhere in the puzzle.
4. **Standard Crossword Numbering:** Cells starting an Across or Down word are numbered sequentially from top-left to bottom-right in row-major order.
5. **High-Quality Content:** Handcrafted seed bank of 20+ verified 5×5 crosswords with real clues, paired with a Datamuse-powered dynamic generator for custom themes and offline resilience.
6. **E-Ink Tablet PDF:** 1404×1872 pt portrait canvas rendering solid black blocker tiles, high-contrast clue lists, and a synchronized 3-page format (Page 1 = Puzzle, Page 2 = Spoiler Blocker, Page 3 = Answer Key).
7. **Mobile Zero-Scroll PWA Studio:** Interactive touch/keyboard grid rendering solid unclickable blocker tiles, auto-advance skipping black tiles, active clue inspector, hidden solutions by default, reveal/clear controls, and 1-tap tablet delivery.

---

## 2. Mathematical Template Validation & Symmetrical Grids

### 2.1 The Minimum Word Length Constraint
In a 5×5 grid, placing a black blocker (`#`) in an interior cell (rows 1–3, columns 1–3) splits a 5-cell line into either:
- $1 + 3$ (creating an illegal 1-letter unplayable cell), or
- $2 + 2$ (creating illegal 2-letter words).

Therefore, in a 5×5 crossword with words of length $\ge 3$, black blocker tiles must be placed strictly in corner/edge configurations.

### 2.2 The 9 Verified 180°-Symmetric Templates
There are exactly 9 mathematically valid 180°-rotational-symmetric layouts with 2 to 6 blockers where every single Across and Down word has length 3, 4, or 5:

1. **Template 1 (2 Corner Blockers - 10 words, lengths 4-5):**
   ```
   # . . . .
   . . . . .
   . . . . .
   . . . . .
   . . . . #
   ```
   Across: 4, 5, 5, 5, 4 | Down: 4, 5, 5, 5, 4

2. **Template 2 (4 Corner Blockers - 10 words, lengths 3-5):**
   ```
   # # . . .
   . . . . .
   . . . . .
   . . . . .
   . . . # #
   ```
   Across: 3, 5, 5, 5, 3 | Down: 4, 4, 5, 4, 4

3. **Template 3 (2 Alternate Corner Blockers - 10 words, lengths 4-5):**
   ```
   . . . . #
   . . . . .
   . . . . .
   . . . . .
   # . . . .
   ```
   Across: 4, 5, 5, 5, 4 | Down: 4, 5, 5, 5, 4

4. **Template 4 (4 Quad-Corner Blockers - 10 words, lengths 3-5):**
   ```
   # . . . #
   . . . . .
   . . . . .
   . . . . .
   # . . . #
   ```
   Across: 3, 5, 5, 5, 3 | Down: 3, 5, 5, 5, 3

5. **Template 5 (4 Staggered Doublets - 10 words, lengths 3-5):**
   ```
   . . . # #
   . . . . .
   . . . . .
   . . . . .
   # # . . .
   ```
   Across: 3, 5, 5, 5, 3 | Down: 4, 4, 5, 4, 4

6. **Template 6 (4 Vertical Corner Doublets - 10 words, lengths 3-5):**
   ```
   # . . . .
   # . . . .
   . . . . .
   . . . . #
   . . . . #
   ```
   Across: 4, 4, 5, 4, 4 | Down: 3, 5, 5, 5, 3

7. **Template 7 (6 L-Corner Blockers - 10 words, lengths 3-5):**
   ```
   # # . . .
   # . . . .
   . . . . .
   . . . . #
   . . . # #
   ```
   Across: 3, 4, 5, 4, 3 | Down: 3, 4, 5, 4, 3

8. **Template 8 (4 Vertical Alt-Corner Doublets - 10 words, lengths 3-5):**
   ```
   . . . . #
   . . . . #
   . . . . .
   # . . . .
   # . . . .
   ```
   Across: 4, 4, 5, 4, 4 | Down: 3, 5, 5, 5, 3

9. **Template 9 (6 Staggered L-Corner Blockers - 10 words, lengths 3-5):**
   ```
   . . . # #
   . . . . #
   . . . . .
   # . . . .
   # # . . .
   ```
   Across: 3, 4, 5, 4, 3 | Down: 3, 4, 5, 4, 3

---

## 3. Architecture & Data Structures

### 3.1 Type Definitions (`src/puzzles/mini-crossword/types.ts`)
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
  // 5x5 grid containing solution uppercase letters or '#' for black blockers
  grid: string[][];
  acrossClues: CrosswordClue[];
  downClues: CrosswordClue[];
}

export interface MiniCrosswordOptions {
  theme?: string;
  date?: string;
}
```

### 3.2 Dynamic Crossword Numbering (`src/puzzles/mini-crossword/numbering.ts`)
```typescript
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

---

## 4. Handcrafted Seed Bank & Dynamic Generator

### 4.1 Handcrafted Seed Bank (`src/puzzles/mini-crossword/seed-bank.ts`)
- Contains **20+ curated, verified 5×5 blocked crosswords**.
- Each puzzle utilizes one of the 9 valid templates.
- **Strictly Distinct Words:** Across and Down words never overlap ($A_i \neq D_j$ for all $i, j$).
- Real, human-written clues across diverse topics (Space, Oceans, Wildlife, Mythology, Science, Food, Tech, Geography).
- Deterministic date selector `getSeedCrosswordForDate(date: string): MiniCrosswordData`.

### 4.2 Datamuse Thematic Generator (`src/puzzles/mini-crossword/generator.ts`)
- Queries Datamuse API: `https://api.datamuse.com/words?topics={theme}&md=d` to fetch candidate 3-, 4-, and 5-letter words with definitions.
- Intersecting Backtracking Slot Filler:
  1. Selects a template.
  2. Extracts slots using `calculateCrosswordNumbering`.
  3. Sorts slots by number of intersections / constraints.
  4. Fills candidate words checking intersecting letters.
  5. Validates word uniqueness across all 10 slots.
- **Fail-Safe Fallback:** If Datamuse fails, network times out (5000ms), or backtracking fails to solve within 3 attempts, immediately and seamlessly returns `getSeedCrosswordForDate(date)`.

---

## 5. E-Ink 3-Page PDF Renderer (`src/puzzles/mini-crossword/renderer.ts`)

### 5.1 PDF Specifications
- reMarkable standard: 1404 × 1872 pt portrait canvas.
- Grid: 500 × 500 pt ($100 \times 100$ pt per cell), centered at top margin.
- **Black Blocker Cells (`#`):** Solid filled black (`#000000`). No text or interior numbers.
- **Playable Cells:** 1 pt `#555555` stroke, 14 pt Helvetica clue number in top-left.
- **Answer Key (Page 3):** Solved letters in 46 pt Helvetica-Bold (`#000000`). Blocker cells remain solid black.
- **Spoiler Blocker (Page 2):** Injected via `builder.addBufferPage()` to protect answer key from accidental swipe-reveals.
- **Clue Typography:** 24 pt headers (`ACROSS`, `DOWN`) with 1.5 pt underline, 20 pt high-contrast clue entries below grid.

---

## 6. Mobile Zero-Scroll PWA Studio (`MiniCrosswordStudio.tsx`)

### 6.1 UI & Interaction Specifications
- Fits strictly within mobile zero-scroll `100dvh` container with `.safe-bottom` safe area insets.
- **Grid Rendering:**
  - `#` cells rendered as solid dark blocker tiles (`bg-stone-900 border-stone-800`), unselectable and inert.
  - White playable cells display dynamic clue number in top-left and entered letter in center.
  - Active cell highlighted in yellow; current word highlighted in blue/tint.
- **Controls & Navigation:**
  - Tapping a playable cell selects it; second tap toggles between Across and Down.
  - Typing a letter fills the cell and auto-advances to the next white cell in the active word, skipping any blocker cells.
  - Arrow keys move between playable cells, automatically bypassing black blocker tiles.
  - Clue Inspector banner displays current clue with `Prev` and `Next` buttons navigating through valid clues.
  - Solutions hidden by default on initial render and sample cycling.
  - "Reveal / Hide Solution" toggle and "Clear Grid" button.
  - `isCrosswordSolved` verifies user entries against solution letters on playable cells only, displaying `🎉 Solved!` when complete.
- **Tablet Delivery:** 1-tap dispatch to GitHub Actions workflow via stored `defaultDestination`.

---

## 7. Testing & Verification Plan

1. **Numbering Tests (`tests/puzzles/mini-crossword-numbering.test.ts`):**
   - Test `calculateCrosswordNumbering` across all 9 templates.
   - Verify all Across and Down slots have length $\ge 3$.
   - Verify every playable cell has both an Across slot and a Down slot.
2. **Seed Bank Integrity (`tests/puzzles/mini-crossword-seed-bank.test.ts`):**
   - Verify all 20+ seed puzzles contain valid grids matching valid templates.
   - Verify all Across and Down words are distinct ($A_i \neq D_j$).
   - Verify all clues are populated and match word lengths.
   - Verify `getSeedCrosswordForDate` is deterministic.
3. **Generator Tests (`tests/puzzles/mini-crossword-generator.test.ts`):**
   - Verify offline fallback produces valid distinct-word blocked puzzles.
   - Verify Datamuse integration produces valid blocked grids when network mocked.
4. **Renderer Tests (`tests/puzzles/mini-crossword-renderer.test.ts`):**
   - Verify generated PDF has 3 pages, `%PDF` magic bytes, solid black blockers, buffer page, and answer key.
5. **Web Utility Tests (`tests/web/crossword-utils.test.ts`):**
   - Test `createEmptyCrosswordGrid` with blockers.
   - Test `isCrosswordSolved` correctly ignores `#` blockers and requires exact letter matches.
6. **Full Build & Verification:**
   - Run `npm test`.
   - Run `npm run build` (CLI and library).
   - Run `npm run build:web` (Vite PWA production build).
