import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getStoredSettings,
  saveStoredSettings,
  dispatchWorkflow,
  StoredSettings,
} from '../../web/src/services/githubApi.ts';

describe('Settings Storage', () => {
  const storageMock: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(storageMock)) delete storageMock[key];
    globalThis.localStorage = {
      getItem: (key: string) => storageMock[key] ?? null,
      setItem: (key: string, val: string) => {
        storageMock[key] = val;
      },
      removeItem: (key: string) => {
        delete storageMock[key];
      },
      clear: () => {
        for (const key of Object.keys(storageMock)) delete storageMock[key];
      },
      key: () => null,
      length: 0,
    } as unknown as Storage;
  });

  it('defaults to category destination when not configured', () => {
    const settings = getStoredSettings();
    expect(settings.defaultDestination).toBe('category');
  });

  it('persists and retrieves custom default destination', () => {
    saveStoredSettings({
      token: 'ghp_test123',
      repo: 'owner/repo',
      defaultDestination: 'daily',
    });

    const settings = getStoredSettings();
    expect(settings.token).toBe('ghp_test123');
    expect(settings.defaultDestination).toBe('daily');
  });
});

describe('Workflow Dispatch for Mini Crossword', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('dispatches mini-crossword with custom crossword_theme and category destination', async () => {
    let capturedUrl = '';
    let capturedBody: any = null;

    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedBody = JSON.parse(init?.body as string);
      return {
        ok: true,
        status: 204,
      } as Response;
    }) as any;

    await dispatchWorkflow({
      token: 'ghp_secret',
      repo: 'marlou-lopez/pen-to-paper',
      inputs: {
        puzzle_type: 'mini-crossword',
        crossword_theme: 'Astronomy',
        is_daily: false,
      },
    });

    expect(capturedUrl).toContain('/actions/workflows/daily-puzzles.yml/dispatches');
    expect(capturedBody.inputs.puzzle_type).toBe('mini-crossword');
    expect(capturedBody.inputs.crossword_theme).toBe('Astronomy');
    expect(capturedBody.inputs.is_daily).toBe('false');
  });

  it('dispatches mini-crossword with default daily destination and blank theme', async () => {
    let capturedBody: any = null;

    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      capturedBody = JSON.parse(init?.body as string);
      return {
        ok: true,
        status: 204,
      } as Response;
    }) as any;

    await dispatchWorkflow({
      token: 'ghp_secret',
      repo: 'marlou-lopez/pen-to-paper',
      inputs: {
        puzzle_type: 'mini-crossword',
        is_daily: true,
      },
    });

    expect(capturedBody.inputs.puzzle_type).toBe('mini-crossword');
    expect(capturedBody.inputs.crossword_theme).toBe('');
    expect(capturedBody.inputs.is_daily).toBe('true');
  });
});
