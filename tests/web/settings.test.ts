import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredSettings,
  saveStoredSettings,
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
