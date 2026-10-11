# Daily Folder Routing & Tablet Archive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Route daily automated puzzles to an active `/Puzzles/Daily` inbox on the reMarkable tablet, pre-create `/Puzzles/Archive/Word Search` and `/Puzzles/Archive/Sudoku` for finished puzzles, and retain default category folder delivery for manual on-demand generations.

**Architecture:** Extend `RmapiDeliveryClient` and `LocalDeliveryClient` to idempotently initialize tablet archive folders; add `--daily` and `--folder` routing options to `runGenerator` and `cli.ts`; update GitHub Actions daily schedule and `workflow_dispatch` to deliver into `/Puzzles/Daily`.

**Tech Stack:** TypeScript (strict, ES2022), Vitest, child_process (execFileSync), GitHub Actions.

## Global Constraints
- Target reMarkable active inbox: `/Puzzles/Daily`
- Target reMarkable archive paths: `/Puzzles/Archive/Word Search` and `/Puzzles/Archive/Sudoku`
- Manual default targets: `/Puzzles/Word Search` and `/Puzzles/Sudoku`
- All tests in `vitest run` must pass with zero TypeScript errors (`tsc --noEmit` or `npm run build`)
- Use `childProcess.execFileSync` without shell interpolation for rmapi operations

---

### Task 1: Delivery Layer Archive Directory Initialization

**Files:**
- Modify: `src/delivery/rmapi-client.ts:25-45`
- Modify: `src/delivery/local-client.ts:1-25`
- Test: `tests/delivery/clients.test.ts:60-96`

**Interfaces:**
- Consumes: `DeliveryClient` interface in `src/delivery/types.ts`
- Produces: `RmapiDeliveryClient.deliver()` and `LocalDeliveryClient.deliver()` pre-creating archive paths `/Puzzles/Archive/Word Search` and `/Puzzles/Archive/Sudoku`

- [ ] **Step 1: Write failing tests in `tests/delivery/clients.test.ts`**

Add tests verifying archive directories are initialized during delivery:

```typescript
  it('RmapiDeliveryClient pre-creates archive folders on delivery', async () => {
    const execCalls: { cmd: string; args: string[] }[] = [];
    vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
      execCalls.push({ cmd, args: args ?? [] });
      return Buffer.from('');
    });

    const client = new RmapiDeliveryClient();
    const buffer = Buffer.from('test-data');
    await client.deliver('Sample.pdf', '/Puzzles/Daily', buffer);

    expect(execCalls).toContainEqual({
      cmd: 'rmapi',
      args: ['mkdir', '/Puzzles/Archive/Word Search'],
    });
    expect(execCalls).toContainEqual({
      cmd: 'rmapi',
      args: ['mkdir', '/Puzzles/Archive/Sudoku'],
    });
  });

  it('LocalDeliveryClient pre-creates archive folders on delivery', async () => {
    const testDir = './test-local-delivery-archive';
    const client = new LocalDeliveryClient(testDir);
    const buffer = Buffer.from('local-data');
    await client.deliver('Test.pdf', '/Puzzles/Daily', buffer);

    const wsArchive = path.join(testDir, 'Puzzles/Archive/Word Search');
    const sudokuArchive = path.join(testDir, 'Puzzles/Archive/Sudoku');
    const wsStat = await fs.stat(wsArchive);
    const sudokuStat = await fs.stat(sudokuArchive);
    expect(wsStat.isDirectory()).toBe(true);
    expect(sudokuStat.isDirectory()).toBe(true);

    await fs.rm(testDir, { recursive: true, force: true });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/delivery/clients.test.ts`
Expected: FAIL because archive folders are not yet created by `deliver()`.

- [ ] **Step 3: Update `LocalDeliveryClient` and `RmapiDeliveryClient`**

In `src/delivery/local-client.ts`:
```typescript
import fs from 'fs/promises';
import path from 'path';
import { DeliveryClient } from './types.js';

export class LocalDeliveryClient implements DeliveryClient {
  constructor(private readonly baseDir: string = './output') {}

  async deliver(filename: string, targetFolder: string, buffer: Buffer): Promise<string> {
    const cleanFolder = targetFolder.replace(/^\/+/, '').replace(/\/+$/, '');
    const fullDirPath = path.join(this.baseDir, cleanFolder);
    await fs.mkdir(fullDirPath, { recursive: true });

    // Pre-create standard archive folders
    await fs.mkdir(path.join(this.baseDir, 'Puzzles/Archive/Word Search'), { recursive: true });
    await fs.mkdir(path.join(this.baseDir, 'Puzzles/Archive/Sudoku'), { recursive: true });

    const filePath = path.join(fullDirPath, filename);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }
}
```

In `src/delivery/rmapi-client.ts`:
Before uploading, ensure archive directories are created:
```typescript
      // Ensure target folders exist (ignore error if exists)
      const folderParts = cleanTargetFolder.split('/').filter(Boolean);
      let currentPath = '';
      for (const part of folderParts) {
        currentPath += '/' + part;
        try {
          childProcess.execFileSync('rmapi', ['mkdir', currentPath], { stdio: 'ignore' });
        } catch {}
      }

      // Pre-create archive folders
      const archiveFolders = ['/Puzzles/Archive', '/Puzzles/Archive/Word Search', '/Puzzles/Archive/Sudoku'];
      for (const archivePath of archiveFolders) {
        try {
          childProcess.execFileSync('rmapi', ['mkdir', archivePath], { stdio: 'ignore' });
        } catch {}
      }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/delivery/clients.test.ts`
Expected: PASS (all tests pass).

- [ ] **Step 5: Commit**

```bash
git add src/delivery/ tests/delivery/
git commit -m "feat(delivery): pre-create tablet archive folders during delivery"
```

---

### Task 2: Daily Inbox & Target Folder Routing in Orchestrator & CLI

**Files:**
- Modify: `src/index.ts:9-70`
- Modify: `src/cli.ts:1-50`
- Test: `tests/cli.test.ts:20-65`

**Interfaces:**
- Consumes: `RunOptions.daily?: boolean`, `RunOptions.folder?: string`
- Produces: `runGenerator()` routing puzzles to `/Puzzles/Daily` when `options.daily === true`, or `options.folder` when specified.

- [ ] **Step 1: Write failing tests in `tests/cli.test.ts`**

Add tests verifying folder routing:

```typescript
  it('routes to /Puzzles/Daily when daily option is true', async () => {
    const results = await runGenerator({
      type: 'word-search',
      daily: true,
      outputDir: './test-cli-output',
    });

    expect(results).toHaveLength(1);
    expect(results[0].deliveredPath).toContain('Puzzles/Daily');
  });

  it('routes to custom folder when folder option is provided', async () => {
    const results = await runGenerator({
      type: 'sudoku',
      folder: '/Puzzles/CustomTesting',
      outputDir: './test-cli-output',
    });

    expect(results).toHaveLength(1);
    expect(results[0].deliveredPath).toContain('Puzzles/CustomTesting');
  });

  it('routes to default category folder when daily is false or omitted', async () => {
    const results = await runGenerator({
      type: 'word-search',
      daily: false,
      outputDir: './test-cli-output',
    });

    expect(results).toHaveLength(1);
    expect(results[0].deliveredPath).toContain('Puzzles/Word Search');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/cli.test.ts`
Expected: FAIL because `daily` and `folder` are not yet handled in `RunOptions` / `runGenerator`.

- [ ] **Step 3: Update `src/index.ts` and `src/cli.ts`**

In `src/index.ts`:
Update `RunOptions`:
```typescript
export interface RunOptions {
  type?: 'all' | 'word-search' | 'sudoku';
  difficulty?: string;
  theme?: string;
  date?: string;
  upload?: boolean;
  outputDir?: string;
  daily?: boolean;
  folder?: string;
}
```

In `runGenerator()` delivery loop:
```typescript
    const targetFolder = options.folder ?? (options.daily ? '/Puzzles/Daily' : puzzle.metadata.targetFolder);
    console.log(`Delivering ${puzzle.filename} to ${targetFolder}...`);
    const deliveredPath = await deliveryClient.deliver(puzzle.filename, targetFolder, pdfBuffer);
```

In `src/cli.ts`:
Parse `--daily` and `--folder`:
```typescript
    if (arg === '--daily') {
      options.daily = true;
    } else if (arg.startsWith('--folder=')) {
      options.folder = arg.slice(arg.indexOf('=') + 1);
    }
```
Update console header in `cli.ts`:
```typescript
  console.log(`Type: ${options.type || 'all'} | Difficulty: ${options.difficulty || 'auto'} | Daily: ${Boolean(options.daily)} | Upload: ${Boolean(options.upload)}`);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/cli.test.ts`
Expected: PASS.

- [ ] **Step 5: Run full test suite and build check**

Run: `npm test && npm run build`
Expected: 100% tests pass, TypeScript compilation clean.

- [ ] **Step 6: Commit**

```bash
git add src/index.ts src/cli.ts tests/cli.test.ts
git commit -m "feat(orchestrator): support --daily inbox routing and --folder override"
```

---

### Task 3: GitHub Actions Automation & Documentation Updates

**Files:**
- Modify: `.github/workflows/daily-puzzles.yml:1-79`
- Modify: `README.md:1-55`

**Interfaces:**
- Consumes: GitHub Actions scheduled cron & workflow_dispatch
- Produces: Daily cron workflow executing with `--daily`, `workflow_dispatch` accepting `is_daily` input.

- [ ] **Step 1: Update `.github/workflows/daily-puzzles.yml`**

Add `is_daily` input to `workflow_dispatch`:
```yaml
      is_daily:
        description: 'Deliver to /Puzzles/Daily (true) or Category folders (false)'
        type: boolean
        required: false
        default: true
```

In `Run puzzle generation & upload` step:
```yaml
      - name: Run puzzle generation & upload
        run: |
          THEME_PARAM="${{ inputs.word_search_theme }}"
          THEME_FLAG=""
          if [ -n "$THEME_PARAM" ]; then
            THEME_FLAG="--theme=$THEME_PARAM"
          fi

          DAILY_FLAG=""
          if [ "${{ github.event_name }}" = "schedule" ] || [ "${{ inputs.is_daily }}" != "false" ]; then
            DAILY_FLAG="--daily"
          fi

          npm run generate -- \
            --type=${{ inputs.puzzle_type || 'all' }} \
            --difficulty=${{ inputs.sudoku_difficulty || 'random' }} \
            $THEME_FLAG \
            $DAILY_FLAG \
            --upload
```

- [ ] **Step 2: Update `README.md`**

Add documentation for:
- `/Puzzles/Daily/` inbox and `/Puzzles/Archive/` workflow.
- CLI options: `--daily` and `--folder=<path>`.
- Updated webhook JSON body example:
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

- [ ] **Step 3: Verify build and test suite**

Run: `npm test && npm run build`
Expected: PASS.

- [ ] **Step 4: Commit and push**

```bash
git add .github/workflows/daily-puzzles.yml README.md
git commit -m "feat(ci): route daily scheduled runs to /Puzzles/Daily and document archive workflow"
git push origin main
```
