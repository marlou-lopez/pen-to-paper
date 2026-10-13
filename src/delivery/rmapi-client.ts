import childProcess from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { DeliveryClient } from './types.js';

export interface RmapiClientOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  throttleMs?: number;
}

export class RmapiDeliveryClient implements DeliveryClient {
  private ensuredFolders: Set<string> = new Set();
  private lastUploadTime: number = 0;
  private options: Required<RmapiClientOptions>;

  constructor(options?: RmapiClientOptions) {
    this.options = {
      maxRetries: options?.maxRetries ?? 3,
      initialDelayMs: options?.initialDelayMs ?? 2000,
      backoffFactor: options?.backoffFactor ?? 2,
      throttleMs: options?.throttleMs ?? 1000,
    };
  }

  isAvailable(): boolean {
    try {
      childProcess.execFileSync('which', ['rmapi'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  resetFolderCache(): void {
    this.ensuredFolders.clear();
  }

  private ensureFolder(folderPath: string): void {
    if (this.ensuredFolders.has(folderPath)) {
      return;
    }
    try {
      childProcess.execFileSync('rmapi', ['mkdir', folderPath], { stdio: 'ignore' });
    } catch {}
    this.ensuredFolders.add(folderPath);
  }

  private async execPutWithRetry(tempFilePath: string, cleanTargetFolder: string): Promise<void> {
    if (this.options.throttleMs > 0 && this.lastUploadTime > 0) {
      const elapsed = Date.now() - this.lastUploadTime;
      if (elapsed < this.options.throttleMs) {
        await new Promise((resolve) => setTimeout(resolve, this.options.throttleMs - elapsed));
      }
    }

    let delay = this.options.initialDelayMs;
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        childProcess.execFileSync('rmapi', ['put', '--force', tempFilePath, cleanTargetFolder], { stdio: 'inherit' });
        this.lastUploadTime = Date.now();
        return;
      } catch (err: any) {
        if (attempt >= this.options.maxRetries) {
          throw err;
        }
        console.warn(`[WARN] rmapi put failed (attempt ${attempt}/${this.options.maxRetries}): ${err?.message || err}. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= this.options.backoffFactor;
      }
    }
  }

  async deliver(filename: string, targetFolder: string, buffer: Buffer): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('rmapi CLI is not found on PATH. Install rmapi or use --local mode.');
    }

    const cleanTargetFolder = targetFolder.replace(/\/+$/, '');
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rmapi-'));
    const tempFilePath = path.join(tempDir, filename);

    try {
      await fs.writeFile(tempFilePath, buffer);

      // Ensure target folders exist (cached per client instance)
      const folderParts = cleanTargetFolder.split('/').filter(Boolean);
      let currentPath = '';
      for (const part of folderParts) {
        currentPath += '/' + part;
        this.ensureFolder(currentPath);
      }

      // Pre-create archive folders (cached per client instance)
      const archiveFolders = [
        '/Puzzles',
        '/Puzzles/Archive',
        '/Puzzles/Archive/Word Search',
        '/Puzzles/Archive/Sudoku',
        '/Puzzles/Archive/Mini Crossword',
        '/Puzzles/Archive/KenKen',
        '/Puzzles/Archive/Kakuro',
        '/Puzzles/Archive/Futoshiki',
      ];
      for (const archivePath of archiveFolders) {
        this.ensureFolder(archivePath);
      }

      // Upload file with retry and backoff (use --force to overwrite if file already exists)
      await this.execPutWithRetry(tempFilePath, cleanTargetFolder);
      return `${cleanTargetFolder}/${filename}`;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
