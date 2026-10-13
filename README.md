# Pen to Paper: reMarkable Puzzle Generator

An automated daily puzzle generator producing e-ink formatted 3-page PDFs for the reMarkable tablet, syncing daily puzzles directly to `/Puzzles/Daily/` and providing organized tablet archives.

## Features
- **Word Search**: 15x15 grids using curated offline themes (Astronomy, Ocean Life, History, etc.).
- **Sudoku**: 9x9 grids with difficulty settings (`random`, `easy`, `medium`, `hard`, `expert`) that rotate automatically or can be specified on-demand.
- **Mini Crossword**: 5x5 e-ink grids with 10 clues (5 across, 5 down), dynamic Datamuse definitions & backtracking solver, and curated offline seed puzzles.
- **KenKen (Mathdoku)**: NxN arithmetic Latin squares (3x3 to 9x9, default 6x6) with partitioned cages (+, -, *, /) and guaranteed single-solution validation.
- **Kakuro (Cross Sums)**: Japanese cross-sums puzzles on 6x6, 8x8, and 10x10 grids with diagonal clue slashes (across/down sums), non-repeating digits (1-9), and single-solution validation.
- **E-Ink Optimized Layout**: 1404x1872 pt (3:4 aspect ratio) with high-contrast monochrome design and generous margins.
- **3-Page Structure**: Page 1 (The Puzzle), Page 2 (Spoiler Blocker), Page 3 (The Answer Key).
- **Daily Inbox & Archive Workflow**: Automated daily puzzles arrive fresh in `/Puzzles/Daily/`. Solved puzzles can be moved into pre-created `/Puzzles/Archive/` folders.
- **Dual Trigger**: Daily GitHub Actions schedule + On-Demand Android HTTP webhook.
- **Mobile PWA Studio**: Touch-friendly web app on GitHub Pages with visual 9x9 Sudoku grid, conflict validation, and 1-tap tablet delivery.

## 📱 Mobile PWA Puzzle Studio
Access the live Progressive Web App on your mobile device:  
👉 **[https://marlou-lopez.github.io/pen-to-paper/](https://marlou-lopez.github.io/pen-to-paper/)**

*(Add to Home Screen on iOS/Android for a fullscreen native app experience!)*

- **Sudoku Studio**: 9x9 visual interactive grid with on-screen number pad (1–9, Clear), auto-advance cursor, instant duplicate conflict detection in red, and built-in solver verification.
- **Word Search Studio**: Pick from 15 curated preset themes or type your own custom theme.
- **Daily Bundle**: 1-tap trigger to deliver today's morning puzzle pack.
- **1-Tap Delivery**: Sends directly to your reMarkable tablet via GitHub Actions with real-time status tracking.

## Tablet Folder Structure & Archive Workflow

Automated puzzles are delivered to a daily inbox so you always know what's fresh:

```text
/Puzzles/
├── Daily/                          # Active inbox: automated daily scheduled puzzles
│   ├── WordSearch_YYYY-MM-DD_<Theme>.pdf
│   ├── Sudoku_<Difficulty>_YYYY-MM-DD.pdf
│   ├── MiniCrossword_YYYY-MM-DD.pdf
│   ├── KenKen_6x6_YYYY-MM-DD.pdf
│   └── Kakuro_8x8_medium_YYYY-MM-DD.pdf
├── Word Search/                    # Category folder for on-demand manual generations
├── Sudoku/                         # Category folder for on-demand manual generations
├── Mini Crossword/                 # Category folder for on-demand manual generations
├── KenKen/                         # Category folder for on-demand manual generations
├── Kakuro/                         # Category folder for on-demand manual generations
└── Archive/                        # Pre-created archive destinations for solved puzzles
    ├── Word Search/
    ├── Sudoku/
    ├── Mini Crossword/
    ├── KenKen/
    └── Kakuro/
```

**Daily Workflow**:
1. Every morning, new puzzles arrive in `/Puzzles/Daily/`.
2. Solve the puzzles on your reMarkable tablet.
3. Move completed puzzles to `/Puzzles/Archive/Word Search/`, `/Puzzles/Archive/Sudoku/`, `/Puzzles/Archive/Mini Crossword/`, `/Puzzles/Archive/KenKen/`, or `/Puzzles/Archive/Kakuro/` to keep your inbox clean.
4. On-demand manual generations deliver directly to their category folders (`/Puzzles/Word Search/`, `/Puzzles/Sudoku/`, `/Puzzles/Mini Crossword/`, `/Puzzles/KenKen/`, `/Puzzles/Kakuro/`) by default, or to `/Puzzles/Daily/` when `--daily` is specified.

## Local Development & CLI Usage

```bash
npm install
npm test

# Generate puzzles locally to ./output/ for preview:
npm run generate -- --type=all --difficulty=medium

# Route to daily inbox:
npm run generate -- --daily

# Generate a KenKen puzzle locally:
npm run generate -- --type=kenken --size=6 --difficulty=medium

# Generate a Kakuro puzzle locally:
npm run generate -- --type=kakuro --size=8 --difficulty=medium

# Generate a mini crossword puzzle locally:
npm run generate -- --type=mini-crossword --theme="space"

# Generate a custom Sudoku puzzle from grid notation:
npm run generate -- --grid="53xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79"

# Custom target folder override:
npm run generate -- --type=sudoku --folder="/Puzzles/Custom"

# Generate and upload to tablet:
npm run generate -- --daily --upload
```

### CLI Options
- `--type=<type>`: Puzzle type to generate (`all`, `word-search`, `sudoku`, `mini-crossword`, `kenken`, `kakuro`). Default: `all`.
- `--size=<N>`: Grid size (KenKen: 3 to 9, default `6`; Kakuro: 6, 8, 10, default `8`).
- `--difficulty=<diff>`: Difficulty setting (`easy`, `medium`, `hard` for KenKen and Kakuro; `random`, `easy`, `medium`, `hard`, `expert` for Sudoku). Default: `random`.
- `--theme=<theme>`: Puzzle theme for Word Search or Mini Crossword (dynamic rotation / seed bank if omitted).
- `--grid=<notation>`: Custom Sudoku grid string using 9 rows separated by `/` or newlines (`1-9` for clues, `x` for blanks). Automatically generates a solved custom puzzle.
- `--daily`: Route puzzles to the `/Puzzles/Daily` inbox folder.
- `--folder=<path>`: Custom folder destination override (takes precedence over `--daily`).
- `--upload`: Upload directly to reMarkable via `rmapi` instead of local storage.

## Cloud Setup (reMarkable)
1. Generate an authentication code at [my.remarkable.com/device/desktop/connect](https://my.remarkable.com/device/desktop/connect).
2. Authenticate `rmapi` locally once. On macOS, this creates `~/Library/Application Support/rmapi/rmapi.conf` (or `~/.rmapi` / `~/.config/rmapi/rmapi.conf` on Linux).
3. Upload the token into your GitHub repository secrets:
   ```bash
   # On macOS:
   gh secret set RMAPI_AUTH_TOKEN < "$HOME/Library/Application Support/rmapi/rmapi.conf"
   # On Linux:
   gh secret set RMAPI_AUTH_TOKEN < ~/.rmapi
   ```

## Android Trigger Setup
Use the **HTTP Request Shortcuts** Android app:
- **Method**: `POST`
- **URL**: `https://api.github.com/repos/<OWNER>/pen-to-paper/actions/workflows/daily-puzzles.yml/dispatches`
- **Headers**:
  - `Authorization: Bearer <GITHUB_PAT>`
  - `Accept: application/vnd.github.v3+json`
- **Body (Daily Generation)**:
  ```json
  {
    "ref": "main",
    "inputs": {
      "puzzle_type": "all",
      "sudoku_difficulty": "random",
      "is_daily": true
    }
  }
  ```

### Custom Sudoku Shortcut
To transcribe a Sudoku puzzle from a physical book or paper directly to your tablet:
- **Body**:
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
The `{sudoku_grid}` variable prompts for user input in HTTP Request Shortcuts, allowing custom transcription from physical books directly to the reMarkable tablet.
