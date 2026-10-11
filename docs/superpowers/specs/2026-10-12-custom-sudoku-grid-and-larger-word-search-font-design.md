# Design Specification: Custom Sudoku Grid Input (`x` Notation) & Enhanced Word Search Font Size

## Overview
This specification details:
1. **Custom Sudoku Grid Input**: Enabling users to transcribe a Sudoku puzzle from a book or newspaper using a mobile-friendly row-by-row `x` notation, solving it automatically to build a complete 3-page e-ink PDF (puzzle on Page 1, spoiler blocker on Page 2, complete answer key on Page 3), and supporting delivery via local CLI or GitHub Actions webhook dispatch.
2. **Word Search Typography Enhancement**: Increasing the font size of the "Words to Find" checklist on Page 1 and the Solutions list on Page 3 for enhanced readability on e-ink displays.

---

## 1. Custom Sudoku Notation & Grammar

### Format
The puzzle is provided as a single string composed of 9 rows separated by slashes (`/`) or newlines (`\n`).
- Digits `1-9` represent given clue numbers.
- `x` or `X` represents an empty cell.
- Surrounding whitespace around rows or slashes is ignored.
- (Tolerates `.` or `0` or `-` as empty cells for backwards compatibility).

### Example
```text
53xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79
```

### Parser & Validation Rules
The parser (`parseSudokuGrid(input: string): number[][]`) enforces:
1. **Row Count**: Must contain exactly 9 rows. If not:
   `Error: Expected 9 rows separated by '/', but found ${count}.`
2. **Cell Count per Row**: Each row must have exactly 9 characters. If not:
   `Error: Row ${r + 1} has ${len} cells instead of 9 ("${rowText}"). Please check your clues.`
3. **Valid Characters**: Only `1-9`, `x`, `X` (and `.`, `0`, `-`) are allowed.
4. **Duplicate Clue Validation**: Ensures the starting puzzle board contains no rule conflicts:
   - No duplicate numbers (1-9) in any row.
   - No duplicate numbers (1-9) in any column.
   - No duplicate numbers (1-9) in any 3x3 block.
   If a duplicate is found:
   `Error: Invalid puzzle: duplicate number ${num} in ${scope} ${index + 1}.`

---

## 2. Sudoku Backtracking Solver

To generate the Page 3 Answer Key, a backtracking solver (`solveSudoku(grid: number[][]): number[][] | null`) calculates the complete 9x9 solution.
- Standard depth-first search with constraint validation.
- **Unsolvable Puzzle Guard**: If the clues lead to an unsolvable configuration, throws:
  `Error: The provided Sudoku has no valid solution. Please check the clues from your book.`
- Output: Returns a 9x9 matrix `number[][]` of solved digits.

---

## 3. Sudoku Generator & Orchestrator Integration

### `SudokuOptions` & `SudokuGenerator`
- `SudokuOptions` adds `grid?: string`.
- When `options.grid` is provided:
  - Calls `parseSudokuGrid(options.grid)` to obtain `puzzleGrid`.
  - Calls `solveSudoku(puzzleGrid)` to obtain `solutionGrid`.
  - Sets `difficulty` / title to `Custom` (`title: 'Sudoku - Custom'`).
  - Sets filename: `Sudoku_Custom_${dateStr}.pdf`.
  - Renders using `renderSudokuPdf()` (existing Page 1 clues in bold, Page 2 spoiler blocker, Page 3 answers).

### `RunOptions` & `cli.ts`
- `RunOptions` in `src/index.ts` adds `grid?: string`.
- In `src/cli.ts`:
  - Parses `--grid=<notation>` or `--grid="<notation>"`.
  - If `--grid` is passed and `--type` is not specified, defaults `options.type = 'sudoku'`.
  - Passes `grid` to `SudokuOptions`.

---

## 4. GitHub Actions Workflow (`daily-puzzles.yml`)

Add `sudoku_grid` input to `workflow_dispatch`:
```yaml
      sudoku_grid:
        description: 'Custom Sudoku grid using x notation (optional)'
        required: false
        default: ''
```

In the execution step:
```bash
GRID_PARAM="${{ inputs.sudoku_grid }}"
GRID_FLAG=""
if [ -n "$GRID_PARAM" ]; then
  GRID_FLAG="--grid=$GRID_PARAM"
fi
npm run generate -- ... $GRID_FLAG
```

### Android HTTP Request Shortcuts Integration
Users can create a dedicated "Upload Book Sudoku" shortcut:
- URL: `https://api.github.com/repos/marlou-lopez/pen-to-paper/actions/workflows/daily-puzzles.yml/dispatches`
- Body:
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

---

## 5. Word Search Typography Enhancement

In `src/puzzles/word-search/renderer.ts`:
- **Page 1 Checklist**:
  - Section Header: Increase from `fontSize(22)` to `fontSize(24)`.
  - Words: Increase from `fontSize(18)` to `fontSize(22)`.
  - Vertical row spacing: Increase from `row * 32` to `row * 38`.
- **Page 3 Solutions List**:
  - Section Header: Increase from `fontSize(22)` to `fontSize(24)`.
  - Words: Increase from `fontSize(18)` to `fontSize(22)`.
  - Vertical row spacing: Increase from `row * 32` to `row * 38`.

---

## 6. Testing Strategy

1. **Parser & Solver Tests (`tests/puzzles/sudoku-parser.test.ts`):**
   - Valid `x` notation parsing and normalization.
   - Rejection of invalid row counts (e.g. 8 rows) with exact error message.
   - Rejection of row with != 9 characters with exact row index.
   - Rejection of duplicate clues in row/column/box.
   - Solving a known valid puzzle accurately.
   - Rejection of unsolvable puzzles with clear error message.
2. **Generator Integration Tests (`tests/puzzles/sudoku.test.ts`):**
   - Generating a puzzle with `grid` option produces `Sudoku_Custom_...pdf` and valid 3-page document.
3. **Word Search Renderer Tests (`tests/puzzles/word-search.test.ts`):**
   - Verify word search PDF builds successfully with larger font size.
4. **Full Suite Regression:**
   - 100% tests pass and `npm run build` compiles cleanly.
