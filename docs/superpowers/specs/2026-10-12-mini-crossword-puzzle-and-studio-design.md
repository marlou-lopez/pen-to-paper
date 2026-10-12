# Mini Crossword (5x5) Puzzle Generator & Mobile Studio Specification

**Date:** 2026-10-12  
**Status:** Approved  
**Topic:** 5x5 Mini Crossword Generator, Datamuse Definitions Engine, reMarkable PDF Renderer, CLI & GitHub Actions Integration, and Mobile PWA Studio

---

## 1. Executive Summary

This feature introduces **5x5 Mini Crosswords** to *Pen to Paper*, completing the classic "newspaper puzzle trifecta" alongside Sudoku and Word Search. The implementation delivers:
1. **Dynamic Generator & Datamuse Definitions Engine**: Procedurally generates valid 5x5 intersecting word grids powered by Datamuse pattern queries (`sp=?????&md=d`) for real definitions without external API keys, backed by an offline seed bank of tested puzzles.
2. **E-Ink 3-Page PDF Renderer**: Produces high-contrast PDFs formatted for the reMarkable tablet (1404x1872 pt) featuring a prominent 5x5 grid, numbered clues (Across & Down), spoiler blocker page, and complete solution key.
3. **Daily Automation & Tablet Routing**: Integrates into `daily-puzzles.yml` and CLI (`--type=mini-crossword` / `--type=all`), routing to `/Puzzles/Daily/` on daily runs and `/Puzzles/Mini Crossword/` on manual runs, with pre-created tablet archive folders at `/Puzzles/Archive/Mini Crossword/`.
4. **Mobile PWA Studio**: An interactive 5x5 crossword studio in the web app, complete with cell touch selection, across/down clue inspector, theme selection, and 1-tap tablet delivery.

---

## 2. Architecture & Data Models

### 2.1 Core Types (`src/puzzles/mini-crossword/types.ts`)

```typescript
export interface CrosswordCell {
  row: number;
  col: number;
  char: string;        // Uppercase A-Z or '#' for blocked cell
  clueNumber?: number; // Clue numbering (e.g., 1, 2, 3...)
  isBlocked: boolean;  // True if black cell
}

export interface CrosswordClue {
  number: number;
  direction: 'across' | 'down';
  word: string;
  clue: string;        // Dictionary definition or human-crafted clue
  startRow: number;
  startCol: number;
  length: number;
}

export interface MiniCrosswordData {
  title: string;
  date: string;
  grid: string[][];    // 5x5 character matrix
  acrossClues: CrosswordClue[];
  downClues: CrosswordClue[];
}

export interface MiniCrosswordOptions {
  theme?: string;      // Optional topic/theme (e.g. "Astronomy", "Nature")
  seed?: number;       // Deterministic seed for reproducible generation
}
```

---

## 3. Puzzle Generation & Word Intersection Engine

### 3.1 Vocabulary & Definitions Service (`src/puzzles/mini-crossword/clue-fetcher.ts`)
- Queries Datamuse REST API:
  `https://api.datamuse.com/words?topics=${encodeURIComponent(theme)}&sp=?????&md=d&max=100`
- Parses definition metadata array (`defs: ["n\tDefinition text..."]`).
- Cleans and normalizes definitions:
  - Strips leading grammatical prefixes (`n\t`, `v\t`, `adj\t`, etc.).
  - Strips brackets and archaic tags.
  - Capitalizes initial letter and trims trailing whitespace/periods.
- Caches results in-memory during execution.

### 3.2 Intersecting Backtracking Grid Builder (`src/puzzles/mini-crossword/generator.ts`)
- Builds an open or symmetrical 5x5 grid:
  1. Selects candidate Across words matching the theme or general vocabulary.
  2. For each vertical column slot, filters valid English words from the word pool that match the horizontal letter intersections.
  3. Depth-first search with backtracking places words until all 5 Across and 5 Down slots are filled with valid words that each possess an associated clue definition.
  4. Numbering algorithm traverses the 5x5 grid row-by-row, assigning sequential clue numbers (1, 2, 3...) to cells that start an Across or Down word.

### 3.3 Offline Curated Seed Bank (`src/puzzles/mini-crossword/seed-bank.ts`)
- Bundles 30+ verified, high-quality 5x5 mini crossword grids with punchy clues.
- Daily deterministic rotation selects a curated seed based on date hash (`YYYY-MM-DD`) when offline, in test suites, or when Datamuse is unreachable.
- Guarantees 100% reliable execution with zero network dependency.

---

## 4. E-Ink 3-Page PDF Layout (`src/puzzles/mini-crossword/renderer.ts`)

- **Canvas Size**: 1404 x 1872 pt (reMarkable native portrait aspect ratio 3:4).
- **Page 1: The Puzzle**:
  - Header: `Mini Crossword - <Theme>` and date, e-ink monochrome banner.
  - 5x5 Grid: Centered, cell size ~90x90 pt, border stroke 2pt.
    - Black cells filled solid black.
    - White cells show clue numbers in top-left corner in 12pt font.
  - Clues Section:
    - Two clean columns: **ACROSS** on the left, **DOWN** on the right.
    - Clue text rendered in 20pt / 22pt high-contrast dark charcoal with generous 32pt line spacing for effortless reading on e-ink.
- **Page 2: Spoiler Blocker**:
  - Dedicated full-page protective shield preventing accidental view of answers.
- **Page 3: Solution Key**:
  - The completed 5x5 grid with bold solved letters filled in each cell.
  - Clue list repeated with highlighted solution words.

---

## 5. CLI, Orchestrator & Delivery Integration

### 5.1 Puzzle Registry & Orchestration (`src/core/registry.ts`, `src/index.ts`)
- Registers `MiniCrosswordGenerator` under key `'mini-crossword'`.
- Supports CLI flags:
  ```bash
  npm run generate -- --type=mini-crossword
  npm run generate -- --type=mini-crossword --theme="Astronomy"
  npm run generate -- --type=all --daily
  ```
- File naming: `MiniCrossword_YYYY-MM-DD_<Theme>.pdf` (or `MiniCrossword_YYYY-MM-DD.pdf`).

### 5.2 Tablet Archive & Delivery Routing (`src/delivery/`)
- `LocalDeliveryClient` and `RmapiDeliveryClient` pre-create `/Puzzles/Archive/Mini Crossword` and ensure category folder `/Puzzles/Mini Crossword/` exists.
- Daily automation routing:
  - Scheduled daily runs (`--daily`) route to `/Puzzles/Daily/`.
  - Manual on-demand runs route to `/Puzzles/Mini Crossword/` (or custom `--folder`).

### 5.3 GitHub Actions Workflow (`.github/workflows/daily-puzzles.yml`)
- Updates `puzzle_type` choices in `workflow_dispatch` to include `mini-crossword`:
  `type: choice`, `options: ['all', 'word-search', 'sudoku', 'mini-crossword']`.
- Adds optional `crossword_theme` input.
- Scheduled morning cron runs `--type=all --daily`, delivering Word Search, Sudoku, and Mini Crossword into `/Puzzles/Daily/`.

---

## 6. Mobile PWA Mini Crossword Studio (`web/`)

### 6.1 Navigation & Registration
- **`web/src/components/PuzzleSelectorModal.tsx`**:
  - Add `'mini-crossword'` to `ActiveTab`.
  - Register option in `PUZZLE_OPTIONS`:
    - `id: 'mini-crossword'`, `title: 'Mini Crossword Studio'`, `description: '5x5 daily crossword with clue inspector & dynamic themes'`, `icon: Edit3`.
- **`web/src/App.tsx`**:
  - Map `TAB_TITLES['mini-crossword'] = 'Mini Crossword Studio'`.
  - Render `<MiniCrosswordStudio onOpenSettings={...} />`.

### 6.2 Mini Crossword Studio Layout (`web/src/components/MiniCrosswordStudio.tsx`)
- **Zero-Scroll Mobile Layout**: Fits within `100dvh` using `.safe-bottom` padding.
- **Visual 5x5 Touch Grid**:
  - Responsive cells with clue numbering.
  - Tap cell: highlights word row/col and displays active clue.
  - Tap cell again: toggles direction between Across and Down.
- **Active Clue Inspector Bar**:
  - Shows current clue text prominently with navigation arrows (`< Prev` / `Next >`).
- **Theme Bar**:
  - Chips for preset themes (`Daily`, `Astronomy`, `Nature`, `Ocean`, `History`) and custom text input.
- **Delivery & Status**:
  - Reads `getStoredSettings().defaultDestination` (`/Puzzles/Daily/` vs `/Puzzles/Mini Crossword/`).
  - Dispatches `daily-puzzles.yml` with `puzzle_type: 'mini-crossword'`.
  - Real-time workflow tracking banner.

---

## 7. Testing Strategy

1. **Unit Tests (`tests/puzzles/mini-crossword.test.ts`)**:
   - Generator produces valid 5x5 grid with 10 total clues (5 Across, 5 Down).
   - Letter intersections between Across and Down words match perfectly.
   - Offline seed bank fallback selects deterministic puzzle for date.
   - Clue fetcher cleans raw Datamuse definitions correctly.
   - Renderer generates valid 3-page PDF buffer with standard metadata.
2. **CLI & Orchestration Tests (`tests/cli.test.ts`)**:
   - Generates mini-crossword when `--type=mini-crossword` is passed.
   - Generates all 3 puzzle types when `--type=all` is passed.
   - Honors `--daily` routing and custom `--folder` destinations.
3. **Web & PWA Build Tests (`tests/web/`)**:
   - `npm test` runs all backend and frontend unit tests.
   - `npm run build:web` succeeds with zero TypeScript / Vite compilation warnings.
