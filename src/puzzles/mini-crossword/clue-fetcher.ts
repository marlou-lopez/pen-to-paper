/**
 * Cleans raw Datamuse definitions by stripping grammatical prefixes (e.g., n\t, v\t),
 * leading parenthetical notes, brackets, and trailing punctuation, and capitalizing the first character.
 */
export function cleanDefinition(raw: string): string {
  if (!raw) return '';

  // Strip grammatical prefix (e.g. n\t, v\t, adj\t, adv\t)
  let text = raw.replace(/^[a-z]+\t/i, '').trim();

  // Strip leading parentheses and bracket qualifiers (e.g. (transitive), [archaic])
  while (/^(\([^)]*\)|\[[^\]]*\])\s*/.test(text)) {
    text = text.replace(/^(\([^)]*\)|\[[^\]]*\])\s*/, '');
  }

  // Remove brackets
  text = text.replace(/[\[\]]/g, '');

  // Trim whitespace and trailing punctuation (. or ;)
  text = text.trim().replace(/[.;\s]+$/, '').trim();

  // Capitalize first character
  if (text.length > 0) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }

  return text;
}

interface DatamuseItem {
  word?: string;
  score?: number;
  defs?: string[];
}

/**
 * Fetches 5-letter candidate words with definitions from Datamuse API.
 * Uses a 5000ms timeout and resilient error handling, returning an empty Map on failure.
 */
export async function fetchWordsWithDefinitions(theme?: string): Promise<Map<string, string>> {
  const result = new Map<string, string>();

  try {
    let url = 'https://api.datamuse.com/words?sp=?????&md=d&max=100';
    if (theme && theme.trim().length > 0) {
      url += `&topics=${encodeURIComponent(theme.trim())}`;
    }

    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return result;
    }

    const items = (await response.json()) as DatamuseItem[];
    if (!Array.isArray(items)) {
      return result;
    }

    for (const item of items) {
      if (!item || typeof item.word !== 'string') continue;
      const word = item.word.trim();
      // Strictly 5 alphabetic characters
      if (!/^[a-zA-Z]{5}$/.test(word)) continue;
      if (!Array.isArray(item.defs) || item.defs.length === 0) continue;

      let cleanedDef = '';
      for (const rawDef of item.defs) {
        if (typeof rawDef === 'string') {
          const cleaned = cleanDefinition(rawDef);
          if (cleaned) {
            cleanedDef = cleaned;
            break;
          }
        }
      }

      if (cleanedDef) {
        result.set(word.toUpperCase(), cleanedDef);
      }
    }
  } catch {
    // Fail resiliently on network failure, timeout, or parsing error
    return new Map<string, string>();
  }

  return result;
}
