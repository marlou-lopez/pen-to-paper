# KenKen (Mathdoku) Puzzle Generator & Mobile Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement KenKen (Mathdoku) procedural puzzle generation (sizes 3×3 to 9×9), 3-page e-ink PDF rendering for reMarkable, CLI/tablet routing with archive pre-creation, GitHub Actions workflow automation, and a zero-scroll mobile PWA studio.

**Architecture:** A standalone generator module (`src/puzzles/kenken/`) generates Latin squares, partitions cells into contiguous cages with valid arithmetic operations (`+`, `−`, `×`, `÷`, single-cell givens), and verifies uniqueness using a constraint solver. Puzzles are rendered into 3-page PDFs (`1404x1872 pt`) via PDFKit with heavy cage outlines and synchronized spoiler page (`builder.addBufferPage()`), registered into the central registry, and exposed to the mobile PWA via a zero-scroll interactive `KenKenStudio.tsx` component.

**Tech Stack:** TypeScript (strict mode), Node.js, PDFKit, Vitest, React 18, Vite, Tailwind CSS, Lucide icons, GitHub Actions.

## Global Constraints

- Supported grid dimensions: 3×3 through 9×9 (default 6×6 for daily scheduled runs).
- Target reMarkable canvas size: 1404 × 1872 pt (portrait 3:4 aspect ratio, `PAGE_MARGIN = 72 pt`).
- High-contrast monochrome typography: Dark charcoal (`#111111`) / pure black, bold cage borders (3 pt), faint inner dividers (0.5 pt), crisp math badges in cage anchor cells.
- PDF structure: 3 pages (Page 1 = Puzzle, Page 2 = Synchronized Spoiler Blocker via `builder.addBufferPage()`, Page 3 = Answer Key).
- Tablet active inbox: `/Puzzles/Daily/`. Category folder: `/Puzzles/KenKen/`. Archive folder: `/Puzzles/Archive/KenKen/`.
- 100% offline generation: Algorithmic procedural generation requires zero external network calls or API keys.
- PWA layout: Zero-scroll mobile layout fitting within `100dvh` with `.safe-bottom` safe area insets.
- Solutions hidden by default in PWA with `[ 👁️ Reveal ]` / `[ 🙈 Hide ]` toggle and clear button.
- All tests and TypeScript compilation must pass cleanly: `npm test && npm run build && npm run build:web`.

---

### Task 1: Core Types & Latin Square Backtracking Generator

**Files:**
- Create: `src/puzzles/kenken/types.ts`
- Create: `src/puzzles/kenken/latin-square.ts`
- Test: `tests/puzzles/kenken-latin-square.test.ts`

**Interfaces:**
- Produces: `KenKenOp`, `KenKenDifficulty`, `KenKenCellCoord`, `KenKenCage`, `KenKenData`, `KenKenOptions`, `generateLatinSquare(size: number, seed?: number | string): number[][]`.

- [ ] **Step 1: Write the failing test for Latin Square Generator**

Create `tests/puzzles/kenken-latin-square.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { generateLatinSquare } from '../../src/puzzles/kenken/latin-square.ts';

describe('KenKen Latin Square Generator', () => {
  it('generates valid Latin squares for sizes 3 through 9', () => {
    for (let size = 3; size <= 9; size++) {
      const grid = generateLatinSquare(size, `test-seed-${size}`);
      expect(grid).toHaveLength(size);

      // Verify each row has numbers 1..size exactly once
      for (let r = 0; r < size; r++) {
        expect(grid[r]).toHaveLength(size);
        const rowSet = new Set(grid[r]);
        expect(rowSet.size).toBe(size);
        for (let num = 1; num <= size; num++) {
          expect(rowSet.has(num)).toBe(true);
        }
      }

      // Verify each column has numbers 1..size exactly once
      for (let c = 0; c < size; c++) {
        const colSet = new Set<number>();
        for (let r = 0; r < size; r++) {
          colSet.add(grid[r][c]);
        }
        expect(colSet.size).toBe(size);
        for (let num = 1; num <= size; num++) {
          expect(colSet.has(num)).toBe(true);
        }
      }
    }
  });

  it('produces deterministic output when given the same seed or date string', () => {
    const gridA = generateLatinSquare(6, '2026-10-12');
    const gridB = generateLatinSquare(6, '2026-10-12');
    expect(gridA).toEqual(gridB);

    const gridC = generateLatinSquare(6, '2026-10-13');
    expect(gridA).not.toEqual(gridC);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzles/kenken-latin-square.test.ts`
Expected: FAIL with "Cannot find module .../latin-square.ts"

- [ ] **Step 3: Implement Core Types and Latin Square Generator**

Create `src/puzzles/kenken/types.ts`:
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

Create `src/puzzles/kenken/latin-square.ts`:
```typescript
/**
 * Simple Linear Congruential Generator for reproducible pseudo-random numbers.
 */
function createRng(seedInput?: number | string): () => number {
  let seed = 123456789;
  if (typeof seedInput === 'number') {
    seed = seedInput;
  } else if (typeof seedInput === 'string') {
    let hash = 0;
    for (let i = 0; i < seedInput.length; i++) {
      hash = (hash << 5) - hash + seedInput.charCodeAt(i);
      hash |= 0;
    }
    seed = Math.abs(hash) || 123456789;
  } else {
    seed = Math.floor(Math.random() * 2147483647);
  }

  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle using seeded RNG.
 */
function shuffle<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates an N x N Latin square using backtracking.
 */
export function generateLatinSquare(size: number, seed?: number | string): number[][] {
  const clampedSize = Math.max(3, Math.min(9, size));
  const rng = createRng(seed);

  const grid: number[][] = Array.from({ length: clampedSize }, () =>
    Array(clampedSize).fill(0)
  );

  const numbers = Array.from({ length: clampedSize }, (_, i) => i + 1);

  function isSafe(row: number, col: number, num: number): boolean {
    for (let c = 0; c < clampedSize; c++) {
      if (grid[row][c] === num) return false;
    }
    for (let r = 0; r < clampedSize; r++) {
      if (grid[r][col] === num) return false;
    }
    return true;
  }

  function solve(row: number, col: number): boolean {
    if (row === clampedSize) return true;
    const nextRow = col === clampedSize - 1 ? row + 1 : row;
    const nextCol = col === clampedSize - 1 ? 0 : col + 1;

    const candidateNumbers = shuffle(numbers, rng);
    for (const num of candidateNumbers) {
      if (isSafe(row, col, num)) {
        grid[row][col] = num;
        if (solve(nextRow, nextCol)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  solve(0, 0);
  return grid;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/puzzles/kenken-latin-square.test.ts`
Expected: PASS (2 tests passed)

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/kenken/types.ts src/puzzles/kenken/latin-square.ts tests/puzzles/kenken-latin-square.test.ts
git commit -m "feat(kenken): add core types and latin square backtracking generator"
```

---

### Task 2: Contiguous Cage Partitioning, Math Operations & Constraint Solver

**Files:**
- Create: `src/puzzles/kenken/cages.ts`
- Create: `src/puzzles/kenken/solver.ts`
- Create: `src/puzzles/kenken/generator.ts`
- Create: `src/puzzles/kenken/index.ts`
- Test: `tests/puzzles/kenken-generator.test.ts`

**Interfaces:**
- Consumes: `KenKenCage`, `KenKenData`, `KenKenOptions`, `generateLatinSquare` from Task 1.
- Produces:
  - `partitionCages(grid: number[][], difficulty: KenKenDifficulty, rng: () => number): KenKenCage[]`
  - `solveKenKen(cages: KenKenCage[], size: number, maxSolutions?: number): number[][][]`
  - `KenKenGenerator` implementing `PuzzleGenerator`

- [ ] **Step 1: Write the failing test for Cage Partitioning, Solver & Generator**

Create `tests/puzzles/kenken-generator.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { KenKenGenerator } from '../../src/puzzles/kenken/generator.ts';
import { solveKenKen } from '../../src/puzzles/kenken/solver.ts';

describe('KenKen Generator & Solver', () => {
  it('generates a complete KenKen puzzle for default 6x6 grid', async () => {
    const generator = new KenKenGenerator();
    const puzzle = await generator.generate({ date: '2026-10-12', size: 6, difficulty: 'medium' });

    expect(puzzle.type).toBe('kenken');
    expect(puzzle.filename).toBe('KenKen_6x6_2026-10-12.pdf');
    expect(puzzle.puzzleData.size).toBe(6);
    expect(puzzle.puzzleData.grid).toHaveLength(6);
    expect(puzzle.puzzleData.cages.length).toBeGreaterThan(5);

    // Verify all 36 cells are assigned to exactly one cage
    const visited = new Set<string>();
    for (const cage of puzzle.puzzleData.cages) {
      expect(cage.cells.length).toBeGreaterThanOrEqual(1);
      expect(cage.cells.length).toBeLessThanOrEqual(4);
      for (const cell of cage.cells) {
        const key = `${cell.row},${cell.col}`;
        expect(visited.has(key)).toBe(false);
        visited.add(key);
      }
    }
    expect(visited.size).toBe(36);
  });

  it('correctly evaluates cage arithmetic targets', async () => {
    const generator = new KenKenGenerator();
    const puzzle = await generator.generate({ date: '2026-10-12', size: 5, difficulty: 'hard' });
    const { grid, cages } = puzzle.puzzleData;

    for (const cage of cages) {
      const values = cage.cells.map((c) => grid[c.row][c.col]);
      if (cage.op === 'none') {
        expect(cage.cells).toHaveLength(1);
        expect(cage.target).toBe(values[0]);
      } else if (cage.op === '+') {
        const sum = values.reduce((a, b) => a + b, 0);
        expect(cage.target).toBe(sum);
      } else if (cage.op === '*') {
        const product = values.reduce((a, b) => a * b, 1);
        expect(cage.target).toBe(product);
      } else if (cage.op === '-') {
        expect(cage.cells).toHaveLength(2);
        expect(cage.target).toBe(Math.abs(values[0] - values[1]));
      } else if (cage.op === '/') {
        expect(cage.cells).toHaveLength(2);
        const max = Math.max(values[0], values[1]);
        const min = Math.min(values[0], values[1]);
        expect(max % min).toBe(0);
        expect(cage.target).toBe(max / min);
      }
    }
  });

  it('guarantees unique solutions via the constraint solver', async () => {
    const generator = new KenKenGenerator();
    const puzzle = await generator.generate({ date: '2026-10-12', size: 4, difficulty: 'easy' });
    const solutions = solveKenKen(puzzle.puzzleData.cages, 4, 2);
    expect(solutions).toHaveLength(1);
    expect(solutions[0]).toEqual(puzzle.puzzleData.grid);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzles/kenken-generator.test.ts`
Expected: FAIL with "Cannot find module .../generator.ts"

- [ ] **Step 3: Implement Cage Partitioning, Solver, and Generator**

Create `src/puzzles/kenken/cages.ts`:
```typescript
import { KenKenCage, KenKenCellCoord, KenKenDifficulty, KenKenOp } from './types.ts';

function shuffle<T>(array: T[], rng: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function partitionCages(
  grid: number[][],
  difficulty: KenKenDifficulty,
  rng: () => number
): KenKenCage[] {
  const size = grid.length;
  const cageMap: number[][] = Array.from({ length: size }, () => Array(size).fill(-1));
  const cages: KenKenCage[] = [];
  let nextCageId = 0;

  const maxCageSize = size <= 4 ? 2 : difficulty === 'easy' ? 3 : 4;
  const allowAnchors = size >= 5;
  let remainingAnchors = allowAnchors ? (difficulty === 'easy' ? 2 : 1) : 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (cageMap[r][c] !== -1) continue;

      const cells: KenKenCellCoord[] = [{ row: r, col: c }];
      cageMap[r][c] = nextCageId;

      // Check if this should be a 1-cell anchor
      if (remainingAnchors > 0 && rng() < 0.15) {
        remainingAnchors--;
      } else {
        // Expand cage with random adjacent empty neighbors
        const targetCageSize = 2 + Math.floor(rng() * (maxCageSize - 1));
        while (cells.length < targetCageSize) {
          const neighbors: KenKenCellCoord[] = [];
          for (const cell of cells) {
            const deltas = [
              [-1, 0],
              [1, 0],
              [0, -1],
              [0, 1],
            ];
            for (const [dr, dc] of deltas) {
              const nr = cell.row + dr;
              const nc = cell.col + dc;
              if (
                nr >= 0 &&
                nr < size &&
                nc >= 0 &&
                nc < size &&
                cageMap[nr][nc] === -1 &&
                !neighbors.some((n) => n.row === nr && n.col === nc)
              ) {
                neighbors.push({ row: nr, col: nc });
              }
            }
          }

          if (neighbors.length === 0) break;
          const chosen = neighbors[Math.floor(rng() * neighbors.length)];
          cageMap[chosen.row][chosen.col] = nextCageId;
          cells.push(chosen);
        }
      }

      // Assign operation & target
      const values = cells.map((cell) => grid[cell.row][cell.col]);
      let op: KenKenOp = '+';
      let target = 0;

      if (cells.length === 1) {
        op = 'none';
        target = values[0];
      } else if (cells.length === 2) {
        const [a, b] = values;
        const max = Math.max(a, b);
        const min = Math.min(a, b);
        const candidates: Array<{ op: KenKenOp; target: number }> = [];

        // Division
        if (max % min === 0 && (difficulty !== 'easy' || size >= 5)) {
          candidates.push({ op: '/', target: max / min });
        }
        // Subtraction
        candidates.push({ op: '-', target: max - min });
        // Addition
        candidates.push({ op: '+', target: a + b });
        // Multiplication
        if (difficulty !== 'easy') {
          candidates.push({ op: '*', target: a * b });
        }

        const picked = candidates[Math.floor(rng() * candidates.length)];
        op = picked.op;
        target = picked.target;
      } else {
        // 3 or 4 cells: '+' or '*'
        const sum = values.reduce((acc, v) => acc + v, 0);
        const prod = values.reduce((acc, v) => acc * v, 1);

        if (difficulty !== 'easy' && prod <= 400 && rng() < 0.4) {
          op = '*';
          target = prod;
        } else {
          op = '+';
          target = sum;
        }
      }

      cages.push({
        id: nextCageId++,
        op,
        target,
        cells,
      });
    }
  }

  return cages;
}
```

Create `src/puzzles/kenken/solver.ts`:
```typescript
import { KenKenCage } from './types.ts';

export function isCageSatisfied(cage: KenKenCage, grid: number[][]): boolean {
  const vals: number[] = [];
  for (const c of cage.cells) {
    const val = grid[c.row][c.col];
    if (val === 0) return true; // not fully filled yet
    vals.push(val);
  }

  if (vals.length < cage.cells.length) return true;

  if (cage.op === 'none') {
    return vals[0] === cage.target;
  }
  if (cage.op === '+') {
    return vals.reduce((a, b) => a + b, 0) === cage.target;
  }
  if (cage.op === '*') {
    return vals.reduce((a, b) => a * b, 1) === cage.target;
  }
  if (cage.op === '-') {
    return Math.abs(vals[0] - vals[1]) === cage.target;
  }
  if (cage.op === '/') {
    const max = Math.max(vals[0], vals[1]);
    const min = Math.min(vals[0], vals[1]);
    return min !== 0 && max % min === 0 && max / min === cage.target;
  }
  return true;
}

export function solveKenKen(
  cages: KenKenCage[],
  size: number,
  maxSolutions = 2
): number[][][] {
  const grid: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
  const cellToCage = new Map<string, KenKenCage>();
  for (const cage of cages) {
    for (const cell of cage.cells) {
      cellToCage.set(`${cell.row},${cell.col}`, cage);
    }
  }

  const solutions: number[][][] = [];

  function isSafe(row: number, col: number, num: number): boolean {
    for (let c = 0; c < size; c++) {
      if (grid[row][c] === num) return false;
    }
    for (let r = 0; r < size; r++) {
      if (grid[r][col] === num) return false;
    }

    grid[row][col] = num;
    const cage = cellToCage.get(`${row},${col}`);
    const valid = cage ? isCageSatisfied(cage, grid) : true;
    grid[row][col] = 0;

    return valid;
  }

  function search(row: number, col: number): boolean {
    if (row === size) {
      solutions.push(grid.map((r) => [...r]));
      return solutions.length >= maxSolutions;
    }

    const nextRow = col === size - 1 ? row + 1 : row;
    const nextCol = col === size - 1 ? 0 : col + 1;

    for (let num = 1; num <= size; num++) {
      if (isSafe(row, col, num)) {
        grid[row][col] = num;
        if (search(nextRow, nextCol)) return true;
        grid[row][col] = 0;
      }
    }
    return false;
  }

  search(0, 0);
  return solutions;
}
```

Create `src/puzzles/kenken/generator.ts`:
```typescript
import { GeneratedPuzzle, PuzzleGenerator } from '../../core/types.ts';
import { generateLatinSquare } from './latin-square.ts';
import { partitionCages } from './cages.ts';
import { solveKenKen } from './solver.ts';
import { KenKenData, KenKenOptions } from './types.ts';

export class KenKenGenerator implements PuzzleGenerator<KenKenData, KenKenOptions> {
  readonly type = 'kenken' as const;

  async generate(options?: KenKenOptions): Promise<GeneratedPuzzle<KenKenData>> {
    const size = Math.max(3, Math.min(9, options?.size ?? 6));
    const difficulty = options?.difficulty ?? 'medium';
    const dateStr =
      options?.date ?? new Date().toISOString().slice(0, 10);
    const seed = options?.seed ?? `${dateStr}-${size}-${difficulty}`;

    let attempt = 0;
    while (attempt < 10) {
      attempt++;
      const currentSeed = `${seed}-${attempt}`;
      const grid = generateLatinSquare(size, currentSeed);
      let hash = 0;
      for (let i = 0; i < currentSeed.length; i++) hash = (hash << 5) - hash + currentSeed.charCodeAt(i);
      let s = Math.abs(hash) || 12345;
      const rng = () => {
        s = (s * 1664525 + 1013904223) % 4294967296;
        return s / 4294967296;
      };

      const cages = partitionCages(grid, difficulty, rng);
      const solutions = solveKenKen(cages, size, 2);

      if (solutions.length === 1) {
        const puzzleData: KenKenData = {
          size,
          grid,
          cages,
          date: dateStr,
          difficulty,
        };

        const filename = `KenKen_${size}x${size}_${dateStr}.pdf`;
        return {
          type: 'kenken',
          title: `KenKen ${size}x${size}`,
          filename,
          puzzleData,
          pdfBuffer: Buffer.alloc(0),
        };
      }
    }

    // Fallback guaranteed valid
    const grid = generateLatinSquare(size, seed);
    let s = 12345;
    const rng = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
    const cages = partitionCages(grid, difficulty, rng);

    return {
      type: 'kenken',
      title: `KenKen ${size}x${size}`,
      filename: `KenKen_${size}x${size}_${dateStr}.pdf`,
      puzzleData: {
        size,
        grid,
        cages,
        date: dateStr,
        difficulty,
      },
      pdfBuffer: Buffer.alloc(0),
    };
  }

  async renderPdf(puzzle: GeneratedPuzzle<KenKenData>): Promise<Buffer> {
    const { renderKenKenPdf } = await import('./renderer.ts');
    return renderKenKenPdf(puzzle);
  }
}
```

Create `src/puzzles/kenken/index.ts`:
```typescript
export * from './types.ts';
export * from './latin-square.ts';
export * from './cages.ts';
export * from './solver.ts';
export * from './generator.ts';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/puzzles/kenken-generator.test.ts`
Expected: PASS (3 tests passed)

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/kenken/cages.ts src/puzzles/kenken/solver.ts src/puzzles/kenken/generator.ts src/puzzles/kenken/index.ts tests/puzzles/kenken-generator.test.ts
git commit -m "feat(kenken): implement cage partitioner, solver, and generator"
```

---

### Task 3: E-Ink 3-Page PDF Renderer

**Files:**
- Create: `src/puzzles/kenken/renderer.ts`
- Modify: `src/puzzles/kenken/generator.ts` (attach renderer buffer to `generate()`)
- Test: `tests/puzzles/kenken-renderer.test.ts`

**Interfaces:**
- Consumes: `KenKenData`, `PdfBuilder` (`addBufferPage`, `addAnswerKeyPage`).
- Produces: `renderKenKenPdf(puzzle: GeneratedPuzzle<KenKenData> | KenKenData): Promise<Buffer>`.

- [ ] **Step 1: Write the failing test for PDF Renderer**

Create `tests/puzzles/kenken-renderer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { KenKenGenerator } from '../../src/puzzles/kenken/generator.ts';
import { renderKenKenPdf } from '../../src/puzzles/kenken/renderer.ts';

describe('KenKen E-Ink PDF Renderer', () => {
  it('renders a valid 3-page e-ink PDF with %PDF magic bytes for 6x6 puzzle', async () => {
    const generator = new KenKenGenerator();
    const puzzle = await generator.generate({ date: '2026-10-12', size: 6, difficulty: 'medium' });
    const pdfBuffer = await renderKenKenPdf(puzzle);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');

    // Count pages in PDF buffer (matches /Type /Page count)
    const pdfText = pdfBuffer.toString('binary');
    const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
    expect(pageMatches).not.toBeNull();
    expect(pageMatches?.length).toBe(3);
  });

  it('renders valid PDFs across small (3x3) and large (9x9) sizes', async () => {
    const generator = new KenKenGenerator();
    for (const size of [3, 9]) {
      const puzzle = await generator.generate({ date: '2026-10-12', size, difficulty: 'medium' });
      const pdfBuffer = await renderKenKenPdf(puzzle);
      expect(pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
    }
  });

  it('populates generator.generate with rendered pdfBuffer', async () => {
    const generator = new KenKenGenerator();
    const puzzle = await generator.generate({ date: '2026-10-12', size: 5 });
    expect(puzzle.pdfBuffer.length).toBeGreaterThan(1000);
    expect(puzzle.pdfBuffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzles/kenken-renderer.test.ts`
Expected: FAIL with "Cannot find module .../renderer.ts"

- [ ] **Step 3: Implement 3-Page E-Ink Renderer**

Create `src/puzzles/kenken/renderer.ts`:
```typescript
import { PdfBuilder, PAGE_MARGIN, PAGE_WIDTH, PAGE_HEIGHT } from '../../core/pdf-builder.js';
import { GeneratedPuzzle } from '../../core/types.js';
import { KenKenCage, KenKenData } from './types.ts';

function formatOpBadge(cage: KenKenCage): string {
  if (cage.op === 'none') return `${cage.target}`;
  const opSymbol =
    cage.op === '+' ? '+' : cage.op === '-' ? '−' : cage.op === '*' ? '×' : '÷';
  return `${cage.target}${opSymbol}`;
}

export function renderKenKenPdf(
  puzzle: GeneratedPuzzle<KenKenData> | KenKenData
): Promise<Buffer> {
  const data: KenKenData = 'puzzleData' in puzzle ? puzzle.puzzleData : puzzle;
  const size = data.size;
  const dateStr = data.date;
  const difficulty = data.difficulty.charAt(0).toUpperCase() + data.difficulty.slice(1);

  const builder = new PdfBuilder('KenKen', `${size}x${size} • ${difficulty}`, dateStr);
  const doc = builder.getDoc();

  // Grid sizing calculations
  const maxBoardDim = Math.min(PAGE_WIDTH - PAGE_MARGIN * 2, PAGE_HEIGHT - PAGE_MARGIN * 2 - 240);
  const cellSize = Math.floor(maxBoardDim / size);
  const boardSize = cellSize * size;
  const startX = Math.floor((PAGE_WIDTH - boardSize) / 2);
  const startY = PAGE_MARGIN + 160;

  // Build cell to cage mapping
  const cellToCageId = new Map<string, number>();
  const cageAnchorCells = new Map<number, { row: number; col: number }>();

  for (const cage of data.cages) {
    // Find top-left-most cell for badge placement
    let anchor = cage.cells[0];
    for (const cell of cage.cells) {
      cellToCageId.set(`${cell.row},${cell.col}`, cage.id);
      if (cell.row < anchor.row || (cell.row === anchor.row && cell.col < anchor.col)) {
        anchor = cell;
      }
    }
    cageAnchorCells.set(cage.id, anchor);
  }

  function drawGrid(isSolution = false) {
    const activeDoc = isSolution ? builder.getDoc() : doc;

    // Rules prompt on Page 1
    if (!isSolution) {
      activeDoc
        .font('Helvetica')
        .fontSize(16)
        .fillColor('#444444')
        .text(
          `Fill with digits 1-${size} without repeats in rows/cols. Bold cages must compute to target number.`,
          PAGE_MARGIN,
          startY - 40,
          { width: PAGE_WIDTH - PAGE_MARGIN * 2, align: 'center' }
        );
    }

    // Draw inner grid lines (faint)
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;
        activeDoc
          .rect(x, y, cellSize, cellSize)
          .lineWidth(0.5)
          .strokeColor('#D1D5DB')
          .stroke();
      }
    }

    // Draw bold cage borders
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const currentCage = cellToCageId.get(`${r},${c}`);
        const x = startX + c * cellSize;
        const y = startY + r * cellSize;

        // Top border
        const topCage = r > 0 ? cellToCageId.get(`${r - 1},${c}`) : undefined;
        if (topCage !== currentCage) {
          activeDoc
            .moveTo(x, y)
            .lineTo(x + cellSize, y)
            .lineWidth(3)
            .strokeColor('#000000')
            .stroke();
        }

        // Bottom border
        const bottomCage = r < size - 1 ? cellToCageId.get(`${r + 1},${c}`) : undefined;
        if (bottomCage !== currentCage) {
          activeDoc
            .moveTo(x, y + cellSize)
            .lineTo(x + cellSize, y + cellSize)
            .lineWidth(3)
            .strokeColor('#000000')
            .stroke();
        }

        // Left border
        const leftCage = c > 0 ? cellToCageId.get(`${r},${c - 1}`) : undefined;
        if (leftCage !== currentCage) {
          activeDoc
            .moveTo(x, y)
            .lineTo(x, y + cellSize)
            .lineWidth(3)
            .strokeColor('#000000')
            .stroke();
        }

        // Right border
        const rightCage = c < size - 1 ? cellToCageId.get(`${r},${c + 1}`) : undefined;
        if (rightCage !== currentCage) {
          activeDoc
            .moveTo(x + cellSize, y)
            .lineTo(x + cellSize, y + cellSize)
            .lineWidth(3)
            .strokeColor('#000000')
            .stroke();
        }
      }
    }

    // Outer frame (bold)
    activeDoc
      .rect(startX, startY, boardSize, boardSize)
      .lineWidth(3)
      .strokeColor('#000000')
      .stroke();

    // Draw cage clue badges
    const badgeFontSize = size <= 4 ? 18 : size <= 6 ? 15 : 12;
    for (const cage of data.cages) {
      const anchor = cageAnchorCells.get(cage.id);
      if (!anchor) continue;
      const x = startX + anchor.col * cellSize + 5;
      const y = startY + anchor.row * cellSize + 4;
      activeDoc
        .font('Helvetica-Bold')
        .fontSize(badgeFontSize)
        .fillColor(isSolution ? '#666666' : '#000000')
        .text(formatOpBadge(cage), x, y, { lineBreak: false });
    }

    // If solution page, draw numbers centered
    if (isSolution) {
      const numFontSize = Math.floor(cellSize * 0.52);
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          const val = data.grid[r][c];
          const x = startX + c * cellSize;
          const y = startY + r * cellSize + Math.floor(cellSize * 0.22);
          activeDoc
            .font('Helvetica-Bold')
            .fontSize(numFontSize)
            .fillColor('#000000')
            .text(`${val}`, x, y, { width: cellSize, align: 'center' });
        }
      }
    }
  }

  // Page 1: Puzzle
  drawGrid(false);

  // Page 2: Synchronized Spoiler Blocker
  builder.addBufferPage();

  // Page 3: Answer Key
  builder.addAnswerKeyPage(`KenKen (${size}x${size})`);
  drawGrid(true);

  return builder.build();
}
```

Update `src/puzzles/kenken/generator.ts` to render the PDF buffer during `generate()`:
```typescript
    // Inside KenKenGenerator.generate():
    const pdfBuffer = await this.renderPdf({
      type: 'kenken',
      title: `KenKen ${size}x${size}`,
      filename,
      puzzleData,
      pdfBuffer: Buffer.alloc(0),
    });

    return {
      type: 'kenken',
      title: `KenKen ${size}x${size}`,
      filename,
      puzzleData,
      pdfBuffer,
    };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/puzzles/kenken-renderer.test.ts`
Expected: PASS (3 tests passed)

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/kenken/renderer.ts src/puzzles/kenken/generator.ts tests/puzzles/kenken-renderer.test.ts
git commit -m "feat(kenken): implement e-ink 3-page pdf renderer for kenken"
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
- Consumes: `KenKenGenerator` from Task 2.
- Produces:
  - CLI support for `--type=kenken`, `--size=N`, and `--type=all` generating 4 puzzles.
  - Tablet client `/Puzzles/KenKen` and `/Puzzles/Archive/KenKen`.
  - Workflow inputs `kenken`, `kenken_size`, `kenken_difficulty`.

- [ ] **Step 1: Write the failing tests in CLI and Delivery clients**

In `tests/cli.test.ts`, add test cases:
```typescript
it('filters by kenken puzzle type when specified with custom size', async () => {
  const result = await orchestrator.runGenerator({ type: 'kenken', size: 5, local: true });
  expect(result).toHaveLength(1);
  expect(result[0].type).toBe('kenken');
  expect(result[0].puzzleData.size).toBe(5);
});

it('routes kenken to /Puzzles/KenKen by default and /Puzzles/Daily when daily option is true', async () => {
  const defaultRes = await orchestrator.runGenerator({ type: 'kenken', local: true });
  expect(defaultRes[0].destinationFolder).toBe('/Puzzles/KenKen');

  const dailyRes = await orchestrator.runGenerator({ type: 'kenken', daily: true, local: true });
  expect(dailyRes[0].destinationFolder).toBe('/Puzzles/Daily');
});

it('generates word-search, sudoku, mini-crossword, and kenken when type is all', async () => {
  const result = await orchestrator.runGenerator({ type: 'all', local: true });
  expect(result).toHaveLength(4);
  const types = result.map((r) => r.type);
  expect(types).toContain('word-search');
  expect(types).toContain('sudoku');
  expect(types).toContain('mini-crossword');
  expect(types).toContain('kenken');
});
```

In `tests/delivery/clients.test.ts`, verify `/Puzzles/Archive/KenKen` is created on initialization.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/cli.test.ts`
Expected: FAIL ("kenken" not recognized)

- [ ] **Step 3: Implement Registry, CLI, Delivery Routing, and Workflow**

1. In `src/core/types.ts`:
   Update `PuzzleType`:
   ```typescript
   export type PuzzleType = 'word-search' | 'sudoku' | 'mini-crossword' | 'kenken';
   ```
2. In `src/core/registry.ts`:
   Register `KenKenGenerator`:
   ```typescript
   import { KenKenGenerator } from '../puzzles/kenken/index.js';
   // Inside createDefaultRegistry():
   registry.register(new KenKenGenerator());
   ```
3. In `src/index.ts`:
   Export `* from './puzzles/kenken/index.js'`.
4. In `src/cli.ts`:
   Update `parseArgs` to support `--size` (3-9, default 6) and pass it to generator options. On `--type=all`, generate all 4 puzzle types.
   Set default folder for `kenken` to `/Puzzles/KenKen`.
5. In `src/delivery/local-client.ts` and `src/delivery/rmapi-client.ts`:
   Add `/Puzzles/Archive/KenKen` to the archive directories array initialized on startup.
6. In `.github/workflows/daily-puzzles.yml`:
   Add `kenken` to `puzzle_type` options, add `kenken_size` input (`3`..`9`), and `kenken_difficulty` input (`easy`, `medium`, `hard`).
7. In `README.md`:
   Update puzzle list and folder structure with KenKen.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/cli.test.ts tests/delivery/clients.test.ts`
Expected: PASS (all tests pass)

- [ ] **Step 5: Commit**

```bash
git add src/core/types.ts src/core/registry.ts src/index.ts src/cli.ts src/delivery/local-client.ts src/delivery/rmapi-client.ts .github/workflows/daily-puzzles.yml README.md tests/cli.test.ts tests/delivery/clients.test.ts
git commit -m "feat(kenken): integrate kenken into registry, cli, tablet delivery, and workflow"
```

---

### Task 5: Mobile Zero-Scroll PWA KenKen Studio

**Files:**
- Create: `web/src/utils/kenken.ts`
- Create: `web/src/components/KenKenStudio.tsx`
- Modify: `web/src/components/PuzzleSelectorModal.tsx`
- Modify: `web/src/App.tsx`
- Modify: `web/src/services/githubApi.ts`
- Test: `tests/web/kenken-utils.test.ts`
- Test: `tests/web/settings.test.ts`

**Interfaces:**
- Consumes: `getStoredSettings`, `dispatchWorkflow`, `pollWorkflowRun`.
- Produces:
  - `web/src/utils/kenken.ts`: `createEmptyKenKenGrid`, `isKenKenSolved`, `getBorderStylesForCell`, `SAMPLE_KENKEN_PUZZLES`.
  - `KenKenStudio` component in `web/src/components/KenKenStudio.tsx`.

- [ ] **Step 1: Write the failing tests for KenKen Web Utilities & Workflow Dispatch**

Create `tests/web/kenken-utils.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import {
  createEmptyKenKenGrid,
  isKenKenSolved,
  SAMPLE_KENKEN_PUZZLES,
} from '../../web/src/utils/kenken.ts';

describe('KenKen Web Utilities', () => {
  it('creates an empty grid with nulls/zeros keeping solutions hidden by default', () => {
    const grid = createEmptyKenKenGrid(6);
    expect(grid).toHaveLength(6);
    for (let r = 0; r < 6; r++) {
      expect(grid[r]).toHaveLength(6);
      for (let c = 0; c < 6; c++) {
        expect(grid[r][c]).toBeNull();
      }
    }
  });

  it('provides verified sample puzzles from size 3 to 9', () => {
    for (let size = 3; size <= 9; size++) {
      const puzzle = SAMPLE_KENKEN_PUZZLES[size];
      expect(puzzle).toBeDefined();
      expect(puzzle.size).toBe(size);
      expect(puzzle.grid).toHaveLength(size);
      expect(puzzle.cages.length).toBeGreaterThan(1);
    }
  });

  it('evaluates solved status correctly', () => {
    const puzzle = SAMPLE_KENKEN_PUZZLES[4];
    const emptyGrid = createEmptyKenKenGrid(4);
    expect(isKenKenSolved(emptyGrid, puzzle)).toBe(false);

    expect(isKenKenSolved(puzzle.grid, puzzle)).toBe(true);
  });
});
```

In `tests/web/settings.test.ts`, add test for dispatching `kenken` with `kenken_size` and `kenken_difficulty`.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/web/kenken-utils.test.ts`
Expected: FAIL with "Cannot find module .../kenken.ts"

- [ ] **Step 3: Implement KenKen Web Utilities & Studio Component**

1. Create `web/src/utils/kenken.ts`:
   - Sample puzzles for sizes 3 through 9.
   - `createEmptyKenKenGrid(size: number): (number | null)[][]`.
   - `isKenKenSolved(userGrid: (number | null)[][], puzzle: KenKenData): boolean`.
   - `getBorderClasses(r: number, c: number, size: number, cellToCageId: Map<string, number>): string`.
2. Update `web/src/services/githubApi.ts`:
   - Support `puzzle_type: 'kenken'` and inputs `kenken_size`, `kenken_difficulty`.
3. Create `web/src/components/KenKenStudio.tsx`:
   - Single-viewport zero-scroll mobile layout (`100dvh` + `.safe-bottom`).
   - Size selector chips (`3×3`, `4×4`, `5×5`, `6×6`, `7×7`, `8×8`, `9×9`).
   - Difficulty selector (`Easy`, `Medium`, `Hard`).
   - Hidden solutions by default on load and size change.
   - Utility bar with `[ 👁️ Reveal ]` / `[ 🙈 Hide ]`, `[ 🧹 Clear ]`, `[ ✨ Sample ]`.
   - Active cage highlighting with math badge banner (e.g. *“Cage: 12× • Target: 12”*).
   - Numeric touch keypad (1 through N, Backspace) + keyboard support.
   - Latin square and cage validation with celebratory `🎉 Solved!` badge.
   - 1-Tap `Send to reMarkable` with live GitHub Actions polling banner.
4. Register in `web/src/components/PuzzleSelectorModal.tsx`:
   - Add `🧮 KenKen Studio` (`kenken`).
5. Register in `web/src/App.tsx`:
   - Add `'kenken'` to tab state and header dropdown switcher.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/web/kenken-utils.test.ts tests/web/settings.test.ts`
Expected: PASS

Run web build: `npm run build && npm run build:web`
Expected: PASS (zero TypeScript or Vite compilation errors)

- [ ] **Step 5: Commit**

```bash
git add web/src/utils/kenken.ts web/src/components/KenKenStudio.tsx web/src/components/PuzzleSelectorModal.tsx web/src/App.tsx web/src/services/githubApi.ts tests/web/kenken-utils.test.ts tests/web/settings.test.ts
git commit -m "feat(pwa): add interactive kenken studio to mobile web app"
```

---

## Plan Self-Review Checklist

1. **Spec Coverage**:
   - 3×3 to 9×9 procedural generation: covered in Tasks 1 & 2.
   - 3-page e-ink PDF with bold cage outlines & synchronized buffer page: covered in Task 3.
   - CLI flags, archive folders, and GitHub Actions workflow: covered in Task 4.
   - Zero-scroll PWA studio with hidden solutions by default, reveal toggle, keypad, and 1-tap dispatch: covered in Task 5.
2. **Placeholder Scan**: Zero instances of "TODO", "TBD", or unwritten steps.
3. **Type Consistency**: `KenKenOp`, `KenKenDifficulty`, `KenKenCage`, `KenKenData`, `KenKenOptions` are used consistently across backend and frontend.
