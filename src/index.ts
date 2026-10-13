import { createDefaultRegistry, PuzzleRegistry } from './core/registry.js';
import { WordSearchGenerator } from './puzzles/word-search/index.js';
import { SudokuGenerator } from './puzzles/sudoku/index.js';
import { MiniCrosswordGenerator } from './puzzles/mini-crossword/index.js';
import { KenKenGenerator } from './puzzles/kenken/index.js';
import { KakuroGenerator } from './puzzles/kakuro/index.js';
import { LocalDeliveryClient } from './delivery/local-client.js';
import { RmapiDeliveryClient } from './delivery/rmapi-client.js';
import { DeliveryClient } from './delivery/types.js';
import { GeneratedPuzzle, PuzzleType } from './core/types.js';

export * from './puzzles/kenken/index.js';
export * from './puzzles/kakuro/index.js';

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

export const orchestrator = {
  runGenerator,
  createRegistry,
};
