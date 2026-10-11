# Design Specification: Mobile PWA Puzzle Studio & Word Search Typography Enhancement

## Overview
This specification details two key enhancements to the Pen to Paper puzzle ecosystem:
1. **Pen to Paper Mobile PWA (`web/`)**: A mobile-first Progressive Web App hosted on GitHub Pages that provides an interactive, touch-friendly 9x9 Sudoku grid builder (for effortlessly copying book puzzles using on-screen number pads instead of error-prone string typing), a Word Search customizer, and a 1-tap "Send to reMarkable" trigger via GitHub Actions workflow dispatch.
2. **Word Search Typography Enhancement**: Increasing font sizes for "Words to Find" and solution checklists on e-ink pages from 18pt to 22pt with proportional row spacing.

---

## 1. Mobile PWA Architecture (`web/`)

### Tech Stack
- **Framework:** React 18 + Vite + TypeScript
- **Styling:** Tailwind CSS (configured for clean e-ink-inspired monochrome aesthetics)
- **PWA Capabilities:** `vite-plugin-pwa` with web app manifest and offline caching service worker.
- **Hosting:** GitHub Pages at `https://marlou-lopez.github.io/pen-to-paper/` (automated build and deploy via `.github/workflows/deploy-pwa.yml`).

### Security Model
- Uses user-provided GitHub **Fine-Grained Personal Access Token (PAT)**:
  - Scoped strictly to `pen-to-paper` with `Actions: Write` permission only.
  - Zero read access to code or other repositories.
  - Persisted only in the user's browser `localStorage` on their device.

---

## 2. PWA Features & Mobile Interaction

### Tab 1: Sudoku Studio (Custom Grid Input)
- **Interactive 9x9 Grid:**
  - Standard 9x9 layout with bold 3x3 box borders.
  - Tapping a cell selects it (soft active highlight).
  - Floating 1–9 numeric keypad at bottom of screen.
  - `Backspace` / `Clear` button.
  - Auto-advance cursor option (advances to next cell across row upon entering a digit).
- **Client-Side Validation & Feedback:**
  - Live duplicate number highlighting in red (instant visual clue conflict alert).
  - Built-in backtracking solver runs client-side to verify the puzzle has a valid solution before submitting.
- **Delivery Destination Selector:**
  - "Category Folder (`/Puzzles/Sudoku/`)" [Default for book puzzles]
  - "Daily Inbox (`/Puzzles/Daily/`)"
- **Submit Action:**
  - Converts grid into standard `x` notation (`53xx7xxxx/6xx195xxx/...`).
  - Calls GitHub API `POST /repos/marlou-lopez/pen-to-paper/actions/workflows/daily-puzzles.yml/dispatches`.
  - Shows live run status by polling workflow run API (`Queued` $\rightarrow$ `Generating & Uploading` $\rightarrow$ `Delivered to reMarkable!`).

### Tab 2: Word Search Studio
- Choose random curated theme or enter custom topic/words.
- 1-tap dispatch to GitHub Actions.

### Tab 3: Daily Bundle
- Quick 1-tap trigger to generate today's scheduled puzzle bundle to `/Puzzles/Daily/`.

### Tab 4: Settings
- GitHub PAT configuration field with test-connection button.
- Repository configuration (default: `marlou-lopez/pen-to-paper`, branch `main`).

---

## 3. Backend Generator & CI Integration

### Custom Sudoku Support in CLI & Generator
- `src/puzzles/sudoku/parser.ts`:
  - Parses 9-row `x` notation string (`1-9` digits, `x`/`X` empty cells, `/` or `\n` row separators).
  - Validates row count, character count per row, and checks for initial clue conflicts.
- `src/puzzles/sudoku/solver.ts`:
  - Depth-first backtracking solver to compute the 9x9 solution grid for Page 3.
  - Throws if puzzle is unsolvable.
- `src/puzzles/sudoku/generator.ts`:
  - Supports `grid?: string` in `SudokuOptions`.
  - Generates `Sudoku_Custom_YYYY-MM-DD.pdf` with `Sudoku - Custom` title.
- `src/cli.ts` & `src/index.ts`:
  - Supports `--grid="<notation>"`.

### GitHub Actions Updates
- `.github/workflows/daily-puzzles.yml`:
  - Adds optional `sudoku_grid` input to `workflow_dispatch`.
  - Passes `--grid="..."` when provided.
- `.github/workflows/deploy-pwa.yml`:
  - Builds `web/` using `npm run build:web` and deploys to GitHub Pages on pushes to `main`.

---

## 4. Word Search Typography Enhancement

In `src/puzzles/word-search/renderer.ts`:
- **Page 1 Checklist ("Words to Find"):**
  - Header: Increase from `22pt` to `24pt` (`Helvetica-Bold`).
  - Words: Increase from `18pt` to `22pt` (`Helvetica`).
  - Row spacing: Increase from `row * 32` to `row * 38`.
- **Page 3 Answer Key ("Solutions"):**
  - Header: Increase from `22pt` to `24pt` (`Helvetica-Bold`).
  - Words: Increase from `18pt` to `22pt` (`Helvetica`).
  - Row spacing: Increase from `row * 32` to `row * 38`.

---

## 5. Verification Plan

1. **Unit Tests:**
   - Sudoku `x` notation parser and solver tests (`tests/puzzles/sudoku-parser.test.ts`).
   - Word Search PDF rendering with updated typography (`tests/puzzles/word-search.test.ts`).
   - CLI custom grid flag tests (`tests/cli.test.ts`).
2. **PWA Build Verification:**
   - `npm --prefix web run build` produces valid static output in `web/dist/`.
3. **End-to-End Test:**
   - Dispatch workflow via API with custom grid and verify valid PDF delivery.
