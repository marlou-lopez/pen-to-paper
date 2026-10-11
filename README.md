# Pen to Paper: reMarkable Puzzle Generator

An automated daily puzzle generator producing e-ink formatted 3-page PDFs for the reMarkable tablet, syncing directly to `/Puzzles/Word Search/` and `/Puzzles/Sudoku/`.

## Features
- **Word Search**: 15x15 grids using curated offline themes (Astronomy, Ocean Life, History, etc.).
- **Sudoku**: 9x9 grids with difficulty settings (`random`, `easy`, `medium`, `hard`, `expert`) that rotate automatically or can be specified on-demand.
- **E-Ink Optimized Layout**: 1404x1872 pt (3:4 aspect ratio) with high-contrast monochrome design and generous margins.
- **3-Page Structure**: Page 1 (The Puzzle), Page 2 (Spoiler Blocker), Page 3 (The Answer Key).
- **Dual Trigger**: Daily GitHub Actions schedule + On-Demand Android HTTP webhook.

## Local Development
```bash
npm install
npm test
# Generate puzzles locally to ./output/ for preview:
npm run generate -- --type=all --difficulty=medium
```

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
