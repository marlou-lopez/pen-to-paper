# Kakuro (Cross Sums) Puzzle Generator & Mobile Studio Design

**Date:** 2026-10-13  
**Status:** Approved  
**Author:** AI Agent (Pair Programming with User)

---

## 1. Executive Summary & Goals

### 1.1 Overview
Kakuro (often called "Cross Sums" or "Crossword with Numbers") is an iconic Nikoli mathematical logic puzzle. The board consists of a grid containing solid block cells, diagonal split clue cells, and white playable cells. Each white cell belongs to an Across run and a Down run. The goal is to fill all white cells with digits from 1 to 9 such that:
1. The sum of digits in each horizontal run equals its Across clue.
2. The sum of digits in each vertical run equals its Down clue.
3. **No digit may be repeated within the same run.**

### 1.2 Target Experience
1. **Multi-Size Board Topologies:** Supported grid sizes:
   - **6×6 (Quick/Daily):** Compact grid with 3–4 runs across/down, run lengths 2–4. Ideal for quick 5-minute daily solves.
   - **8×8 (Standard - Default):** Classic newspaper format with 6–8 runs across/down, run lengths 2–5.
   - **10×10 (Challenging):** Rich interconnected grid with 10–14 runs across/down, run lengths 2–6.
2. **Three Difficulty Tiers:** Easy, Medium, Hard (calibrated by run lengths and clue sum constraints).
3. **Uniquely Solvable Guarantee:** Every generated puzzle is verified by a constraint satisfaction backtracking solver to ensure exactly one unique solution.
4. **Curated Offline Seed Bank:** 18+ verified handcrafted Kakuro puzzles (covering all sizes and difficulties) for instant deterministic daily generation and offline resilience.
5. **E-Ink 3-Page PDF Renderer:** 1404×1872 pt portrait canvas rendering high-contrast diagonal clue cells, solid black blocks, synchronized Page 2 spoiler blocker, and Page 3 answer key.
6. **Mobile Zero-Scroll PWA Studio (`KakuroStudio.tsx`):** Responsive touch grid fitting within `100dvh` with diagonal split headers, live run sum calculation, duplicate digit highlighting, touch/keyboard input, hidden solutions by default, reveal/clear controls, and 1-tap tablet delivery.
7. **System Orchestration & Tablet Routing:** CLI options `--type=kakuro`, `--size=6|8|10`, `--difficulty=easy|medium|hard`, pre-created archive `/Puzzles/Archive/Kakuro/`, and integration with `--type=all` generating all 5 daily puzzles.

---

## 2. Mathematical Rules, Data Structures & Solver Engine

### 2.1 The Rules of Kakuro
- A grid of dimensions $N \times N$ ($N \in \{6, 8, 10\}$).
- Cell types:
  - `block`: Unplayable background cell.
  - `clue`: Split diagonally from top-left to bottom-right. May specify an `acrossSum` (top-right triangle), a `downSum` (bottom-left triangle), or both.
  - `white`: Playable cell to be filled with an integer digit $d \in \{1, \dots, 9\}$.
- A **Run** is a maximal contiguous line of white cells adjacent to a clue cell:
  - An Across run spans horizontally rightward from a clue cell until blocked.
  - A Down run spans vertically downward from a clue cell until blocked.
- Constraints:
  - Every white cell belongs to exactly one Across run and one Down run.
  - In any run of length $L$ with target sum $S$:
    $$\sum_{i=1}^{L} d_i = S, \quad d_i \in \{1, \dots, 9\}, \quad d_i \neq d_j \text{ for } i \neq j$$
  - Run lengths $L$ must satisfy $2 \le L \le 9$ (in practice, $2 \le L \le 6$ for $6 \le N \le 10$).
  - Minimum sum for length $L$ is $\sum_{i=1}^{L} i = \frac{L(L+1)}{2}$. Maximum sum is $\sum_{i=1}^{L} (10 - i) = \frac{L(19-L)}{2}$.

### 2.2 Core Types (`src/puzzles/kakuro/types.ts`)
```typescript
export type KakuroCellType = 'white' | 'clue' | 'block';

export interface KakuroCell {
  type: KakuroCellType;
  value?: number;       // Current player entry (1–9 or undefined)
  solution?: number;    // Solved digit (1–9 for white cells)
  acrossSum?: number;   // Clue sum for run immediately rightward
  downSum?: number;     // Clue sum for run immediately downward
}

export interface KakuroRun {
  id: string;
  direction: 'across' | 'down';
  clueRow: number;
  clueCol: number;
  targetSum: number;
  cells: [number, number][]; // Coordinates of white cells in this run
}

export type KakuroDifficulty = 'easy' | 'medium' | 'hard';

export interface KakuroData {
  title: string;
  date: string;
  size: number; // 6, 8, or 10
  difficulty: KakuroDifficulty;
  grid: KakuroCell[][];
  runs: KakuroRun[];
}

export interface KakuroOptions {
  size?: number; // 6, 8, or 10 (default 8)
  difficulty?: KakuroDifficulty; // 'easy' | 'medium' | 'hard' (default 'medium')
  date?: string;
}
```

### 2.3 Partition Combinations Helper (`src/puzzles/kakuro/partitions.ts`)
```typescript
/**
 * Returns all combinations of `length` distinct digits from 1 to 9 summing to `sum`.
 * Combinations are sorted in ascending order.
 */
export function getKakuroPartitions(length: number, sum: number): number[][] {
  const results: number[][] = [];
  function backtrack(startDigit: number, current: number[], currentSum: number) {
    if (current.length === length) {
      if (currentSum === sum) {
        results.push([...current]);
      }
      return;
    }
    const remainingCount = length - current.length;
    for (let d = startDigit; d <= 9; d++) {
      // Prune if minimum possible sum exceeds target sum
      const minPossible = currentSum + d + (remainingCount - 1) * (d + 1 + (d + remainingCount - 1)) / 2;
      if (minPossible > sum) break;
      backtrack(d + 1, [...current, d], currentSum + d);
    }
  }
  backtrack(1, [], 0);
  return results;
}
```

### 2.4 Backtracking Constraint Solver (`src/puzzles/kakuro/solver.ts`)
```typescript
/**
 * Solves a Kakuro grid using constraint propagation and backtracking with MRV.
 * Returns array of solutions (each solution is a 2D number array of grid values).
 * A puzzle is valid and unique if solutions.length === 1.
 */
export function solveKakuro(
  grid: KakuroCell[][],
  runs: KakuroRun[],
  maxSolutions = 2
): number[][][]
```
- **Forward Checking & MRV:**
  1. Identifies all unassigned white cells.
  2. For each cell, computes intersecting Across and Down run constraints:
     - Digits already placed in the same Across run cannot be used.
     - Digits already placed in the same Down run cannot be used.
     - Partial run sums plus remaining cells must be able to hit target sums.
  3. Selects the cell with the smallest domain of candidate digits (MRV).
  4. Branches recursively. If number of solutions reaches `maxSolutions`, returns early.

---

## 3. Template Library, Generator & Seed Bank

### 3.1 Symmetrical Template Library (`src/puzzles/kakuro/templates.ts`)
- Pre-defines 180°-rotational-symmetric layouts:
  - 2 templates for 6×6
  - 2 templates for 8×8
  - 2 templates for 10×10
- Includes `extractKakuroRuns(grid: KakuroCell[][]): KakuroRun[]` to compute Across and Down runs automatically:
  - Traverses $(r, c)$ in row-major order.
  - A clue cell with adjacent white cell to the right starts an Across run.
  - A clue cell with adjacent white cell below starts a Down run.
  - Validates that every white cell has both an Across and Down run, and lengths are between 2 and 6.

### 3.2 Procedural Generator (`src/puzzles/kakuro/generator.ts`)
- Implements `PuzzleGenerator<KakuroOptions, KakuroData>`:
  1. Validates options: `size` $\in \{6, 8, 10\}$ (defaults to 8), `difficulty` $\in \{\text{'easy'}, \text{'medium'}, \text{'hard'}\}$ (defaults to `'medium'`).
  2. Selects matching template from `KAKURO_TEMPLATES`.
  3. Fills white cells with random valid digit assignments (1–9 without run duplicates).
  4. Computes target clue sums from assigned digits.
  5. Verifies with `solveKakuro(grid, runs, 2)`.
  6. If unique (`solutions.length === 1`), constructs and returns `KakuroData`.
  7. If backtracking fails to find a unique board after 10 attempts, gracefully falls back to `getSeedKakuro(size, difficulty, date)`.

### 3.3 Curated Seed Bank (`src/puzzles/kakuro/seed-bank.ts`)
- Contains 18 verified handcrafted puzzles:
  - 6×6: 2 Easy, 2 Medium, 2 Hard
  - 8×8: 2 Easy, 2 Medium, 2 Hard
  - 10×10: 2 Easy, 2 Medium, 2 Hard
- `getSeedKakuro(size: number, difficulty: KakuroDifficulty, dateStr: string): KakuroData`
  - Deterministically hashes `dateStr` to pick a seed puzzle.
  - Returns a deep copy with empty player values.

---

## 4. E-Ink 3-Page PDF Renderer (`src/puzzles/kakuro/renderer.ts`)

### 4.1 Layout & Canvas Specs
- **Canvas:** 1404 × 1872 pt portrait canvas via `PdfBuilder`.
- **Dynamic Board Sizing:**
  - 6×6: Cell size 110 pt, board size 660 pt, centered at $(X = 372, Y = 380)$.
  - 8×8: Cell size 90 pt, board size 720 pt, centered at $(X = 342, Y = 350)$.
  - 10×10: Cell size 75 pt, board size 750 pt, centered at $(X = 327, Y = 330)$.
- **Cell Drawing Logic:**
  - `block`: Filled with solid black `#000000`.
  - `clue`:
    - Filled with dark charcoal `#222222`.
    - Diagonal line stroke from top-left `(cellX, cellY)` to bottom-right `(cellX + size, cellY + size)` in 1 pt `#777777`.
    - If `acrossSum`: Bold white text `#FFFFFF` (~16–20 pt) positioned in the upper-right triangle.
    - If `downSum`: Bold white text `#FFFFFF` (~16–20 pt) positioned in the lower-left triangle.
  - `white`:
    - White fill `#FFFFFF` with 1 pt solid border `#000000`.
    - Page 1 (Puzzle): Left blank for stylus input.
    - Page 3 (Answer Key): Solved digit centered in 36–44 pt Helvetica-Bold `#000000`.
- **Instructional Footer:**
  - Crisp footer: *"Kakuro: Fill white cells with digits 1–9. Digits within each run cannot repeat and must sum to the clue."*
- **3-Page Flow:**
  - Page 1: Kakuro Puzzle
  - Page 2: Spoiler Blocker Page (`builder.addBufferPage()`)
  - Page 3: Solved Answer Key (`builder.addAnswerKeyPage('Kakuro')`)

---

## 5. Mobile Zero-Scroll PWA Studio (`KakuroStudio.tsx`)

### 5.1 Interface Specifications
- **Layout:** Contained within zero-scroll `100dvh` container with `.safe-bottom` safe area insets.
- **Top Controls:**
  - Size pills: `6×6`, `8×8`, `10×10`.
  - Difficulty pills: `Easy`, `Medium`, `Hard`.
  - Sample cycle button and Delivery button.
- **Interactive Board:**
  - Clue cells render authentic diagonal split headers using CSS SVG or linear gradients with `acrossSum` in top-right and `downSum` in bottom-left.
  - White cells display current player digit.
  - Tapping a white cell highlights its intersecting Across and Down runs.
  - Run Inspector banner: Displays `Across: Target X (Current Y) | Down: Target A (Current B)`.
  - Duplicate Warning: Highlights white cells in red/amber if the user enters repeating digits in the same run.
- **Input Controls:**
  - Touch keypad (digits 1–9, Backspace, Clear).
  - Physical keyboard support (digits 1–9, Backspace, Arrow navigation).
- **Validation & Delivery:**
  - Solutions hidden by default.
  - "Reveal / Hide Solution" toggle and "Clear Grid" button.
  - Real-time solver validation displays `🎉 Solved!` when all runs are satisfied with unique digits.
  - 1-tap tablet delivery via `dispatchWorkflow` querying stored `defaultDestination`.

---

## 6. CLI, Registry & Tablet Directory Architecture

### 6.1 Registry & Types
- `src/core/types.ts`: Update `PuzzleType = 'word-search' | 'sudoku' | 'mini-crossword' | 'kenken' | 'kakuro'`.
- `src/core/registry.ts`: Register `KakuroGenerator`.

### 6.2 CLI Options (`src/cli.ts`)
- `--type=kakuro`
- `--size=6|8|10` (default 8)
- `--difficulty=easy|medium|hard` (default medium)
- `--type=all`: Generates all 5 puzzles (Word Search, Sudoku, Mini Crossword, KenKen, Kakuro).

### 6.3 Tablet Routing & Delivery
- Active daily inbox: `/Puzzles/Daily/`
- Category folder: `/Puzzles/Kakuro/`
- Archive folder: `/Puzzles/Archive/Kakuro/` (pre-created by `LocalDeliveryClient` and `RmapiDeliveryClient`)
- Workflow update: `.github/workflows/daily-puzzles.yml` adds `kakuro`, `kakuro_size`, `kakuro_difficulty`.
- PWA navigation: Register in `PuzzleSelectorModal.tsx` and `App.tsx`.

---

## 7. Testing & Quality Gates

1. **Partition Helper Tests (`tests/puzzles/kakuro-partitions.test.ts`):**
   - Correct digit combinations for known lengths and sums (e.g. len 2 sum 3 -> [1, 2]; len 2 sum 17 -> [8, 9]; len 3 sum 6 -> [1, 2, 3]).
   - Pruning and boundary checks.
2. **Solver Tests (`tests/puzzles/kakuro-solver.test.ts`):**
   - Solves known Kakuro grids correctly.
   - Detects uniqueness (`solutions.length === 1`) vs multiple solutions.
3. **Template & Run Tests (`tests/puzzles/kakuro-templates.test.ts`):**
   - Validates 180° symmetry on all templates.
   - Run extraction validates every white cell has both an Across and Down run.
4. **Seed Bank Integrity Tests (`tests/puzzles/kakuro-seed.test.ts`):**
   - All 18 seed puzzles have exactly 1 unique solution.
   - Digits in every run are unique and sum exactly to the clue.
   - Date lookup is deterministic.
5. **Renderer Tests (`tests/puzzles/kakuro-renderer.test.ts`):**
   - Validates PDF generation, `%PDF` magic bytes, 3-page count, buffer spoiler page, and solved key.
6. **CLI & Delivery Tests (`tests/cli.test.ts` & `tests/delivery/clients.test.ts`):**
   - CLI generates Kakuro with size and difficulty flags.
   - Pre-creates `/Puzzles/Archive/Kakuro` and routes to `/Puzzles/Kakuro` or `/Puzzles/Daily`.
7. **Web Utilities Tests (`tests/web/kakuro-utils.test.ts`):**
   - Verifies empty grid initialization, live sum calculation, duplicate digit detection, and solved verification.
8. **Build Verification:**
   - `npm test` passing cleanly.
   - `npm run build` and `npm run build:web` with 0 errors.
