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
    vi.spyOn(childProcess, 'execSync').mockImplementation((cmd: string) => {
      if (cmd === 'which rmapi') {
        throw new Error('not found');
      }
      return Buffer.from('');
    });

    const client = new RmapiDeliveryClient();
    expect(client.isAvailable()).toBe(false);
  });

  it('RmapiDeliveryClient throws error on deliver when rmapi binary is missing', async () => {
    vi.spyOn(childProcess, 'execSync').mockImplementation((cmd: string) => {
      if (cmd === 'which rmapi') {
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
    const execCalls: string[] = [];
    vi.spyOn(childProcess, 'execSync').mockImplementation((cmd: string) => {
      execCalls.push(cmd);
      return Buffer.from('');
    });

    const client = new RmapiDeliveryClient();
    expect(client.isAvailable()).toBe(true);

    const buffer = Buffer.from('remote-pdf-bytes');
    const remotePath = await client.deliver('Daily.pdf', '/Puzzles/WordSearch', buffer);

    expect(remotePath).toBe('/Puzzles/WordSearch/Daily.pdf');
    expect(execCalls).toContain('rmapi mkdir "/Puzzles"');
    expect(execCalls).toContain('rmapi mkdir "/Puzzles/WordSearch"');
    expect(execCalls.some(call => call.startsWith('rmapi put ') && call.endsWith('"/Puzzles/WordSearch"'))).toBe(true);
  });
});
