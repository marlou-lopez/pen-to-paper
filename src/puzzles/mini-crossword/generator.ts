import { GeneratedPuzzle, PuzzleGenerator, PuzzleMetadata, PuzzleResult } from '../../core/types.js';
import { CrosswordClue, MiniCrosswordData, MiniCrosswordOptions } from './types.js';
import { getSeedCrosswordForDate, SEED_CROSSWORDS } from './seed-bank.js';
import { fetchWordsWithDefinitions } from './clue-fetcher.js';
import { renderMiniCrosswordPdf } from './renderer.js';
import { calculateCrosswordNumbering } from './numbering.js';
import { CROSSWORD_TEMPLATES, CrosswordTemplate } from './templates.js';

// Pre-populate dictionary of verified words and clues from curated seeds
const SEED_DICTIONARY = new Map<string, string>();
for (const seed of SEED_CROSSWORDS) {
  for (const clue of [...seed.acrossClues, ...seed.downClues]) {
    if (!SEED_DICTIONARY.has(clue.word)) {
      SEED_DICTIONARY.set(clue.word, clue.clue);
    }
  }
}

function formatTitle(theme: string): string {
  return theme
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Solves a 5x5 blocked crossword grid matching a template using backtracking search.
 * Returns solved grid letters and clues if successful within maxSteps, or null if unsolveable.
 */
function solveTemplateGrid(
  template: CrosswordTemplate,
  candidateWords: string[],
  validWords: Set<string>,
  maxSteps = 2000
): { grid: string[][]; acrossClues: CrosswordClue[]; downClues: CrosswordClue[] } | null {
  const { acrossSlots, downSlots } = calculateCrosswordNumbering(template.grid);

  const candByLen = new Map<number, string[]>();
  for (const len of [3, 4, 5]) {
    const list = candidateWords.filter(w => w.length === len);
    const seedList = Array.from(SEED_DICTIONARY.keys()).filter(w => w.length === len);
    const combined = Array.from(new Set([...list, ...seedList]));
    candByLen.set(len, combined);
  }

  const downPrefixes = new Set<string>();
  for (const w of validWords) {
    for (let len = 1; len <= w.length; len++) {
      downPrefixes.add(`${w.length}:${w.slice(0, len)}`);
    }
  }

  const grid = template.grid.map(row => [...row]);
  const used = new Set<string>();
  let steps = 0;

  function backtrack(slotIdx: number): boolean {
    if (slotIdx === acrossSlots.length) {
      const downWords: string[] = [];
      for (const ds of downSlots) {
        const w = ds.coords.map(([r, c]) => grid[r][c]).join('');
        if (!validWords.has(w)) return false;
        downWords.push(w);
      }
      if (new Set(downWords).size !== downWords.length) return false;
      for (const dw of downWords) {
        if (used.has(dw)) return false;
      }
      return true;
    }

    const slot = acrossSlots[slotIdx];
    const candidates = candByLen.get(slot.length) || [];

    for (const word of candidates) {
      if (used.has(word)) continue;
      steps++;
      if (steps > maxSteps) return false;

      let valid = true;
      for (let i = 0; i < slot.length; i++) {
        const [r, c] = slot.coords[i];
        const ds = downSlots.find(s => s.coords.some(([rr, cc]) => rr === r && cc === c));
        if (!ds) continue;
        const idxInDown = ds.coords.findIndex(([rr, cc]) => rr === r && cc === c);
        let prefix = '';
        for (let p = 0; p < idxInDown; p++) {
          const [pr, pc] = ds.coords[p];
          prefix += grid[pr][pc];
        }
        prefix += word[i];
        if (!downPrefixes.has(`${ds.length}:${prefix}`)) {
          valid = false;
          break;
        }
      }

      if (valid) {
        for (let i = 0; i < slot.length; i++) {
          const [r, c] = slot.coords[i];
          grid[r][c] = word[i];
        }
        used.add(word);

        if (backtrack(slotIdx + 1)) return true;

        used.delete(word);
        for (let i = 0; i < slot.length; i++) {
          const [r, c] = slot.coords[i];
          grid[r][c] = template.grid[r][c];
        }
      }
    }

    return false;
  }

  if (backtrack(0)) {
    const acrossClues: CrosswordClue[] = acrossSlots.map(slot => ({
      number: slot.number,
      direction: 'across',
      word: slot.coords.map(([r, c]) => grid[r][c]).join(''),
      clue: 'Thematic entry',
      startRow: slot.startRow,
      startCol: slot.startCol,
      length: slot.length,
    }));

    const downClues: CrosswordClue[] = downSlots.map(slot => ({
      number: slot.number,
      direction: 'down',
      word: slot.coords.map(([r, c]) => grid[r][c]).join(''),
      clue: 'Thematic entry',
      startRow: slot.startRow,
      startCol: slot.startCol,
      length: slot.length,
    }));

    return { grid, acrossClues, downClues };
  }

  return null;
}

export class MiniCrosswordGenerator implements PuzzleGenerator<MiniCrosswordOptions, MiniCrosswordData> {
  readonly metadata: PuzzleMetadata = {
    id: 'mini-crossword',
    displayName: 'Mini Crossword',
    targetFolder: '/Puzzles/Mini Crossword',
  };

  readonly type = 'mini-crossword';

  /**
   * Generates 5x5 Mini Crossword data.
   * Attempts dynamic thematic clue generation with backtracking template search,
   * falling back cleanly to curated seed puzzles when offline or word pool is insufficient.
   */
  async generateData(options?: MiniCrosswordOptions): Promise<MiniCrosswordData> {
    const dateStr = options?.date ?? new Date().toISOString().slice(0, 10);

    if (options?.theme && options.theme.trim().length > 0) {
      const theme = options.theme.trim();
      const fetchedWords = await fetchWordsWithDefinitions(theme);

      // Attempt backtracking if we have sufficient candidate words
      if (fetchedWords.size >= 10) {
        const candidateRows = Array.from(fetchedWords.keys());
        const validWords = new Set([...candidateRows, ...SEED_DICTIONARY.keys()]);
        const clueMap = new Map([...SEED_DICTIONARY.entries(), ...fetchedWords.entries()]);

        // Attempt template search across first few templates
        for (const template of CROSSWORD_TEMPLATES.slice(0, 3)) {
          const solved = solveTemplateGrid(template, candidateRows, validWords);
          if (solved) {
            for (const clue of [...solved.acrossClues, ...solved.downClues]) {
              if (clueMap.has(clue.word)) {
                clue.clue = clueMap.get(clue.word)!;
              }
            }

            return {
              title: `Mini Crossword - ${formatTitle(theme)}`,
              date: dateStr,
              templateId: template.id,
              grid: solved.grid,
              acrossClues: solved.acrossClues,
              downClues: solved.downClues,
            };
          }
        }
      }

      // Fallback with theme applied to title
      const seedPuzzle = getSeedCrosswordForDate(dateStr);
      return {
        ...seedPuzzle,
        title: `Mini Crossword - ${formatTitle(theme)}`,
      };
    }

    // Default: Return deterministic curated seed puzzle for date
    return getSeedCrosswordForDate(dateStr);
  }

  /**
   * Generates puzzle bundle implementing PuzzleGenerator interface.
   */
  async generate(
    options?: MiniCrosswordOptions
  ): Promise<PuzzleResult<MiniCrosswordData>> {
    const data = await this.generateData(options);
    const themeSuffix = options?.theme && options.theme.trim().length > 0
      ? `_${options.theme.trim().replace(/\s+/g, '_')}`
      : '';
    const filename = `MiniCrossword_${data.date}${themeSuffix}.pdf`;

    const puzzle: GeneratedPuzzle<MiniCrosswordData> = {
      metadata: {
        ...this.metadata,
        date: data.date,
      },
      type: this.type,
      title: data.title,
      filename,
      puzzleData: data,
    };
    const buffer = await this.renderPdf(puzzle);

    return {
      ...puzzle,
      type: this.type,
      buffer,
      metadata: {
        ...this.metadata,
        date: data.date,
      },
    };
  }

  /**
   * Renders PDF buffer for the puzzle using PdfBuilder.
   */
  async renderPdf(puzzle: GeneratedPuzzle<MiniCrosswordData>): Promise<Buffer> {
    return renderMiniCrosswordPdf(puzzle);
  }
}
