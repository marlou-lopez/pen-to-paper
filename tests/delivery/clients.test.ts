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
  });

  it('LocalDeliveryClient pre-creates archive folders on delivery', async () => {
    const testDir = './test-local-delivery-archive';
    const client = new LocalDeliveryClient(testDir);
    const buffer = Buffer.from('local-data');
    try {
      await client.deliver('Test.pdf', '/Puzzles/Daily', buffer);

      const wsArchive = path.join(testDir, 'Puzzles/Archive/Word Search');
      const sudokuArchive = path.join(testDir, 'Puzzles/Archive/Sudoku');
      const wsStat = await fs.stat(wsArchive);
      const sudokuStat = await fs.stat(sudokuArchive);
      expect(wsStat.isDirectory()).toBe(true);
      expect(sudokuStat.isDirectory()).toBe(true);
    } finally {
      await fs.rm(testDir, { recursive: true, force: true });
    }
  });
});
