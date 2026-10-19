import { CleanupClient, RemoteDocument } from './types.js';

export interface CleanupOptions {
  client: CleanupClient;
  retentionDays?: number; // default: 2
  dryRun?: boolean;       // default: false
  referenceDate?: string; // YYYY-MM-DD for deterministic testing (defaults to UTC today)
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

export function getPuzzleCategory(name: string): string {
  const clean = name.replace(/^\[DONE\]\s*/i, '');
  if (/^Word[_\s-]?Search[_\s-]/i.test(clean)) return 'Word Search';
  if (/^Sudoku[_\s-]/i.test(clean)) return 'Sudoku';
  if (/^Mini[_\s-]?Crossword[_\s-]/i.test(clean)) return 'Mini Crossword';
  if (/^KenKen[_\s-]/i.test(clean)) return 'KenKen';
  if (/^Kakuro[_\s-]/i.test(clean)) return 'Kakuro';
  if (/^Futoshiki[_\s-]/i.test(clean)) return 'Futoshiki';
  return 'Other';
}

export function isCompleted(doc: RemoteDocument): boolean {
  if (doc.tags?.some((t) => typeof t === 'string' && /^done$/i.test(t.trim()))) return true;
  if (/^\[DONE\]/i.test(doc.name)) return true;
  return false;
}

export function extractPuzzleDate(filename: string): string | null {
  const match = filename.match(/(?:^|\D)(\d{4}-\d{2}-\d{2})(?:\D|$)/);
  return match ? match[1] : null;
}

export function isStaleDaily(filename: string, retentionDays = 2, referenceDate?: string): boolean {
  const dateStr = extractPuzzleDate(filename);
  if (!dateStr) return false;
  const puzzleDate = new Date(`${dateStr}T00:00:00Z`).getTime();
  if (Number.isNaN(puzzleDate)) return false;
  const todayDate = referenceDate
    ? new Date(`${referenceDate}T00:00:00Z`).getTime()
    : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z').getTime();

  const diffDays = Math.floor((todayDate - puzzleDate) / (1000 * 60 * 60 * 24));
  return diffDays >= retentionDays;
}

export async function cleanupPuzzles(options: CleanupOptions): Promise<CleanupSummary> {
  const retentionDays = options.retentionDays ?? 2;
  const dryRun = options.dryRun ?? false;

  const summary: CleanupSummary = {
    archived: [],
    staleMoved: [],
    skipped: [],
  };

  const allDocs = await options.client.listDocuments('/Puzzles', true);
  const handledPaths = new Set<string>();

  // Pass 1: Archive Completed Puzzles
  for (const doc of allDocs) {
    if (!isCompleted(doc)) {
      continue;
    }

    const cleanFolder = doc.folder.replace(/^\/+/, '').replace(/\/+$/, '');
    const normalizedFolder = cleanFolder ? `/${cleanFolder}` : '/';

    if (normalizedFolder === '/Puzzles/Archive' || normalizedFolder.startsWith('/Puzzles/Archive/')) {
      summary.skipped.push({ name: doc.name, reason: 'Already in archive' });
      handledPaths.add(doc.path);
      continue;
    }

    const category = getPuzzleCategory(doc.name);
    const destFolder = `/Puzzles/Archive/${category}`;

    try {
      if (!dryRun) {
        await options.client.moveDocument(doc.path, destFolder);
      }
      summary.archived.push({ name: doc.name, from: doc.folder, to: destFolder });
    } catch (err: any) {
      console.error(`Failed to archive ${doc.name}: ${err?.message ?? err}`);
      summary.skipped.push({ name: doc.name, reason: `Move failed: ${err?.message ?? err}` });
    }
    handledPaths.add(doc.path);
  }

  // Pass 2: Sweep Stale Dailies
  for (const doc of allDocs) {
    const cleanFolder = doc.folder.replace(/^\/+/, '').replace(/\/+$/, '');
    const normalizedFolder = cleanFolder ? `/${cleanFolder}` : '/';

    if (normalizedFolder !== '/Puzzles/Daily') {
      continue;
    }

    if (handledPaths.has(doc.path) || isCompleted(doc)) {
      continue;
    }

    if (isStaleDaily(doc.name, retentionDays, options.referenceDate)) {
      const category = getPuzzleCategory(doc.name);
      const destFolder = `/Puzzles/${category}`;

      try {
        if (!dryRun) {
          await options.client.moveDocument(doc.path, destFolder);
        }
        summary.staleMoved.push({ name: doc.name, from: doc.folder, to: destFolder });
      } catch (err: any) {
        console.error(`Failed to move stale daily ${doc.name}: ${err?.message ?? err}`);
        summary.skipped.push({ name: doc.name, reason: `Move failed: ${err?.message ?? err}` });
      }
    } else {
      const reason = extractPuzzleDate(doc.name) ? 'Within retention window' : 'No date in filename';
      summary.skipped.push({ name: doc.name, reason });
    }
  }

  console.log(
    `[CLEANUP] Archived ${summary.archived.length} puzzles, moved ${summary.staleMoved.length} stale dailies`
  );

  return summary;
}
