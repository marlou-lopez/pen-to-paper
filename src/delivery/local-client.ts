import fs from 'fs/promises';
import path from 'path';
import { CleanupClient, RemoteDocument } from './types.js';

export class LocalDeliveryClient implements CleanupClient {
  constructor(private readonly baseDir: string = './output') {}

  get outputDir(): string {
    return this.baseDir;
  }

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
    await fs.mkdir(path.join(this.baseDir, 'Puzzles/Archive/Futoshiki'), { recursive: true });

    const filePath = path.join(fullDirPath, filename);
    await fs.writeFile(filePath, buffer);
    return filePath;
  }

  async listDocuments(folder: string, recursive = true): Promise<RemoteDocument[]> {
    const cleanFolder = folder.replace(/^\/+/, '').replace(/\/+$/, '');
    const scanDir = path.join(this.baseDir, cleanFolder);

    try {
      const stat = await fs.stat(scanDir);
      if (!stat.isDirectory()) {
        return [];
      }
    } catch {
      return [];
    }

    const results: RemoteDocument[] = [];

    const walk = async (currentDir: string): Promise<void> => {
      let entries;
      try {
        entries = await fs.readdir(currentDir, { withFileTypes: true });
      } catch {
        return;
      }

      for (const entry of entries) {
        const fullEntryPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          if (recursive) {
            await walk(fullEntryPath);
          }
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
          const baseNameWithoutExt = entry.name.replace(/\.pdf$/i, '');
          const relDir = path.relative(this.baseDir, currentDir);
          const normalizedFolder = relDir ? '/' + relDir.split(path.sep).join('/') : '/';
          const docPath =
            normalizedFolder === '/' ? `/${baseNameWithoutExt}` : `${normalizedFolder}/${baseNameWithoutExt}`;

          const tags: string[] = [];
          if (/\[DONE\]/i.test(entry.name)) {
            tags.push('DONE');
          }

          const sidecarCandidates = [
            `${fullEntryPath}.json`,
            path.join(currentDir, `${baseNameWithoutExt}.json`),
          ];
          for (const sidecarPath of sidecarCandidates) {
            try {
              const scStat = await fs.stat(sidecarPath);
              if (scStat.isFile()) {
                const content = await fs.readFile(sidecarPath, 'utf-8');
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed.tags)) {
                  for (const t of parsed.tags) {
                    if (typeof t === 'string' && !tags.includes(t)) {
                      tags.push(t);
                    }
                  }
                }
                break;
              }
            } catch {}
          }

          results.push({
            name: baseNameWithoutExt,
            path: docPath,
            folder: normalizedFolder,
            tags,
          });
        }
      }
    };

    await walk(scanDir);
    return results;
  }

  async moveDocument(sourcePath: string, destinationFolder: string): Promise<void> {
    const cleanSource = sourcePath.replace(/^\/+/, '');
    let fullSourcePath = path.join(this.baseDir, cleanSource);

    try {
      await fs.stat(fullSourcePath);
    } catch {
      if (!fullSourcePath.toLowerCase().endsWith('.pdf')) {
        fullSourcePath += '.pdf';
        await fs.stat(fullSourcePath);
      } else {
        throw new Error(`Source file not found: ${sourcePath}`);
      }
    }

    const cleanDestFolder = destinationFolder.replace(/^\/+/, '').replace(/\/+$/, '');
    const targetDir = path.join(this.baseDir, cleanDestFolder);
    await fs.mkdir(targetDir, { recursive: true });

    const fileName = path.basename(fullSourcePath);
    const targetFilePath = path.join(targetDir, fileName);

    try {
      await fs.rename(fullSourcePath, targetFilePath);
    } catch (err: any) {
      if (err?.code === 'EXDEV') {
        await fs.copyFile(fullSourcePath, targetFilePath);
        await fs.unlink(fullSourcePath);
      } else {
        throw err;
      }
    }

    const baseNameWithoutExt = fileName.replace(/\.pdf$/i, '');
    const sourceDir = path.dirname(fullSourcePath);
    const sidecarCandidates = [
      `${fullSourcePath}.json`,
      path.join(sourceDir, `${baseNameWithoutExt}.json`),
    ];
    for (const sc of sidecarCandidates) {
      try {
        const scStat = await fs.stat(sc);
        if (scStat.isFile()) {
          const destSc = path.join(targetDir, path.basename(sc));
          try {
            await fs.rename(sc, destSc);
          } catch {
            await fs.copyFile(sc, destSc);
            await fs.unlink(sc);
          }
          break;
        }
      } catch {}
    }
  }
}
