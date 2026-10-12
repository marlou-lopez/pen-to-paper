# KenKen (Mathdoku) Puzzle Generator & Mobile PWA Studio Design

**Date:** 2026-10-12  
**Status:** Approved by User  
**Target Delivery:** CLI, Tablet Delivery (Local & RMAPI), GitHub Actions, and Mobile PWA Studio  

---

## 1. Overview & Objectives

KenKen (also known as Mathdoku or Calcudoku) is a premier arithmetic logic puzzle that blends Latin-square deduction with cage mathematics. Players must fill an $N \times N$ grid with digits $1 \dots N$ such that no digit repeats in any row or column, while groups of cells bounded by bold lines ("cages") must compute to a specified target number using a given arithmetic operation (`+`, `−`, `×`, `÷`).

This project adds a complete, end-to-end KenKen experience to `pen-to-paper`:
1. **Procedural Latin Square & Cage Generator**: Supports grid sizes from **3×3 up to 9×9**, with intelligent cage partitioning, valid math operations, and a backtracking constraint solver guaranteeing unique solutions.
2. **High-Contrast 3-Page E-Ink PDF Renderer**: Formatted for reMarkable tablets (1404 × 1872 pt) featuring bold cage perimeters, crisp math clue badges, a synchronized spoiler page, and a clean answer key.
3. **CLI, Daily Pack & Tablet Routing Integration**: Automated daily generation (6×6 classic default) routed to `/Puzzles/Daily/` or `/Puzzles/KenKen/`, with archive folder pre-creation and GitHub Actions workflow inputs.
4. **Mobile Zero-Scroll PWA KenKen Studio**: Fully interactive, zero-scroll web studio supporting all sizes (3×3 to 9×9), difficulty levels, hidden solutions by default with reveal/clear toggles, touch keypad, active cage highlighting, and 1-tap tablet delivery.

---

## 2. Architecture & Data Structures

### 2.1 Core Types (`src/puzzles/kenken/types.ts`)

```typescript
export type KenKenOp = '+' | '-' | '*' | '/' | 'none';

export type KenKenDifficulty = 'easy' | 'medium' | 'hard';

export interface KenKenCellCoord {
  row: number; // 0 to size - 1
  col: number; // 0 to size - 1
}

export interface KenKenCage {
  id: number;
  op: KenKenOp;
  target: number;
  cells: KenKenCellCoord[];
}

export interface KenKenData {
  size: number; // 3 to 9 (default 6)
  grid: number[][]; // N x N Latin square solution matrix
  cages: KenKenCage[];
  date: string;
  difficulty: KenKenDifficulty;
}

export interface KenKenOptions {
  size?: number; // 3 to 9, defaults to 6
  difficulty?: KenKenDifficulty; // easy | medium | hard, defaults to medium
  date?: string;
  seed?: number | string;
}
```

---

## 3. Algorithmic Pipeline & Uniqueness Verification

### 3.1 Latin Square Generation
* Generates an $N \times N$ matrix where every row and column contains numbers $1 \dots N$ without duplicates.
* Uses deterministic pseudo-random backtracking seeded by the puzzle date (for daily runs) or timestamp/seed (for on-demand runs).

### 3.2 Contiguous Cage Partitioning
* Unassigned grid cells are grouped into contiguous connected cages using randomized orthogonal flood-fill (checking adjacent unfilled horizontal/vertical neighbors).
* **Cage Size Rules**:
  * **3×3 & 4×4**: Cages restricted to 1–2 cells.
  * **5×5 to 9×9**: Cages can range from 1 to 4 cells (primarily 2–3 cells, max 4 cells).
  * **Single-Cell Anchor Cages**: 1–2 single-cell "given" cages (op `'none'`, target equals the digit) on grids $\ge 5\times 5$ to establish intuitive entry points for solvers.

### 3.3 Operation & Target Assignment
Given the underlying Latin square digits in the cage:
* **Single Cell**: `op: 'none'`, `target: digit`.
* **Two Cells ($a, b$)**:
  * **Division (`/`)**: If $\max(a, b) \pmod{\min(a, b)} === 0$ and difficulty allows division: `target = max / min`.
  * **Subtraction (`-`)**: `target = |a - b|`.
  * **Multiplication (`*`)**: `target = a * b`.
  * **Addition (`+`)**: `target = a + b`.
* **3–4 Cells**:
  * **Multiplication (`*`)**: `target = \prod cells` (if product $\le 500$).
  * **Addition (`+`)**: `target = \sum cells`.

### 3.4 Constraint Solver & Uniqueness Verification (`src/puzzles/kenken/solver.ts`)
* A dedicated recursive backtracking solver with forward checking:
  1. Row and column Latin square uniqueness constraint.
  2. Cage arithmetic constraint: As cells are filled in a cage, checks if the partial assignment can still satisfy the cage operation and target. Once a cage is full, verifies exact arithmetic match.
* **Uniqueness Guarantee**: The generator counts solutions. If more than 1 solution exists, it merges or splits ambiguous cages, or re-seeds until a strictly unique solution ($N_{solutions} = 1$) is achieved.
* **Client-Side Export**: The solver logic is shared or mirrored in `web/src/utils/kenken.ts` for instant client-side validation in the PWA.

---

## 4. E-Ink 3-Page PDF Renderer (`src/puzzles/kenken/renderer.ts`)

### 4.1 Page Layout & Dimensions
* **Canvas**: Standard portrait 1404 × 1872 pt canvas (`PdfBuilder`).
* **Page Margins**: `PAGE_MARGIN = 72 pt`.
* **Cell Scaling**:
  * 3×3 to 4×4: $160–180\text{ pt}$ per cell.
  * 5×5 to 6×6: $110–130\text{ pt}$ per cell.
  * 7×7 to 9×9: $80–95\text{ pt}$ per cell (matching Sudoku grid sizing).
* **Grid Placement**: Perfectly centered horizontally and vertically on Page 1.

### 4.2 High-Contrast Cage Line Drawing
* **Outer Frame**: Solid black border, $3\text{ pt}$ stroke width.
* **Inner Dividers Between Same Cage Cells**: Faint dotted or thin gray line ($0.5\text{ pt}$, `#C8C8C8`).
* **Cage Perimeter Borders**: Heavy solid black lines ($3\text{ pt}$, `#000000`) drawn along any boundary between two cells belonging to different cages.

### 4.3 Cage Math Badges
* Drawn in the top-left corner of the primary anchor cell of each cage (minimum row, then minimum col).
* Clue string: `${target}${opSymbol}` where:
  * `+` $\to$ `+`
  * `-` $\to$ `−`
  * `*` $\to$ `×`
  * `/` $\to$ `÷`
  * `'none'` $\to$ `` (no symbol, just the number)
* Font: `Helvetica-Bold`, size 11–16 pt depending on grid size.
* Positioned in top-left with $4\text{ pt}$ padding so the cell center is completely open for stylus writing.

### 4.4 Page Synchronization
* **Page 1 (Puzzle)**:
  * Header: `KENKEN` with subtitle `${size}x${size} • ${difficulty}` and date.
  * Compact rules instructions at top.
  * Empty grid with bold cage borders and math clue badges.
* **Page 2 (Spoiler Blocker)**:
  * Calls `builder.addBufferPage()` in `src/core/pdf-builder.ts`:
  * Exact synchronized text:
    * `Answer Key on Next Page` (36 pt bold black)
    * `[ Swipe to reveal solution ]` (22 pt regular gray)
* **Page 3 (Solution Key)**:
  * Header: `Answer Key: KenKen (${size}x${size})`.
  * Grid with subtle cage boundaries, faint math badges, and large bold solved numerals ($1 \dots N$) centered in each cell.

---

## 5. CLI, Registry, and Tablet Delivery Routing

### 5.1 Puzzle Registry (`src/core/types.ts` & `src/core/registry.ts`)
* `PuzzleType` union updated to include `'kenken'`:
  ```typescript
  export type PuzzleType = 'word-search' | 'sudoku' | 'mini-crossword' | 'kenken';
  ```
* Registered in `createDefaultRegistry()` with `KenKenGenerator`.
* `--type=all` generates all 4 daily puzzles: Word Search, Sudoku, Mini Crossword, and KenKen (6×6 default).

### 5.2 CLI Orchestration (`src/cli.ts`)
* Accepts:
  * `--type=kenken`
  * `--size=<3-9>` (default `6`)
  * `--difficulty=<easy|medium|hard>` (default `medium`)
  * `--daily`
  * `--upload`
* Filename convention: `KenKen_${size}x${size}_${date}.pdf` (e.g., `KenKen_6x6_2026-10-12.pdf`).

### 5.3 Tablet Delivery Routing
* **LocalDeliveryClient & RmapiDeliveryClient**:
  * Default category folder: `/Puzzles/KenKen/`
  * Daily pack folder: `/Puzzles/Daily/`
  * Archive folder pre-creation: `/Puzzles/Archive/KenKen` automatically ensured during client initialization.

### 5.4 GitHub Actions Workflow (`.github/workflows/daily-puzzles.yml`)
* Add `kenken` to `puzzle_type` dropdown options.
* Add `kenken_size` input (`choice` from `3` to `9`, default `6`).
* Add `kenken_difficulty` input (`choice`: `easy`, `medium`, `hard`, default `medium`).

---

## 6. Mobile Zero-Scroll PWA KenKen Studio (`web/src/components/KenKenStudio.tsx`)

### 6.1 Viewport Architecture
* Single-viewport mobile layout constrained strictly within `h-full max-w-md mx-auto flex flex-col justify-between pt-2 pb-2 safe-bottom px-3 select-none touch-manipulation`.
* Zero vertical scrollbars, zero layout shift on cell selection or input.

### 6.2 Grid & Cage Visuals
* Dynamically sizes cells based on chosen grid size ($N \in [3 \dots 9]$) to fit mobile screens:
  * 3×3 / 4×4: `w-16 h-16`
  * 5×5: `w-14 h-14`
  * 6×6: `w-11 h-11`
  * 7×7: `w-10 h-10`
  * 8×8 / 9×9: `w-8.5 h-8.5`
* Border styles:
  * Outer border: `border-2 border-gray-900`
  * Between different cages: `border-gray-900 border-2`
  * Within the same cage: `border-dashed border-gray-200 border-[0.5px]`
* Active cage highlight: Tapping any cell highlights all cells belonging to that cage in `bg-amber-100` and displays the cage clue banner.

### 6.3 Hidden Solutions by Default & Interactive Solving
* Cells initialize completely empty. Solutions are strictly hidden by default.
* **Utility Subheader Controls**:
  * **`[ 👁️ Reveal ]` / `[ 🙈 Hide ]`**: Toggles visibility of the solved numbers in amber text.
  * **`[ 🧹 Clear ]`**: Clears all user-entered digits.
  * **`[ 🎲 New ]` / `[ ✨ Sample ]`**: Generates or cycles sample puzzles of the selected size.
  * **`🎉 Solved!` badge**: Appears in the utility bar as soon as all cages and Latin square conditions are satisfied.
* **Dual Input System**:
  * **Numeric Touch Keypad**: Renders digits `1` through `N`, `⌫ Backspace`, and `Clear`.
  * **Physical Keyboard**: Number keys `1`–`N`, `Backspace`, `Delete`, and Arrow key navigation.

### 6.4 Controls & 1-Tap Tablet Delivery
* **Grid Size Selector**: Quick pill buttons for `3×3`, `4×4`, `5×5`, `6×6`, `7×7`, `8×8`, `9×9`.
* **Difficulty Selector**: `Easy`, `Medium`, `Hard`.
* **1-Tap Tablet Action Button**: Calls `dispatchWorkflow` with `puzzle_type: 'kenken'`, `kenken_size`, and `kenken_difficulty`. Reads stored `defaultDestination` (`category` vs `daily`) to route appropriately. Shows live GitHub Actions status progress bar.
* **Navigation Integration**:
  * Registered in `PuzzleSelectorModal.tsx` as `🧮 KenKen Studio`.
  * Registered in `App.tsx` header switcher.

---

## 7. Testing & Quality Verification

### 7.1 Backend Unit Tests
* `tests/puzzles/kenken-generator.test.ts`:
  * Validates Latin square row/column uniqueness for sizes 3 through 9.
  * Validates cage partitioning: contiguous connectivity, target computation for all operations (`+`, `-`, `*`, `/`, `none`).
  * Validates uniqueness solver: verifies puzzle has exactly 1 solution.
* `tests/puzzles/kenken-renderer.test.ts`:
  * Validates 3-page PDF output with `%PDF` header.
  * Verifies `builder.addBufferPage()` spoiler page insertion.
  * Verifies page count = 3.
* `tests/cli.test.ts`:
  * Verifies CLI parseArgs handles `--type=kenken`, `--size=N`, and `--difficulty`.
  * Verifies orchestrator generates KenKen on `--type=kenken` and `--type=all`.
  * Verifies tablet routing to `/Puzzles/KenKen` and `/Puzzles/Daily`.
* `tests/delivery/clients.test.ts`:
  * Verifies pre-creation of `/Puzzles/Archive/KenKen`.

### 7.2 Web Unit Tests
* `tests/web/kenken-utils.test.ts`:
  * Grid initialization with empty cells (solutions hidden by default).
  * Latin square conflict detection and cage arithmetic verification.
  * Solver check function returning true for solved state and false for empty/incorrect state.
* `tests/web/settings.test.ts`:
  * Verifies dispatching workflow with `kenken`, `kenken_size`, and `kenken_difficulty`.

---

## 8. Success Criteria
* [x] KenKen generation algorithm generates valid, uniquely solvable puzzles for sizes 3×3 to 9×9.
* [x] High-contrast 3-page PDF produces crisp e-ink output on reMarkable with bold cage outlines.
* [x] Spoiler blocker page is 100% synchronized with Sudoku and Mini Crossword.
* [x] Tablet delivery archives and routes to `/Puzzles/KenKen` or `/Puzzles/Daily`.
* [x] Mobile PWA KenKen Studio fits within `100dvh` zero-scroll mobile layout.
* [x] Solutions are hidden by default in the studio, with reveal toggle, touch keypad, and keyboard support.
* [x] All automated tests pass (`npm test`) and builds compile cleanly (`npm run build && npm run build:web`).
