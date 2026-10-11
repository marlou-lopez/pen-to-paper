import { PuzzleGenerator } from './types.js';

export class PuzzleRegistry {
  private generators = new Map<string, PuzzleGenerator>();

  register(generator: PuzzleGenerator): void {
    this.generators.set(generator.metadata.id, generator);
  }

  get(id: string): PuzzleGenerator | undefined {
    return this.generators.get(id);
  }

  getAll(): PuzzleGenerator[] {
    return Array.from(this.generators.values());
  }
}
