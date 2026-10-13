# Unified Puzzle Dimensions & Page Layout Design

## 1. Overview & Problem Statement

Currently, the daily puzzles on the reMarkable e-ink tablet (and to a lesser degree in the mobile PWA) have disparate dimensions and vertical positioning:
- **Sudoku**: 990×990 pt ($Y=280$ pt, cellSize 110 pt) — comfortable, readable, and visually balanced.
- **KenKen**: 1284×1284 pt ($Y=220$ pt, cellSize up to 214–321 pt) — oversized, stretching edge-to-edge.
- **Mini Crossword**: 500×500 pt ($Y=210$ pt, cellSize 100 pt, clue numbers 14 pt) — tiny grid floating high on the page, clue numbers hard to read.
- **Kakuro**: 660–750 pt ($Y=330$–$380$ pt, cellSize 75–110 pt) — noticeably smaller than Sudoku, vertical anchor floats.
- **Futoshiki**: 720–780 pt ($Y=546$–$576$ pt) — vertically pushed down into the middle-bottom of the page, creating massive dead space at the top.
- **Word Search**: 810×810 pt ($Y=180$ pt, cellSize 54 pt).

Switching between these puzzles in `/Puzzles/Daily` on the tablet is jarring because the board bounding box jumps between 500 pt and 1284 pt, and the top anchor fluctuates between $Y=180$ pt and $Y=576$ pt.

### Goals
1. Establish a **Unified Design System** anchored on the Sudoku baseline across all 6 puzzle types.
2. Standardize the **Top Grid Anchor** to strictly **$Y = 240$ pt** across all puzzles so the top-left corner of every board aligns identically when flipping pages.
3. Standardize the **Target Board Footprint** to **$960\text{–}990$ pt** (centered horizontally on the 1404 pt canvas at $X \approx 207\text{–}252$ pt).
4. Scale typography and clue labels so every puzzle is crisp, readable at arm's length on e-ink, and visually harmonious.
5. Align Web PWA Studios to a consistent **$340\text{–}360$ px** mobile container width with zero scrolling.

---

## 2. Standardized Page Geometry (PDF Canvas: 1404 × 1872 pt)

```text
+-------------------------------------------------------------+  Y = 0 pt
| PAGE_MARGIN = 60 pt                                         |
| [HEADER ZONE] Y = 60 pt -> 160 pt                           |
| Title (46 pt bold) + Metadata Badge (22 pt) + Date (20 pt) |
| Divider Stroke (2 pt black) @ Y = 160 pt                    |
|                                                             |
| [UNIFIED GRID ZONE] Y = 240 pt -> ~1200 pt                  |
| Target Width & Height: 960 - 990 pt                         |
| Centered Horizontally: startX = (1404 - boardSize) / 2      |
|                                                             |
|                                                             |
|                                                             |
| [CONTENT / FOOTER ZONE] Y = 1220 pt -> 1750 pt              |
| Clues (Mini Crossword), Checklist (Word Search), or Rules   |
| PAGE_MARGIN = 60 pt                                         |
+-------------------------------------------------------------+  Y = 1872 pt
```

---

## 3. Detailed Per-Puzzle Specifications

### 3.1 Sudoku (`src/puzzles/sudoku/renderer.ts`)
- **Grid Size**: $9 \times 9$.
- **Cell Size**: $110$ pt.
- **Board Footprint**: $990 \times 990$ pt.
- **Anchor**: $X = 207$ pt, $Y = 240$ pt (adjusted from $280$ pt to align with standard $240$ pt anchor).
- **Typography**: Given/solution digits $54$ pt bold / $50$ pt regular centered at $Y_{\text{cell}} + 30$ pt.

### 3.2 KenKen (`src/puzzles/kenken/renderer.ts`)
- **Grid Sizes**: $4\times 4, 5\times 5, 6\times 6, 7\times 7, 8\times 8, 9\times 9$ (default: $6\times 6$).
- **Board Footprint**: Standardized to **$960 \times 960$ pt** (centered at $X = 222$ pt, $Y = 240$ pt).
  - $4\times 4$: cell $240$ pt, cage badge $32$ pt, digit $72$ pt.
  - $5\times 5$: cell $192$ pt, cage badge $28$ pt, digit $64$ pt.
  - $6\times 6$: cell $160$ pt, cage badge $24$ pt, digit $56$ pt.
  - $7\times 7$: cell $137$ pt ($959$ pt), cage badge $22$ pt, digit $48$ pt.
  - $8\times 8$: cell $120$ pt, cage badge $20$ pt, digit $44$ pt.
  - $9\times 9$: cell $106$ pt ($954$ pt), cage badge $18$ pt, digit $40$ pt.
- **Outer border**: 3 pt black frame; cage borders: 3 pt black; cell lines: 1 pt gray.
- **Rules prompt**: Centered at $Y = 1240$ pt ($20$ pt font, width $1284$ pt).

### 3.3 Kakuro (`src/puzzles/kakuro/renderer.ts`)
- **Grid Sizes**: $6\times 6, 8\times 8, 10\times 10$ (default: $8\times 8$).
- **Board Footprint**: Standardized to **$960 \times 960$ pt** (centered at $X = 222$ pt, $Y = 240$ pt).
  - $6\times 6$: cell $160$ pt ($960$ pt), split clue badges $28$ pt, solved digits $56$ pt.
  - $8\times 8$: cell $120$ pt ($960$ pt), split clue badges $24$ pt, solved digits $48$ pt.
  - $10\times 10$: cell $96$ pt ($960$ pt), split clue badges $20$ pt, solved digits $40$ pt.
- **Rules prompt**: Centered at $Y = 1240$ pt ($20$ pt font).

### 3.4 Futoshiki (`src/puzzles/futoshiki/renderer.ts`)
- **Grid Sizes**: $4\times 4, 5\times 5, 6\times 6$ (default: $5\times 5$).
- **Board Footprint**: Standardized to **$960 \times 960$ pt** (centered at $X = 222$ pt, anchored at **$Y = 240$ pt**).
  - $4\times 4$: cell $205$ pt, gutter $45$ pt ($4 \times 205 + 3 \times 45 = 955$ pt), chevron span $12$ pt, digits $70$ pt.
  - $5\times 5$: cell $160$ pt, gutter $40$ pt ($5 \times 160 + 4 \times 40 = 960$ pt), chevron span $10$ pt, digits $56$ pt.
  - $6\times 6$: cell $135$ pt, gutter $30$ pt ($6 \times 135 + 5 \times 30 = 960$ pt), chevron span $8$ pt, digits $48$ pt.
- **Rules prompt**: Centered at $Y = 1240$ pt ($20$ pt font).

### 3.5 Mini Crossword (`src/puzzles/mini-crossword/renderer.ts`)
- **Grid Size**: $5 \times 5$.
- **Cell Size**: **$180$ pt** (enlarged from $100$ pt).
- **Board Footprint**: **$900 \times 900$ pt** (centered at $X = 252$ pt, $Y = 240$ pt).
- **Cell Clue Numbers**: **$28$ pt** (enlarged from $14$ pt for instant readability).
- **Solved Letters**: **$64$ pt** bold (enlarged from $46$ pt).
- **Clue List**: Starts at $Y = 1180$ pt directly below the grid:
  - 2 balanced side-by-side columns: Across at $X = 140$ pt (width $520$ pt), Down at $X = 744$ pt (width $520$ pt).
  - Section headers: $24$ pt bold (`ACROSS`, `DOWN`).
  - Clue text: $20$ pt text with $22$ pt bold number prefixes and clean line heights ($28$ pt).

### 3.6 Word Search (`src/puzzles/word-search/renderer.ts`)
- **Grid Size**: $15 \times 15$.
- **Cell Size**: **$64$ pt** (enlarged from $54$ pt).
- **Board Footprint**: **$960 \times 960$ pt** (centered at $X = 222$ pt, $Y = 240$ pt).
- **Letter Size**: **$30$ pt bold** (enlarged from $26$ pt).
- **Checklist**: Starts at $Y = 1240$ pt:
  - Title: $24$ pt bold ("Words to Find:").
  - 3 columns with `[  ]` check tags ($20$ pt font, row height $32$ pt).

---

## 4. Web PWA Studio Standardization

- **Unified Max Width**: All studio grids are constrained to `max-w-[340px]` to `max-w-[360px]` on mobile.
- **Zero-Scroll Guarantee**: Top header + options pills + grid + action bar + adaptive keypad fit into `100dvh` with `.safe-bottom` safe area insets.
- **Visual Uniformity**: Equal border radiuses, dark-mode styling, and focus rings across Sudoku, KenKen, Kakuro, Futoshiki, and Mini Crossword.

---

## 5. Verification & Testing Strategy

1. **Renderer Geometry Unit Tests**:
   - Update tests in:
     - `tests/puzzles/sudoku.test.ts`
     - `tests/puzzles/kenken-renderer.test.ts`
     - `tests/puzzles/kakuro-renderer.test.ts`
     - `tests/puzzles/futoshiki-renderer.test.ts`
     - `tests/puzzles/mini-crossword-renderer.test.ts`
     - `tests/puzzles/word-search.test.ts`
   - Verify all 6 renderers build 3-page PDFs without errors and match the new dimensions.
2. **End-to-End Build**:
   - `npm test`: 100% test pass rate.
   - `npm run build` && `npm run build:web`: 0 errors.
