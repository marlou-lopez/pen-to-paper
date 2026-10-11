# reMarkable Daily Puzzle Generator Design Document

**Date:** 2026-10-11  
**Status:** Approved  
**Project:** Pen to Paper (`pen-to-paper`)

---

## 1. Overview & Objectives

The **reMarkable Daily Puzzle Generator** is an automated and on-demand puzzle generation and delivery system built with Node.js and TypeScript. It generates daily "Pen to Paper" puzzles formatted specifically for the reMarkable e-ink tablet (aspect ratio 3:4, high contrast, pen-friendly sizing) and delivers them directly into dedicated tablet folders via the reMarkable Cloud API (`rmapi`).

### Primary Goals
- **Daily & On-Demand Generation**: Runs automatically on a daily schedule via GitHub Actions cron, with on-demand triggers accessible from an Android device using the "HTTP Request Shortcuts" app.
- **Dedicated 3-Page Documents**: Produces clean individual PDF files per puzzle type (e.g. Word Search, Sudoku) with a 3-page layout: Page 1 (Puzzle), Page 2 (Spoiler Blocker), Page 3 (Answer Key).
- **Direct Cloud Sync**: Uploads PDFs straight to `/Puzzles/Word Search/` and `/Puzzles/Sudoku/` on the reMarkable Cloud.
- **Extensible Architecture**: Uses a modular `PuzzleGenerator` interface so future puzzles (Nonograms, Mazes, Crosswords) can be added without modifying the core delivery or automation pipeline.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Trigger Layer                            │
│  ┌─────────────────────────────┐  ┌──────────────────────┐  │
│  │ GitHub Actions Cron         │  │ Android Shortcuts    │  │
│  │ (Daily at 06:00 UTC)        │  │ (POST /dispatches)   │  │
│  └──────────────┬──────────────┘  └──────────┬───────────┘  │
└─────────────────┼────────────────────────────┼──────────────┘
                  ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Runner: GitHub Actions (Node.js)               │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ CLI Orchestrator (`src/cli.ts`)                     │   │
│   │ - Parses `--type`, `--difficulty`, `--dest`         │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              ▼                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Generator Registry (`src/core/registry.ts`)         │   │
│   │ ┌──────────────────────┐   ┌──────────────────────┐ │   │
│   │ │ Word Search Gen      │   │ Sudoku Gen           │ │   │
│   │ │ (@blex41/word-search)│   │ (sudoku-gen)         │ │   │
│   │ └──────────┬───────────┘   └──────────┬───────────┘ │   │
│   └────────────┼──────────────────────────┼─────────────┘   │
│                ▼                          ▼                 │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ PDF Builder (`src/core/pdf-builder.ts` with pdfkit) │   │
│   │ Page 1: Puzzle  | Page 2: Buffer | Page 3: Key      │   │
│   └──────────────────────────┬──────────────────────────┘   │
│                              ▼                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Delivery Client (`src/delivery/rmapi-client.ts`)    │   │
│   │ Uses `rmapi` CLI binary with `RMAPI_AUTH_TOKEN`     │   │
│   └──────────────────────────┬──────────────────────────┘   │
└──────────────────────────────┼──────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    reMarkable Cloud                         │
│  ├── /Puzzles/Word Search/WordSearch_YYYY-MM-DD_Theme.pdf   │
│  └── /Puzzles/Sudoku/Sudoku_Difficulty_YYYY-MM-DD.pdf       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Core Interface & Engine Design

### 3.1 Interface Contract (`src/core/types.ts`)
```typescript
export interface PuzzleMetadata {
  id: string;              // Unique identifier (e.g. 'word-search', 'sudoku')
  displayName: string;     // Friendly name (e.g. 'Word Search', 'Sudoku')
  targetFolder: string;    // Remote directory (e.g. '/Puzzles/Word Search')
}

export interface GeneratedPuzzle<TData = unknown> {
  metadata: PuzzleMetadata;
  title: string;           // e.g. 'Word Search - Astronomy'
  filename: string;        // e.g. 'WordSearch_2026-10-11_Astronomy.pdf'
  puzzleData: TData;
}

export interface PuzzleGenerator<TOptions = unknown, TData = unknown> {
  readonly metadata: PuzzleMetadata;
  generate(options?: TOptions): Promise<GeneratedPuzzle<TData>>;
  renderPdf(puzzle: GeneratedPuzzle<TData>): Promise<Buffer>;
}
```

### 3.2 Registry Pattern (`src/core/registry.ts`)
A central registry holds registered `PuzzleGenerator` instances. Adding a future puzzle requires creating a generator module and calling `registry.register(new NonogramGenerator())`.

---

## 4. Puzzle Specifications

### 4.1 Word Search (`src/puzzles/word-search/`)
- **Engine**: `@blex41/word-search` npm package.
- **Grid Size**: 15 x 15 matrix.
- **Themed Word Lists (`src/puzzles/word-search/word-bank.ts`)**:
  - Embedded JSON collections containing 15+ curated themes (Astronomy, Ocean Life, Geology, Ancient Civilizations, Flora & Fauna, Inventions, World Capitals, Literature, Chemistry, etc.).
  - 100% offline, zero API keys required.
- **Placement Logic**:
  - Selects 12–15 words per theme.
  - Places across 8 directions (`N`, `S`, `E`, `W`, `NE`, `NW`, `SE`, `SW`) with configurable backward word placement (probability ~0.3).
  - Empty cells filled with uppercase letters according to standard English letter distribution.
  - Retries up to 5 times if collision density prevents placement of minimum target words.
- **Rendering**:
  - **Page 1**: Header (Title, Theme, Date), 15x15 letter grid with generous cell sizing, and neatly formatted 3-column word checklist with `[ ]` checkboxes below the grid.
  - **Page 3 (Answer Key)**: Solution grid showing placed words marked with clean pill outlines or bold highlight styling.

### 4.2 Sudoku (`src/puzzles/sudoku/`)
- **Engine**: `sudoku-gen` npm package.
- **Grid Size**: Standard 9 x 9 board with bold 3 x 3 subgrid dividers.
- **Difficulty Settings**:
  - Supported values: `"random"`, `"easy"`, `"medium"`, `"hard"`, `"expert"`.
  - Configurable via GitHub Actions workflow (`workflow_dispatch` input and scheduled default).
  - When `"random"` is selected, difficulty rotates based on day-of-week:
    - Monday: `easy`
    - Tuesday & Wednesday: `medium`
    - Thursday & Friday: `hard`
    - Saturday & Sunday: `expert`
- **Rendering**:
  - **Page 1**: High-contrast 9x9 grid with original clue digits prominently centered and ample pencil-marking space per cell (~60pt).
  - **Page 3 (Answer Key)**: Solved grid with clue digits styled distinctly from deduction digits for easy review.

---

## 5. Document Layout & E-ink Styling

### 5.1 Document Dimensions & Margins (`src/core/pdf-builder.ts`)
- **Page Size**: `1404 x 1872 pt` (native 3:4 reMarkable ratio).
- **Margins**: Minimum `60 pt` padding on all sides to prevent overlap with the reMarkable software sidebar, page switcher, and touch gestures.
- **Color Palette**:
  - Foreground: Pure black (`#000000`) for text, outer borders, and clue numbers.
  - Grid Dividers: Medium-dark gray (`#666666` / 1.5pt) for inner grid lines; 3pt black for subgrid boundaries.
  - Background: Pure white (`#FFFFFF`) — no solid fills or gradients to prevent e-ink ghosting.

### 5.2 3-Page Flow
1. **Page 1 (The Puzzle)**:
   - Header: Puzzle Title, Subtitle (Theme or Difficulty), Date.
   - Body: Puzzle Grid + instructions / word checklist.
2. **Page 2 (The Buffer / Spoiler Blocker)**:
   - Blank page with minimalist centered text:
     ```
     Answer Key on Next Page
     [ Swipe to reveal solution ]
     ```
   - Prevents accidental spoilers when swiping pages on the tablet.
3. **Page 3 (The Answer Key)**:
   - Header: `"Solution: " + Puzzle Title`.
   - Body: Full completed solution grid.

---

## 6. Delivery Pipeline & reMarkable Sync

### 6.1 `rmapi` CLI Integration (`src/delivery/rmapi-client.ts`)
- Cloud uploads use the official release binary of `rmapi` (maintained Go CLI for reMarkable Cloud).
- **Authentication**:
  - One-time device pairing via [my.remarkable.com/device/desktop/connect](https://my.remarkable.com/device/desktop/connect).
  - The resulting token is stored as a repository secret: `RMAPI_AUTH_TOKEN`.
- **Directory Management**:
  - Ensures remote folders exist before uploading:
    - `rmapi mkdir /Puzzles`
    - `rmapi mkdir /Puzzles/Word Search`
    - `rmapi mkdir /Puzzles/Sudoku`
- **Upload Command**:
  - `rmapi put <local-pdf-path> <remote-folder>`

### 6.2 Local Execution Mode
- Running locally with `--local` (or when `RMAPI_AUTH_TOKEN` is unset) outputs generated files to `./output/`.
- Enables rapid testing, visual inspection in macOS Preview, and zero dependency on remote cloud services during development.

---

## 7. Automation & Triggers

### 7.1 GitHub Actions Workflow (`.github/workflows/daily-puzzles.yml`)
- **Schedule**: Runs daily at 06:00 UTC (customizable via cron).
- **Manual Dispatch (`workflow_dispatch`)**:
  - `puzzle_type`: Choice (`all`, `word-search`, `sudoku`), default: `all`.
  - `sudoku_difficulty`: Choice (`random`, `easy`, `medium`, `hard`, `expert`), default: `random`.
- **Workflow Steps**:
  1. Check out repository.
  2. Set up Node.js 20.x & install dependencies (`npm ci`).
  3. Download and install `rmapi` binary.
  4. Authenticate `rmapi` using secrets `RMAPI_AUTH_TOKEN`.
  5. Execute generation script:
     ```bash
     npm run generate -- --type=${{ inputs.puzzle_type || 'all' }} --difficulty=${{ inputs.sudoku_difficulty || 'random' }} --upload
     ```

### 7.2 Android Shortcuts Trigger
- App: **HTTP Request Shortcuts** (F-Droid / Google Play).
- **Method**: `POST`
- **URL**: `https://api.github.com/repos/<OWNER>/pen-to-paper/actions/workflows/daily-puzzles.yml/dispatches`
- **Headers**:
  - `Authorization: Bearer <GITHUB_PERSONAL_ACCESS_TOKEN>`
  - `Accept: application/vnd.github.v3+json`
  - `X-GitHub-Api-Version: 2022-11-28`
- **Body**:
  ```json
  {
    "ref": "main",
    "inputs": {
      "puzzle_type": "all",
      "sudoku_difficulty": "random"
    }
  }
  ```

---

## 8. Error Handling & Quality Assurance

### 8.1 Error Resilience
- **Word Placement Fallback**: Word search generator attempts up to 5 random layout iterations if initial placement fails due to dense collisions.
- **Folder Idempotence**: `rmapi mkdir` errors indicating directories already exist are safely ignored.
- **Buffer & Page Validation**: PDF generation verifies that buffers are valid non-empty `%PDF` binary streams containing exactly 3 pages before handoff to delivery.

### 8.2 Testing Strategy
- **Framework**: `vitest`
- **Unit Tests**:
  - `word-search.test.ts`: Verify 15x15 dimensions, word containment in grid, solution coordinate validity, filler character set.
  - `sudoku.test.ts`: Verify 9x9 layout, difficulty mapping from "random" to specific difficulty, valid clue counts.
  - `pdf-builder.test.ts`: Verify PDF header, page count (3 pages), and non-empty stream generation.
- **Local Verification**:
  - Visual verification command: `npm run generate -- --type=all --local`
  - Allows previewing output files directly on macOS before deployment.
