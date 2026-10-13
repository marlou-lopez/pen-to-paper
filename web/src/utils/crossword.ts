export interface CrosswordClueData {
  number: number;
  direction: 'across' | 'down';
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  length: number;
}

export interface CrosswordPuzzleData {
  title: string;
  grid: string[][];
  acrossClues: CrosswordClueData[];
  downClues: CrosswordClueData[];
}

export interface CrosswordSlot {
  number: number;
  direction: 'across' | 'down';
  startRow: number;
  startCol: number;
  length: number;
  coords: [number, number][];
}

export interface NumberingResult {
  gridNumbers: (number | null)[][];
  acrossSlots: CrosswordSlot[];
  downSlots: CrosswordSlot[];
}

export function calculateCrosswordNumbering(grid: string[][]): NumberingResult {
  const gridNumbers: (number | null)[][] = Array.from({ length: 5 }, () => Array(5).fill(null));
  const acrossSlots: CrosswordSlot[] = [];
  const downSlots: CrosswordSlot[] = [];
  let currentNumber = 1;

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (grid[r][c] === '#') continue;

      const isAcrossStart =
        (c === 0 || grid[r][c - 1] === '#') &&
        c + 1 < 5 &&
        grid[r][c + 1] !== '#';

      const isDownStart =
        (r === 0 || grid[r - 1][c] === '#') &&
        r + 1 < 5 &&
        grid[r + 1][c] !== '#';

      if (isAcrossStart || isDownStart) {
        gridNumbers[r][c] = currentNumber;

        if (isAcrossStart) {
          const coords: [number, number][] = [];
          let colIdx = c;
          while (colIdx < 5 && grid[r][colIdx] !== '#') {
            coords.push([r, colIdx]);
            colIdx++;
          }
          acrossSlots.push({
            number: currentNumber,
            direction: 'across',
            startRow: r,
            startCol: c,
            length: coords.length,
            coords,
          });
        }

        if (isDownStart) {
          const coords: [number, number][] = [];
          let rowIdx = r;
          while (rowIdx < 5 && grid[rowIdx][c] !== '#') {
            coords.push([rowIdx, c]);
            rowIdx++;
          }
          downSlots.push({
            number: currentNumber,
            direction: 'down',
            startRow: r,
            startCol: c,
            length: coords.length,
            coords,
          });
        }

        currentNumber++;
      }
    }
  }

  return { gridNumbers, acrossSlots, downSlots };
}


export const PRESET_THEMES = ['Daily', 'Astronomy', 'Nature', 'Ocean', 'History'];

function buildSamplePuzzle(
  title: string,
  gridStrings: string[],
  acrossCluesList: string[],
  downCluesList: string[]
): CrosswordPuzzleData {
  const grid = gridStrings.map((row) => row.split(''));
  const { acrossSlots, downSlots } = calculateCrosswordNumbering(grid);

  const acrossClues: CrosswordClueData[] = acrossSlots.map((slot, index) => ({
    number: slot.number,
    direction: 'across',
    word: slot.coords.map(([r, c]) => grid[r][c]).join(''),
    clue: acrossCluesList[index] || '',
    startRow: slot.startRow,
    startCol: slot.startCol,
    length: slot.length,
  }));

  const downClues: CrosswordClueData[] = downSlots.map((slot, index) => ({
    number: slot.number,
    direction: 'down',
    word: slot.coords.map(([r, c]) => grid[r][c]).join(''),
    clue: downCluesList[index] || '',
    startRow: slot.startRow,
    startCol: slot.startCol,
    length: slot.length,
  }));

  return {
    title,
    grid,
    acrossClues,
    downClues,
  };
}

export const SAMPLE_PUZZLES: CrosswordPuzzleData[] = [
  buildSamplePuzzle(
    'Autumn Harvest',
    [
      'PAST#',
      'ALLOW',
      'STAKE',
      'SEVEN',
      '#RENT',
    ],
    [
      'Time gone by or elapsed history',
      'Permit or give authorization for',
      'Post driven into ground, or enterprise share',
      'Prime number of days in a week',
      'Regular payment made by tenant to landlord',
    ],
    [
      'Go beyond an obstacle or succeed in an exam',
      'Make a modification or adjustment to',
      'Laborer bound in involuntary servitude',
      'Tangible keepsake, symbol, or game piece',
      'Departed or traveled from one place to another',
    ]
  ),
  buildSamplePuzzle(
    'Desert Echo',
    [
      'MOST#',
      'ATLAS',
      'SHAKE',
      'SEVEN',
      '#RENT',
    ],
    [
      'Greatest in amount, quantity, or degree',
      'Bound volume of geographic maps and charts',
      'Vibrate rapidly or tremble with force',
      'Lucky casino roll sum or days in a week',
      'Monthly lease payment for an apartment',
    ],
    [
      'Large body of matter, or a church liturgy',
      'Alternative person or different option',
      'Involuntary worker of ancient times',
      'Captured by force or occupied by reservation',
      'Dispatched a letter or electronic message',
    ]
  ),
  buildSamplePuzzle(
    'Shoreline Breeze',
    [
      '#THAT',
      'SHORE',
      'TERMS',
      'ASSET',
      'REED#',
    ],
    [
      'Specific person, item, or concept indicated',
      'Coastal boundary where ocean meets sandy land',
      'Stipulated conditions within a legal contract',
      'Item of valuable property or financial wealth',
      'Tall slender wetland grass or woodwind piece',
    ],
    [
      'Plural pronoun indicating objects close at hand',
      'Equine steed harnessed for riding or farming',
      'Equipped with weaponry or prepared for combat',
      'Examination assessing knowledge or skill',
      'Luminous celestial body shining in night sky',
    ]
  ),
  buildSamplePuzzle(
    'Coral Reef',
    [
      '#SAN#',
      'CORAL',
      'ALIKE',
      'BASED',
      '#RED#',
    ],
    [
      'Honorific suffix in Japan, or Francisco prefix',
      'Marine invertebrate colony building colorful reefs',
      'Having similar qualities or looking identical',
      'Founded upon evidence or located in headquarters',
      'Primary color of ripe strawberries and rubies',
    ],
    [
      'Relating to energy harnessed from sun rays',
      'Get up from slumber or emerge into existence',
      'Without clothing, covering, or artificial disguise',
      'Hired taxicab vehicle in a bustling city',
      'Guided a group forward along a marked trail',
    ]
  ),
  buildSamplePuzzle(
    'Morning Flight',
    [
      '#BAD#',
      'MONEY',
      'EAGLE',
      'TREAT',
      '#DRY#',
    ],
    [
      'Unpleasant in quality or ethically corrupt',
      'Medium of exchange in coins and banknotes',
      'Regal bird of prey with keen distance vision',
      'Provide hospitality or an unexpected delicious snack',
      'Free from moisture, rain, or dampness',
    ],
    [
      'Plank of timber, or committee directing a firm',
      'Intense displeasure provoked by wrongdoing',
      'Postpone or cause something to run late',
      'Encountered an acquaintance face to face',
      'Up until now, or nevertheless',
    ]
  ),
];

export function createEmptyCrosswordGrid(template?: string[][]): string[][] {
  if (template) {
    return template.map((row) =>
      row.map((cell) => (cell === '#' ? '#' : ''))
    );
  }
  return Array.from({ length: 5 }, () => Array(5).fill(''));
}

export function isCrosswordSolved(userGrid: string[][], solutionGrid: string[][]): boolean {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const solutionChar = (solutionGrid[r]?.[c] || '').toUpperCase();
      if (solutionChar === '#') {
        continue;
      }
      const userChar = (userGrid[r]?.[c] || '').toUpperCase();
      if (!userChar || userChar !== solutionChar) {
        return false;
      }
    }
  }
  return true;
}
