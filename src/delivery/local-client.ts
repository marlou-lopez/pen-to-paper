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
    await fs.mkdir(path.join(this.baseDir, 'Puzzles/Archive/Mini Crossword'), { recursive: true });
    await fs.mkdir(path.join(this.baseDir, 'Puzzles/Archive/KenKen'), { recursive: true });
    await fs.mkdir(path.join(this.baseDir, 'Puzzles/Archive/Kakuro'), { recursive: true });

    const filePath = path.join(fullDirPath, filename);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }
}
