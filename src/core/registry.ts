import { PuzzleGenerator } from './types.js';

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
