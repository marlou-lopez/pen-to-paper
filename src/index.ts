import { createDefaultRegistry, PuzzleRegistry } from './core/registry.js';
import { WordSearchGenerator } from './puzzles/word-search/index.js';
import { SudokuGenerator } from './puzzles/sudoku/index.js';
import { MiniCrosswordGenerator } from './puzzles/mini-crossword/index.js';
import { KenKenGenerator } from './puzzles/kenken/index.js';
import { KakuroGenerator } from './puzzles/kakuro/index.js';
import { FutoshikiGenerator } from './puzzles/futoshiki/index.js';
import { LocalDeliveryClient } from './delivery/local-client.js';
import { RmapiDeliveryClient } from './delivery/rmapi-client.js';
import { DeliveryClient, CleanupClient } from './delivery/types.js';
import { GeneratedPuzzle, PuzzleType } from './core/types.js';
import { cleanupPuzzles, CleanupSummary } from './delivery/cleanup.js';

export * from './puzzles/kenken/index.js';
export * from './puzzles/kakuro/index.js';
export * from './puzzles/futoshiki/index.js';
export * from './delivery/cleanup.js';

export interface RunOptions {
  type?: 'all' | PuzzleType;
  difficulty?: string;
  theme?: string;
  date?: string;
  upload?: boolean;
  outputDir?: string;
  daily?: boolean;
  folder?: string;
  grid?: string;
  size?: number;
  local?: boolean;
  cleanup?: boolean;
  days?: number;
  dryRun?: boolean;
}

export interface GeneratedResult<TData = any> {
  puzzle: GeneratedPuzzle<TData>;
  deliveredPath: string;
  type?: string;
  destinationFolder?: string;
  puzzleData?: TData;
}

export function createRegistry(): PuzzleRegistry {
  return createDefaultRegistry();
}

export { createDefaultRegistry };

export async function runGenerator(options: RunOptions = {}): Promise<GeneratedResult[]> {
  const registry = createRegistry();
  const selectedType = (options.grid && !options.type) ? 'sudoku' : (options.type || 'all');

  const generators = selectedType === 'all'
    ? registry.getAll()
    : [registry.get(selectedType)].filter((g): g is NonNullable<typeof g> => Boolean(g));

  if (generators.length === 0) {
    throw new Error(`Unknown puzzle type: ${selectedType}`);
  }

  const rmapi = new RmapiDeliveryClient();
  const rmapiAvailable = rmapi.isAvailable();
  if (options.upload && !rmapiAvailable) {
    console.warn('[WARN] --upload requested but rmapi is not available on PATH; falling back to local delivery.');
  }
  const useRmapi = Boolean(!options.local && options.upload && rmapiAvailable);
  const deliveryClient: DeliveryClient = useRmapi
    ? rmapi
    : new LocalDeliveryClient(options.outputDir || './output');

  const results: GeneratedResult[] = [];

  for (const gen of generators) {
    console.log(`Generating ${gen.metadata.displayName}...`);
    const puzzle = await gen.generate({
      date: options.date,
      difficulty: options.difficulty,
      theme: options.theme,
      grid: options.grid,
      size: options.size,
    });

    const pdfBuffer = ('buffer' in puzzle && Buffer.isBuffer((puzzle as any).buffer))
      ? (puzzle as any).buffer
      : await gen.renderPdf(puzzle);

    const targetFolder = options.folder ?? (options.daily ? '/Puzzles/Daily' : puzzle.metadata.targetFolder);
    console.log(`Delivering ${puzzle.filename} to ${targetFolder}...`);
    const deliveredPath = await deliveryClient.deliver(puzzle.filename, targetFolder, pdfBuffer);

    results.push({
      puzzle,
      deliveredPath,
      type: puzzle.metadata.id,
      destinationFolder: targetFolder,
      puzzleData: puzzle.puzzleData,
    });
  }

  return results;
}

export async function runCleanup(options: RunOptions = {}): Promise<CleanupSummary> {
  const rmapi = new RmapiDeliveryClient();
  const rmapiAvailable = rmapi.isAvailable();
  if (options.upload && !rmapiAvailable) {
    console.warn('[WARN] --upload requested but rmapi is not available on PATH; falling back to local delivery.');
  }
  const useRmapi = Boolean(!options.local && options.upload && rmapiAvailable);
  const client: CleanupClient = useRmapi
    ? rmapi
    : new LocalDeliveryClient(options.outputDir || './output');

  return cleanupPuzzles({
    client,
    retentionDays: options.days ?? 2,
    dryRun: options.dryRun ?? false,
    referenceDate: options.date,
  });
}

export const orchestrator = {
  runGenerator,
  runCleanup,
  createRegistry,
};

