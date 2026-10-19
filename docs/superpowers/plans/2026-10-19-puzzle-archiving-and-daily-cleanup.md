# Puzzle Archiving & Daily Stale Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an automated lifecycle management system that moves completed puzzles (tagged `DONE` or titled `[DONE]`) across all tablet folders into their respective category archives (`/Puzzles/Archive/<Category>`), and moves uncompleted stale daily puzzles ($> 2$ days old) from `/Puzzles/Daily` into their category folders (`/Puzzles/<Category>`).

**Architecture:** Extend the delivery client abstraction with `listDocuments` and `moveDocument` methods for both `RmapiDeliveryClient` and `LocalDeliveryClient`. Build a standalone, testable TypeScript engine in `src/delivery/cleanup.ts` executing a two-pass algorithm (Pass 1: Archive completed puzzles; Pass 2: Sweep stale dailies). Expose it via CLI (`npm run cleanup`) and automate it via a dedicated GitHub Actions workflow (`cleanup-puzzles.yml`) and an automated pre-step in the daily puzzle generator (`daily-puzzles.yml`).

**Tech Stack:** TypeScript (strict mode), Node.js `child_process` / `fs`, `rmapi` CLI with JSON output, Vitest, GitHub Actions.

## Global Constraints

- reMarkable tablet folder root: `/Puzzles`.
- Categories: `'Word Search'`, `'Sudoku'`, `'Mini Crossword'`, `'KenKen'`, `'Kakuro'`, `'Futoshiki'`.
- Fallback category for unrecognized filenames: `'Other'` (`/Puzzles/Archive/Other`).
- Completed detection: Case-insensitive tag matching `/^done$/i` (`'DONE'`, `'Done'`, `'done'`) OR document name starting with `[DONE]` (case-insensitive).
- Stale daily threshold: Puzzles in `/Puzzles/Daily` with filename date older than 2 calendar days ($\ge 2$ days) relative to UTC today (or passed reference date) that are not completed.
- Archive destination: Strictly category subfolders under `/Puzzles/Archive/<Category>/`.
- Stale destination: Strictly category folders under `/Puzzles/<Category>/`.
- Must support `--dry-run` to log planned moves without writing/moving files.
- All tests and TypeScript compilation must pass cleanly: `npm test && npm run build && npm run build:web`.

---

### Task 1: Delivery Client Extensions (`RemoteDocument`, `CleanupClient`, `listDocuments` & `moveDocument`)

**Files:**
- Modify: `src/delivery/types.ts`
- Modify: `src/delivery/rmapi-client.ts`
- Modify: `src/delivery/local-client.ts`
- Test: `tests/delivery/clients.test.ts`

**Interfaces:**
- `src/delivery/types.ts`:
  ```typescript
  export interface RemoteDocument {
    id?: string;
    name: string;
    path: string;
    folder: string;
    tags: string[];
  }

  export interface CleanupClient extends DeliveryClient {
    listDocuments(folder: string, recursive?: boolean): Promise<RemoteDocument[]>;
    moveDocument(sourcePath: string, destinationFolder: string): Promise<void>;
  }
  ```
- `RmapiDeliveryClient`:
  - `listDocuments(folder: string, recursive?: boolean): Promise<RemoteDocument[]>`: runs `rmapi -json find <folder>` or `rmapi -json ls <folder>`. Parses items into `RemoteDocument`.
  - `moveDocument(sourcePath: string, destinationFolder: string): Promise<void>`: ensures `destinationFolder` exists, executes `rmapi mv "<sourcePath>" "<destinationFolder>"` with retry & backoff.
- `LocalDeliveryClient`:
  - `listDocuments(folder: string, recursive?: boolean): Promise<RemoteDocument[]>`: scans local directory recursively, extracting file names and relative paths.
  - `moveDocument(sourcePath: string, destinationFolder: string): Promise<void>`: moves local file via `fs.rename` (creating destination dir if needed).

- [ ] **Step 1: Write failing tests in `tests/delivery/clients.test.ts`**

Add unit tests for `listDocuments` and `moveDocument` on both `LocalDeliveryClient` and `RmapiDeliveryClient`:
```typescript
it('LocalDeliveryClient lists documents and moves document between folders', async () => {
  const tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'local-client-test-'));
  const client = new LocalDeliveryClient(tmpRoot);

  await client.deliver('Sudoku_2026-10-12.pdf', '/Puzzles/Daily', Buffer.from('dummy'));
  const docs = await client.listDocuments('/Puzzles/Daily');
  expect(docs).toHaveLength(1);
  expect(docs[0].name).toBe('Sudoku_2026-10-12');
  expect(docs[0].folder).toBe('/Puzzles/Daily');

  await client.moveDocument('/Puzzles/Daily/Sudoku_2026-10-12.pdf', '/Puzzles/Archive/Sudoku');
  const dailyDocsAfter = await client.listDocuments('/Puzzles/Daily');
  expect(dailyDocsAfter).toHaveLength(0);

  const archiveDocs = await client.listDocuments('/Puzzles/Archive/Sudoku');
  expect(archiveDocs).toHaveLength(1);
  await fs.rm(tmpRoot, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/delivery/clients.test.ts`
Expected: FAIL (missing methods `listDocuments` and `moveDocument`).

- [ ] **Step 3: Update `src/delivery/types.ts`**

Export `RemoteDocument` and `CleanupClient` interfaces. Update `DeliveryClient` or implement `CleanupClient`.

- [ ] **Step 4: Implement `listDocuments` and `moveDocument` in `src/delivery/local-client.ts`**

Implement local file scanning and `fs.rename`.

- [ ] **Step 5: Implement `listDocuments` and `moveDocument` in `src/delivery/rmapi-client.ts`**

Add `listDocuments(folder: string, recursive = true): Promise<RemoteDocument[]>` parsing JSON output from `rmapi -json find <folder>` (and filtering to files). Add `moveDocument(sourcePath: string, destinationFolder: string): Promise<void>` executing `rmapi mv` with retry.

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/delivery/clients.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/delivery/types.ts src/delivery/rmapi-client.ts src/delivery/local-client.ts tests/delivery/clients.test.ts
git commit -m "feat(delivery): extend delivery clients with listDocuments and moveDocument"
```

---

### Task 2: Core Cleanup Engine (`src/delivery/cleanup.ts`)

**Files:**
- Create: `src/delivery/cleanup.ts`
- Create: `tests/delivery/cleanup.test.ts`

**Interfaces:**
- Consumes: `CleanupClient`, `RemoteDocument` from `src/delivery/types.ts`.
- Produces:
  ```typescript
  export interface CleanupOptions {
    client: CleanupClient;
    retentionDays?: number; // default: 2
    dryRun?: boolean;       // default: false
    referenceDate?: string; // YYYY-MM-DD for deterministic testing
  }

  export interface MoveAction {
    name: string;
    from: string;
    to: string;
  }

  export interface CleanupSummary {
    archived: MoveAction[];
    staleMoved: MoveAction[];
    skipped: { name: string; reason: string }[];
  }

  export function getPuzzleCategory(filename: string): string;
  export function isCompleted(doc: RemoteDocument): boolean;
  export function isStaleDaily(filename: string, retentionDays?: number, referenceDate?: string): boolean;
  export function cleanupPuzzles(options: CleanupOptions): Promise<CleanupSummary>;
  ```

- [ ] **Step 1: Write failing unit tests in `tests/delivery/cleanup.test.ts`**

Test:
1. `getPuzzleCategory` correctly identifies category for all 6 puzzles, handles `[DONE]` prefix, and falls back to `'Other'`.
2. `isCompleted` returns true for tags `['DONE']`, `['done']`, `['Done']`, and titles with `[DONE] ...`. Returns false for untagged.
3. `isStaleDaily` calculates day difference relative to `referenceDate`:
   - `Sudoku_Medium_2026-10-17` with ref `2026-10-19` is 2 days old $\rightarrow$ stale (`true`).
   - `Sudoku_Medium_2026-10-18` with ref `2026-10-19` is 1 day old $\rightarrow$ NOT stale (`false`).
   - `Sudoku_Medium_2026-10-19` with ref `2026-10-19` is 0 days old $\rightarrow$ NOT stale (`false`).
4. Full `cleanupPuzzles` orchestration with a Mock client:
   - Completed puzzles in `/Puzzles/Daily` moved to `/Puzzles/Archive/<Category>`.
   - Completed puzzles in `/Puzzles/Sudoku` moved to `/Puzzles/Archive/Sudoku`.
   - Completed puzzles already in `/Puzzles/Archive/...` skipped.
   - Stale uncompleted puzzles in `/Puzzles/Daily` moved to `/Puzzles/<Category>`.
   - Recent uncompleted puzzles in `/Puzzles/Daily` kept in `/Puzzles/Daily`.
   - `dryRun: true` records planned actions in summary but does not invoke `client.moveDocument`.

- [ ] **Step 2: Run tests to verify Red phase**

Run: `npx vitest run tests/delivery/cleanup.test.ts`
Expected: FAIL (module `src/delivery/cleanup.ts` not found).

- [ ] **Step 3: Implement `src/delivery/cleanup.ts`**

Implement helper functions and `cleanupPuzzles()`:
```typescript
export function getPuzzleCategory(name: string): string {
  const clean = name.replace(/^\[DONE\]\s*/i, '');
  if (/^WordSearch_/i.test(clean)) return 'Word Search';
  if (/^Sudoku_/i.test(clean)) return 'Sudoku';
  if (/^MiniCrossword_/i.test(clean)) return 'Mini Crossword';
  if (/^KenKen_/i.test(clean)) return 'KenKen';
  if (/^Kakuro_/i.test(clean)) return 'Kakuro';
  if (/^Futoshiki_/i.test(clean)) return 'Futoshiki';
  return 'Other';
}

export function isCompleted(doc: RemoteDocument): boolean {
  if (doc.tags?.some((t) => /^done$/i.test(t))) return true;
  if (/^\[DONE\]/i.test(doc.name)) return true;
  return false;
}

export function extractPuzzleDate(filename: string): string | null {
  const match = filename.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  return match ? match[1] : null;
}

export function isStaleDaily(filename: string, retentionDays = 2, referenceDate?: string): boolean {
  const dateStr = extractPuzzleDate(filename);
  if (!dateStr) return false;
  const puzzleDate = new Date(`${dateStr}T00:00:00Z`).getTime();
  const todayDate = referenceDate
    ? new Date(`${referenceDate}T00:00:00Z`).getTime()
    : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime();

  const diffDays = Math.floor((todayDate - puzzleDate) / (1000 * 60 * 60 * 24));
  return diffDays >= retentionDays;
}
```
Implement `cleanupPuzzles` two-pass algorithm and summary reporting.

- [ ] **Step 4: Run tests to verify Green phase**

Run: `npx vitest run tests/delivery/cleanup.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/delivery/cleanup.ts tests/delivery/cleanup.test.ts
git commit -m "feat(cleanup): implement puzzle archiving and stale daily cleanup engine"
```

---

### Task 3: CLI Integration (`src/cli.ts` & `package.json`)

**Files:**
- Modify: `src/cli.ts`
- Modify: `package.json`
- Test: `tests/cli.test.ts`

**Interfaces:**
- Consumes: `cleanupPuzzles`, `CleanupOptions` from `src/delivery/cleanup.ts`, `RmapiDeliveryClient`, `LocalDeliveryClient`.
- CLI syntax:
  - `pen-to-paper cleanup [--days=N] [--dry-run] [--upload] [--local]`
  - `pen-to-paper --cleanup [--days=N] [--dry-run] [--upload] [--local]`
- `package.json`:
  - `"cleanup": "tsx src/cli.ts --cleanup"`

- [ ] **Step 1: Write failing CLI tests in `tests/cli.test.ts`**

Add tests for:
1. `parseArgs` parses `--cleanup`, `--days=3`, and `--dry-run`.
2. Running orchestrator with `cleanup: true` invokes `cleanupPuzzles` with corresponding options.

- [ ] **Step 2: Run test to verify Red phase**

Run: `npx vitest run tests/cli.test.ts`
Expected: FAIL.

- [ ] **Step 3: Update `src/cli.ts`**

- Update `parseArgs` to support:
  - `cleanup: boolean` (`--cleanup` or command `cleanup`)
  - `days: number` (`--days=N`, default: 2)
  - `dryRun: boolean` (`--dry-run`)
- In `main()` / orchestrator: if `cleanup` is requested:
  - Select client: `RmapiDeliveryClient` if `--upload`, otherwise `LocalDeliveryClient`.
  - Invoke `cleanupPuzzles({ client, retentionDays: args.days, dryRun: args.dryRun })`.
  - Log summary and exit cleanly.

- [ ] **Step 4: Update `package.json`**

Add `"cleanup": "tsx src/cli.ts --cleanup"` to `"scripts"`.

- [ ] **Step 5: Run tests to verify Green phase**

Run: `npm test`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/cli.ts package.json tests/cli.test.ts
git commit -m "feat(cli): add cleanup command with days retention and dry-run flags"
```

---

### Task 4: GitHub Actions Workflows & Documentation

**Files:**
- Create: `.github/workflows/cleanup-puzzles.yml`
- Modify: `.github/workflows/daily-puzzles.yml`
- Modify: `README.md`

**Details:**
1. Create `.github/workflows/cleanup-puzzles.yml`:
   - Scheduled daily at 20:00 UTC (1 hour before 21:00 UTC daily puzzle generation).
   - `workflow_dispatch` trigger with `retention_days` (default `2`) and `dry_run` (default `false`).
   - Checks out repo, sets up Node, installs dependencies, installs `rmapi`, configures `RMAPI_AUTH_TOKEN`, and runs:
     `npm run cleanup -- --upload --days=${{ inputs.retention_days || 2 }} $DRY_RUN_FLAG`
2. Update `.github/workflows/daily-puzzles.yml`:
   - Insert cleanup pre-step before `Run puzzle generation & upload`:
     ```yaml
     - name: Tidy completed and stale puzzles
       run: npm run cleanup -- --upload --days=2
     ```
3. Update `README.md`:
   - Document `npm run cleanup` command, flags, and automated lifecycle behavior.

- [ ] **Step 1: Create `.github/workflows/cleanup-puzzles.yml`**
- [ ] **Step 2: Update `.github/workflows/daily-puzzles.yml`**
- [ ] **Step 3: Update `README.md`**
- [ ] **Step 4: Verify full test suite and builds**

Run: `npm test && npm run build && npm run build:web`
Expected: 100% tests pass, 0 compile errors.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/cleanup-puzzles.yml .github/workflows/daily-puzzles.yml README.md
git commit -m "ci: add standalone cleanup workflow and integrate tidy pre-step in daily puzzles"
```

---

### Task 5: End-to-End Verification, Whole-Branch Review & Production Deployment

- [ ] **Step 1: Run comprehensive verification**
```bash
npm test && npm run build && npm run build:web
```
- [ ] **Step 2: Dry-run test against live tablet**
Test `npm run cleanup -- --upload --dry-run` to verify live `rmapi` connectivity and ensure that real files tagged `DONE` and stale dailies are detected properly.
- [ ] **Step 3: Conduct whole-branch review**
Dispatch Final Code Reviewer subagent across the feature diff.
- [ ] **Step 4: Request user sign-off and push to production**
Push to `origin/main`.
