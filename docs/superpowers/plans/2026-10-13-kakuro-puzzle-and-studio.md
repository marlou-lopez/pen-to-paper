# Kakuro (Cross Sums) Puzzle Generator & Mobile Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Kakuro ("Cross Sums" / "Crossword with Numbers") puzzle generator, e-ink 3-page PDF renderer for reMarkable, CLI/tablet delivery with pre-created archives, and zero-scroll mobile PWA studio supporting 6×6, 8×8, and 10×10 grids across Easy, Medium, and Hard difficulty levels.

**Architecture:**
- `types.ts`, `partitions.ts`, and `solver.ts`: Define grid models, precomputed unique digit partition logic, and an exact constraint satisfaction backtracking solver with MRV.
- `templates.ts`, `seed-bank.ts`, and `generator.ts`: Symmetrical layout templates, 18+ verified unique handcrafted seeds, and a procedural backtracking generator conforming to `PuzzleGenerator`.
- `renderer.ts`: 3-page e-ink PDF builder (1404×1872 pt) rendering solid black blocks, diagonal split clue cells with white sum badges, spoiler blocker page, and bold solved digits on the answer key.
- `cli.ts`, `registry.ts`, and delivery clients: Command line orchestration (`--type=kakuro`, `--size`, `--difficulty`), tablet folder routing (`/Puzzles/Kakuro` and `/Puzzles/Archive/Kakuro`), and workflow automation.
- `web/src/utils/kakuro.ts` and `KakuroStudio.tsx`: Zero-scroll `100dvh` mobile studio with diagonal split headers, live run sum calculation, duplicate digit highlighting, touch/keyboard input, hidden solutions by default, reveal/clear toggles, and 1-tap tablet delivery.

**Tech Stack:** TypeScript (strict mode), Node.js, PDFKit, Vitest, React 18, Vite, Tailwind CSS, Lucide React, GitHub Actions.

## Global Constraints

- Supported grid sizes: 6×6 (Quick/Daily), 8×8 (Standard - Default), and 10×10 (Challenging).
- Difficulty tiers: `easy`, `medium`, `hard`.
- Digits in playable white cells: integers from 1 to 9.
- Uniqueness per run: No duplicate digits in any Across or Down run.
- Canvas format: Standard reMarkable 1404 × 1872 pt portrait canvas.
- PDF structure: 3 pages (Page 1 = Puzzle, Page 2 = Spoiler Blocker via `builder.addBufferPage()`, Page 3 = Answer Key).
- High-contrast e-ink monochrome rendering: pure black `#000000`, dark charcoal `#222222`, white `#FFFFFF`.
- Tablet folders: `/Puzzles/Daily/` (automated daily), `/Puzzles/Kakuro/` (manual category), `/Puzzles/Archive/Kakuro/` (archive).
- PWA layout: Zero-scroll mobile layout fitting within `100dvh` with `.safe-bottom` safe area insets. Solutions hidden by default.
- Verification: All tests and TypeScript builds must pass: `npm test && npm run build && npm run build:web`.

---

### Task 1: Core Types, Partition Helper & Constraint Solver

**Files:**
- Create: `src/puzzles/kakuro/types.ts`
- Create: `src/puzzles/kakuro/partitions.ts`
- Create: `src/puzzles/kakuro/solver.ts`
- Create: `tests/puzzles/kakuro-partitions.test.ts`
- Create: `tests/puzzles/kakuro-solver.test.ts`

**Interfaces:**
- Produces: `KakuroCellType`, `KakuroCell`, `KakuroRun`, `KakuroDifficulty`, `KakuroData`, `KakuroOptions`, `getKakuroPartitions(length: number, sum: number): number[][]`, `solveKakuro(grid: KakuroCell[][], runs: KakuroRun[], maxSolutions?: number): number[][][]`.

- [ ] **Step 1: Write failing tests for partitions and solver**

Create `tests/puzzles/kakuro-partitions.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { getKakuroPartitions } from '../../src/puzzles/kakuro/partitions.ts';

describe('Kakuro Partitions Helper', () => {
  it('returns exact unique digit combinations for known sums', () => {
    // 2-cell runs
    expect(getKakuroPartitions(2, 3)).toEqual([[1, 2]]);
    expect(getKakuroPartitions(2, 4)).toEqual([[1, 3]]); // 2+2 is forbidden
    expect(getKakuroPartitions(2, 17)).toEqual([[8, 9]]);

    // 3-cell runs
    expect(getKakuroPartitions(3, 6)).toEqual([[1, 2, 3]]);
    expect(getKakuroPartitions(3, 24)).toEqual([[7, 8, 9]]);
  });

  it('returns empty array for impossible sums or lengths', () => {
    expect(getKakuroPartitions(2, 2)).toEqual([]); // min sum for len 2 is 1+2=3
    expect(getKakuroPartitions(2, 18)).toEqual([]); // max sum for len 2 is 8+9=17
    expect(getKakuroPartitions(0, 5)).toEqual([]);
    expect(getKakuroPartitions(10, 50)).toEqual([]); // digits 1..9 only allows max length 9
  });
});
```

Create `tests/puzzles/kakuro-solver.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { solveKakuro } from '../../src/puzzles/kakuro/solver.ts';
import { KakuroCell, KakuroRun } from '../../src/puzzles/kakuro/types.ts';

describe('Kakuro Constraint Solver', () => {
  it('solves a simple 3x3 mini Kakuro grid with a unique solution', () => {
    // Grid:
    // [block]     [clue D:4]  [clue D:3]
    // [clue A:3]  [white]     [white]
    // [clue A:4]  [white]     [white]
    // Unique solution: (1,1)=1, (1,2)=2, (2,1)=3, (2,2)=1
    const grid: KakuroCell[][] = [
      [{ type: 'block' }, { type: 'clue', downSum: 4 }, { type: 'clue', downSum: 3 }],
      [{ type: 'clue', acrossSum: 3 }, { type: 'white' }, { type: 'white' }],
      [{ type: 'clue', acrossSum: 4 }, { type: 'white' }, { type: 'white' }],
    ];

    const runs: KakuroRun[] = [
      { id: 'A1', direction: 'across', clueRow: 1, clueCol: 0, targetSum: 3, cells: [[1, 1], [1, 2]] },
      { id: 'A2', direction: 'across', clueRow: 2, clueCol: 0, targetSum: 4, cells: [[2, 1], [2, 2]] },
      { id: 'D1', direction: 'down', clueRow: 0, clueCol: 1, targetSum: 4, cells: [[1, 1], [2, 1]] },
      { id: 'D2', direction: 'down', clueRow: 0, clueCol: 2, targetSum: 3, cells: [[1, 2], [2, 2]] },
    ];

    const solutions = solveKakuro(grid, runs, 2);
    expect(solutions).toHaveLength(1);
    expect(solutions[0][1][1]).toBe(1);
    expect(solutions[0][1][2]).toBe(2);
    expect(solutions[0][2][1]).toBe(3);
    expect(solutions[0][2][2]).toBe(1);
  });

  it('detects multiple solutions when ambiguous clues are provided', () => {
    // 2x2 white cell loop without unique constraints
    const grid: KakuroCell[][] = [
      [{ type: 'block' }, { type: 'clue', downSum: 6 }, { type: 'clue', downSum: 6 }],
      [{ type: 'clue', acrossSum: 6 }, { type: 'white' }, { type: 'white' }],
      [{ type: 'clue', acrossSum: 6 }, { type: 'white' }, { type: 'white' }],
    ];

    const runs: KakuroRun[] = [
      { id: 'A1', direction: 'across', clueRow: 1, clueCol: 0, targetSum: 6, cells: [[1, 1], [1, 2]] },
      { id: 'A2', direction: 'across', clueRow: 2, clueCol: 0, targetSum: 6, cells: [[2, 1], [2, 2]] },
      { id: 'D1', direction: 'down', clueRow: 0, clueCol: 1, targetSum: 6, cells: [[1, 1], [2, 1]] },
      { id: 'D2', direction: 'down', clueRow: 0, clueCol: 2, targetSum: 6, cells: [[1, 2], [2, 2]] },
    ];

    const solutions = solveKakuro(grid, runs, 2);
    expect(solutions.length).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/puzzles/kakuro-partitions.test.ts tests/puzzles/kakuro-solver.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement types, partitions, and solver**

Create `src/puzzles/kakuro/types.ts`:
```typescript
export type KakuroCellType = 'white' | 'clue' | 'block';

export interface KakuroCell {
  type: KakuroCellType;
  value?: number;
  solution?: number;
  acrossSum?: number;
  downSum?: number;
}

export interface KakuroRun {
  id: string;
  direction: 'across' | 'down';
  clueRow: number;
  clueCol: number;
  targetSum: number;
  cells: [number, number][];
}

export type KakuroDifficulty = 'easy' | 'medium' | 'hard';

export interface KakuroData {
  title: string;
  date: string;
  size: number;
  difficulty: KakuroDifficulty;
  grid: KakuroCell[][];
  runs: KakuroRun[];
}

export interface KakuroOptions {
  size?: number;
  difficulty?: KakuroDifficulty;
  date?: string;
}
```

Create `src/puzzles/kakuro/partitions.ts`:
```typescript
export function getKakuroPartitions(length: number, sum: number): number[][] {
  if (length <= 0 || length > 9 || sum <= 0) return [];
  const minSum = (length * (length + 1)) / 2;
  const maxSum = (length * (19 - length)) / 2;
  if (sum < minSum || sum > maxSum) return [];

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
      const minPossible = currentSum + d + (remainingCount - 1) * (2 * d + remainingCount) / 2;
      if (minPossible > sum) break;

      backtrack(d + 1, [...current, d], currentSum + d);
    }
  }

  backtrack(1, [], 0);
  return results;
}
```

Create `src/puzzles/kakuro/solver.ts`:
```typescript
import { KakuroCell, KakuroRun } from './types.js';

export function solveKakuro(
  grid: KakuroCell[][],
  runs: KakuroRun[],
  maxSolutions = 2
): number[][][] {
  const rows = grid.length;
  const cols = grid[0].length;

  const currentGrid: (number | null)[][] = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) =>
      grid[r][c].type === 'white' ? (grid[r][c].value ?? null) : null
    )
  );

  const whiteCells: [number, number][] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c].type === 'white') {
        whiteCells.push([r, c]);
      }
    }
  }

  // Pre-index runs touching each cell
  const cellRuns = new Map<string, { across?: KakuroRun; down?: KakuroRun }>();
  for (const cell of whiteCells) {
    const key = `${cell[0]},${cell[1]}`;
    cellRuns.set(key, {});
  }
  for (const run of runs) {
    for (const [r, c] of run.cells) {
      const entry = cellRuns.get(`${r},${c}`);
      if (entry) {
        if (run.direction === 'across') entry.across = run;
        else entry.down = run;
      }
    }
  }

  const solutions: number[][][] = [];

  function isRunValid(run: KakuroRun): boolean {
    const digits: number[] = [];
    let sum = 0;
    let unfilled = 0;

    for (const [r, c] of run.cells) {
      const val = currentGrid[r][c];
      if (val === null) {
        unfilled++;
      } else {
        if (digits.includes(val)) return false; // Duplicate digit
        digits.push(val);
        sum += val;
      }
    }

    if (sum > run.targetSum) return false;
    if (unfilled === 0 && sum !== run.targetSum) return false;

    // Feasibility check: Can remaining unfilled cells mathematically reach targetSum?
    if (unfilled > 0) {
      const remainingSum = run.targetSum - sum;
      const availableDigits: number[] = [];
      for (let d = 1; d <= 9; d++) {
        if (!digits.includes(d)) availableDigits.push(d);
      }
      if (availableDigits.length < unfilled) return false;

      let minPossible = 0;
      for (let i = 0; i < unfilled; i++) minPossible += availableDigits[i];
      if (minPossible > remainingSum) return false;

      let maxPossible = 0;
      for (let i = 0; i < unfilled; i++) {
        maxPossible += availableDigits[availableDigits.length - 1 - i];
      }
      if (maxPossible < remainingSum) return false;
    }

    return true;
  }

  function getCandidates(r: number, c: number): number[] {
    const entry = cellRuns.get(`${r},${c}`);
    const usedDigits = new Set<number>();

    if (entry?.across) {
      for (const [ar, ac] of entry.across.cells) {
        const v = currentGrid[ar][ac];
        if (v !== null) usedDigits.add(v);
      }
    }
    if (entry?.down) {
      for (const [dr, dc] of entry.down.cells) {
        const v = currentGrid[dr][dc];
        if (v !== null) usedDigits.add(v);
      }
    }

    const candidates: number[] = [];
    for (let d = 1; d <= 9; d++) {
      if (usedDigits.has(d)) continue;
      currentGrid[r][c] = d;
      let valid = true;
      if (entry?.across && !isRunValid(entry.across)) valid = false;
      if (valid && entry?.down && !isRunValid(entry.down)) valid = false;
      currentGrid[r][c] = null;
      if (valid) candidates.push(d);
    }

    return candidates;
  }

  function backtrack() {
    if (solutions.length >= maxSolutions) return;

    // Pick unassigned cell with MRV (fewest candidates)
    let bestCell: [number, number] | null = null;
    let bestCandidates: number[] | null = null;

    for (const [r, c] of whiteCells) {
      if (currentGrid[r][c] !== null) continue;
      const candidates = getCandidates(r, c);
      if (candidates.length === 0) return; // Dead end

      if (bestCandidates === null || candidates.length < bestCandidates.length) {
        bestCell = [r, c];
        bestCandidates = candidates;
        if (candidates.length === 1) break; // Optimal choice
      }
    }

    if (bestCell === null) {
      // All white cells filled successfully!
      const sol: number[][] = currentGrid.map((row) =>
        row.map((val) => (val === null ? 0 : val))
      );
      solutions.push(sol);
      return;
    }

    const [br, bc] = bestCell;
    for (const val of bestCandidates!) {
      currentGrid[br][bc] = val;
      backtrack();
      currentGrid[br][bc] = null;
      if (solutions.length >= maxSolutions) return;
    }
  }

  backtrack();
  return solutions;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/puzzles/kakuro-partitions.test.ts tests/puzzles/kakuro-solver.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/kakuro/types.ts src/puzzles/kakuro/partitions.ts src/puzzles/kakuro/solver.ts tests/puzzles/kakuro-partitions.test.ts tests/puzzles/kakuro-solver.test.ts
git commit -m "feat(kakuro): add core types, partitions helper, and constraint solver"
```

---

### Task 2: Symmetrical Templates, Run Extractor, Curated Seed Bank & Generator

**Files:**
- Create: `src/puzzles/kakuro/templates.ts`
- Create: `src/puzzles/kakuro/seed-bank.ts`
- Create: `src/puzzles/kakuro/generator.ts`
- Create: `src/puzzles/kakuro/index.ts`
- Create: `tests/puzzles/kakuro-templates.test.ts`
- Create: `tests/puzzles/kakuro-seed.test.ts`
- Create: `tests/puzzles/kakuro-generator.test.ts`

**Interfaces:**
- Produces: `extractKakuroRuns(grid: KakuroCell[][]): KakuroRun[]`, `KAKURO_TEMPLATES`, `getSeedKakuro(size: number, difficulty: KakuroDifficulty, dateStr: string): KakuroData`, `KakuroGenerator`.

- [ ] **Step 1: Write failing tests for templates, seed bank, and generator**

Create `tests/puzzles/kakuro-templates.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { KAKURO_TEMPLATES, extractKakuroRuns } from '../../src/puzzles/kakuro/templates.ts';

describe('Kakuro Templates & Run Extractor', () => {
  it('defines 180-degree symmetric templates for sizes 6, 8, and 10', () => {
    for (const tmpl of KAKURO_TEMPLATES) {
      expect([6, 8, 10]).toContain(tmpl.size);
      const rows = tmpl.grid.length;
      const cols = tmpl.grid[0].length;
      expect(rows).toBe(tmpl.size);
      expect(cols).toBe(tmpl.size);

      // Verify 180° symmetry of white vs clue/block cells
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const isWhite = tmpl.grid[r][c].type === 'white';
          const oppIsWhite = tmpl.grid[rows - 1 - r][cols - 1 - c].type === 'white';
          expect(isWhite).toBe(oppIsWhite);
        }
      }
    }
  });

  it('extracts runs where every white cell belongs to exactly 1 Across and 1 Down run', () => {
    for (const tmpl of KAKURO_TEMPLATES) {
      const runs = extractKakuroRuns(tmpl.grid);
      expect(runs.length).toBeGreaterThan(0);

      const cellCounts = new Map<string, { across: number; down: number }>();
      for (let r = 0; r < tmpl.size; r++) {
        for (let c = 0; c < tmpl.size; c++) {
          if (tmpl.grid[r][c].type === 'white') {
            cellCounts.set(`${r},${c}`, { across: 0, down: 0 });
          }
        }
      }

      for (const run of runs) {
        expect(run.cells.length).toBeGreaterThanOrEqual(2);
        expect(run.cells.length).toBeLessThanOrEqual(6);
        for (const [r, c] of run.cells) {
          const entry = cellCounts.get(`${r},${c}`);
          expect(entry).toBeDefined();
          if (run.direction === 'across') entry!.across++;
          else entry!.down++;
        }
      }

      for (const [coord, counts] of cellCounts.entries()) {
        expect(counts.across, `Cell ${coord} must have exactly 1 across run`).toBe(1);
        expect(counts.down, `Cell ${coord} must have exactly 1 down run`).toBe(1);
      }
    }
  });
});
```

Create `tests/puzzles/kakuro-seed.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { getSeedKakuro, SEED_KAKURO_PUZZLES } from '../../src/puzzles/kakuro/seed-bank.ts';
import { solveKakuro } from '../../src/puzzles/kakuro/solver.ts';

describe('Kakuro Seed Bank', () => {
  it('contains at least 18 verified puzzles (across 6, 8, 10 sizes and easy/medium/hard)', () => {
    expect(SEED_KAKURO_PUZZLES.length).toBeGreaterThanOrEqual(18);
  });

  it('guarantees every seed puzzle has unique solutions matching target clue sums', () => {
    for (const puzzle of SEED_KAKURO_PUZZLES) {
      const solutions = solveKakuro(puzzle.grid, puzzle.runs, 2);
      expect(solutions, `Puzzle ${puzzle.title} must have exactly 1 solution`).toHaveLength(1);

      // Verify digits in each run sum to targetSum without duplicates
      for (const run of puzzle.runs) {
        const digits = run.cells.map(([r, c]) => puzzle.grid[r][c].solution!);
        expect(new Set(digits).size).toBe(digits.length);
        const sum = digits.reduce((a, b) => a + b, 0);
        expect(sum).toBe(run.targetSum);
      }
    }
  });

  it('returns deterministic puzzle copies on getSeedKakuro', () => {
    const p1 = getSeedKakuro(8, 'medium', '2026-10-13');
    const p2 = getSeedKakuro(8, 'medium', '2026-10-13');
    expect(p1.title).toBe(p2.title);
    expect(p1.size).toBe(8);
    expect(p1.difficulty).toBe('medium');
    // Ensure deep clone (modifying p1 value does not affect p2)
    p1.grid[1][1].value = 9;
    expect(p2.grid[1][1].value).toBeUndefined();
  });
});
```

Create `tests/puzzles/kakuro-generator.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { KakuroGenerator } from '../../src/puzzles/kakuro/generator.ts';
import { solveKakuro } from '../../src/puzzles/kakuro/solver.ts';

describe('Kakuro Generator', () => {
  it('generates a valid Kakuro puzzle conforming to PuzzleGenerator interface', async () => {
    const generator = new KakuroGenerator();
    const result = await generator.generate({ size: 8, difficulty: 'medium', date: '2026-10-13' });

    expect(result.type).toBe('kakuro');
    expect(result.puzzleData.size).toBe(8);
    expect(result.puzzleData.difficulty).toBe('medium');
    expect(result.puzzleData.grid).toHaveLength(8);

    // Verify generated puzzle has a unique solution
    const solutions = solveKakuro(result.puzzleData.grid, result.puzzleData.runs, 2);
    expect(solutions).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/puzzles/kakuro-templates.test.ts tests/puzzles/kakuro-seed.test.ts tests/puzzles/kakuro-generator.test.ts`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement templates, seed bank, and generator**

In `src/puzzles/kakuro/templates.ts`:
- Define 6 symmetrical templates (two for 6×6, two for 8×8, two for 10×10).
- Implement `extractKakuroRuns(grid: KakuroCell[][]): KakuroRun[]`.

In `src/puzzles/kakuro/seed-bank.ts`:
- Construct 18 verified handcrafted Kakuro puzzles (6 per size across easy, medium, hard).
- Implement `getSeedKakuro(size: number, difficulty: KakuroDifficulty, dateStr: string): KakuroData`.

In `src/puzzles/kakuro/generator.ts`:
- Implement `KakuroGenerator implements PuzzleGenerator<KakuroOptions, KakuroData>`.
- Use template + random digit filling + sum calculation + `solveKakuro` verification.
- Fallback gracefully to `getSeedKakuro` if attempt limit reached.

In `src/puzzles/kakuro/index.ts`:
- Barrel exports.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/puzzles/kakuro-templates.test.ts tests/puzzles/kakuro-seed.test.ts tests/puzzles/kakuro-generator.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/kakuro/templates.ts src/puzzles/kakuro/seed-bank.ts src/puzzles/kakuro/generator.ts src/puzzles/kakuro/index.ts tests/puzzles/kakuro-templates.test.ts tests/puzzles/kakuro-seed.test.ts tests/puzzles/kakuro-generator.test.ts
git commit -m "feat(kakuro): implement templates, seed bank, and puzzle generator"
```

---

### Task 3: E-Ink 3-Page PDF Renderer

**Files:**
- Create: `src/puzzles/kakuro/renderer.ts`
- Modify: `src/puzzles/kakuro/generator.ts` (integrate `renderPdf`)
- Create: `tests/puzzles/kakuro-renderer.test.ts`

**Interfaces:**
- Produces: `renderKakuroPdf(puzzle: GeneratedPuzzle<KakuroData> | KakuroData): Promise<Buffer>`.

- [ ] **Step 1: Write failing test for PDF renderer**

Create `tests/puzzles/kakuro-renderer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { renderKakuroPdf } from '../../src/puzzles/kakuro/renderer.ts';
import { getSeedKakuro } from '../../src/puzzles/kakuro/seed-bank.ts';

describe('Kakuro E-Ink PDF Renderer', () => {
  it('renders a valid 3-page e-ink PDF with diagonal clue cells and answer key', async () => {
    const data = getSeedKakuro(8, 'medium', '2026-10-13');
    const buffer = await renderKakuroPdf(data);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');

    // Page count check: exactly 3 pages
    const pdfText = buffer.toString('latin1');
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches?.length).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzles/kakuro-renderer.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `renderKakuroPdf`**

In `src/puzzles/kakuro/renderer.ts`:
- Canvas 1404 × 1872 pt portrait via `PdfBuilder`.
- Draw grid:
  - Dynamic cell sizing: 6×6 -> 110 pt, 8×8 -> 90 pt, 10×10 -> 75 pt.
  - Draw `block` cells: solid black `#000000`.
  - Draw `clue` cells: dark charcoal `#222222`, diagonal divider stroke `\`, white `acrossSum` in top-right, white `downSum` in bottom-left.
  - Draw `white` cells: white background, 1 pt borders. Empty on Page 1, bold centered digits (36–44 pt Helvetica-Bold `#000000`) on Page 3.
- Page 1: Header + Kakuro Grid + Rules footer.
- Page 2: `builder.addBufferPage()`.
- Page 3: `builder.addAnswerKeyPage('Kakuro')` with solved grid.
- Connect into `KakuroGenerator.renderPdf`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/puzzles/kakuro-renderer.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/kakuro/renderer.ts src/puzzles/kakuro/generator.ts tests/puzzles/kakuro-renderer.test.ts
git commit -m "feat(kakuro): implement e-ink 3-page pdf renderer with diagonal clue headers"
```

---

### Task 4: Registry, CLI, Tablet Delivery Archives & GitHub Actions Integration

**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/core/registry.ts`
- Modify: `src/cli.ts`
- Modify: `src/index.ts`
- Modify: `src/delivery/local-client.ts`
- Modify: `src/delivery/rmapi-client.ts`
- Modify: `.github/workflows/daily-puzzles.yml`
- Modify: `README.md`
- Modify: `tests/cli.test.ts`
- Modify: `tests/delivery/clients.test.ts`

**Interfaces:**
- Update `PuzzleType = 'word-search' | 'sudoku' | 'mini-crossword' | 'kenken' | 'kakuro'`.
- Register `KakuroGenerator` in registry and CLI.
- CLI options: `--type=kakuro`, `--size=6|8|10` (default 8), `--difficulty=easy|medium|hard` (default medium), `--type=all` generates all 5 puzzles.

- [ ] **Step 1: Write failing tests in CLI and Delivery suites**

In `tests/cli.test.ts`:
Add test for `--type=kakuro` and verify `--type=all` generates 5 puzzles including kakuro.
In `tests/delivery/clients.test.ts`:
Verify `/Puzzles/Archive/Kakuro` is pre-created by `LocalDeliveryClient` and `RmapiDeliveryClient`.

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run tests/cli.test.ts tests/delivery/clients.test.ts`
Expected: FAIL

- [ ] **Step 3: Update registry, CLI, delivery clients, workflow, and README**

- In `src/core/types.ts`: Add `'kakuro'` to `PuzzleType`.
- In `src/core/registry.ts` & `src/index.ts`: Register `KakuroGenerator`.
- In `src/cli.ts`: Parse `--size` and `--difficulty` for kakuro, route manual runs to `/Puzzles/Kakuro`, update `--type=all` list.
- In `src/delivery/local-client.ts` & `src/delivery/rmapi-client.ts`: Pre-create `/Puzzles/Archive/Kakuro` directory.
- In `.github/workflows/daily-puzzles.yml`: Add `kakuro` to puzzle choices, and inputs `kakuro_size`, `kakuro_difficulty`.
- In `README.md`: Document Kakuro and tablet folder paths.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/cli.test.ts tests/delivery/clients.test.ts && npm test && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/core/types.ts src/core/registry.ts src/cli.ts src/index.ts src/delivery/local-client.ts src/delivery/rmapi-client.ts .github/workflows/daily-puzzles.yml README.md tests/cli.test.ts tests/delivery/clients.test.ts
git commit -m "feat(kakuro): integrate kakuro into registry, cli, tablet delivery, and workflow"
```

---

### Task 5: Mobile Zero-Scroll PWA Studio (`KakuroStudio.tsx`) & Navigation Registration

**Files:**
- Modify: `web/src/services/githubApi.ts`
- Create: `web/src/utils/kakuro.ts`
- Create: `web/src/components/KakuroStudio.tsx`
- Modify: `web/src/components/PuzzleSelectorModal.tsx`
- Modify: `web/src/App.tsx`
- Create: `tests/web/kakuro-utils.test.ts`

**Interfaces:**
- Produces: `KakuroStudio`, `createEmptyKakuroGrid`, `isKakuroSolved`, `computeRunSums`, `findDuplicateRunDigits`.

- [ ] **Step 1: Write failing tests for Web Kakuro Utilities**

Create `tests/web/kakuro-utils.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  createEmptyKakuroGrid,
  isKakuroSolved,
  computeRunSums,
  findDuplicateRunDigits,
  SAMPLE_KAKURO_PUZZLES,
} from '../../web/src/utils/kakuro.ts';

describe('Web Kakuro Utilities', () => {
  it('creates empty user grid matching template dimensions', () => {
    const sample = SAMPLE_KAKURO_PUZZLES[0];
    const userGrid = createEmptyKakuroGrid(sample.grid);
    expect(userGrid).toHaveLength(sample.size);
    expect(userGrid[0]).toHaveLength(sample.size);
    for (let r = 0; r < sample.size; r++) {
      for (let c = 0; c < sample.size; c++) {
        expect(userGrid[r][c]).toBeNull();
      }
    }
  });

  it('correctly calculates live run sums and flags duplicates', () => {
    const sample = SAMPLE_KAKURO_PUZZLES[0];
    const userGrid = createEmptyKakuroGrid(sample.grid);
    const run = sample.runs[0];
    const [c1, c2] = run.cells;
    userGrid[c1[0]][c1[1]] = 3;
    userGrid[c2[0]][c2[1]] = 3;

    const sums = computeRunSums(userGrid, [run]);
    expect(sums[run.id]).toBe(6);

    const dupes = findDuplicateRunDigits(userGrid, [run]);
    expect(dupes.has(`${c1[0]},${c1[1]}`)).toBe(true);
    expect(dupes.has(`${c2[0]},${c2[1]}`)).toBe(true);
  });

  it('verifies solved state only when all runs equal target sum with unique digits', () => {
    const sample = SAMPLE_KAKURO_PUZZLES[0];
    const userGrid = createEmptyKakuroGrid(sample.grid);
    expect(isKakuroSolved(userGrid, sample.runs)).toBe(false);

    // Fill solution digits
    for (let r = 0; r < sample.size; r++) {
      for (let c = 0; c < sample.size; c++) {
        if (sample.grid[r][c].solution !== undefined) {
          userGrid[r][c] = sample.grid[r][c].solution!;
        }
      }
    }
    expect(isKakuroSolved(userGrid, sample.runs)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/web/kakuro-utils.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement web utilities, `KakuroStudio.tsx`, and app registration**

- In `web/src/services/githubApi.ts`: Add `puzzle_type: 'kakuro'`, `kakuro_size`, `kakuro_difficulty`.
- In `web/src/utils/kakuro.ts`: Sample puzzles for 6×6, 8×8, 10×10, helper functions.
- In `web/src/components/KakuroStudio.tsx`:
  - Zero-scroll layout fitting `100dvh` with `.safe-bottom`.
  - Authentic diagonal split clue headers (`downSum` in lower-left, `acrossSum` in upper-right).
  - Selected cell highlights Across and Down runs.
  - Run Inspector displays current sum vs target sum.
  - On-screen touch keypad (1–9, Backspace, Clear) + keyboard support.
  - Solutions hidden by default. Reveal/Clear buttons.
  - Solved celebratory badge `🎉 Solved!`.
  - 1-tap tablet delivery.
- In `web/src/components/PuzzleSelectorModal.tsx` & `web/src/App.tsx`: Register `kakuro` in header switcher and selector sheet.

- [ ] **Step 4: Run tests and web build to verify they pass**

Run: `npx vitest run tests/web/kakuro-utils.test.ts && npm test && npm run build && npm run build:web`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add web/src/services/githubApi.ts web/src/utils/kakuro.ts web/src/components/KakuroStudio.tsx web/src/components/PuzzleSelectorModal.tsx web/src/App.tsx tests/web/kakuro-utils.test.ts
git commit -m "feat(pwa): add interactive kakuro studio to mobile web app"
```

---

### Task 6: Full Regression Testing, CLI Verification & Production Deployment Check

**Files:**
- Full test suite: `npm test`
- CLI verification: `node dist/cli.js generate --type=kakuro`
- Web build: `npm run build:web`

- [ ] **Step 1: Run complete test suite**

Run: `npm test`
Expected: PASS across all test files.

- [ ] **Step 2: Verify CLI generator output**

Run: `npm run build && node dist/cli.js generate --type=kakuro`
Expected: Successfully generates 3-page Kakuro PDF in `output/Puzzles/Kakuro/`.

- [ ] **Step 3: Verify production web build**

Run: `npm run build:web`
Expected: Vite PWA build succeeds with 0 errors.
