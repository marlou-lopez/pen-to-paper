import childProcess from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { DeliveryClient } from './types.js';

export class RmapiDeliveryClient implements DeliveryClient {
  isAvailable(): boolean {
    try {
      childProcess.execSync('which rmapi', { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  async deliver(filename: string, targetFolder: string, buffer: Buffer): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('rmapi CLI is not found on PATH. Install rmapi or use --local mode.');
    }

    // Write buffer to temporary file for upload
    const tempFilePath = path.join(os.tmpdir(), filename);
    await fs.writeFile(tempFilePath, buffer);

    try {
      // Ensure target folders exist (ignore error if exists)
      const folderParts = targetFolder.split('/').filter(Boolean);
      let currentPath = '';
      for (const part of folderParts) {
        currentPath += '/' + part;
        try {
          childProcess.execSync(`rmapi mkdir "${currentPath}"`, { stdio: 'ignore' });
        } catch {
          // Folder already exists or was created
        }
      }

      // Upload file
      childProcess.execSync(`rmapi put "${tempFilePath}" "${targetFolder}"`, { stdio: 'inherit' });
      return `${targetFolder}/${filename}`;
    } finally {
      await fs.unlink(tempFilePath).catch(() => {});
    }
  }
}
