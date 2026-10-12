import childProcess from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { DeliveryClient } from './types.js';

export class RmapiDeliveryClient implements DeliveryClient {
  isAvailable(): boolean {
    try {
      childProcess.execFileSync('which', ['rmapi'], { stdio: 'ignore' });
      return true;
    } catch {
      return false;
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
      const archiveFolders = ['/Puzzles', '/Puzzles/Archive', '/Puzzles/Archive/Word Search', '/Puzzles/Archive/Sudoku', '/Puzzles/Archive/Mini Crossword'];
      for (const archivePath of archiveFolders) {
        try {
          childProcess.execFileSync('rmapi', ['mkdir', archivePath], { stdio: 'ignore' });
        } catch {}
      }

      // Upload file (use --force to overwrite if file already exists)
      childProcess.execFileSync('rmapi', ['put', '--force', tempFilePath, cleanTargetFolder], { stdio: 'inherit' });
      return `${cleanTargetFolder}/${filename}`;
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
