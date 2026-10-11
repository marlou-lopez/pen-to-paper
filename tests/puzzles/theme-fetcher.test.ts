import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchThemeFromApi, getDynamicWordTheme } from '../../src/puzzles/word-search/theme-fetcher.js';
import { WORD_THEMES } from '../../src/puzzles/word-search/word-bank.js';

describe('theme-fetcher', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters and formats words from Datamuse API correctly', async () => {
    const mockApiResponse = [
      { word: 'buccaneer' },
      { word: 'invalid word with space' },
      { word: 'no' }, // too short (< 4)
      { word: 'supercalifragilistic' }, // too long (> 12)
      { word: 'corvette' },
      { word: 'galleon' },
      { word: 'cutlass' },
      { word: 'treasure' },
      { word: 'anchor' },
      { word: 'compass' },
      { word: 'piracy' },
      { word: 'corsair' },
      { word: 'mariner' },
      { word: 'voyage' },
      { word: 'island' },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse,
    } as any);

    const words = await fetchThemeFromApi('pirates');
    expect(words).toContain('BUCCANEER');
    expect(words).toContain('GALLEON');
    expect(words).not.toContain('NO');
    expect(words).not.toContain('INVALID WORD WITH SPACE');
    expect(words.length).toBeGreaterThanOrEqual(10);
  });

  it('falls back to curated offline themes when network request fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    const theme = await getDynamicWordTheme({ theme: 'nonexistent-xyz-fail' });
    expect(theme).toBeDefined();
    expect(theme.words.length).toBeGreaterThanOrEqual(10);
    // Should be one of the offline fallback themes
    const offlineNames = WORD_THEMES.map((t) => t.name.toLowerCase());
    expect(offlineNames).toContain(theme.name.toLowerCase());
  });

  it('fetches a dynamic theme when topic is provided', async () => {
    const mockWords = [
      { word: 'starlight' },
      { word: 'comet' },
      { word: 'nebula' },
      { word: 'galaxy' },
      { word: 'pulsar' },
      { word: 'quasar' },
      { word: 'meteor' },
      { word: 'planet' },
      { word: 'zenith' },
      { word: 'aurora' },
      { word: 'supernova' },
      { word: 'eclipse' },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockWords,
    } as any);

    const theme = await getDynamicWordTheme({ theme: 'stargazing' });
    expect(theme.name).toBe('Stargazing');
    expect(theme.words).toContain('STARLIGHT');
    expect(theme.words).toContain('GALAXY');
  });
});
