import { PuzzleGenerator } from './types.js';
import { WordSearchGenerator } from '../puzzles/word-search/index.js';
import { SudokuGenerator } from '../puzzles/sudoku/index.js';
import { MiniCrosswordGenerator } from '../puzzles/mini-crossword/index.js';
import { KenKenGenerator } from '../puzzles/kenken/index.js';
import { KakuroGenerator } from '../puzzles/kakuro/index.js';

export class PuzzleRegistry {
  private generators = new Map<string, PuzzleGenerator<any, any>>();

  register(generator: PuzzleGenerator<any, any>): void {
    this.generators.set(generator.metadata.id, generator);
  }

  get(id: string): PuzzleGenerator<any, any> | undefined {
    return this.generators.get(id);
  }

  getAll(): PuzzleGenerator<any, any>[] {
    return Array.from(this.generators.values());
  }
}

export function createDefaultRegistry(): PuzzleRegistry {
  const registry = new PuzzleRegistry();
  registry.register(new WordSearchGenerator());
  registry.register(new SudokuGenerator());
  registry.register(new MiniCrosswordGenerator());
  registry.register(new KenKenGenerator());
  registry.register(new KakuroGenerator());
  return registry;
}

