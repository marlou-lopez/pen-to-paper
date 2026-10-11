// @ts-expect-error blex41 word search library has no bundled types
import WordSearch from '@blex41/word-search';
import { GeneratedPuzzle, PuzzleGenerator, PuzzleMetadata } from '../../core/types.js';
import { WORD_THEMES, WordTheme } from './word-bank.js';
import { renderWordSearchPdf } from './renderer.js';

export interface WordSearchOptions {
  date?: string;
  theme?: string;
}

export interface PlacedWordSolution {
  word: string;
  cells: [number, number][];
}

export interface WordSearchData {
  theme: string;
  grid: string[][];
  words: string[];
  solution: PlacedWordSolution[];
}

export class WordSearchGenerator implements PuzzleGenerator<WordSearchOptions, WordSearchData> {
  readonly metadata: PuzzleMetadata = {
    id: 'word-search',
    displayName: 'Word Search',
    targetFolder: '/Puzzles/Word Search',
  };

  async generate(options?: WordSearchOptions): Promise<GeneratedPuzzle<WordSearchData>> {
    const dateStr = options?.date ?? new Date().toISOString().slice(0, 10);
    const themeObj: WordTheme = options?.theme
      ? WORD_THEMES.find((t) => t.name.toLowerCase() === options.theme?.toLowerCase()) || WORD_THEMES[0]
      : WORD_THEMES[Math.floor(Math.random() * WORD_THEMES.length)];

    let ws: any;
    let attempts = 0;
    while (attempts < 5) {
      ws = new WordSearch({
        cols: 15,
        rows: 15,
        dictionary: themeObj.words,
        maxWords: 15,
        backwardsProbability: 0.3,
        upperCase: true,
      });
      if (ws.words && ws.words.length >= 10) break;
      attempts++;
    }

    const grid: string[][] = ws.grid;
    const placedWords: string[] = ws.words.map((w: any) => w.clean);

    // Map solution coordinate paths
    const solution: PlacedWordSolution[] = ws.words.map((w: any) => {
      let cells: [number, number][] = [];
      if (Array.isArray(w.path)) {
        cells = w.path.map((p: { x: number; y: number }) => [p.y, p.x]);
      } else if (w.startY !== undefined && w.startX !== undefined) {
        const dr = Math.sign(w.endY - w.startY);
        const dc = Math.sign(w.endX - w.startX);
        let r = w.startY;
        let c = w.startX;
        const len = w.clean.length;
        for (let i = 0; i < len; i++) {
          cells.push([r, c]);
          r += dr;
          c += dc;
        }
      }
      return { word: w.clean, cells };
    });

    const sanitizedTheme = themeObj.name.replace(/\s+/g, '');
    const filename = `WordSearch_${dateStr}_${sanitizedTheme}.pdf`;

    return {
      metadata: this.metadata,
      title: `Word Search - ${themeObj.name}`,
      filename,
      puzzleData: {
        theme: themeObj.name,
        grid,
        words: placedWords,
        solution,
      },
    };
  }

  renderPdf(puzzle: GeneratedPuzzle<WordSearchData>): Promise<Buffer> {
    return renderWordSearchPdf(puzzle);
  }
}
