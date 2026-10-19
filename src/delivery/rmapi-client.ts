import childProcess from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { CleanupClient, RemoteDocument } from './types.js';

export interface RmapiClientOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  throttleMs?: number;
}

interface RmapiCollection {
  id: string;
  name: string;
  parent?: string;
}

interface RmapiEntry {
  id?: string;
  name: string;
  type: string;
  parent?: string;
  tags?: string[];
}

export class RmapiDeliveryClient implements CleanupClient {
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
    const parts = folderPath.split('/').filter(Boolean);
    let currentPath = '';
    for (const part of parts) {
      currentPath += '/' + part;
      if (this.ensuredFolders.has(currentPath)) {
        continue;
      }
      try {
        childProcess.execFileSync('rmapi', ['mkdir', currentPath], { stdio: 'ignore' });
      } catch {}
      this.ensuredFolders.add(currentPath);
    }
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
        console.warn(
          `[WARN] rmapi put failed (attempt ${attempt}/${this.options.maxRetries}): ${err?.message || err}. Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= this.options.backoffFactor;
      }
    }
  }

  private async execMvWithRetry(sourcePath: string, destinationFolder: string): Promise<void> {
    let delay = this.options.initialDelayMs;
    for (let attempt = 1; attempt <= this.options.maxRetries; attempt++) {
      try {
        childProcess.execFileSync('rmapi', ['mv', sourcePath, destinationFolder], { stdio: 'inherit' });
        return;
      } catch (err: any) {
        if (attempt >= this.options.maxRetries) {
          throw err;
        }
        console.warn(
          `[WARN] rmapi mv failed (attempt ${attempt}/${this.options.maxRetries}): ${err?.message || err}. Retrying in ${delay}ms...`
        );
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

  async listDocuments(folder: string, recursive = true): Promise<RemoteDocument[]> {
    if (!this.isAvailable()) {
      return [];
    }

    const rawClean = folder.replace(/^\/+/, '').replace(/\/+$/, '');
    const cleanFolder = rawClean ? '/' + rawClean : '/';

    try {
      const output = childProcess.execFileSync('rmapi', ['-json', recursive ? 'find' : 'ls', cleanFolder], {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });

      const raw = output ? output.toString().trim() : '';
      if (!raw) {
        return [];
      }

      const entries: RmapiEntry[] = JSON.parse(raw);
      if (!Array.isArray(entries)) {
        return [];
      }

      const collectionsById = new Map<string, RmapiCollection>();
      for (const entry of entries) {
        if (entry.type === 'CollectionType' && entry.id) {
          collectionsById.set(entry.id, {
            id: entry.id,
            name: entry.name,
            parent: entry.parent,
          });
        }
      }

      const resolveFolder = (entryParentId?: string): string => {
        if (!entryParentId) {
          return cleanFolder;
        }

        const parts: string[] = [];
        let curId: string | undefined = entryParentId;
        const visited = new Set<string>();

        while (curId && collectionsById.has(curId) && !visited.has(curId)) {
          visited.add(curId);
          const coll: RmapiCollection | undefined = collectionsById.get(curId);
          if (!coll) {
            break;
          }
          parts.unshift(coll.name);
          curId = coll.parent;
        }

        if (parts.length === 0) {
          return cleanFolder;
        }

        const cleanParts = cleanFolder.split('/').filter(Boolean);

        // Case A: parts starts with the root segment of cleanFolder
        if (cleanParts.length > 0 && parts[0] === cleanParts[0]) {
          return '/' + parts.join('/');
        }

        // Case B: overlap between cleanParts and parts
        for (let i = 0; i < cleanParts.length; i++) {
          const cleanSuffix = cleanParts.slice(i);
          let match = true;
          for (let j = 0; j < cleanSuffix.length; j++) {
            if (j >= parts.length || cleanSuffix[j] !== parts[j]) {
              match = false;
              break;
            }
          }
          if (match) {
            const merged = cleanParts.slice(0, i).concat(parts);
            return '/' + merged.join('/');
          }
        }

        // Case C: parts are strictly child directories
        if (cleanParts.length === 0) {
          return '/' + parts.join('/');
        }
        return '/' + cleanParts.concat(parts).join('/');
      };

      const documents: RemoteDocument[] = [];
      for (const entry of entries) {
        if (entry.type === 'DocumentType') {
          const docFolder = resolveFolder(entry.parent);
          const docName = entry.name.replace(/\.pdf$/i, '');
          const docPath = docFolder === '/' ? `/${docName}` : `${docFolder}/${docName}`;
          documents.push({
            id: entry.id,
            name: docName,
            path: docPath,
            folder: docFolder,
            tags: Array.isArray(entry.tags) ? entry.tags : [],
          });
        }
      }

      return documents;
    } catch {
      return [];
    }
  }

  async moveDocument(sourcePath: string, destinationFolder: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('rmapi CLI is not found on PATH. Install rmapi or use --local mode.');
    }

    const cleanSource = '/' + sourcePath.replace(/^\/+/, '');
    const cleanDestFolder = '/' + destinationFolder.replace(/^\/+/, '').replace(/\/+$/, '');

    this.ensureFolder(cleanDestFolder);
    await this.execMvWithRetry(cleanSource, cleanDestFolder);
  }
}
