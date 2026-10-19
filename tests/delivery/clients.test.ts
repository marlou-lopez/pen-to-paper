import { describe, it, expect, vi, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import childProcess from 'child_process';
import { LocalDeliveryClient } from '../../src/delivery/local-client.js';
import { RmapiDeliveryClient } from '../../src/delivery/rmapi-client.js';

describe('Delivery Clients', () => {
  const testDir = path.join(__dirname, '../../test-output');

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('LocalDeliveryClient writes PDF to configured directory', async () => {
    const client = new LocalDeliveryClient(testDir);
    const buffer = Buffer.from('test-pdf-data');
    const savedPath = await client.deliver('Test.pdf', '/Puzzles/Test', buffer);

    expect(savedPath).toContain('Test.pdf');
    const readData = await fs.readFile(savedPath);
    expect(readData.toString()).toBe('test-pdf-data');
  });

  it('LocalDeliveryClient handles folders without leading slashes', async () => {
    const client = new LocalDeliveryClient(testDir);
    const buffer = Buffer.from('test-data-no-slash');
    const savedPath = await client.deliver('Sample.pdf', 'Puzzles/Sub', buffer);

    expect(savedPath).toBe(path.join(testDir, 'Puzzles/Sub', 'Sample.pdf'));
    const readData = await fs.readFile(savedPath);
    expect(readData.toString()).toBe('test-data-no-slash');
  });

  it('RmapiDeliveryClient falls back gracefully when rmapi binary is missing', async () => {
    vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
      if (cmd === 'which' && args?.[0] === 'rmapi') {
        throw new Error('not found');
      }
      return Buffer.from('');
    });

    const client = new RmapiDeliveryClient();
    expect(client.isAvailable()).toBe(false);
  });

  it('RmapiDeliveryClient throws error on deliver when rmapi binary is missing', async () => {
    vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
      if (cmd === 'which' && args?.[0] === 'rmapi') {
        throw new Error('not found');
      }
      return Buffer.from('');
    });

    const client = new RmapiDeliveryClient();
    const buffer = Buffer.from('pdf-bytes');
    await expect(client.deliver('Test.pdf', '/Puzzles/Test', buffer)).rejects.toThrow(
      'rmapi CLI is not found on PATH. Install rmapi or use --local mode.'
    );
  });

  it('RmapiDeliveryClient uploads file and creates remote directories when available', async () => {
    const execCalls: { cmd: string; args: string[] }[] = [];
    vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
      execCalls.push({ cmd, args: args ?? [] });
      return Buffer.from('');
    });

    const client = new RmapiDeliveryClient();
    expect(client.isAvailable()).toBe(true);

    const buffer = Buffer.from('remote-pdf-bytes');
    const remotePath = await client.deliver('Daily.pdf', '/Puzzles/WordSearch/', buffer);

    expect(remotePath).toBe('/Puzzles/WordSearch/Daily.pdf');
    expect(execCalls).toContainEqual({
      cmd: 'rmapi',
      args: ['mkdir', '/Puzzles'],
    });
    expect(execCalls).toContainEqual({
      cmd: 'rmapi',
      args: ['mkdir', '/Puzzles/WordSearch'],
    });
    expect(
      execCalls.some(
        call =>
          call.cmd === 'rmapi' &&
          call.args[0] === 'put' &&
          call.args.includes('--force') &&
          call.args.some(arg => arg.endsWith('Daily.pdf')) &&
          call.args[call.args.length - 1] === '/Puzzles/WordSearch'
      )
    ).toBe(true);
  });

  it('RmapiDeliveryClient pre-creates archive folders on delivery', async () => {
    const execCalls: { cmd: string; args: string[] }[] = [];
    vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
      execCalls.push({ cmd, args: args ?? [] });
      return Buffer.from('');
    });

    const client = new RmapiDeliveryClient();
    const buffer = Buffer.from('test-data');
    await client.deliver('Sample.pdf', '/Puzzles/Daily', buffer);

    expect(execCalls).toContainEqual({
      cmd: 'rmapi',
      args: ['mkdir', '/Puzzles'],
    });
    expect(execCalls).toContainEqual({
      cmd: 'rmapi',
      args: ['mkdir', '/Puzzles/Archive'],
    });
    expect(execCalls).toContainEqual({
      cmd: 'rmapi',
      args: ['mkdir', '/Puzzles/Archive/Word Search'],
    });
    expect(execCalls).toContainEqual({
      cmd: 'rmapi',
      args: ['mkdir', '/Puzzles/Archive/Sudoku'],
    });
    expect(execCalls).toContainEqual({
      cmd: 'rmapi',
      args: ['mkdir', '/Puzzles/Archive/Mini Crossword'],
    });
    expect(execCalls).toContainEqual({
      cmd: 'rmapi',
      args: ['mkdir', '/Puzzles/Archive/KenKen'],
    });
    expect(execCalls).toContainEqual({
      cmd: 'rmapi',
      args: ['mkdir', '/Puzzles/Archive/Kakuro'],
    });
    expect(execCalls).toContainEqual({
      cmd: 'rmapi',
      args: ['mkdir', '/Puzzles/Archive/Futoshiki'],
    });
  });

  it('LocalDeliveryClient pre-creates archive folders on delivery', async () => {
    const testDir = './test-local-delivery-archive';
    const client = new LocalDeliveryClient(testDir);
    const buffer = Buffer.from('local-data');
    try {
      await client.deliver('Test.pdf', '/Puzzles/Daily', buffer);

      const wsArchive = path.join(testDir, 'Puzzles/Archive/Word Search');
      const sudokuArchive = path.join(testDir, 'Puzzles/Archive/Sudoku');
      const miniCrosswordArchive = path.join(testDir, 'Puzzles/Archive/Mini Crossword');
      const kenkenArchive = path.join(testDir, 'Puzzles/Archive/KenKen');
      const kakuroArchive = path.join(testDir, 'Puzzles/Archive/Kakuro');
      const futoshikiArchive = path.join(testDir, 'Puzzles/Archive/Futoshiki');
      const wsStat = await fs.stat(wsArchive);
      const sudokuStat = await fs.stat(sudokuArchive);
      const miniCrosswordStat = await fs.stat(miniCrosswordArchive);
      const kenkenStat = await fs.stat(kenkenArchive);
      const kakuroStat = await fs.stat(kakuroArchive);
      const futoshikiStat = await fs.stat(futoshikiArchive);
      expect(wsStat.isDirectory()).toBe(true);
      expect(sudokuStat.isDirectory()).toBe(true);
      expect(miniCrosswordStat.isDirectory()).toBe(true);
      expect(kenkenStat.isDirectory()).toBe(true);
      expect(kakuroStat.isDirectory()).toBe(true);
      expect(futoshikiStat.isDirectory()).toBe(true);
    } finally {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });

  it('RmapiDeliveryClient caches remote directories and avoids redundant mkdir calls across deliveries', async () => {
    const execCalls: { cmd: string; args: string[] }[] = [];
    vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
      execCalls.push({ cmd, args: args ?? [] });
      return Buffer.from('');
    });

    const client = new RmapiDeliveryClient({ throttleMs: 0 });
    const buffer = Buffer.from('pdf-data');

    await client.deliver('Puzzle1.pdf', '/Puzzles/Daily', buffer);
    const mkdirCallsFirst = execCalls.filter(c => c.cmd === 'rmapi' && c.args[0] === 'mkdir');
    expect(mkdirCallsFirst.length).toBeGreaterThan(0);

    // Second delivery using the same client to the same folder
    await client.deliver('Puzzle2.pdf', '/Puzzles/Daily', buffer);
    const mkdirCallsAfterSecond = execCalls.filter(c => c.cmd === 'rmapi' && c.args[0] === 'mkdir');
    expect(mkdirCallsAfterSecond.length).toBe(mkdirCallsFirst.length);
  });

  it('RmapiDeliveryClient retries put operation with backoff when transient failure occurs', async () => {
    let putAttempts = 0;
    vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
      if (cmd === 'rmapi' && args?.[0] === 'put') {
        putAttempts++;
        if (putAttempts === 1) {
          throw new Error('failed to create user token from device token request failed with status 429');
        }
      }
      return Buffer.from('');
    });

    const client = new RmapiDeliveryClient({ maxRetries: 3, initialDelayMs: 1, backoffFactor: 1, throttleMs: 0 });
    const buffer = Buffer.from('test-retry-data');
    const deliveredPath = await client.deliver('Retry.pdf', '/Puzzles/Daily', buffer);

    expect(deliveredPath).toBe('/Puzzles/Daily/Retry.pdf');
    expect(putAttempts).toBe(2);
  });

  it('RmapiDeliveryClient fails when put retries exceed maxRetries', async () => {
    let putAttempts = 0;
    vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
      if (cmd === 'rmapi' && args?.[0] === 'put') {
        putAttempts++;
        throw new Error('persistent 429 rate limit error');
      }
      return Buffer.from('');
    });

    const client = new RmapiDeliveryClient({ maxRetries: 2, initialDelayMs: 1, backoffFactor: 1, throttleMs: 0 });
    const buffer = Buffer.from('test-fail-data');
    await expect(client.deliver('Fail.pdf', '/Puzzles/Daily', buffer)).rejects.toThrow('persistent 429 rate limit error');
    expect(putAttempts).toBe(2);
  });

  it('RmapiDeliveryClient can reset folder cache via resetFolderCache', async () => {
    const execCalls: { cmd: string; args: string[] }[] = [];
    vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
      execCalls.push({ cmd, args: args ?? [] });
      return Buffer.from('');
    });

    const client = new RmapiDeliveryClient({ throttleMs: 0 });
    const buffer = Buffer.from('pdf-data');

    await client.deliver('Puzzle1.pdf', '/Puzzles/Daily', buffer);
    const firstCount = execCalls.filter(c => c.cmd === 'rmapi' && c.args[0] === 'mkdir').length;

    client.resetFolderCache();
    await client.deliver('Puzzle2.pdf', '/Puzzles/Daily', buffer);
    const secondCount = execCalls.filter(c => c.cmd === 'rmapi' && c.args[0] === 'mkdir').length;
    expect(secondCount).toBe(firstCount * 2);
  });

  describe('LocalDeliveryClient - listDocuments and moveDocument', () => {
    it('lists documents and moves document between folders (with or without .pdf extension)', async () => {
      const tmpRoot = path.join(testDir, 'local-lifecycle');
      const client = new LocalDeliveryClient(tmpRoot);

      await client.deliver('Sudoku_2026-10-12.pdf', '/Puzzles/Daily', Buffer.from('dummy-1'));
      await client.deliver('[DONE] MiniCrossword_2026-10-12.pdf', '/Puzzles/Daily', Buffer.from('dummy-2'));

      // Also create a file with sidecar JSON
      await client.deliver('KenKen_2026-10-12.pdf', '/Puzzles/Daily', Buffer.from('dummy-3'));
      await fs.writeFile(
        path.join(tmpRoot, 'Puzzles/Daily/KenKen_2026-10-12.json'),
        JSON.stringify({ tags: ['DONE', 'FAVORITE'] })
      );

      const docs = await client.listDocuments('/Puzzles/Daily');
      expect(docs).toHaveLength(3);

      const sudokuDoc = docs.find(d => d.name === 'Sudoku_2026-10-12');
      expect(sudokuDoc).toBeDefined();
      expect(sudokuDoc?.folder).toBe('/Puzzles/Daily');
      expect(sudokuDoc?.path).toBe('/Puzzles/Daily/Sudoku_2026-10-12');
      expect(sudokuDoc?.tags).toEqual([]);

      const doneDoc = docs.find(d => d.name === '[DONE] MiniCrossword_2026-10-12');
      expect(doneDoc).toBeDefined();
      expect(doneDoc?.folder).toBe('/Puzzles/Daily');
      expect(doneDoc?.tags).toContain('DONE');

      const kenkenDoc = docs.find(d => d.name === 'KenKen_2026-10-12');
      expect(kenkenDoc).toBeDefined();
      expect(kenkenDoc?.tags).toContain('DONE');
      expect(kenkenDoc?.tags).toContain('FAVORITE');

      // Move document using path with .pdf extension
      await client.moveDocument('/Puzzles/Daily/Sudoku_2026-10-12.pdf', '/Puzzles/Archive/Sudoku');
      const dailyAfterMove = await client.listDocuments('/Puzzles/Daily');
      expect(dailyAfterMove.map(d => d.name)).not.toContain('Sudoku_2026-10-12');

      const sudokuArchive = await client.listDocuments('/Puzzles/Archive/Sudoku');
      expect(sudokuArchive.map(d => d.name)).toContain('Sudoku_2026-10-12');
      expect(sudokuArchive[0].folder).toBe('/Puzzles/Archive/Sudoku');

      // Move document using path without .pdf extension, along with its sidecar JSON
      await client.moveDocument('/Puzzles/Daily/KenKen_2026-10-12', '/Puzzles/Archive/KenKen');
      const kenkenArchive = await client.listDocuments('/Puzzles/Archive/KenKen');
      expect(kenkenArchive.map(d => d.name)).toContain('KenKen_2026-10-12');
      expect(kenkenArchive[0].tags).toContain('DONE');
      const sidecarExists = await fs
        .stat(path.join(tmpRoot, 'Puzzles/Archive/KenKen/KenKen_2026-10-12.json'))
        .then(() => true)
        .catch(() => false);
      expect(sidecarExists).toBe(true);
    });

    it('returns empty array when listing a non-existent folder', async () => {
      const client = new LocalDeliveryClient(testDir);
      const docs = await client.listDocuments('/NonExistent/Folder');
      expect(docs).toEqual([]);
    });

    it('supports shallow listing when recursive is false', async () => {
      const tmpRoot = path.join(testDir, 'shallow-test');
      const client = new LocalDeliveryClient(tmpRoot);

      await client.deliver('RootDoc.pdf', '/Puzzles', Buffer.from('data'));
      await client.deliver('NestedDoc.pdf', '/Puzzles/Daily', Buffer.from('data'));

      const shallowDocs = await client.listDocuments('/Puzzles', false);
      expect(shallowDocs.map(d => d.name)).toEqual(['RootDoc']);

      const recursiveDocs = await client.listDocuments('/Puzzles', true);
      expect(recursiveDocs.map(d => d.name).sort()).toEqual(['NestedDoc', 'RootDoc']);
    });

    it('throws error when moving a non-existent file', async () => {
      const client = new LocalDeliveryClient(testDir);
      await expect(client.moveDocument('/Puzzles/Daily/Missing.pdf', '/Puzzles/Archive/Sudoku')).rejects.toThrow();
    });
  });

  describe('RmapiDeliveryClient - listDocuments and moveDocument', () => {
    it('parses rmapi -json find output into RemoteDocument objects with resolved folders and tags', async () => {
      const rmapiFindOutput = [
        { id: 'root-id', name: 'Puzzles', type: 'CollectionType', parent: '' },
        { id: 'daily-id', name: 'Daily', type: 'CollectionType', parent: 'root-id' },
        { id: 'archive-id', name: 'Archive', type: 'CollectionType', parent: 'root-id' },
        { id: 'sudoku-archive-id', name: 'Sudoku', type: 'CollectionType', parent: 'archive-id' },
        {
          id: 'doc-1',
          name: 'Sudoku_Medium_2026-10-13',
          type: 'DocumentType',
          parent: 'daily-id',
          tags: ['DONE'],
        },
        {
          id: 'doc-2',
          name: '[DONE] MiniCrossword_2026-10-13',
          type: 'DocumentType',
          parent: 'daily-id',
        },
        {
          id: 'doc-3',
          name: 'Sudoku_Old_2026-10-01',
          type: 'DocumentType',
          parent: 'sudoku-archive-id',
          tags: [],
        },
      ];

      const execCalls: { cmd: string; args: string[] }[] = [];
      vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
        execCalls.push({ cmd, args: args ?? [] });
        if (cmd === 'which' && args?.[0] === 'rmapi') {
          return Buffer.from('/usr/local/bin/rmapi');
        }
        if (cmd === 'rmapi' && args?.[0] === '-json' && args?.[1] === 'find') {
          return Buffer.from(JSON.stringify(rmapiFindOutput));
        }
        return Buffer.from('');
      });

      const client = new RmapiDeliveryClient();
      const docs = await client.listDocuments('/Puzzles');

      expect(execCalls).toContainEqual({
        cmd: 'rmapi',
        args: ['-json', 'find', '/Puzzles'],
      });

      expect(docs).toHaveLength(3);

      const doc1 = docs.find(d => d.id === 'doc-1');
      expect(doc1).toEqual({
        id: 'doc-1',
        name: 'Sudoku_Medium_2026-10-13',
        path: '/Puzzles/Daily/Sudoku_Medium_2026-10-13',
        folder: '/Puzzles/Daily',
        tags: ['DONE'],
      });

      const doc2 = docs.find(d => d.id === 'doc-2');
      expect(doc2).toEqual({
        id: 'doc-2',
        name: '[DONE] MiniCrossword_2026-10-13',
        path: '/Puzzles/Daily/[DONE] MiniCrossword_2026-10-13',
        folder: '/Puzzles/Daily',
        tags: [],
      });

      const doc3 = docs.find(d => d.id === 'doc-3');
      expect(doc3).toEqual({
        id: 'doc-3',
        name: 'Sudoku_Old_2026-10-01',
        path: '/Puzzles/Archive/Sudoku/Sudoku_Old_2026-10-01',
        folder: '/Puzzles/Archive/Sudoku',
        tags: [],
      });
    });

    it('uses rmapi -json ls when recursive is false', async () => {
      const execCalls: { cmd: string; args: string[] }[] = [];
      vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
        execCalls.push({ cmd, args: args ?? [] });
        if (cmd === 'which' && args?.[0] === 'rmapi') return Buffer.from('/usr/local/bin/rmapi');
        if (cmd === 'rmapi' && args?.[0] === '-json' && args?.[1] === 'ls') {
          return Buffer.from(JSON.stringify([{ id: 'd1', name: 'Doc1', type: 'DocumentType', parent: '' }]));
        }
        return Buffer.from('');
      });

      const client = new RmapiDeliveryClient();
      const docs = await client.listDocuments('/Puzzles/Daily', false);

      expect(execCalls).toContainEqual({
        cmd: 'rmapi',
        args: ['-json', 'ls', '/Puzzles/Daily'],
      });
      expect(docs).toHaveLength(1);
      expect(docs[0].folder).toBe('/Puzzles/Daily');
      expect(docs[0].path).toBe('/Puzzles/Daily/Doc1');
    });

    it('returns empty array if rmapi find command fails or outputs invalid json', async () => {
      vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
        if (cmd === 'which') return Buffer.from('/usr/local/bin/rmapi');
        if (cmd === 'rmapi') throw new Error('Directory not found');
        return Buffer.from('');
      });

      const client = new RmapiDeliveryClient();
      const docs = await client.listDocuments('/NonExistent');
      expect(docs).toEqual([]);
    });

    it('moveDocument ensures destination folder and calls rmapi mv', async () => {
      const execCalls: { cmd: string; args: string[] }[] = [];
      vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
        execCalls.push({ cmd, args: args ?? [] });
        return Buffer.from('');
      });

      const client = new RmapiDeliveryClient();
      await client.moveDocument('/Puzzles/Daily/Sudoku_2026-10-12', '/Puzzles/Archive/Sudoku');

      expect(execCalls).toContainEqual({
        cmd: 'rmapi',
        args: ['mkdir', '/Puzzles'],
      });
      expect(execCalls).toContainEqual({
        cmd: 'rmapi',
        args: ['mkdir', '/Puzzles/Archive'],
      });
      expect(execCalls).toContainEqual({
        cmd: 'rmapi',
        args: ['mkdir', '/Puzzles/Archive/Sudoku'],
      });
      expect(execCalls).toContainEqual({
        cmd: 'rmapi',
        args: ['mv', '/Puzzles/Daily/Sudoku_2026-10-12', '/Puzzles/Archive/Sudoku'],
      });
    });

    it('moveDocument retries on failure with exponential backoff and succeeds', async () => {
      let mvAttempts = 0;
      vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
        if (cmd === 'rmapi' && args?.[0] === 'mv') {
          mvAttempts++;
          if (mvAttempts === 1) {
            throw new Error('temporary network error 503');
          }
        }
        return Buffer.from('');
      });

      const client = new RmapiDeliveryClient({ maxRetries: 3, initialDelayMs: 1, backoffFactor: 1 });
      await client.moveDocument('/Puzzles/Daily/Retry.pdf', '/Puzzles/Archive/Sudoku');

      expect(mvAttempts).toBe(2);
    });

    it('moveDocument throws when retries are exhausted', async () => {
      vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
        if (cmd === 'rmapi' && args?.[0] === 'mv') {
          throw new Error('persistent mv error');
        }
        return Buffer.from('');
      });

      const client = new RmapiDeliveryClient({ maxRetries: 2, initialDelayMs: 1, backoffFactor: 1 });
      await expect(
        client.moveDocument('/Puzzles/Daily/Fail.pdf', '/Puzzles/Archive/Sudoku')
      ).rejects.toThrow('persistent mv error');
    });

    it('moveDocument throws if rmapi is not available', async () => {
      vi.spyOn(childProcess, 'execFileSync').mockImplementation((cmd: string, args?: any) => {
        if (cmd === 'which' && args?.[0] === 'rmapi') {
          throw new Error('not found');
        }
        return Buffer.from('');
      });

      const client = new RmapiDeliveryClient();
      await expect(
        client.moveDocument('/Puzzles/Daily/Fail.pdf', '/Puzzles/Archive/Sudoku')
      ).rejects.toThrow('rmapi CLI is not found on PATH. Install rmapi or use --local mode.');
    });
  });
});


