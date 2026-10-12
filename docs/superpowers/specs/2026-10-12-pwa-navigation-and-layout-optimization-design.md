# Design Specification: PWA Scalable Navigation & Mobile Zero-Scroll Layout Optimization

## Overview
This specification details UI and architectural enhancements to the Pen to Paper Mobile PWA (`web/`):
1. **Scalable Navigation Architecture**: Replacing the cramped fixed 4-tab bottom navigation bar with a modern Top Header Switcher (`🧩 Sudoku Studio ▾`) and a Slide-Up Puzzle Selector Sheet, providing infinite scalability for future puzzle types while reclaiming 64px of vertical screen real estate.
2. **Centralized Delivery Destination in Settings**: Moving the "Delivery Destination" toggle out of the individual game screens (Sudoku and Word Search) into a unified preference in the Settings modal (`Category Folders` vs `Daily Inbox`), persisted in `localStorage`.
3. **Zero-Scroll Sudoku Studio Layout**: Redesigning the Sudoku grid, utility controls, keypad, and action buttons into a tight single-viewport mobile layout (`100dvh`), allowing users to transcribe book puzzles and send them to their reMarkable tablet with zero vertical scrolling.
4. **Streamlined Word Search Studio**: Removing the redundant destination toggle to create a focused, single-view theme selection and dispatch experience.

---

## 1. Architecture & Navigation Design

### Problem
The previous bottom navigation bar (`Sudoku | Word Search | Daily Pack | Settings`) occupied 64px of screen height and was non-scalable: adding even 1 or 2 new puzzle types (e.g., Crosswords, Nonograms) would make the tabs cramped and unreadable on mobile viewports.

### Solution: Top Header Switcher & Selector Sheet
- **Top Header Bar (`web/src/App.tsx`)**:
  - Left: Logo icon (`P`) and an interactive button pill displaying the current puzzle and dropdown indicator: `[ 🧩 Sudoku Studio ▾ ]`.
  - Right: GitHub connection status badge (`Ready` / `Setup Token`) and the Settings button `[ ⚙️ ]`.
  - Height: `h-12` (48px) with `safe-top` insets for mobile notches.
- **Puzzle Selector Sheet (`web/src/components/PuzzleSelectorModal.tsx`)**:
  - Modal bottom sheet that slides up when the header pill is tapped.
  - Lists available puzzle suites with clear typography, icons, and short descriptions:
    - 🧩 **Sudoku Studio** — *Transcribe physical books & custom grids*
    - 🔍 **Word Search Studio** — *15 curated offline themes & custom topics*
    - ⚡ **Daily Pack** — *1-tap morning bundle trigger*
    - Future-ready: new puzzles can be registered simply as array entries in `PUZZLE_TYPES`.
  - Smooth backdrop blur dismiss and tap-to-select.

---

## 2. Centralized Delivery Destination Preference

### Settings Updates (`web/src/components/SettingsModal.tsx` & `web/src/services/githubApi.ts`)
- Add `defaultDestination: 'category' | 'daily'` to `StoredSettings` in `githubApi.ts`.
  - `'category'`: delivers on-demand puzzles to category folders (`/Puzzles/Sudoku/` and `/Puzzles/Word Search/`). This maps to `is_daily = false`. (Default).
  - `'daily'`: delivers on-demand puzzles to the active inbox (`/Puzzles/Daily/`). This maps to `is_daily = true`.
- Update `SettingsModal.tsx`:
  - Radio toggle selector:
    - 🔘 **Category Folders** (`/Puzzles/Sudoku/`, `/Puzzles/Word Search/`)
    - 🔘 **Daily Inbox** (`/Puzzles/Daily/`)
  - Persisted in `localStorage` under `pen_to_paper_settings`.
- Removal from Studios:
  - Remove the destination toggle card from `SudokuStudio.tsx` and `WordSearchStudio.tsx`.
  - When dispatching, studios read `getStoredSettings().defaultDestination !== 'daily' ? false : true` directly.

---

## 3. Sudoku Studio Zero-Scroll Viewport Layout

### Goal
All interactive elements (Header, Subheader, 9x9 Grid, Keypad, Action Buttons) must fit inside `100dvh` on standard mobile screens (from 667px iPhone SE to 844px+ modern devices) with **no vertical scrolling**.

### Height Budget & Layout Breakdown
1. **Header**: 48px
2. **Compact Utility Bar**:
   - Single horizontal bar placed directly above the grid:
     - Left: `[x] Auto-advance` checkbox toggle
     - Center: `cluesCount / 81 clues` indicator
     - Right: `[✨ Sample]` and `[🔄 Clear]` buttons
   - Height: ~30px
3. **9x9 Interactive Sudoku Grid**:
   - Sized responsively to fit viewport height constraints: `w-[288px] h-[288px]` to `w-[315px] h-[315px]` (cells ~32px–35px each).
   - High-contrast black outer border and bold 3x3 division borders.
   - Live conflict highlighting in red; active cell highlight in amber.
4. **Touch-Friendly 2-Row Numeric Keypad**:
   - Row 1: `[ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ]`
   - Row 2: `[ 6 ] [ 7 ] [ 8 ] [ 9 ] [ Clear ]`
   - Button height: 36px–40px, tight gap (6px).
   - Total keypad height: ~82px.
5. **Primary Action Bar**:
   - Flex row placed directly below keypad:
     - `[ Check ]` (secondary button, validates solvability)
     - `[ 🚀 Send to reMarkable ]` (primary full-width button)
   - Height: ~42px.
6. **Total Height**:
   `48px (Header) + 30px (Utility) + 305px (Grid) + 82px (Keypad) + 42px (Actions) + padding (16px) = ~523px`.
   Easily fits inside 667px (iPhone SE) and 844px+ screens with **zero vertical scrolling**!
7. **Toasts / Status Messages**:
   - Displayed as a floating toast or compact non-layout-shifting banner above the keypad/action buttons so messages never push elements off-screen.

---

## 4. Word Search Studio Updates

- Remove destination selection card.
- Clean layout featuring:
  - Curated preset theme pills (15 themes).
  - Custom topic / words input field.
  - "Send to reMarkable" action button dispatching with stored destination preference.

---

## 5. Verification Plan

1. **Unit Tests**:
   - Verify `getStoredSettings` and `saveStoredSettings` properly handle `defaultDestination`.
   - Ensure all 45 existing unit tests pass (`npm test`).
2. **Build Verification**:
   - Backend compilation: `npm run build` (0 TypeScript errors).
   - Frontend PWA compilation: `npm run build:web` (0 errors, Vite bundle + PWA service worker precache generated).
3. **Responsive Visual Testing**:
   - Verify on simulated mobile viewports (375x667 iPhone SE, 390x844 iPhone 14, 412x915 Pixel 7) that the Sudoku Studio displays all elements with no vertical scrollbar.
