# 5x5 Mini Crossword Puzzle Generator & Mobile Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5x5 Mini Crossword puzzles across Pen to Paper, including Datamuse definition-backed procedural generation with an offline seed bank, e-ink 3-page PDF rendering for reMarkable, CLI/tablet routing with pre-created archives, GitHub Actions automation, and a zero-scroll mobile PWA studio.

**Architecture:** A standalone generator module (`src/puzzles/mini-crossword/`) generates intersecting 5x5 grids with Across/Down clues via Datamuse API (`sp=?????&md=d`) or an offline seed bank fallback. Puzzles are rendered into 3-page PDFs (`1404x1872 pt`) via PDFKit, registered into the central registry, and exposed to the mobile PWA via a new interactive `MiniCrosswordStudio.tsx` component.

**Tech Stack:** TypeScript (strict mode), Node.js, PDFKit, Vitest, React 18, Vite, Tailwind CSS, GitHub Actions, Datamuse REST API.

## Global Constraints

- Grid dimensions: exactly 5x5 (5 rows, 5 columns).
- Target reMarkable canvas size: 1404 x 1872 pt (portrait 3:4 aspect ratio).
- High-contrast monochrome typography: Dark charcoal (`#111111`) / pure black, bold clues in 20pt/22pt, generous 32pt vertical line spacing.
- PDF structure: 3 pages (Page 1 = Puzzle, Page 2 = Spoiler Blocker, Page 3 = Answer Key).
- Tablet active inbox: `/Puzzles/Daily/`. Category folder: `/Puzzles/Mini Crossword/`. Archive folder: `/Puzzles/Archive/Mini Crossword/`.
- Offline reliability: The system must run 100% reliably without network access or external API keys using the curated seed bank.
- PWA layout: Zero-scroll mobile layout fitting within `100dvh` with `.safe-bottom` safe area insets.
- All tests and TypeScript compilation must pass cleanly: `npm test && npm run build && npm run build:web`.

---

### Task 1: Core Types & Offline Curated Seed Bank

**Files:**
- Create: `src/puzzles/mini-crossword/types.ts`
- Create: `src/puzzles/mini-crossword/seed-bank.ts`
- Test: `tests/puzzles/mini-crossword-seed.test.ts`

**Interfaces:**
- Produces: `CrosswordCell`, `CrosswordClue`, `MiniCrosswordData`, `MiniCrosswordOptions`, `SEED_CROSSWORDS`, `getSeedCrosswordForDate(dateStr: string): MiniCrosswordData`.

- [ ] **Step 1: Write the failing test for Seed Bank**

Create `tests/puzzles/mini-crossword-seed.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { getSeedCrosswordForDate, SEED_CROSSWORDS } from '../../src/puzzles/mini-crossword/seed-bank.ts';

describe('Mini Crossword Seed Bank', () => {
  it('contains at least 15 verified 5x5 seed puzzles', () => {
    expect(SEED_CROSSWORDS.length).toBeGreaterThanOrEqual(15);
  });

  it('validates every seed puzzle has a 5x5 grid and 10 total clues (5 across, 5 down)', () => {
    for (const puzzle of SEED_CROSSWORDS) {
      expect(puzzle.grid).toHaveLength(5);
      for (const row of puzzle.grid) {
        expect(row).toHaveLength(5);
      }
      expect(puzzle.acrossClues).toHaveLength(5);
      expect(puzzle.downClues).toHaveLength(5);
      for (const clue of [...puzzle.acrossClues, ...puzzle.downClues]) {
        expect(clue.word.length).toBe(5);
        expect(clue.clue.trim().length).toBeGreaterThan(3);
        expect(clue.number).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('verifies letter intersections between Across and Down words match in seed puzzles', () => {
    for (const puzzle of SEED_CROSSWORDS) {
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const acrossWord = puzzle.acrossClues[r].word;
          const downWord = puzzle.downClues[c].word;
          expect(acrossWord[c]).toBe(downWord[r]);
          expect(puzzle.grid[r][c]).toBe(acrossWord[c]);
        }
      }
    }
  });

  it('returns a deterministic seed puzzle for a given date string', () => {
    const p1 = getSeedCrosswordForDate('2026-10-12');
    const p2 = getSeedCrosswordForDate('2026-10-12');
    expect(p1.title).toBe(p2.title);
    expect(p1.grid).toEqual(p2.grid);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzles/mini-crossword-seed.test.ts`
Expected: FAIL (Cannot find module `../../src/puzzles/mini-crossword/seed-bank.ts`).

- [ ] **Step 3: Implement `types.ts` and `seed-bank.ts`**

Create `src/puzzles/mini-crossword/types.ts`:
```typescript
export interface CrosswordCell {
  row: number;
  col: number;
  char: string;
  clueNumber?: number;
  isBlocked: boolean;
}

export interface CrosswordClue {
  number: number;
  direction: 'across' | 'down';
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  length: number;
}

export interface MiniCrosswordData {
  title: string;
  date: string;
  grid: string[][];
  acrossClues: CrosswordClue[];
  downClues: CrosswordClue[];
}

export interface MiniCrosswordOptions {
  theme?: string;
  date?: string;
  seed?: number;
}
```

Create `src/puzzles/mini-crossword/seed-bank.ts`:
Define `SEED_CROSSWORDS` with 15+ verified, self-intersecting 5x5 word squares/grids and clues (e.g. HEART/EMBER/ABUSE/RESIN/TREND, CRANE/RAVEN/ADORE/NERVE/ENTER, etc.), and implement `getSeedCrosswordForDate(dateStr: string): MiniCrosswordData`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/puzzles/mini-crossword-seed.test.ts`
Expected: PASS (4 passed).

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/mini-crossword/types.ts src/puzzles/mini-crossword/seed-bank.ts tests/puzzles/mini-crossword-seed.test.ts
git commit -m "feat(crossword): add mini crossword core types and curated seed bank"
```

---

### Task 2: Datamuse Definition Clue Fetcher & Intersecting Backtracking Generator

**Files:**
- Create: `src/puzzles/mini-crossword/clue-fetcher.ts`
- Create: `src/puzzles/mini-crossword/generator.ts`
- Create: `src/puzzles/mini-crossword/index.ts`
- Test: `tests/puzzles/mini-crossword-generator.test.ts`

**Interfaces:**
- Consumes: `types.ts`, `seed-bank.ts`
- Produces: `fetchWordsWithDefinitions(theme?: string): Promise<Map<string, string>>`, `MiniCrosswordGenerator` implementing `PuzzleGenerator`

- [ ] **Step 1: Write the failing test for Clue Fetcher and Generator**

Create `tests/puzzles/mini-crossword-generator.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest';
import { cleanDefinition, fetchWordsWithDefinitions } from '../../src/puzzles/mini-crossword/clue-fetcher.ts';
import { MiniCrosswordGenerator } from '../../src/puzzles/mini-crossword/generator.ts';

describe('Mini Crossword Clue Fetcher', () => {
  it('cleans raw Datamuse definitions correctly', () => {
    expect(cleanDefinition('n\tA firm, round fruit produced by an apple tree.')).toBe('A firm, round fruit produced by an apple tree');
    expect(cleanDefinition('v\t(transitive) To employ or put into service. ')).toBe('To employ or put into service');
    expect(cleanDefinition('adj\tVery large or spacious.')).toBe('Very large or spacious');
  });

  it('falls back gracefully to seed bank when network fails', async () => {
    const generator = new MiniCrosswordGenerator();
    const result = await generator.generateData({ theme: 'nonexistent-xyz-theme', date: '2026-10-12' });
    expect(result.grid).toHaveLength(5);
    expect(result.acrossClues).toHaveLength(5);
    expect(result.downClues).toHaveLength(5);
  });
});

describe('MiniCrosswordGenerator Data Generation', () => {
  it('generates a valid 5x5 grid with 5 across and 5 down clues matching character intersections', async () => {
    const generator = new MiniCrosswordGenerator();
    const puzzle = await generator.generateData({ date: '2026-10-12' });
    
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        expect(puzzle.grid[r][c]).toBe(puzzle.acrossClues[r].word[c]);
        expect(puzzle.grid[r][c]).toBe(puzzle.downClues[c].word[r]);
      }
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzles/mini-crossword-generator.test.ts`
Expected: FAIL (Cannot find module `clue-fetcher.ts`).

- [ ] **Step 3: Implement `clue-fetcher.ts`, `generator.ts`, and barrel export**

Create `src/puzzles/mini-crossword/clue-fetcher.ts`:
- Implement `cleanDefinition(raw: string): string`.
- Implement `fetchWordsWithDefinitions(theme?: string): Promise<Map<string, string>>` fetching 5-letter words with `sp=?????&md=d`.

Create `src/puzzles/mini-crossword/generator.ts`:
- Implement `MiniCrosswordGenerator` implementing `PuzzleGenerator`:
  - `type: 'mini-crossword'`
  - `generateData(options?: MiniCrosswordOptions): Promise<MiniCrosswordData>`
  - Uses backtracking algorithm to form a 5x5 word grid from candidate words, with automatic fallback to `getSeedCrosswordForDate(dateStr)` if Datamuse API returns insufficient words or times out.

Create `src/puzzles/mini-crossword/index.ts` re-exporting types, seed bank, and generator.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/puzzles/mini-crossword-generator.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/mini-crossword/clue-fetcher.ts src/puzzles/mini-crossword/generator.ts src/puzzles/mini-crossword/index.ts tests/puzzles/mini-crossword-generator.test.ts
git commit -m "feat(crossword): implement datamuse clue fetcher and crossword generator"
```

---

### Task 3: E-Ink 3-Page PDF Renderer

**Files:**
- Create: `src/puzzles/mini-crossword/renderer.ts`
- Modify: `src/puzzles/mini-crossword/generator.ts`
- Test: `tests/puzzles/mini-crossword-renderer.test.ts`

**Interfaces:**
- Produces: `renderMiniCrosswordPdf(data: MiniCrosswordData): Promise<Buffer>`
- Updates `MiniCrosswordGenerator.generate(options)` to return `PuzzleResult` with `{ type: 'mini-crossword', filename, buffer, metadata }`.

- [ ] **Step 1: Write the failing test for PDF Renderer**

Create `tests/puzzles/mini-crossword-renderer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { MiniCrosswordGenerator } from '../../src/puzzles/mini-crossword/generator.ts';
import { getSeedCrosswordForDate } from '../../src/puzzles/mini-crossword/seed-bank.ts';
import { renderMiniCrosswordPdf } from '../../src/puzzles/mini-crossword/renderer.ts';

describe('Mini Crossword PDF Renderer', () => {
  it('renders a 3-page e-ink PDF buffer for a mini crossword', async () => {
    const puzzle = getSeedCrosswordForDate('2026-10-12');
    const buffer = await renderMiniCrosswordPdf(puzzle);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1000);
    // PDF Magic bytes
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
  });

  it('generator produce complete PuzzleResult with filename and 3-page PDF buffer', async () => {
    const generator = new MiniCrosswordGenerator();
    const result = await generator.generate({ date: '2026-10-12' });
    expect(result.type).toBe('mini-crossword');
    expect(result.filename).toMatch(/^MiniCrossword_2026-10-12.*\.pdf$/);
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.subarray(0, 4).toString()).toBe('%PDF');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzles/mini-crossword-renderer.test.ts`
Expected: FAIL (Cannot find module `renderer.ts`).

- [ ] **Step 3: Implement `src/puzzles/mini-crossword/renderer.ts` and update `generator.ts`**

Create `src/puzzles/mini-crossword/renderer.ts`:
- Build on `PdfBuilder`:
  - 1404 x 1872 pt portrait canvas.
  - Page 1:
    - Title banner: `Mini Crossword - <Theme>` and date.
    - Centered 5x5 grid: cells ~90x90 pt, thick 2pt outer frame, 12pt clue numbering in top-left corners.
    - Two-column clue section below grid: **ACROSS** (left column) and **DOWN** (right column) in high-contrast 20pt/22pt font with 32pt spacing.
  - Page 2:
    - Spoiler blocker page (`Spoiler Blocker: Solutions on Next Page`).
  - Page 3:
    - Solution key with 5x5 grid filled with bold solution letters, plus solutions listed next to clues.
- Wire `renderMiniCrosswordPdf` into `MiniCrosswordGenerator.generate()`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/puzzles/mini-crossword-renderer.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/puzzles/mini-crossword/renderer.ts src/puzzles/mini-crossword/generator.ts tests/puzzles/mini-crossword-renderer.test.ts
git commit -m "feat(crossword): implement e-ink 3-page pdf renderer for mini crossword"
```

---

### Task 4: Registry, CLI, Tablet Delivery Archives & GitHub Actions Integration

**Files:**
- Modify: `src/core/registry.ts`
- Modify: `src/cli.ts`
- Modify: `src/index.ts`
- Modify: `src/delivery/local-client.ts`
- Modify: `src/delivery/rmapi-client.ts`
- Modify: `.github/workflows/daily-puzzles.yml`
- Modify: `README.md`
- Test: `tests/cli.test.ts`
- Test: `tests/delivery/clients.test.ts`

**Interfaces:**
- Produces: CLI support for `--type=mini-crossword` and `--theme`, tablet pre-creation of `/Puzzles/Archive/Mini Crossword` and category folder `/Puzzles/Mini Crossword/`, updated GitHub Actions workflow.

- [ ] **Step 1: Write the failing tests in `cli.test.ts` and `clients.test.ts`**

Update `tests/cli.test.ts`:
- Add test: `runGenerator generates mini-crossword when type is mini-crossword`.
- Add test: `runGenerator generates 3 puzzles when type is all`.
Update `tests/delivery/clients.test.ts`:
- Verify `/Puzzles/Archive/Mini Crossword` is pre-created in `archiveFolders`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/cli.test.ts tests/delivery/clients.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement updates across CLI, Registry, Delivery Clients, and Workflow**

1. Register `MiniCrosswordGenerator` in `src/core/registry.ts`.
2. Add `mini-crossword` to CLI argument parsing in `src/cli.ts`.
3. Update `src/index.ts` to route mini-crosswords to `/Puzzles/Mini Crossword/` on manual runs, or `/Puzzles/Daily/` on daily runs.
4. Add `'/Puzzles/Archive/Mini Crossword'` to `archiveFolders` in `src/delivery/local-client.ts` and `src/delivery/rmapi-client.ts`.
5. Update `.github/workflows/daily-puzzles.yml`:
   - Add `mini-crossword` to `puzzle_type` choices.
   - Add `crossword_theme` input.
6. Update `README.md` documenting Mini Crossword feature and folder structure.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test && npm run build`
Expected: PASS (all tests pass, clean TypeScript build).

- [ ] **Step 5: Commit**

```bash
git add src/core/registry.ts src/cli.ts src/index.ts src/delivery/local-client.ts src/delivery/rmapi-client.ts .github/workflows/daily-puzzles.yml README.md tests/cli.test.ts tests/delivery/clients.test.ts
git commit -m "feat(crossword): integrate mini crossword into registry, cli, tablet delivery, and workflow"
```

---

### Task 5: Mobile PWA Mini Crossword Studio (`web/`)

**Files:**
- Create: `web/src/components/MiniCrosswordStudio.tsx`
- Modify: `web/src/components/PuzzleSelectorModal.tsx`
- Modify: `web/src/App.tsx`
- Test: `tests/web/settings.test.ts` (and build verification)

**Interfaces:**
- Produces: `MiniCrosswordStudio` component, updated `PuzzleSelectorModal` with `mini-crossword` option, header title mapping.

- [ ] **Step 1: Create `MiniCrosswordStudio.tsx`**

Implement `web/src/components/MiniCrosswordStudio.tsx`:
- Zero-scroll mobile layout (`h-full max-w-md mx-auto flex flex-col justify-between pt-2 pb-2 safe-bottom px-3 select-none touch-manipulation`).
- Interactive 5x5 grid with cell touch selection and clue numbers.
- Clue inspector bar displaying active Across/Down clue with navigation buttons.
- Theme selector chips (`Daily`, `Astronomy`, `Nature`, `Ocean`, `History`) and custom theme input.
- Send to reMarkable button dispatching `puzzle_type: 'mini-crossword'` using `getStoredSettings().defaultDestination`.
- Live workflow polling banner.

- [ ] **Step 2: Update `PuzzleSelectorModal.tsx` and `App.tsx`**

- In `PuzzleSelectorModal.tsx`:
  - Add `'mini-crossword'` to `ActiveTab`.
  - Add entry to `PUZZLE_OPTIONS`:
    ```typescript
    {
      id: 'mini-crossword',
      title: 'Mini Crossword Studio',
      badge: 'New',
      description: '5x5 daily crossword with clue inspector & themes',
      icon: Edit3, // or KeyRound
    }
    ```
- In `App.tsx`:
  - Add `'mini-crossword': 'Mini Crossword Studio'` to `TAB_TITLES`.
  - Render `<MiniCrosswordStudio onOpenSettings={() => setIsSettingsOpen(true)} />` when `activeTab === 'mini-crossword'`.

- [ ] **Step 3: Run web tests and build verification**

Run: `npm test && npm run build:web`
Expected: PASS (clean Vite & TypeScript build with zero errors).

- [ ] **Step 4: Commit**

```bash
git add web/src/components/MiniCrosswordStudio.tsx web/src/components/PuzzleSelectorModal.tsx web/src/App.tsx
git commit -m "feat(pwa): add interactive 5x5 mini crossword studio to mobile web app"
```

---

### Task 6: End-to-End Verification, GitHub Pages Deployment & Clean Git Push

**Files:**
- Verify: all test files in `tests/`
- Verify: `web/dist` build

- [ ] **Step 1: Run full verification suite**

Run:
```bash
npm test
npm run build
npm run build:web
```
Expected: PASS (all tests pass, clean backend build, clean PWA build).

- [ ] **Step 2: Push to GitHub and verify deployment**

Run:
```bash
git push origin main
gh run list --workflow="deploy-pwa.yml" --limit 1
```
Expected: Deployment workflow succeeds on GitHub Pages.

---
