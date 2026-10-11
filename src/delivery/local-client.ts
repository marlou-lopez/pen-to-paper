import fs from 'fs/promises';
import path from 'path';
import { DeliveryClient } from './types.js';

export class LocalDeliveryClient implements DeliveryClient {
  constructor(private baseDir = './output') {}

  async deliver(filename: string, targetFolder: string, buffer: Buffer): Promise<string> {
    const sanitizedFolder = targetFolder.replace(/^\/+/, '');
    const fullDirPath = path.join(this.baseDir, sanitizedFolder);
    await fs.mkdir(fullDirPath, { recursive: true });

    const fullFilePath = path.join(fullDirPath, filename);
    await fs.writeFile(fullFilePath, buffer);
    return fullFilePath;
  }
}
