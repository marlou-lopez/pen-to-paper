import { WORD_THEMES, WordTheme } from './word-bank.js';

export const DYNAMIC_TOPICS: string[] = [
  'astronomy',
  'ocean life',
  'ancient history',
  'inventions',
  'geography',
  'chemistry',
  'architecture',
  'musical instruments',
  'weather',
  'wildlife',
  'board games',
  'botany',
  'deep space',
  'minerals',
  'aviation',
  'volcano',
  'castle',
  'desert',
  'glacier',
  'dinosaur',
  'pirate',
  'detective',
  'safari',
  'mythology',
  'island',
  'rainforest',
  'mountain',
  'robotics',
  'carnival',
  'renaissance',
  'shipwreck',
  'lighthouse',
  'constellation',
  'canyon',
  'archaeology',
  'microbiology',
  'medieval',
  'polar exploration',
  'deep sea',
  'meteorology',
];

export async function fetchThemeFromApi(topic: string, timeoutMs = 5000): Promise<string[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const encoded = encodeURIComponent(topic.trim());
    const response = await fetch(`https://api.datamuse.com/words?ml=${encoded}&max=60`, {
      signal: controller.signal,
    });

    if (!response.ok) {
      return [];
    }

    const data: Array<{ word: string }> = await response.json();
    const seen = new Set<string>();
    const validWords: string[] = [];

    for (const item of data) {
      const upper = item.word.toUpperCase().trim();
      // Valid word: 4 to 12 uppercase letters, alphabetical only
      if (/^[A-Z]{4,12}$/.test(upper) && !seen.has(upper)) {
        seen.add(upper);
        validWords.push(upper);
      }
    }

    return validWords;
  } catch {
    return [];
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatThemeName(topic: string): string {
  return topic
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export async function getDynamicWordTheme(options?: { date?: string; theme?: string }): Promise<WordTheme> {
  // If specific theme was requested
  if (options?.theme) {
    // Check known offline curated themes first for instant deterministic response
    const offline = WORD_THEMES.find(
      (t) => t.name.toLowerCase() === options.theme?.toLowerCase()
    );
    if (offline) return offline;

    // Otherwise fetch dynamic words from Datamuse API for custom themes
    const apiWords = await fetchThemeFromApi(options.theme);
    if (apiWords.length >= 10) {
      return {
        name: formatThemeName(options.theme),
        words: apiWords.slice(0, 18),
      };
    }
  }

  // Determine topic for the day
  let chosenTopic: string;
  if (options?.date) {
    const dateObj = new Date(options.date + 'T12:00:00Z');
    const dayOfYear = Math.floor(
      (dateObj.getTime() - new Date(Date.UTC(dateObj.getUTCFullYear(), 0, 0)).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    chosenTopic = DYNAMIC_TOPICS[dayOfYear % DYNAMIC_TOPICS.length];
  } else {
    chosenTopic = DYNAMIC_TOPICS[Math.floor(Math.random() * DYNAMIC_TOPICS.length)];
  }

  // Try fetching fresh words from Datamuse
  const words = await fetchThemeFromApi(chosenTopic);
  if (words.length >= 10) {
    return {
      name: formatThemeName(chosenTopic),
      words: words.slice(0, 18),
    };
  }

  // Resilient fallback to curated offline theme if API request failed or offline
  return WORD_THEMES[Math.floor(Math.random() * WORD_THEMES.length)];
}
