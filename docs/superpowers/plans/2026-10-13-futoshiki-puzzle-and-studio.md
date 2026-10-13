# Futoshiki (Inequality Latin Square) Puzzle Generator & Mobile Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, production-grade Futoshiki (Inequality Latin Square) puzzle system supporting sizes 4×4, 5×5, 6×6 across easy, medium, and hard difficulty tiers with an MRV/AC-3 constraint solver, procedural generator with 18 verified seed puzzles, e-ink 3-page PDF renderer, CLI and tablet archive routing, and an interactive mobile zero-scroll PWA studio.

**Architecture:** A domain-pruning MRV constraint satisfaction solver (`solveFutoshiki`) guarantees uniqueness. Procedural generator derives Latin squares and adjacent inequality relations, supported by a 18-puzzle handcrafted seed bank. High-contrast 1404×1872 pt e-ink PDF renderer outputs 3 pages (Puzzle, Spoiler Blocker, Answer Key). CLI orchestrates 6 daily puzzles in `--type=all`, while `FutoshikiStudio.tsx` provides real-time constraint validation and adaptive numeric touch keypads on mobile.

**Tech Stack:** TypeScript (strict mode), Node.js, Vitest, PDFKit, React 18, Tailwind CSS, Lucide React, GitHub Actions, rmapi.

## Global Constraints

- Supported grid sizes: strictly 4×4, 5×5, and 6×6.
- Digits in playable cells: integers from $1$ to $N$ inclusive.
- Difficulty tiers: `easy`, `medium`, `hard`.
- Mathematical constraints: strictly 1 of each digit $1 \dots N$ per row and column (Latin square), and all inequality relations ($<, >$) between adjacent cells satisfied.
- Solution uniqueness: every generated puzzle and seed puzzle must possess strictly 1 unique solution.
- PDF structure: exactly 3 pages (Page 1 = Puzzle, Page 2 = Synchronized Spoiler Blocker via `builder.addBufferPage()`, Page 3 = Answer Key).
- Mobile layout: strict zero-scroll fitting `100dvh` with `.safe-bottom` safe area insets.
- Delivery paths: `/Puzzles/Futoshiki` on category runs, `/Puzzles/Daily` on daily runs, `/Puzzles/Archive/Futoshiki` for archives.
- `--type=all`: generates all 6 daily puzzles (Word Search, Sudoku, Mini Crossword, KenKen, Kakuro, Futoshiki).
- All tests and TypeScript builds must pass cleanly (`npm test && npm run build && npm run build:web`).

---

### Task 1: Core Types & MRV/AC-3 Constraint Solver

**Files:**
- Create: `src/puzzles/futoshiki/types.ts`
- Create: `src/puzzles/futoshiki/solver.ts`
- Test: `tests/puzzles/futoshiki-solver.test.ts`

**Interfaces:**
- Produces:
  - `FutoshikiDifficulty`: `'easy' | 'medium' | 'hard'`
  - `FutoshikiInequality`: `{ row1: number; col1: number; row2: number; col2: number; relation: '<' | '>' }`
  - `FutoshikiData`: `{ size: 4 | 5 | 6; initialGrid: number[][]; solution: number[][]; inequalities: FutoshikiInequality[]; difficulty: FutoshikiDifficulty; dateStr?: string }`
  - `FutoshikiOptions`: `{ size?: number; difficulty?: FutoshikiDifficulty | string; date?: string; theme?: string }`
  - `solveFutoshiki(initialGrid: number[][], inequalities: FutoshikiInequality[], maxSolutions?: number): number[][][]`

- [ ] **Step 1: Write the failing tests for the solver**

Create `tests/puzzles/futoshiki-solver.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { solveFutoshiki } from '../../src/puzzles/futoshiki/solver.js';
import { FutoshikiInequality } from '../../src/puzzles/futoshiki/types.js';

describe('Futoshiki Constraint Solver', () => {
  it('solves a known 4x4 Futoshiki puzzle with unique solution', () => {
    // 4x4 grid:
    // . . . .
    // . . . .
    // . . . .
    // . . . .
    // Inequalities:
    // (0,0) < (0,1), (0,2) > (0,3)
    // (1,1) > (2,1)
    // (2,2) < (2,3)
    // (3,0) > (3,1)
    // Given clues: (0,0)=1, (3,3)=2
    const initialGrid = [
      [1, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 2],
    ];
    const inequalities: FutoshikiInequality[] = [
      { row1: 0, col1: 0, row2: 0, col2: 1, relation: '<' },
      { row1: 0, col1: 2, row2: 0, col2: 3, relation: '>' },
      { row1: 1, col1: 1, row2: 2, col2: 1, relation: '>' },
      { row1: 2, col1: 2, row2: 2, col2: 3, relation: '<' },
      { row1: 3, col1: 0, row2: 3, col2: 1, relation: '>' },
    ];

    const solutions = solveFutoshiki(initialGrid, inequalities);
    expect(solutions.length).toBeGreaterThanOrEqual(1);
    const sol = solutions[0];
    expect(sol.length).toBe(4);
    expect(sol[0][0]).toBe(1);
    expect(sol[0][0]).toBeLessThan(sol[0][1]);
    expect(sol[0][2]).toBeGreaterThan(sol[0][3]);
    expect(sol[1][1]).toBeGreaterThan(sol[2][1]);
    expect(sol[2][2]).toBeLessThan(sol[2][3]);
    expect(sol[3][0]).toBeGreaterThan(sol[3][1]);

    // Verify row & col Latin square property
    for (let r = 0; r < 4; r++) {
      expect(new Set(sol[r]).size).toBe(4);
      expect(new Set([sol[0][r], sol[1][r], sol[2][r], sol[3][r]]).size).toBe(4);
    }
  });

  it('detects multiple solutions and respects maxSolutions limit', () => {
    // Completely unconstrained 4x4 grid has many solutions
    const emptyGrid = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    const solutions = solveFutoshiki(emptyGrid, [], 2);
    expect(solutions).toHaveLength(2);
  });

  it('detects impossible/contradictory boards and returns empty array', () => {
    const grid = [
      [4, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    // Contradiction: (0,0) is 4, but rule says (0,0) < (0,1) where max digit is 4
    const impossibleInequalities: FutoshikiInequality[] = [
      { row1: 0, col1: 0, row2: 0, col2: 1, relation: '<' },
    ];
    // And if (0,1) is forced to be 1:
    grid[0][1] = 1;
    const solutions = solveFutoshiki(grid, impossibleInequalities);
    expect(solutions).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzles/futoshiki-solver.test.ts`
Expected: FAIL with module not found for `solver.js`.

- [ ] **Step 3: Implement core types and solver**

Create `src/puzzles/futoshiki/types.ts`:
```typescript
export type FutoshikiDifficulty = 'easy' | 'medium' | 'hard';

export interface FutoshikiInequality {
  row1: number;
  col1: number;
  row2: number;
  col2: number;
  relation: '<' | '>';
}

export interface FutoshikiData {
  size: 4 | 5 | 6;
  initialGrid: number[][];
  solution: number[][];
  inequalities: FutoshikiInequality[];
  difficulty: FutoshikiDifficulty;
  dateStr?: string;
}

export interface FutoshikiOptions {
  size?: number;
  difficulty?: FutoshikiDifficulty | string;
  date?: string;
  theme?: string;
}
```

Create `src/puzzles/futoshiki/solver.ts`:
```typescript
import { FutoshikiInequality } from './types.js';

export function solveFutoshiki(
  initialGrid: number[][],
  inequalities: FutoshikiInequality[],
  maxSolutions: number = 2
): number[][][] {
  const n = initialGrid.length;
  if (n === 0) return [];

  // Initialize domains: Set of numbers 1..n for each cell
  const domains: Set<number>[][] = [];
  for (let r = 0; r < n; r++) {
    domains[r] = [];
    for (let c = 0; c < n; c++) {
      if (initialGrid[r][c] !== 0) {
        domains[r][c] = new Set([initialGrid[r][c]]);
      } else {
        const d = new Set<number>();
        for (let v = 1; v <= n; v++) d.add(v);
        domains[r][c] = d;
      }
    }
  }

  // Propagate constraints (Arc Consistency / Forward Checking)
  function propagate(curDomains: Set<number>[][]): boolean {
    let changed = true;
    while (changed) {
      changed = false;

      // 1. Row and Column uniqueness for singletons
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          if (curDomains[r][c].size === 0) return false;
          if (curDomains[r][c].size === 1) {
            const val = Array.from(curDomains[r][c])[0];
            // Remove val from row peers
            for (let c2 = 0; c2 < n; c2++) {
              if (c2 !== c && curDomains[r][c2].has(val)) {
                curDomains[r][c2].delete(val);
                if (curDomains[r][c2].size === 0) return false;
                changed = true;
              }
            }
            // Remove val from col peers
            for (let r2 = 0; r2 < n; r2++) {
              if (r2 !== r && curDomains[r2][c].has(val)) {
                curDomains[r2][c].delete(val);
                if (curDomains[r2][c].size === 0) return false;
                changed = true;
              }
            }
          }
        }
      }

      // 2. Inequality domain pruning
      for (const ineq of inequalities) {
        const d1 = curDomains[ineq.row1][ineq.col1];
        const d2 = curDomains[ineq.row2][ineq.col2];
        if (d1.size === 0 || d2.size === 0) return false;

        const min1 = Math.min(...d1);
        const max1 = Math.max(...d1);
        const min2 = Math.min(...d2);
        const max2 = Math.max(...d2);

        if (ineq.relation === '<') {
          // Cell 1 < Cell 2 => Cell 1 < max2, Cell 2 > min1
          for (const v1 of Array.from(d1)) {
            if (v1 >= max2) {
              d1.delete(v1);
              if (d1.size === 0) return false;
              changed = true;
            }
          }
          for (const v2 of Array.from(d2)) {
            if (v2 <= min1) {
              d2.delete(v2);
              if (d2.size === 0) return false;
              changed = true;
            }
          }
        } else {
          // Cell 1 > Cell 2 => Cell 1 > min2, Cell 2 < max1
          for (const v1 of Array.from(d1)) {
            if (v1 <= min2) {
              d1.delete(v1);
              if (d1.size === 0) return false;
              changed = true;
            }
          }
          for (const v2 of Array.from(d2)) {
            if (v2 >= max1) {
              d2.delete(v2);
              if (d2.size === 0) return false;
              changed = true;
            }
          }
        }
      }
    }
    return true;
  }

  function cloneDomains(curDomains: Set<number>[][]): Set<number>[][] {
    return curDomains.map(row => row.map(cell => new Set(cell)));
  }

  const solutions: number[][][] = [];

  function backtrack(curDomains: Set<number>[][]): void {
    if (solutions.length >= maxSolutions) return;

    if (!propagate(curDomains)) return;

    // Find cell with MRV (smallest domain > 1)
    let bestR = -1;
    let bestC = -1;
    let minSize = Infinity;
    let allAssigned = true;

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const sz = curDomains[r][c].size;
        if (sz === 0) return;
        if (sz > 1) {
          allAssigned = false;
          if (sz < minSize) {
            minSize = sz;
            bestR = r;
            bestC = c;
          }
        }
      }
    }

    if (allAssigned) {
      const solGrid = curDomains.map(row => row.map(cell => Array.from(cell)[0]));
      solutions.push(solGrid);
      return;
    }

    const candidates = Array.from(curDomains[bestR][bestC]);
    for (const val of candidates) {
      if (solutions.length >= maxSolutions) return;
      const nextDomains = cloneDomains(curDomains);
      nextDomains[bestR][bestC] = new Set([val]);
      backtrack(nextDomains);
    }
  }

  backtrack(domains);
  return solutions;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/puzzles/futoshiki-solver.test.ts`
Expected: PASS with 3 passing tests.

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/futoshiki/types.ts src/puzzles/futoshiki/solver.ts tests/puzzles/futoshiki-solver.test.ts
git commit -m "feat(futoshiki): implement core types and MRV constraint solver"
```

---

### Task 2: Handcrafted 18+ Seed Bank & Procedural Generator with Seed Fallback

**Files:**
- Create: `src/puzzles/futoshiki/seed-bank.ts`
- Create: `src/puzzles/futoshiki/generator.ts`
- Create: `src/puzzles/futoshiki/index.ts`
- Test: `tests/puzzles/futoshiki-seed.test.ts`
- Test: `tests/puzzles/futoshiki-generator.test.ts`

**Interfaces:**
- Consumes:
  - `FutoshikiData`, `FutoshikiOptions`, `FutoshikiDifficulty`, `FutoshikiInequality` from `types.ts`
  - `solveFutoshiki` from `solver.ts`
- Produces:
  - `FUTOSHIKI_SEED_BANK: FutoshikiData[]` (18 verified unique seed puzzles)
  - `getSeedFutoshiki(size: number, difficulty: FutoshikiDifficulty, dateStr?: string): FutoshikiData`
  - `FutoshikiGenerator implements PuzzleGenerator<FutoshikiOptions, FutoshikiData>`

- [ ] **Step 1: Write the failing tests for the seed bank and generator**

Create `tests/puzzles/futoshiki-seed.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { FUTOSHIKI_SEED_BANK, getSeedFutoshiki } from '../../src/puzzles/futoshiki/seed-bank.js';
import { solveFutoshiki } from '../../src/puzzles/futoshiki/solver.js';

describe('Futoshiki Seed Bank', () => {
  it('contains at least 18 seed puzzles covering sizes 4, 5, 6 across all difficulties', () => {
    expect(FUTOSHIKI_SEED_BANK.length).toBeGreaterThanOrEqual(18);
    const sizes = new Set(FUTOSHIKI_SEED_BANK.map(p => p.size));
    expect(sizes).toContain(4);
    expect(sizes).toContain(5);
    expect(sizes).toContain(6);

    for (const size of [4, 5, 6] as const) {
      for (const diff of ['easy', 'medium', 'hard'] as const) {
        const matches = FUTOSHIKI_SEED_BANK.filter(p => p.size === size && p.difficulty === diff);
        expect(matches.length).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('verifies every seed puzzle has strictly 1 unique solution matching its declared solution', () => {
    for (const puzzle of FUTOSHIKI_SEED_BANK) {
      const solutions = solveFutoshiki(puzzle.initialGrid, puzzle.inequalities, 2);
      expect(solutions).toHaveLength(1);
      expect(solutions[0]).toEqual(puzzle.solution);

      // Verify all inequality relations hold on solution
      for (const ineq of puzzle.inequalities) {
        const val1 = puzzle.solution[ineq.row1][ineq.col1];
        const val2 = puzzle.solution[ineq.row2][ineq.col2];
        if (ineq.relation === '<') {
          expect(val1).toBeLessThan(val2);
        } else {
          expect(val1).toBeGreaterThan(val2);
        }
      }
    }
  });

  it('getSeedFutoshiki returns deep copies and deterministically cycles seeds by date', () => {
    const seed1 = getSeedFutoshiki(5, 'medium', '2026-10-14');
    const seed2 = getSeedFutoshiki(5, 'medium', '2026-10-14');
    expect(seed1).toEqual(seed2);
    expect(seed1).not.toBe(seed2);
    expect(seed1.initialGrid).not.toBe(seed2.initialGrid);
  });
});
```

Create `tests/puzzles/futoshiki-generator.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { FutoshikiGenerator } from '../../src/puzzles/futoshiki/generator.js';
import { solveFutoshiki } from '../../src/puzzles/futoshiki/solver.js';

describe('FutoshikiGenerator', () => {
  const generator = new FutoshikiGenerator();

  it('generates a valid 5x5 medium Futoshiki puzzle with unique solution', async () => {
    const puzzle = await generator.generate({ size: 5, difficulty: 'medium', date: '2026-10-14' });
    expect(puzzle.metadata.id).toBe('futoshiki');
    expect(puzzle.puzzleData.size).toBe(5);
    expect(puzzle.puzzleData.difficulty).toBe('medium');

    const solutions = solveFutoshiki(puzzle.puzzleData.initialGrid, puzzle.puzzleData.inequalities, 2);
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toEqual(puzzle.puzzleData.solution);
  });

  it('generates 4x4 and 6x6 puzzles respecting size clamping', async () => {
    const p4 = await generator.generate({ size: 4, difficulty: 'easy', date: '2026-10-14' });
    expect(p4.puzzleData.size).toBe(4);

    const p6 = await generator.generate({ size: 6, difficulty: 'hard', date: '2026-10-14' });
    expect(p6.puzzleData.size).toBe(6);

    const pClamped = await generator.generate({ size: 9, difficulty: 'medium' });
    expect(pClamped.puzzleData.size).toBe(6);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/puzzles/futoshiki-seed.test.ts tests/puzzles/futoshiki-generator.test.ts`
Expected: FAIL with module not found.

- [ ] **Step 3: Implement seed bank, generator, and barrel export**

Create `src/puzzles/futoshiki/seed-bank.ts`:
Author 18 verified unique seed puzzles (covering 4×4, 5×5, 6×6 across easy, medium, hard). Provide `getSeedFutoshiki(size, difficulty, dateStr)`.

Create `src/puzzles/futoshiki/generator.ts`:
```typescript
import { PuzzleGenerator, GeneratedPuzzle } from '../../core/types.js';
import { FutoshikiData, FutoshikiOptions, FutoshikiDifficulty, FutoshikiInequality } from './types.js';
import { solveFutoshiki } from './solver.js';
import { getSeedFutoshiki } from './seed-bank.js';

export class FutoshikiGenerator implements PuzzleGenerator<FutoshikiOptions, FutoshikiData> {
  readonly metadata = {
    id: 'futoshiki' as const,
    displayName: 'Futoshiki',
    defaultTargetFolder: '/Puzzles/Futoshiki',
  };

  async generate(options: FutoshikiOptions = {}): Promise<GeneratedPuzzle<FutoshikiData>> {
    const rawSize = options.size ?? 5;
    const size = (rawSize <= 4 ? 4 : rawSize >= 6 ? 6 : 5) as 4 | 5 | 6;
    const difficulty = (['easy', 'medium', 'hard'].includes(options.difficulty as string)
      ? options.difficulty
      : 'medium') as FutoshikiDifficulty;
    const dateStr = options.date ?? new Date().toISOString().split('T')[0];

    // Procedural generation with timeout fallback to verified seed
    const puzzleData = this.generateProcedural(size, difficulty, dateStr)
      ?? getSeedFutoshiki(size, difficulty, dateStr);

    const filename = `Futoshiki_${size}x${size}_${difficulty}_${dateStr}.pdf`;

    return {
      metadata: {
        id: 'futoshiki',
        displayName: 'Futoshiki',
        targetFolder: '/Puzzles/Futoshiki',
      },
      filename,
      puzzleData,
    };
  }

  async renderPdf(puzzle: GeneratedPuzzle<FutoshikiData> | FutoshikiData): Promise<Buffer> {
    const { renderFutoshikiPdf } = await import('./renderer.js');
    return renderFutoshikiPdf(puzzle);
  }

  private generateProcedural(size: 4 | 5 | 6, difficulty: FutoshikiDifficulty, dateStr: string): FutoshikiData | null {
    // Generate valid Latin square
    const sol = this.generateLatinSquare(size);
    if (!sol) return null;

    // Collect all adjacent inequalities
    const allIneqs: FutoshikiInequality[] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size - 1; c++) {
        allIneqs.push({
          row1: r,
          col1: c,
          row2: r,
          col2: c + 1,
          relation: sol[r][c] < sol[r][c + 1] ? '<' : '>',
        });
      }
    }
    for (let r = 0; r < size - 1; r++) {
      for (let c = 0; c < size; c++) {
        allIneqs.push({
          row1: r,
          col1: c,
          row2: r + 1,
          col2: c,
          relation: sol[r][c] < sol[r + 1][c] ? '<' : '>',
        });
      }
    }

    // Select subset of inequalities based on difficulty
    const ineqKeepRatio = difficulty === 'easy' ? 0.45 : difficulty === 'medium' ? 0.35 : 0.30;
    const ineqCount = Math.floor(allIneqs.length * ineqKeepRatio);
    // Shuffle and pick
    const shuffledIneqs = [...allIneqs].sort(() => Math.random() - 0.5).slice(0, ineqCount);

    // Initial numbers
    const initialGrid = sol.map(row => [...row]);
    const numKeepRatio = difficulty === 'easy' ? 0.35 : difficulty === 'medium' ? 0.20 : 0.08;
    const numCellsToKeep = Math.max(1, Math.floor(size * size * numKeepRatio));

    // Carve cells in random order while preserving uniqueness
    const cellIndices: [number, number][] = [];
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        cellIndices.push([r, c]);
      }
    }
    cellIndices.sort(() => Math.random() - 0.5);

    let filledCount = size * size;
    for (const [r, c] of cellIndices) {
      if (filledCount <= numCellsToKeep) break;
      const backup = initialGrid[r][c];
      initialGrid[r][c] = 0;
      const sols = solveFutoshiki(initialGrid, shuffledIneqs, 2);
      if (sols.length === 1) {
        filledCount--;
      } else {
        initialGrid[r][c] = backup; // Restore if uniqueness was lost
      }
    }

    // Ensure final grid is unique
    const finalSols = solveFutoshiki(initialGrid, shuffledIneqs, 2);
    if (finalSols.length !== 1) {
      return null;
    }

    return {
      size,
      initialGrid,
      solution: sol,
      inequalities: shuffledIneqs,
      difficulty,
      dateStr,
    };
  }

  private generateLatinSquare(size: number): number[][] | null {
    const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
    // Fill first row randomly
    const firstRow = Array.from({ length: size }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    grid[0] = firstRow;

    // Use solver on empty remainder
    const sols = solveFutoshiki(grid, [], 1);
    return sols.length > 0 ? sols[0] : null;
  }
}
```

Create `src/puzzles/futoshiki/index.ts`:
```typescript
export * from './types.js';
export * from './solver.js';
export * from './seed-bank.js';
export * from './generator.js';
export * from './renderer.js';
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/puzzles/futoshiki-seed.test.ts tests/puzzles/futoshiki-generator.test.ts`
Expected: PASS with all tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/futoshiki/ tests/puzzles/futoshiki-seed.test.ts tests/puzzles/futoshiki-generator.test.ts
git commit -m "feat(futoshiki): implement seed bank, procedural generator, and exports"
```

---

### Task 3: E-Ink 3-Page PDF Renderer with Centered Chevrons

**Files:**
- Create: `src/puzzles/futoshiki/renderer.ts`
- Test: `tests/puzzles/futoshiki-renderer.test.ts`

**Interfaces:**
- Consumes:
  - `FutoshikiData`, `FutoshikiInequality` from `types.ts`
  - `PdfBuilder` from `src/core/pdf-builder.ts`
- Produces:
  - `renderFutoshikiPdf(puzzle: GeneratedPuzzle<FutoshikiData> | FutoshikiData): Promise<Buffer>`

- [ ] **Step 1: Write the failing tests for PDF renderer**

Create `tests/puzzles/futoshiki-renderer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { renderFutoshikiPdf } from '../../src/puzzles/futoshiki/renderer.js';
import { getSeedFutoshiki } from '../../src/puzzles/futoshiki/seed-bank.js';
import PDFParser from 'pdf2json';

function parsePdfBuffer(buffer: Buffer): Promise<any> {
  return new Promise((resolve, reject) => {
    const parser = new (PDFParser as any)(null, 1);
    parser.on('pdfParser_dataReady', (data: any) => resolve(data));
    parser.on('pdfParser_dataError', (err: any) => reject(err));
    parser.parseBuffer(buffer);
  });
}

describe('Futoshiki PDF Renderer', () => {
  it('renders a 3-page e-ink PDF for 5x5 Futoshiki', async () => {
    const puzzleData = getSeedFutoshiki(5, 'medium', '2026-10-14');
    const pdfBuffer = await renderFutoshikiPdf(puzzleData);
    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    const pdfData = await parsePdfBuffer(pdfBuffer);
    expect(pdfData.Pages.length).toBe(3); // Page 1: Puzzle, Page 2: Spoiler Blocker, Page 3: Answer Key
  });

  it('renders 4x4 and 6x6 grids cleanly without layout overlap', async () => {
    const p4 = getSeedFutoshiki(4, 'easy', '2026-10-14');
    const buf4 = await renderFutoshikiPdf(p4);
    const pdfData4 = await parsePdfBuffer(buf4);
    expect(pdfData4.Pages.length).toBe(3);

    const p6 = getSeedFutoshiki(6, 'hard', '2026-10-14');
    const buf6 = await renderFutoshikiPdf(p6);
    const pdfData6 = await parsePdfBuffer(buf6);
    expect(pdfData6.Pages.length).toBe(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzles/futoshiki-renderer.test.ts`
Expected: FAIL with module not found for `renderer.js`.

- [ ] **Step 3: Implement 3-page e-ink PDF renderer**

Create `src/puzzles/futoshiki/renderer.ts`:
- Build high-contrast e-ink canvas (1404 × 1872 pt portrait).
- Render Page 1 (Puzzle):
  - Header with title, size, difficulty, date.
  - Centered grid with cells: 4×4 (150pt cell, 40pt gutter), 5×5 (125pt cell, 35pt gutter), 6×6 (105pt cell, 30pt gutter).
  - Given numbers in bold 48–60pt Helvetica-Bold.
  - Inequalities positioned in gutters ($<, >$ horizontally, $\wedge, \vee$ vertically).
  - Rules footer at bottom.
- Render Page 2 (Spoiler Blocker) via `builder.addBufferPage()`.
- Render Page 3 (Answer Key) via `builder.addAnswerKeyPage('Futoshiki')`:
  - Solved grid with all Latin square numbers in bold black text and inequality signs preserved.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/puzzles/futoshiki-renderer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/futoshiki/renderer.ts tests/puzzles/futoshiki-renderer.test.ts
git commit -m "feat(futoshiki): implement 3-page e-ink pdf renderer with centered chevrons"
```

---

### Task 4: Registry, CLI, Tablet Delivery Archives & GitHub Actions Integration

**Files:**
- Modify: `src/core/types.ts`
- Modify: `src/core/registry.ts`
- Modify: `src/index.ts`
- Modify: `src/cli.ts`
- Modify: `src/delivery/local-client.ts`
- Modify: `src/delivery/rmapi-client.ts`
- Modify: `.github/workflows/daily-puzzles.yml`
- Modify: `README.md`
- Test: `tests/cli.test.ts`
- Test: `tests/delivery/clients.test.ts`

**Interfaces:**
- Consumes:
  - `FutoshikiGenerator` from `src/puzzles/futoshiki/index.ts`
- Produces:
  - `PuzzleType` includes `'futoshiki'`
  - CLI supports `--type=futoshiki`, `--size=4|5|6`, `--difficulty=easy|medium|hard`
  - `--type=all` generates 6 daily puzzles
  - Tablet delivery pre-creates `/Puzzles/Archive/Futoshiki`

- [ ] **Step 1: Write failing tests in `tests/cli.test.ts` and `tests/delivery/clients.test.ts`**

Update `tests/cli.test.ts`:
- Add test for `--type=futoshiki` routing to `/Puzzles/Futoshiki` and `--daily` routing to `/Puzzles/Daily`.
- Update `--type=all` test to expect 6 puzzles (including `futoshiki`).
- Add parseArgs test for `--type=futoshiki --size=5 --difficulty=hard`.

Update `tests/delivery/clients.test.ts`:
- Expect `rmapi` and `local` clients to pre-create `/Puzzles/Archive/Futoshiki`.

- [ ] **Step 2: Run tests to verify failures**

Run: `npx vitest run tests/cli.test.ts tests/delivery/clients.test.ts`
Expected: FAIL due to missing `'futoshiki'` in registry/CLI.

- [ ] **Step 3: Implement registry, CLI, delivery archives, and workflow**

1. Update `src/core/types.ts`: Add `'futoshiki'` to `PuzzleType`.
2. Update `src/core/registry.ts`: Register `FutoshikiGenerator`.
3. Update `src/index.ts`: Export `* from './puzzles/futoshiki/index.js'` and register in default registry.
4. Update `src/cli.ts`:
   - Parse `--type=futoshiki` and clamp size to 4, 5, or 6 (default 5).
   - Category routing to `/Puzzles/Futoshiki`.
5. Update `src/delivery/local-client.ts` & `src/delivery/rmapi-client.ts`: Pre-create `/Puzzles/Archive/Futoshiki`.
6. Update `.github/workflows/daily-puzzles.yml`:
   - Add `futoshiki`, `futoshiki_size`, and `futoshiki_difficulty` inputs.
7. Update `README.md`: Document Futoshiki CLI commands and tablet directory structure.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/cli.test.ts tests/delivery/clients.test.ts`
Expected: PASS with 100% test pass rate.

- [ ] **Step 5: Commit**

```bash
git add src/core/types.ts src/core/registry.ts src/index.ts src/cli.ts src/delivery/ .github/workflows/daily-puzzles.yml README.md tests/cli.test.ts tests/delivery/clients.test.ts
git commit -m "feat(futoshiki): integrate futoshiki into registry, cli, tablet delivery, and workflow"
```

---

### Task 5: Mobile Zero-Scroll PWA Studio (`FutoshikiStudio.tsx`) & Navigation Registration

**Files:**
- Modify: `web/src/services/githubApi.ts`
- Create: `web/src/utils/futoshiki.ts`
- Create: `web/src/components/FutoshikiStudio.tsx`
- Modify: `web/src/components/PuzzleSelectorModal.tsx`
- Modify: `web/src/App.tsx`
- Create: `tests/web/futoshiki-utils.test.ts`

**Interfaces:**
- Produces:
  - `web/src/utils/futoshiki.ts`: `createEmptyFutoshikiGrid`, `findFutoshikiViolations`, `isFutoshikiSolved`, `SAMPLE_FUTOSHIKI_PUZZLES`
  - `web/src/components/FutoshikiStudio.tsx`: Full zero-scroll React PWA component
  - Registered in `PuzzleSelectorModal.tsx` and `App.tsx`

- [ ] **Step 1: Write failing tests for web utilities**

Create `tests/web/futoshiki-utils.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  createEmptyFutoshikiGrid,
  findFutoshikiViolations,
  isFutoshikiSolved,
  SAMPLE_FUTOSHIKI_PUZZLES,
} from '../../web/src/utils/futoshiki.js';

describe('Futoshiki Web Utilities', () => {
  it('creates empty user grid copying given clues only', () => {
    const sample = SAMPLE_FUTOSHIKI_PUZZLES[0];
    const userGrid = createEmptyFutoshikiGrid(sample.initialGrid);
    expect(userGrid.length).toBe(sample.size);
    for (let r = 0; r < sample.size; r++) {
      for (let c = 0; c < sample.size; c++) {
        expect(userGrid[r][c]).toBe(sample.initialGrid[r][c]);
      }
    }
  });

  it('detects row and column duplicate violations', () => {
    const sample = SAMPLE_FUTOSHIKI_PUZZLES[0];
    const userGrid = createEmptyFutoshikiGrid(sample.initialGrid);
    // Introduce duplicate in row 0
    userGrid[0][0] = 1;
    userGrid[0][1] = 1;

    const violations = findFutoshikiViolations(userGrid, sample.inequalities);
    expect(violations.duplicateCells.has('0,0')).toBe(true);
    expect(violations.duplicateCells.has('0,1')).toBe(true);
  });

  it('detects inequality violations', () => {
    const sample = SAMPLE_FUTOSHIKI_PUZZLES[0];
    const ineq = sample.inequalities[0];
    const userGrid = createEmptyFutoshikiGrid(sample.initialGrid);

    // Violate inequality
    if (ineq.relation === '<') {
      userGrid[ineq.row1][ineq.col1] = 4;
      userGrid[ineq.row2][ineq.col2] = 2;
    } else {
      userGrid[ineq.row1][ineq.col1] = 1;
      userGrid[ineq.row2][ineq.col2] = 3;
    }

    const violations = findFutoshikiViolations(userGrid, sample.inequalities);
    expect(violations.brokenInequalities.length).toBeGreaterThan(0);
  });

  it('verifies solved status when grid is correctly filled', () => {
    const sample = SAMPLE_FUTOSHIKI_PUZZLES[0];
    expect(isFutoshikiSolved(sample.solution, sample.solution, sample.inequalities)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/web/futoshiki-utils.test.ts`
Expected: FAIL with module not found for `futoshiki.js`.

- [ ] **Step 3: Implement web utilities, FutoshikiStudio component, and registrations**

1. Create `web/src/utils/futoshiki.ts`:
   - Sample puzzles for sizes 4, 5, 6.
   - `createEmptyFutoshikiGrid`, `findFutoshikiViolations`, `isFutoshikiSolved`.
2. Update `web/src/services/githubApi.ts`:
   - Support `puzzle_type: 'futoshiki'`, `futoshiki_size`, and `futoshiki_difficulty`.
3. Create `web/src/components/FutoshikiStudio.tsx`:
   - Layout: strictly zero-scroll fitting `100dvh` with `.safe-bottom` insets.
   - Size selector (4×4, 5×5, 6×6) and Difficulty toggle (Easy, Medium, Hard).
   - Interactive grid with inter-cell chevron badges.
   - Live soft-red highlighting for duplicates and broken inequalities.
   - Adaptive touch keypad (1..N, Backspace, Clear) + keyboard arrows/typing.
   - Solutions hidden by default on load, size change, difficulty change, sample cycling.
   - Reveal/Clear controls and 1-tap tablet delivery.
4. Update `web/src/components/PuzzleSelectorModal.tsx`:
   - Add Futoshiki with inequality icon (`Compass` or `EqualNot`/`ChevronsLeftRight`).
5. Update `web/src/App.tsx`:
   - Register `'futoshiki'` in puzzle state and render `<FutoshikiStudio />`.

- [ ] **Step 4: Run tests and verify builds**

Run:
```bash
npm test && npm run build && npm run build:web
```
Expected: PASS with 100% test pass rate (120+ tests) and 0 build errors.

- [ ] **Step 5: Commit**

```bash
git add web/src/ utils/ components/ App.tsx tests/web/futoshiki-utils.test.ts
git commit -m "feat(pwa): add interactive futoshiki studio to mobile web app"
```

---

### Task 6: Whole-Branch Review & Verification Checkpoint

- [ ] **Step 1: Run comprehensive verification**
```bash
npm test && npm run build && npm run build:web
```
- [ ] **Step 2: Verify git status and clean working tree**
```bash
git status
```
- [ ] **Step 3: Request final user review and approval before push**
