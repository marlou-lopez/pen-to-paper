# Mobile PWA Puzzle Studio & Word Search Typography Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Progressive Web App (`web/`) with an interactive 9x9 Sudoku grid builder that triggers GitHub Actions workflow dispatch with a user's Fine-Grained PAT, implement the backend `x` notation Sudoku parser and backtracking solver, and increase Word Search typography sizes for enhanced e-ink legibility.

**Architecture:** 
- Backend engine (`src/`): Add `parser.ts` and `solver.ts` to `src/puzzles/sudoku/` to parse `x` notation, solve custom puzzles, and render them; update `renderer.ts` in Word Search with larger fonts (22pt); wire `--grid` into `cli.ts` and `.github/workflows/daily-puzzles.yml`.
- Frontend (`web/`): A touch-friendly Vite + React + Tailwind CSS PWA with interactive 9x9 grid, floating 1–9 number pad, duplicate highlighting, client-side validation, and GitHub Actions dispatch client; deploy via `.github/workflows/deploy-pwa.yml` to GitHub Pages.

**Tech Stack:** TypeScript, Node.js, Vitest, React 18, Vite, Tailwind CSS, `vite-plugin-pwa`, GitHub Pages.

## Global Constraints
- Target reMarkable active inbox: `/Puzzles/Daily`
- Custom Sudoku destination default: `/Puzzles/Sudoku` (unless `--daily` passed)
- Custom Sudoku notation: 9 rows separated by `/` or `\n`, clues `1-9`, blanks `x` or `X` (tolerates `.` and `0`)
- Word Search font size: Words 22pt (from 18pt), section headers 24pt (from 22pt), vertical spacing 38pt (from 32pt)
- All existing tests and TypeScript compilation must pass cleanly (`npm test && npm run build`)
- PWA must build cleanly (`npm --prefix web run build`) and have valid PWA manifest

---

### Task 1: Word Search Typography Enhancement

**Files:**
- Modify: `src/puzzles/word-search/renderer.ts:31-45, 114-124`
- Test: `tests/puzzles/word-search.test.ts:1-75`

**Interfaces:**
- Consumes: `renderWordSearchPdf(puzzle: GeneratedPuzzle<WordSearchData>)`
- Produces: PDF with 22pt word checklist (Page 1) and solutions list (Page 3) with 38pt row spacing

- [ ] **Step 1: Write/Update test in `tests/puzzles/word-search.test.ts`**

Verify that rendering with updated typography builds without errors and produces valid PDF buffer:

```typescript
  it('renders valid PDF buffer with enhanced typography sizes', async () => {
    const generator = new WordSearchGenerator();
    const puzzle = await generator.generate({ theme: 'Astronomy' });
    const pdfBuffer = await generator.renderPdf(puzzle);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(1000);
  });
```

- [ ] **Step 2: Update typography in `src/puzzles/word-search/renderer.ts`**

Update Page 1 checklist font size and vertical spacing:
```typescript
  // Draw Word Checklist (3 columns)
  const checklistY = startY + gridWidth + 40;
  doc.fontSize(24).font('Helvetica-Bold').fillColor('#000000').text('Words to Find:', PAGE_MARGIN, checklistY);

  const colWidth = (PAGE_WIDTH - PAGE_MARGIN * 2) / 3;
  const itemsPerCol = Math.ceil(words.length / 3);
  doc.font('Helvetica').fontSize(22).fillColor('#222222');

  words.forEach((word, index) => {
    const col = Math.floor(index / itemsPerCol);
    const row = index % itemsPerCol;
    const x = PAGE_MARGIN + col * colWidth;
    const y = checklistY + 40 + row * 38;
    doc.text(`[  ]  ${word}`, x, y);
  });
```

Update Page 3 Solutions list font size and vertical spacing:
```typescript
  // Draw Solutions list below the grid on Page 3
  keyDoc.fontSize(24).font('Helvetica-Bold').fillColor('#000000').text('Solutions:', PAGE_MARGIN, checklistY);
  keyDoc.font('Helvetica').fontSize(22).fillColor('#222222');
  words.forEach((word, index) => {
    const col = Math.floor(index / itemsPerCol);
    const row = index % itemsPerCol;
    const x = PAGE_MARGIN + col * colWidth;
    const y = checklistY + 40 + row * 38;
    keyDoc.text(`[X]  ${word}`, x, y);
  });
```

- [ ] **Step 3: Run test suite**

Run: `npm test tests/puzzles/word-search.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/puzzles/word-search/renderer.ts tests/puzzles/word-search.test.ts
git commit -m "feat(word-search): increase font size of words to find and solution checklist to 22pt"
```

---

### Task 2: Custom Sudoku Grid Parser & Backtracking Solver

**Files:**
- Create: `src/puzzles/sudoku/parser.ts`
- Create: `src/puzzles/sudoku/solver.ts`
- Modify: `src/puzzles/sudoku/index.ts:1-10`
- Test: `tests/puzzles/sudoku-parser.test.ts`

**Interfaces:**
- `parseSudokuGrid(input: string): (number | null)[][]`
- `solveSudoku(grid: (number | null)[][]): number[][]`

- [ ] **Step 1: Write failing unit tests in `tests/puzzles/sudoku-parser.test.ts`**

```typescript
import { describe, it, expect } from 'vitest';
import { parseSudokuGrid } from '../../src/puzzles/sudoku/parser.js';
import { solveSudoku } from '../../src/puzzles/sudoku/solver.js';

describe('Sudoku Parser & Solver', () => {
  const sampleNotation = '53xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79';

  it('parses valid x notation into 9x9 matrix', () => {
    const grid = parseSudokuGrid(sampleNotation);
    expect(grid).toHaveLength(9);
    expect(grid[0]).toHaveLength(9);
    expect(grid[0][0]).toBe(5);
    expect(grid[0][1]).toBe(3);
    expect(grid[0][2]).toBeNull();
    expect(grid[0][4]).toBe(7);
  });

  it('tolerates dots, zeros, and newlines', () => {
    const multiLine = '53..7....\n6..195...\n.98....6.\n8...6...3\n4..8.3..1\n7...2...6\n.6....28.\n...419..5\n....8..79';
    const grid = parseSudokuGrid(multiLine);
    expect(grid[0][0]).toBe(5);
    expect(grid[0][2]).toBeNull();
  });

  it('throws helpful error when row count is invalid', () => {
    expect(() => parseSudokuGrid('53xx7xxxx/6xx195xxx')).toThrow('Expected 9 rows separated by \'/\', but found 2');
  });

  it('throws helpful error when row length is not 9', () => {
    expect(() => parseSudokuGrid('53xx7xxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79')).toThrow('Row 1 has 8 cells instead of 9');
  });

  it('throws helpful error on duplicate clue in row/col/box', () => {
    // Row 1 has duplicate 5
    const duplicate = '55xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79';
    expect(() => parseSudokuGrid(duplicate)).toThrow('duplicate number 5');
  });

  it('solves valid sudoku puzzle', () => {
    const grid = parseSudokuGrid(sampleNotation);
    const solution = solveSudoku(grid);
    expect(solution).toHaveLength(9);
    expect(solution[0]).toHaveLength(9);
    expect(solution[0][0]).toBe(5);
    expect(solution[0][1]).toBe(3);
    expect(solution[0][2]).toBe(4);
    // Verify no nulls in solution
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        expect(typeof solution[r][c]).toBe('number');
      }
    }
  });

  it('throws error for unsolvable puzzle', () => {
    // Contrived unsolvable board
    const unsolvable = '12345678x/xxxxxxxx9/xxxxxxxx8/xxxxxxxx7/xxxxxxxx6/xxxxxxxx5/xxxxxxxx4/xxxxxxxx3/xxxxxxxx2';
    const grid = parseSudokuGrid(unsolvable);
    expect(() => solveSudoku(grid)).toThrow('The provided Sudoku has no valid solution');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test tests/puzzles/sudoku-parser.test.ts`
Expected: FAIL because parser and solver modules do not exist yet.

- [ ] **Step 3: Implement `src/puzzles/sudoku/parser.ts`**

```typescript
export function parseSudokuGrid(input: string): (number | null)[][] {
  if (!input || typeof input !== 'string') {
    throw new Error('Sudoku grid input is empty or invalid.');
  }

  // Split by slashes or newlines
  const rawRows = input.includes('/') ? input.split('/') : input.split(/\r?\n/);
  const rows = rawRows.map((r) => r.trim()).filter((r) => r.length > 0);

  if (rows.length !== 9) {
    throw new Error(`Expected 9 rows separated by '/', but found ${rows.length}.`);
  }

  const grid: (number | null)[][] = [];

  for (let r = 0; r < 9; r++) {
    const rowStr = rows[r];
    if (rowStr.length !== 9) {
      throw new Error(`Row ${r + 1} has ${rowStr.length} cells instead of 9 ("${rowStr}").`);
    }

    const row: (number | null)[] = [];
    for (let c = 0; c < 9; c++) {
      const char = rowStr[c];
      if (char.toLowerCase() === 'x' || char === '.' || char === '-' || char === '0') {
        row.push(null);
      } else if (char >= '1' && char <= '9') {
        row.push(parseInt(char, 10));
      } else {
        throw new Error(`Invalid character '${char}' in row ${r + 1}, column ${c + 1}.`);
      }
    }
    grid.push(row);
  }

  // Check for duplicate clues
  validateClues(grid);

  return grid;
}

function validateClues(grid: (number | null)[][]): void {
  // Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Set<number>();
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c];
      if (val !== null) {
        if (seen.has(val)) {
          throw new Error(`Invalid puzzle: duplicate number ${val} in row ${r + 1}.`);
        }
        seen.add(val);
      }
    }
  }

  // Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Set<number>();
    for (let r = 0; r < 9; r++) {
      const val = grid[r][c];
      if (val !== null) {
        if (seen.has(val)) {
          throw new Error(`Invalid puzzle: duplicate number ${val} in column ${c + 1}.`);
        }
        seen.add(val);
      }
    }
  }

  // Check 3x3 boxes
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen = new Set<number>();
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const val = grid[br * 3 + r][bc * 3 + c];
          if (val !== null) {
            if (seen.has(val)) {
              throw new Error(`Invalid puzzle: duplicate number ${val} in box (${br + 1}, ${bc + 1}).`);
            }
            seen.add(val);
          }
        }
      }
    }
  }
}
```

- [ ] **Step 4: Implement `src/puzzles/sudoku/solver.ts`**

```typescript
export function solveSudoku(initialGrid: (number | null)[][]): number[][] {
  const grid: number[][] = initialGrid.map((row) => row.map((cell) => (cell === null ? 0 : cell)));

  function isValid(r: number, c: number, num: number): boolean {
    for (let i = 0; i < 9; i++) {
      if (grid[r][i] === num) return false;
      if (grid[i][c] === num) return false;
    }

    const boxRow = Math.floor(r / 3) * 3;
    const boxCol = Math.floor(c / 3) * 3;
    for (let br = 0; br < 3; br++) {
      for (let bc = 0; bc < 3; bc++) {
        if (grid[boxRow + br][boxCol + bc] === num) return false;
      }
    }

    return true;
  }

  function solve(): boolean {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(r, c, num)) {
              grid[r][c] = num;
              if (solve()) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  if (!solve()) {
    throw new Error('The provided Sudoku has no valid solution. Please check the clues from your book.');
  }

  return grid;
}
```

Export both from `src/puzzles/sudoku/index.ts`:
```typescript
export * from './generator.js';
export * from './renderer.js';
export * from './parser.js';
export * from './solver.js';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test tests/puzzles/sudoku-parser.test.ts`
Expected: PASS (all parser and solver tests pass).

- [ ] **Step 6: Commit**

```bash
git add src/puzzles/sudoku/ tests/puzzles/sudoku-parser.test.ts
git commit -m "feat(sudoku): add x-notation grid parser and backtracking solver"
```

---

### Task 3: Sudoku Generator Custom Grid Integration & CLI

**Files:**
- Modify: `src/puzzles/sudoku/generator.ts:1-95`
- Modify: `src/index.ts:9-65`
- Modify: `src/cli.ts:1-55`
- Test: `tests/puzzles/sudoku.test.ts`
- Test: `tests/cli.test.ts`

**Interfaces:**
- Consumes: `parseSudokuGrid`, `solveSudoku`
- Produces: `SudokuGenerator.generate({ grid: '...' })` returning `Sudoku_Custom_YYYY-MM-DD.pdf`, `RunOptions.grid?: string`, `cli.ts` `--grid="..."`

- [ ] **Step 1: Write failing tests in `tests/puzzles/sudoku.test.ts` and `tests/cli.test.ts`**

In `tests/puzzles/sudoku.test.ts`:
```typescript
  it('generates custom sudoku puzzle from grid notation', async () => {
    const generator = new SudokuGenerator();
    const puzzle = await generator.generate({
      grid: '53xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79',
      date: '2026-10-12',
    });

    expect(puzzle.filename).toBe('Sudoku_Custom_2026-10-12.pdf');
    expect(puzzle.title).toBe('Sudoku - Custom');
    expect(puzzle.puzzleData.puzzleGrid[0][0]).toBe(5);
    expect(puzzle.puzzleData.solutionGrid[0][2]).toBe(4);
  });
```

In `tests/cli.test.ts`:
```typescript
  it('generates custom sudoku when --grid is provided', async () => {
    const results = await runGenerator({
      grid: '53xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79',
      outputDir: './test-cli-output',
      date: '2026-10-12',
    });

    expect(results).toHaveLength(1);
    expect(results[0].puzzle.metadata.id).toBe('sudoku');
    expect(results[0].puzzle.filename).toContain('Sudoku_Custom_');
  });
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test tests/puzzles/sudoku.test.ts tests/cli.test.ts`
Expected: FAIL because `grid` is not yet supported in `SudokuOptions` or `runGenerator`.

- [ ] **Step 3: Update `src/puzzles/sudoku/generator.ts`**

Update `SudokuOptions`:
```typescript
export interface SudokuOptions {
  date?: string;
  difficulty?: string;
  grid?: string;
}
```

In `SudokuGenerator.generate()`:
```typescript
    if (options?.grid) {
      const puzzleGrid = parseSudokuGrid(options.grid);
      const solutionGrid = solveSudoku(puzzleGrid);
      const filename = `Sudoku_Custom_${dateStr}.pdf`;

      return {
        metadata: this.metadata,
        title: 'Sudoku - Custom',
        filename,
        puzzleData: {
          difficulty: 'expert', // default display weight
          puzzleGrid,
          solutionGrid,
        },
      };
    }
```

- [ ] **Step 4: Update `src/index.ts` and `src/cli.ts`**

In `src/index.ts`:
```typescript
export interface RunOptions {
  type?: 'all' | 'word-search' | 'sudoku';
  difficulty?: string;
  theme?: string;
  date?: string;
  upload?: boolean;
  outputDir?: string;
  daily?: boolean;
  folder?: string;
  grid?: string;
}
```
In `runGenerator`:
If `options.grid` is set and `!options.type`, default `selectedType = 'sudoku'`.
Pass `grid: options.grid` to `gen.generate(...)`.

In `src/cli.ts`:
Parse `--grid=`:
```typescript
    } else if (arg.startsWith('--grid=')) {
      options.grid = arg.slice(arg.indexOf('=') + 1);
      if (!options.type) {
        options.type = 'sudoku';
      }
    }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test && npm run build`
Expected: PASS (all tests pass, clean build).

- [ ] **Step 6: Commit**

```bash
git add src/puzzles/sudoku/generator.ts src/index.ts src/cli.ts tests/puzzles/sudoku.test.ts tests/cli.test.ts
git commit -m "feat(sudoku): integrate custom grid generation into generator and CLI"
```

---

### Task 4: GitHub Actions Workflow Update for Custom Grid

**Files:**
- Modify: `.github/workflows/daily-puzzles.yml:25-79`
- Modify: `README.md:20-65`

**Interfaces:**
- Consumes: `inputs.sudoku_grid` in `workflow_dispatch`
- Produces: CLI execution with `--grid="..."` flag when provided

- [ ] **Step 1: Update `.github/workflows/daily-puzzles.yml`**

Add input:
```yaml
      sudoku_grid:
        description: 'Custom Sudoku grid using x notation (optional)'
        required: false
        default: ''
```

In execution step:
```bash
          GRID_PARAM="${{ inputs.sudoku_grid }}"
          GRID_FLAG=""
          if [ -n "$GRID_PARAM" ]; then
            GRID_FLAG="--grid=$GRID_PARAM"
          fi

          npm run generate -- \
            --type=${{ inputs.puzzle_type || 'all' }} \
            --difficulty=${{ inputs.sudoku_difficulty || 'random' }} \
            $THEME_FLAG \
            $DAILY_FLAG \
            $GRID_FLAG \
            --upload
```

- [ ] **Step 2: Update `README.md`**

Document custom Sudoku CLI usage and the exact Android shortcut JSON payload:
```json
{
  "ref": "main",
  "inputs": {
    "puzzle_type": "sudoku",
    "sudoku_grid": "{sudoku_grid}",
    "is_daily": false
  }
}
```

- [ ] **Step 3: Verify tests and build**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/daily-puzzles.yml README.md
git commit -m "feat(ci): add sudoku_grid input to workflow dispatch and update docs"
```

---

### Task 5: Mobile PWA Puzzle Studio (`web/`) & GitHub Pages Deployment

**Files:**
- Create: `web/package.json`
- Create: `web/vite.config.ts`
- Create: `web/index.html`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/src/components/SudokuStudio.tsx`
- Create: `web/src/components/WordSearchStudio.tsx`
- Create: `web/src/components/DailyBundle.tsx`
- Create: `web/src/components/SettingsModal.tsx`
- Create: `web/src/services/githubApi.ts`
- Create: `.github/workflows/deploy-pwa.yml`
- Modify: `package.json` (add scripts: `"dev:web"`, `"build:web"`)

**Interfaces:**
- Produces: Fully functional mobile PWA built to `web/dist`, auto-deployed to GitHub Pages

- [ ] **Step 1: Scaffold `web/` with Vite, React, TypeScript, and Tailwind**

Setup `web/package.json`:
- `react`, `react-dom`, `lucide-react`, `vite-plugin-pwa`, `tailwindcss`, `vite`, `typescript`.

Configure `web/vite.config.ts` with base path `/pen-to-paper/` and PWA manifest:
- Name: "Pen to Paper"
- Short name: "Puzzles"
- Display: "standalone"
- Theme color: "#000000", Background: "#F9FAFB"

- [ ] **Step 2: Implement `web/src/services/githubApi.ts`**

```typescript
export interface DispatchOptions {
  token: string;
  repo: string; // "marlou-lopez/pen-to-paper"
  ref?: string; // "main"
  inputs: {
    puzzle_type: 'all' | 'sudoku' | 'word-search';
    sudoku_difficulty?: string;
    sudoku_grid?: string;
    word_search_theme?: string;
    is_daily?: boolean;
  };
}

export async function dispatchWorkflow(opts: DispatchOptions): Promise<void> {
  const url = `https://api.github.com/repos/${opts.repo}/actions/workflows/daily-puzzles.yml/dispatches`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ref: opts.ref || 'main',
      inputs: opts.inputs,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub API Error (${res.status}): ${errorText}`);
  }
}
```

- [ ] **Step 3: Implement `SudokuStudio.tsx`**

Features:
- State: `grid: (number | null)[][]` (9x9 matrix initialized to nulls), `selectedCell: [number, number] | null`.
- 9x9 CSS Grid with 3x3 thicker border styling and clear cell typography.
- Floating touch-friendly keypad at bottom (`1` to `9`, `Clear`).
- Keypad digit tap sets cell value and auto-advances selection to next column.
- Duplicate number validation (flags conflicts in row/col/box with red styling).
- Destination toggle: "Category (/Puzzles/Sudoku/)" or "Daily (/Puzzles/Daily/)".
- "Send to reMarkable" button converts matrix to `x` notation (`53xx7xxxx/...`), calls `dispatchWorkflow`, and displays status spinner / success banner.

- [ ] **Step 4: Implement `WordSearchStudio.tsx`, `DailyBundle.tsx`, and `SettingsModal.tsx`**

- `WordSearchStudio.tsx`: Quick custom theme/words text box with send button.
- `DailyBundle.tsx`: 1-tap "Deliver Today's Bundle" button.
- `SettingsModal.tsx`: Field for GitHub Fine-Grained PAT, persisted to `localStorage.getItem('gh_token')`.

- [ ] **Step 5: Implement `web/src/App.tsx` navigation**

Bottom navigation bar with 4 tabs:
- 🧩 Sudoku
- 🔍 Word Search
- ⚡ Daily Pack
- ⚙️ Settings

- [ ] **Step 6: Add GitHub Pages deploy workflow `.github/workflows/deploy-pwa.yml`**

```yaml
name: Deploy PWA to GitHub Pages

on:
  push:
    branches: [main]
    paths:
      - 'web/**'
      - '.github/workflows/deploy-pwa.yml'
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: 'pages'
  cancel-in-progress: true

jobs:
  build-and-deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install and Build Web
        run: |
          cd web
          npm ci
          npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: 'web/dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 7: Verify PWA build and root test suite**

Run:
```bash
npm --prefix web run build
npm test && npm run build
```
Expected: PASS (web build generates static HTML/JS/CSS assets in `web/dist`, root tests pass).

- [ ] **Step 8: Commit**

```bash
git add web/ package.json .github/workflows/deploy-pwa.yml
git commit -m "feat(pwa): implement mobile PWA puzzle studio with github pages deployment"
```
