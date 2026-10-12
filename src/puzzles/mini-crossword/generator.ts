import { GeneratedPuzzle, PuzzleGenerator, PuzzleMetadata } from '../../core/types.js';
import { CrosswordClue, MiniCrosswordData, MiniCrosswordOptions } from './types.js';
import { getSeedCrosswordForDate, SEED_CROSSWORDS } from './seed-bank.js';
import { fetchWordsWithDefinitions } from './clue-fetcher.js';

const ACROSS_NUMBERS = [1, 6, 7, 8, 9];
const DOWN_NUMBERS = [1, 2, 3, 4, 5];

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
 * Solves a 5x5 intersecting word grid using backtracking search.
 * Returns 5 across words if successful, or null if no valid grid is found within step limits.
 */
function solve5x5Grid(
  candidateRows: string[],
  validWords: Set<string>,
  maxSteps = 3000
): string[] | null {
  const prefixSet = new Set<string>();
  for (const w of validWords) {
    for (let len = 1; len <= 5; len++) {
      prefixSet.add(w.slice(0, len));
    }
  }

  const solution: string[] = [];
  const used = new Set<string>();
  let steps = 0;

  function backtrack(row: number): boolean {
    if (row === 5) {
      // Confirm all vertical columns are valid 5-letter words
      for (let c = 0; c < 5; c++) {
        const colWord = solution.map(r => r[c]).join('');
        if (!validWords.has(colWord)) return false;
      }
      return true;
    }

    for (const word of candidateRows) {
      if (used.has(word)) continue;
      steps++;
      if (steps > maxSteps) return false;

      // Validate prefix compatibility for each column
      let valid = true;
      for (let c = 0; c < 5; c++) {
        let prefix = '';
        for (let r = 0; r < row; r++) {
          prefix += solution[r][c];
        }
        prefix += word[c];
        if (!prefixSet.has(prefix)) {
          valid = false;
          break;
        }
      }

      if (valid) {
        solution.push(word);
        used.add(word);
        if (backtrack(row + 1)) return true;
        solution.pop();
        used.delete(word);
      }
    }

    return false;
  }

  if (backtrack(0)) {
    return solution;
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
   * Attempts dynamic thematic clue generation with backtracking intersection search,
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

        const solvedRows = solve5x5Grid(candidateRows, validWords);
        if (solvedRows) {
          const solvedCols = [0, 1, 2, 3, 4].map(c => solvedRows.map(r => r[c]).join(''));
          const grid = solvedRows.map(row => row.split(''));

          const acrossClues: CrosswordClue[] = solvedRows.map((word, index) => ({
            number: ACROSS_NUMBERS[index],
            direction: 'across',
            word,
            clue: clueMap.get(word) || 'Thematic entry',
            startRow: index,
            startCol: 0,
            length: 5,
          }));

          const downClues: CrosswordClue[] = solvedCols.map((word, index) => ({
            number: DOWN_NUMBERS[index],
            direction: 'down',
            word,
            clue: clueMap.get(word) || 'Thematic entry',
            startRow: 0,
            startCol: index,
            length: 5,
          }));

          return {
            title: `Mini Crossword - ${formatTitle(theme)}`,
            date: dateStr,
            grid,
            acrossClues,
            downClues,
          };
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
  ): Promise<GeneratedPuzzle<MiniCrosswordData> & { type: string; buffer: Buffer }> {
    const data = await this.generateData(options);
    const buffer = await this.renderPdf({
      metadata: this.metadata,
      title: data.title,
      filename: `MiniCrossword_${data.date}.pdf`,
      puzzleData: data,
    });

    return {
      metadata: this.metadata,
      type: this.type,
      title: data.title,
      filename: `MiniCrossword_${data.date}.pdf`,
      puzzleData: data,
      buffer,
    };
  }

  /**
   * Renders PDF buffer for the puzzle (stubbed for Task 3 integration).
   */
  async renderPdf(_puzzle: GeneratedPuzzle<MiniCrosswordData>): Promise<Buffer> {
    return Buffer.from('%PDF-1.4\n');
  }
}
