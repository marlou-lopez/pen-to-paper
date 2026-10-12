# PWA Scalable Navigation & Zero-Scroll Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the mobile PWA to support scalable puzzle navigation via a Top Header Switcher and Slide-Up Selector Sheet, centralize the delivery destination in Settings, and eliminate all vertical scrolling in the Sudoku Studio.

**Architecture:** Replace the fixed 4-item bottom navigation bar with a compact header switcher and slide-up modal sheet (`PuzzleSelectorModal.tsx`). Centralize destination routing in `localStorage` via `SettingsModal.tsx` and `githubApi.ts`. Optimize `SudokuStudio.tsx` component hierarchy and CSS constraints to fit within a single mobile viewport (`100dvh`) without page scrolling.

**Tech Stack:** React 18, TypeScript, Tailwind CSS, Vite 5, Vitest.

## Global Constraints
- Framework: React 18 with TypeScript in strict mode.
- Base URL: `/pen-to-paper/` preserved in Vite config.
- Single-Screen Mobile Viewport: Sudoku Studio must fit inside standard phone screens (667px–844px height) with 0 vertical scrolling.
- Local Storage Key: `pen_to_paper_settings` persists token, repo, and default destination.
- All test suites must pass (`npm test`) and frontend/backend builds must succeed (`npm run build && npm run build:web`).

---

### Task 1: Centralized Delivery Destination Preference in Settings

**Files:**
- Modify: `web/src/services/githubApi.ts`
- Modify: `web/src/components/SettingsModal.tsx`
- Create: `tests/web/settings.test.ts`

**Interfaces:**
- Consumes: `localStorage`
- Produces: `StoredSettings.defaultDestination?: 'category' | 'daily'`, `getStoredSettings()`, `saveStoredSettings()`, radio selector UI in `SettingsModal`

- [ ] **Step 1: Write unit tests in `tests/web/settings.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredSettings,
  saveStoredSettings,
  StoredSettings,
} from '../../web/src/services/githubApi.js';

describe('Settings Storage', () => {
  const storageMock: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(storageMock)) delete storageMock[key];
    globalThis.localStorage = {
      getItem: (key: string) => storageMock[key] ?? null,
      setItem: (key: string, val: string) => {
        storageMock[key] = val;
      },
      removeItem: (key: string) => {
        delete storageMock[key];
      },
      clear: () => {
        for (const key of Object.keys(storageMock)) delete storageMock[key];
      },
      key: () => null,
      length: 0,
    } as unknown as Storage;
  });

  it('defaults to category destination when not configured', () => {
    const settings = getStoredSettings();
    expect(settings.defaultDestination).toBe('category');
  });

  it('persists and retrieves custom default destination', () => {
    saveStoredSettings({
      token: 'ghp_test123',
      repo: 'owner/repo',
      defaultDestination: 'daily',
    });

    const settings = getStoredSettings();
    expect(settings.token).toBe('ghp_test123');
    expect(settings.defaultDestination).toBe('daily');
  });
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `npm test tests/web/settings.test.ts`
Expected: FAIL because `defaultDestination` is not yet on `StoredSettings`.

- [ ] **Step 3: Update `web/src/services/githubApi.ts`**

```typescript
export interface StoredSettings {
  token: string;
  repo: string;
  defaultDestination?: 'category' | 'daily';
}
```

In `getStoredSettings()`:
```typescript
      return {
        token: parsed.token || '',
        repo: parsed.repo || DEFAULT_REPO,
        defaultDestination: parsed.defaultDestination === 'daily' ? 'daily' : 'category',
      };
```

- [ ] **Step 4: Update `web/src/components/SettingsModal.tsx`**

Add `defaultDestination` state (defaulting to `'category'`), load it in `useEffect`, save it in `handleSave()`, and add the radio selector UI:

```tsx
          {/* Default Delivery Destination */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Default Delivery Destination
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDefaultDestination('category')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  defaultDestination === 'category'
                    ? 'border-gray-950 bg-gray-50 text-gray-950 font-semibold ring-1 ring-gray-950'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="text-xs font-bold">Category Folders</div>
                <div className="text-[10px] text-gray-400 mt-0.5 font-mono">/Puzzles/Sudoku/</div>
              </button>

              <button
                type="button"
                onClick={() => setDefaultDestination('daily')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  defaultDestination === 'daily'
                    ? 'border-gray-950 bg-gray-50 text-gray-950 font-semibold ring-1 ring-gray-950'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }`}
              >
                <div className="text-xs font-bold">Daily Inbox</div>
                <div className="text-[10px] text-gray-400 mt-0.5 font-mono">/Puzzles/Daily/</div>
              </button>
            </div>
            <p className="text-[11px] text-gray-500">
              Determines where custom and on-demand puzzles are routed on your reMarkable tablet.
            </p>
          </div>
```

- [ ] **Step 5: Run tests and verify build**

Run: `npm test && npm run build:web`
Expected: PASS (all tests pass, clean build).

- [ ] **Step 6: Commit**

```bash
git add web/src/services/githubApi.ts web/src/components/SettingsModal.tsx tests/web/settings.test.ts
git commit -m "feat(web): add default delivery destination setting"
```

---

### Task 2: Scalable Navigation Architecture: Header Switcher & Puzzle Selector Sheet

**Files:**
- Create: `web/src/components/PuzzleSelectorModal.tsx`
- Modify: `web/src/App.tsx`

**Interfaces:**
- Produces: `PuzzleSelectorModal`, Header switcher pill in `App.tsx`, removes fixed bottom navigation bar

- [ ] **Step 1: Create `web/src/components/PuzzleSelectorModal.tsx`**

```tsx
import React from 'react';
import { X, Grid3X3, Search, Zap, Check } from 'lucide-react';

export type ActiveTab = 'sudoku' | 'word-search' | 'daily';

interface PuzzleOption {
  id: ActiveTab;
  title: string;
  badge?: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PUZZLE_OPTIONS: PuzzleOption[] = [
  {
    id: 'sudoku',
    title: 'Sudoku Studio',
    description: 'Transcribe physical books or create custom grids',
    icon: Grid3X3,
  },
  {
    id: 'word-search',
    title: 'Word Search Studio',
    description: '15 curated offline themes or custom word lists',
    icon: Search,
  },
  {
    id: 'daily',
    title: 'Daily Pack',
    badge: '1-Tap',
    description: "Generate today's complete puzzle bundle to /Puzzles/Daily",
    icon: Zap,
  },
];

interface PuzzleSelectorModalProps {
  isOpen: boolean;
  activeTab: ActiveTab;
  onSelect: (tab: ActiveTab) => void;
  onClose: () => void;
}

export const PuzzleSelectorModal: React.FC<PuzzleSelectorModalProps> = ({
  isOpen,
  activeTab,
  onSelect,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col p-5 space-y-4 max-h-[85vh] animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-950">Switch Puzzle Studio</h3>
            <p className="text-[11px] text-gray-500">Select a puzzle type to work with</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {PUZZLE_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = activeTab === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onSelect(opt.id);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                  isSelected
                    ? 'border-gray-950 bg-gray-50 text-gray-950 shadow-xs ring-1 ring-gray-950'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-gray-950 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold">{opt.title}</span>
                      {opt.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-amber-100 text-amber-800 rounded-md">
                          {opt.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{opt.description}</p>
                  </div>
                </div>

                {isSelected && <Check className="w-4 h-4 text-gray-950 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Update `web/src/App.tsx`**

- Remove bottom `<nav className="fixed bottom-0 ...">` component.
- Add `isSelectorOpen` state.
- In top header, replace static title with interactive dropdown pill:
  ```tsx
  <button
    type="button"
    onClick={() => setIsSelectorOpen(true)}
    className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-950 font-bold text-xs transition-colors"
  >
    <span>{CURRENT_TITLES[activeTab]}</span>
    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
  </button>
  ```
- Render `<PuzzleSelectorModal>` alongside `<SettingsModal>`.
- Set main container to `h-[100dvh] flex flex-col overflow-hidden`.

- [ ] **Step 3: Run tests and verify build**

Run: `npm test && npm run build:web`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add web/src/components/PuzzleSelectorModal.tsx web/src/App.tsx
git commit -m "feat(web): replace bottom nav with header puzzle switcher and selector sheet"
```

---

### Task 3: Sudoku Studio Zero-Scroll Viewport Layout

**Files:**
- Modify: `web/src/components/SudokuStudio.tsx`

**Interfaces:**
- Consumes: `getStoredSettings().defaultDestination`, 9x9 matrix state, solver validation
- Produces: Single-screen viewport layout fitting `100dvh` without vertical scroll

- [ ] **Step 1: Update `web/src/components/SudokuStudio.tsx` layout and styling**

1. **Remove Destination Card**:
   Delete lines 302–329 (`<div className="bg-white p-3 rounded-xl border border-gray-200 ...">`).
   In `handleSendToRemarkable()`, read `isDaily` directly from stored settings:
   ```typescript
   const { token, repo, defaultDestination } = getStoredSettings();
   const isDaily = defaultDestination === 'daily';
   ```

2. **Streamline Utility Subheader**:
   Create a single row directly above the grid:
   ```tsx
   <div className="flex items-center justify-between text-xs px-1 text-gray-600">
     <label className="flex items-center space-x-1.5 cursor-pointer select-none">
       <input
         type="checkbox"
         checked={autoAdvance}
         onChange={(e) => setAutoAdvance(e.target.checked)}
         className="w-3.5 h-3.5 rounded text-gray-900 focus:ring-gray-900 border-gray-300"
       />
       <span className="text-[11px] font-medium">Auto-advance</span>
     </label>

     <span className="text-[11px] text-gray-400 font-mono">
       {cluesCount} / 81 clues
     </span>

     <div className="flex items-center space-x-1.5">
       <button
         type="button"
         onClick={handleLoadSample}
         disabled={isBusy}
         className="px-2 py-1 text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50 flex items-center space-x-1 shadow-xs active:scale-95"
       >
         <Sparkles className="w-3 h-3 text-amber-500" />
         <span>Sample</span>
       </button>
       <button
         type="button"
         onClick={handleClearBoard}
         disabled={isBusy}
         title="Clear grid"
         className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
       >
         <RotateCcw className="w-3.5 h-3.5" />
       </button>
     </div>
   </div>
   ```

3. **Size Grid & Keypad Responsively**:
   - Grid: cell size `w-8 h-8 sm:w-9 sm:h-9 text-sm font-semibold`. Outer box `p-0.5`. Total grid height ~290px.
   - Keypad: 2 rows of 5 buttons, `h-9` (36px). Tight padding.
   - Action buttons: Flex row with `[ Check ]` and `[ 🚀 Send to reMarkable ]` (`h-10` / 40px).
   - Layout container: `h-full flex flex-col justify-between py-2 px-3`. Zero scrollbars.

4. **Floating Toast for Status Messages**:
   Render `statusMessage.text` as an absolute/floating compact banner or snackbar when active so it does not alter grid vertical positioning.

- [ ] **Step 2: Run tests and verify build**

Run: `npm test && npm run build:web`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/SudokuStudio.tsx
git commit -m "feat(sudoku): streamline sudoku studio into zero-scroll mobile layout"
```

---

### Task 4: Streamline Word Search Studio

**Files:**
- Modify: `web/src/components/WordSearchStudio.tsx`

**Interfaces:**
- Consumes: `getStoredSettings().defaultDestination`
- Produces: Word Search Studio with destination toggle removed, cleanly fitting mobile screen

- [ ] **Step 1: Update `web/src/components/WordSearchStudio.tsx`**

- Remove lines managing `isDaily` UI toggle buttons.
- In `handleDispatch()`, read `isDaily`:
  ```typescript
  const { token, repo, defaultDestination } = getStoredSettings();
  const isDaily = defaultDestination === 'daily';
  ```
- Adjust layout padding and card heights to match the clean single-screen mobile design.

- [ ] **Step 2: Run tests and verify build**

Run: `npm test && npm run build:web`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add web/src/components/WordSearchStudio.tsx
git commit -m "feat(word-search): remove destination card and use global settings"
```

---

### Task 5: End-to-End Verification, GitHub Pages Deployment & Clean Git Push

**Files:**
- Verify: all test files in `tests/`
- Verify: `web/dist` build

- [ ] **Step 1: Run full test suites and build verifications**

Run:
```bash
npm test
npm run build
npm run build:web
```
Expected: PASS (46+ tests passing, 0 TypeScript errors, Vite PWA precache generated).

- [ ] **Step 2: Push to GitHub and verify deployment**

Run:
```bash
git push origin main
gh run list --workflow="deploy-pwa.yml" --limit 1
```
Expected: Deployment workflow succeeds on GitHub Pages.

---
