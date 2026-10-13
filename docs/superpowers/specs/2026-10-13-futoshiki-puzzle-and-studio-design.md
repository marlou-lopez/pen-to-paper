# Futoshiki (Inequality Latin Square) Puzzle Generator & Mobile Studio Design

## 1. Overview & Goals

Futoshiki (Japanese for "inequality" or "not equal") is a deductive logic puzzle played on an $N \times N$ square grid. The objective is to fill the grid with numbers from $1$ to $N$ such that:
1. Each row and each column contains every digit from $1$ to $N$ exactly once (Latin square constraint).
2. All inequality signs ($<, >, \wedge, \vee$) specified between adjacent cells are strictly respected.
3. The puzzle possesses exactly one unique mathematical solution.

This project delivers:
- **Core Puzzle Engine**: Constraint satisfaction solver (MRV + Arc Consistency / Forward Checking), procedural Latin square generator with difficulty progression, and an offline bank of 18 handcrafted, verified seed puzzles.
- **E-Ink 3-Page PDF Renderer**: High-contrast 1404×1872 pt portrait canvas tailored for reMarkable tablets (Page 1 = Puzzle, Page 2 = Spoiler buffer page, Page 3 = Answer key).
- **CLI & Delivery Integration**: Command-line orchestration (`--type=futoshiki`, `--size=4|5|6`, `--difficulty=easy|medium|hard`), category routing (`/Puzzles/Futoshiki`), pre-created archive directory (`/Puzzles/Archive/Futoshiki`), and `--type=all` daily batch expansion to 6 puzzles.
- **Mobile Zero-Scroll PWA Studio**: Interactive React studio (`FutoshikiStudio.tsx`) fitting `100dvh` with `.safe-bottom` insets, chevron badges, live error highlighting (row/col duplicates & broken inequalities), adaptive touch keypad ($1 \dots N$), solutions hidden by default, and 1-tap tablet delivery.

---

## 2. Core Architecture & Interfaces

### 2.1 Types (`src/puzzles/futoshiki/types.ts`)
```typescript
export type FutoshikiDifficulty = 'easy' | 'medium' | 'hard';

export interface FutoshikiInequality {
  row1: number;
  col1: number;
  row2: number;
  col2: number;
  relation: '<' | '>'; // Cell(row1, col1) < Cell(row2, col2) or >
}

export interface FutoshikiData {
  size: 4 | 5 | 6; // Grid dimension (N x N)
  initialGrid: number[][]; // 0 for empty cell, 1..N for given clue numbers
  solution: number[][]; // Solved 1..N Latin square
  inequalities: FutoshikiInequality[]; // Relational inequality constraints
  difficulty: FutoshikiDifficulty;
  dateStr?: string;
}

export interface FutoshikiOptions {
  size?: number; // default: 5 (clamped to 4, 5, or 6)
  difficulty?: FutoshikiDifficulty | string; // default: 'medium'
  date?: string;
  theme?: string;
}
```

---

## 3. Solver Algorithm (`src/puzzles/futoshiki/solver.ts`)

The solver finds all valid solutions for any grid configuration and inequality set:
1. **Domain Initialization**:
   - Each empty cell $(r, c)$ starts with domain $\{1, 2, \dots, N\}$.
   - Given cells start with singleton domain $\{d\}$.
2. **Constraint Propagation (AC-3 / Forward Checking)**:
   - **Row & Column Uniqueness**: When a cell's domain becomes size 1 with value $d$, remove $d$ from all peers in the same row and column.
   - **Inequality Domain Pruning**: For every inequality $(r_1, c_1) < (r_2, c_2)$:
     - Values in $\text{domain}_1 \ge \max(\text{domain}_2)$ are pruned.
     - Values in $\text{domain}_2 \le \min(\text{domain}_1)$ are pruned.
   - Repeat until domains stabilize. If any domain becomes empty, trigger immediate backtrack.
3. **MRV (Minimum Remaining Values) Backtracking**:
   - Select the unassigned cell with the smallest domain size ($|\text{domain}| \ge 2$).
   - Assign candidate values and recursively solve.
4. **Uniqueness Gate**:
   - `solveFutoshiki(initialGrid, inequalities, maxSolutions = 2)` halts as soon as 2 solutions are found. A puzzle is valid if and only if `solutions.length === 1`. Search terminates in $<5$ ms for grids up to 6×6.

---

## 4. Generator & Seed Bank

### 4.1 Procedural Generator (`src/puzzles/futoshiki/generator.ts`)
1. **Latin Square Synthesis**: Generate a solved $N \times N$ Latin square using randomized candidates.
2. **Relation Extraction**: Extract all $2N(N-1)$ horizontal and vertical adjacent pairs:
   - Horizontal: $(r, c) \leftrightarrow (r, c+1)$ for $r \in [0, N-1], c \in [0, N-2]$
   - Vertical: $(r, c) \leftrightarrow (r+1, c)$ for $r \in [0, N-2], c \in [0, N-1]$
3. **Difficulty Tuning**:
   - **Easy**: ~30–40% given numbers, 40–50% of available inequalities placed. Single-step deductions.
   - **Medium**: ~15–25% given numbers, 30–40% of available inequalities placed. Multi-step inequality chains.
   - **Hard**: 1–3 given numbers, 25–35% of available inequalities placed forming tight deduction bottlenecks (forcing boundary values $1$ and $N$).
4. **Iterative Minimization**:
   - Remove redundant numbers and inequalities while maintaining uniqueness verified by `solveFutoshiki`.
5. **Fallback**: If procedural generation times out (100ms cap), fallback to `getSeedFutoshiki`.

### 4.2 Handcrafted Seed Bank (`src/puzzles/futoshiki/seed-bank.ts`)
- Contains **18 handcrafted, verified puzzles**:
  - Size 4×4: 2 Easy, 2 Medium, 2 Hard (6 puzzles)
  - Size 5×5: 2 Easy, 2 Medium, 2 Hard (6 puzzles)
  - Size 6×6: 2 Easy, 2 Medium, 2 Hard (6 puzzles)
- Every seed puzzle is mathematically verified in tests to have exactly 1 unique solution.
- `getSeedFutoshiki(size, difficulty, dateStr)` provides deterministic deep-copied puzzles based on the date.

---

## 5. E-Ink 3-Page PDF Renderer (`src/puzzles/futoshiki/renderer.ts`)

- **Canvas**: Standard reMarkable portrait format (1404 × 1872 pt).
- **Page 1 (Puzzle)**:
  - Header: "FUTOSHIKI" title, size badge, difficulty badge, date.
  - Grid: Centered $N \times N$ grid with dynamic cell sizes:
    - 4×4: ~150 pt cell size, ~40 pt inter-cell gutter.
    - 5×5: ~125 pt cell size, ~35 pt inter-cell gutter.
    - 6×6: ~105 pt cell size, ~30 pt inter-cell gutter.
  - Cells: White squares with 2pt solid black borders. Given numbers rendered in bold 48–60pt Helvetica-Bold.
  - Inequalities: Crisp centered chevron glyphs ($<, >, \wedge, \vee$) positioned midway in inter-cell gutters.
  - Footer: Clear rules and deduction instructions.
- **Page 2 (Spoiler Blocker)**:
  - Synchronized buffer page via `builder.addBufferPage()` ("Pen to Paper / Spoiler Warning / Turn to Page 3 for Solutions").
- **Page 3 (Answer Key)**:
  - Header: "FUTOSHIKI — SOLUTION".
  - Grid: Complete solved Latin square with all numbers in bold black text and inequality signs preserved.

---

## 6. CLI, Delivery & GitHub Actions Integration

- **Central Registry (`src/core/registry.ts`)**:
  - Register `FutoshikiGenerator` under ID `'futoshiki'`.
- **CLI (`src/cli.ts`)**:
  - Support `--type=futoshiki`.
  - Parse `--size=4|5|6` (clamped, default: 5).
  - Parse `--difficulty=easy|medium|hard` (default: medium).
  - Include `futoshiki` in `--type=all` (now generating all 6 daily puzzles: Word Search, Sudoku, Mini Crossword, KenKen, Kakuro, Futoshiki).
  - Route category runs to `/Puzzles/Futoshiki` and daily runs to `/Puzzles/Daily`.
- **Archive Pre-Creation**:
  - `LocalDeliveryClient` and `RmapiDeliveryClient` pre-create `/Puzzles/Archive/Futoshiki`.
- **Workflow (`.github/workflows/daily-puzzles.yml`)**:
  - Add `futoshiki`, `futoshiki_size`, and `futoshiki_difficulty` inputs.
- **Documentation**:
  - Document Futoshiki in `README.md`.

---

## 7. Mobile Zero-Scroll PWA Studio (`FutoshikiStudio.tsx`)

- **Layout**: Strictly zero-scroll fitting `100dvh` with `.safe-bottom` safe area insets.
- **Header**:
  - Puzzle title badge ("Futoshiki").
  - Size pills (4×4, 5×5, 6×6) and difficulty pills (Easy, Medium, Hard).
  - 1-tap tablet delivery button (`Send to Tablet`).
- **Action Controls**:
  - "Sample" button to cycle through verified seed puzzles.
  - "Clear" button to wipe user entries (preserving given clues).
  - "Reveal" toggle to view solutions (hidden by default on load, size change, difficulty change, sample cycling).
- **Interactive Grid & Chevrons**:
  - Given cells locked and visually distinguished.
  - Editable cells selectable with high-contrast active ring.
  - Chevrons ($<, >, \wedge, \vee$) placed in inter-cell slots.
- **Live Real-Time Feedback**:
  - Conflicting duplicate numbers in any row or column highlight in soft red (`bg-red-50 text-red-600 border-red-300`).
  - Violated inequalities highlight in soft red on the chevron and both adjacent cells.
  - Solved badge (🎉 **Solved!**) when board is complete and valid.
- **Keypad & Inputs**:
  - Adaptive touch keypad showing digits $1 \dots N$, Backspace, and Clear.
  - Physical keyboard support (1..N, Backspace, Arrows).
- **Navigation Registration**:
  - Registered in `PuzzleSelectorModal.tsx` and `App.tsx` header switcher.

---

## 8. Verification & Testing Strategy

- `tests/puzzles/futoshiki-solver.test.ts`:
  - Solves valid Futoshiki boards with known unique solutions.
  - Detects unsolvable boards and multiple solutions.
  - Respects inequality domain pruning.
- `tests/puzzles/futoshiki-templates.test.ts` / `tests/puzzles/futoshiki-seed.test.ts`:
  - Verifies all 18 seed puzzles have valid Latin square solutions, valid inequalities, and strictly unique solutions via `solveFutoshiki`.
- `tests/puzzles/futoshiki-generator.test.ts`:
  - Tests procedural generator for sizes 4, 5, 6 across easy, medium, hard.
  - Verifies non-empty initial grids, valid solutions, and uniqueness.
- `tests/puzzles/futoshiki-renderer.test.ts`:
  - Verifies 3-page PDF generation (puzzle page, buffer page, answer key).
- `tests/cli.test.ts`:
  - Verifies `--type=futoshiki` routing to `/Puzzles/Futoshiki` and `--daily` to `/Puzzles/Daily`.
  - Verifies `--type=all` generates all 6 puzzles.
- `tests/web/futoshiki-utils.test.ts`:
  - Tests `createEmptyFutoshikiGrid`, `findFutoshikiViolations`, and `isFutoshikiSolved`.
- Total test suite target: 100% pass rate across CLI and Web.
