# Pen to Paper: reMarkable Puzzle Generator

An automated daily puzzle generator producing e-ink formatted 3-page PDFs for the reMarkable tablet, syncing daily puzzles directly to `/Puzzles/Daily/` and providing organized tablet archives.

## Features
- **Word Search**: 15x15 grids using curated offline themes (Astronomy, Ocean Life, History, etc.).
- **Sudoku**: 9x9 grids with difficulty settings (`random`, `easy`, `medium`, `hard`, `expert`) that rotate automatically or can be specified on-demand.
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
│   └── Sudoku_<Difficulty>_YYYY-MM-DD.pdf
├── Word Search/                    # Category folder for on-demand manual generations
├── Sudoku/                         # Category folder for on-demand manual generations
└── Archive/                        # Pre-created archive destinations for solved puzzles
    ├── Word Search/
    └── Sudoku/
```

**Daily Workflow**:
1. Every morning, new puzzles arrive in `/Puzzles/Daily/`.
2. Solve the puzzles on your reMarkable tablet.
3. Move completed puzzles to `/Puzzles/Archive/Word Search/` or `/Puzzles/Archive/Sudoku/` to keep your inbox clean.
4. On-demand manual generations deliver directly to their category folders (`/Puzzles/Word Search/` and `/Puzzles/Sudoku/`) by default, or to `/Puzzles/Daily/` when `--daily` is specified.

## Local Development & CLI Usage

```bash
npm install
npm test

# Generate puzzles locally to ./output/ for preview:
npm run generate -- --type=all --difficulty=medium

# Route to daily inbox:
npm run generate -- --daily

# Generate a custom Sudoku puzzle from grid notation:
npm run generate -- --grid="53xx7xxxx/6xx195xxx/x98xxxx6x/8xxx6xxx3/4xx8x3xx1/7xxx2xxx6/x6xxxx28x/xxx419xx5/xxxx8xx79"

# Custom target folder override:
npm run generate -- --type=sudoku --folder="/Puzzles/Custom"

# Generate and upload to tablet:
npm run generate -- --daily --upload
```

### CLI Options
- `--type=<type>`: Puzzle type to generate (`all`, `word-search`, `sudoku`). Default: `all`.
- `--difficulty=<diff>`: Sudoku difficulty (`random`, `easy`, `medium`, `hard`, `expert`). Default: `random`.
- `--theme=<theme>`: Word Search theme (optional; dynamic rotation if omitted).
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
