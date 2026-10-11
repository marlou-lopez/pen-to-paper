# Design Specification: Daily Folder Routing & Tablet Archive Structure

## Overview
This specification defines the folder organization and routing logic for the Pen to Paper daily puzzle generator on the reMarkable tablet and local filesystem. Daily automated puzzles land in a dedicated `/Puzzles/Daily/` folder (acting as an active "Inbox"). Once solved, users can move them into pre-created archive subfolders (`/Puzzles/Archive/Word Search/` and `/Puzzles/Archive/Sudoku/`). Manual, on-demand puzzle generations continue to route directly to their specific category folders (`/Puzzles/Word Search/` and `/Puzzles/Sudoku/`) by default, unless `--daily` or an explicit `--folder` override is provided.

---

## 1. Folder Structure on reMarkable & Local Storage

```text
/Puzzles/
├── Daily/                          # Active inbox: where automated daily puzzles land
│   ├── WordSearch_YYYY-MM-DD_<Theme>.pdf
│   └── Sudoku_<Difficulty>_YYYY-MM-DD.pdf
├── Word Search/                    # Category folder for manual on-demand generations
├── Sudoku/                         # Category folder for manual on-demand generations
└── Archive/                        # Pre-created archive destinations for completed puzzles
    ├── Word Search/
    └── Sudoku/
```

---

## 2. Target Folder Routing Logic

The destination folder for each generated puzzle is resolved according to the following precedence:

1. **Explicit Folder Override (`--folder=<path>`):**
   If `--folder` is specified in CLI or `options.folder` in `runGenerator()`, use that exact path.
2. **Daily Inbox Mode (`--daily` or `options.daily === true`):**
   If `daily` is enabled, the target folder is `/Puzzles/Daily` for all puzzle types.
3. **Default / Manual Generation Mode:**
   If neither `--folder` nor `--daily` is provided, fall back to each puzzle generator's metadata `targetFolder`:
   - Word Search $\rightarrow$ `/Puzzles/Word Search`
   - Sudoku $\rightarrow$ `/Puzzles/Sudoku`

---

## 3. CLI & Orchestration Interface

### `RunOptions` in `src/index.ts`
```typescript
export interface RunOptions {
  type?: 'all' | 'word-search' | 'sudoku';
  difficulty?: string;
  theme?: string;
  date?: string;
  upload?: boolean;
  outputDir?: string;
  daily?: boolean;       // If true, routes puzzles to /Puzzles/Daily
  folder?: string;      // Explicit target folder override
}
```

### CLI Arguments in `src/cli.ts`
- `--daily`: Boolean flag to route output to `/Puzzles/Daily`.
- `--folder=<path>`: Custom target folder override.

Examples:
```bash
# Automated / Daily generation (lands in /Puzzles/Daily):
npm run generate -- --daily --upload

# Manual generation (lands in /Puzzles/Word Search):
npm run generate -- --type=word-search --upload

# Manual generation to custom folder:
npm run generate -- --type=sudoku --folder="/Puzzles/Test" --upload
```

---

## 4. Archive & Folder Pre-creation in Delivery Clients

Both `RmapiDeliveryClient` and `LocalDeliveryClient` must ensure that standard archive folders exist so users can organize solved puzzles without having to manually create directories on their tablet:

### Archive Folders to Pre-create
- `/Puzzles/Archive/Word Search`
- `/Puzzles/Archive/Sudoku`

### Behavior
- In `RmapiDeliveryClient`:
  - When initializing or executing delivery, run `rmapi mkdir` for `/Puzzles/Archive/Word Search` and `/Puzzles/Archive/Sudoku`.
  - Silently ignore errors if folders already exist (idempotent).
- In `LocalDeliveryClient`:
  - Ensure `./output/Puzzles/Archive/Word Search` and `./output/Puzzles/Archive/Sudoku` exist via `fs.mkdir(..., { recursive: true })`.

---

## 5. GitHub Actions Workflow Updates

In `.github/workflows/daily-puzzles.yml`:

### Scheduled Cron (`0 21 * * *`)
- Always passes `--daily` so scheduled runs deliver directly into `/Puzzles/Daily`.

### Manual `workflow_dispatch`
- Add input `is_daily`:
  ```yaml
  inputs:
    puzzle_type:
      description: 'Puzzle type (all, word-search, sudoku)'
      required: false
      default: 'all'
    sudoku_difficulty:
      description: 'Sudoku difficulty'
      required: false
      default: 'random'
    word_search_theme:
      description: 'Word Search theme'
      required: false
      default: ''
    is_daily:
      description: 'Deliver to /Puzzles/Daily (true) or Category folders (false)'
      type: boolean
      default: true
  ```
- Execution script checks `inputs.is_daily` or event type `schedule` and appends `--daily` when true.

---

## 6. Testing Strategy

1. **Orchestrator Routing Unit Tests (`tests/cli.test.ts`):**
   - Verify `runGenerator({ daily: true })` delivers puzzles to `/Puzzles/Daily`.
   - Verify `runGenerator({ folder: '/Custom/Path' })` delivers to `/Custom/Path`.
   - Verify `runGenerator({ daily: false })` delivers to default category folders (`/Puzzles/Word Search` and `/Puzzles/Sudoku`).
2. **Delivery Client Archive Creation Tests (`tests/delivery/clients.test.ts`):**
   - Verify `RmapiDeliveryClient` creates archive directories (`/Puzzles/Archive/Word Search` and `/Puzzles/Archive/Sudoku`).
   - Verify `LocalDeliveryClient` creates local archive directories.
3. **Full Suite Regression:**
   - Ensure all existing unit tests and `tsc` builds continue to pass.
