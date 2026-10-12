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

export const CELL_CLUE_NUMBERS: Record<string, number> = {
  '0,0': 1,
  '0,1': 2,
  '0,2': 3,
  '0,3': 4,
  '0,4': 5,
  '1,0': 6,
  '2,0': 7,
  '3,0': 8,
  '4,0': 9,
};

export const PRESET_THEMES = ['Daily', 'Astronomy', 'Nature', 'Ocean', 'History'];

export const SAMPLE_PUZZLES: CrosswordPuzzleData[] = [
  {
    title: 'Heart & Soul',
    grid: [
      ['H', 'E', 'A', 'R', 'T'],
      ['E', 'M', 'B', 'E', 'R'],
      ['A', 'B', 'U', 'S', 'E'],
      ['R', 'E', 'S', 'I', 'N'],
      ['T', 'R', 'E', 'N', 'D'],
    ],
    acrossClues: [
      { number: 1, direction: 'across', word: 'HEART', clue: 'Vital muscular organ pumping blood', startRow: 0, startCol: 0, length: 5 },
      { number: 6, direction: 'across', word: 'EMBER', clue: 'Glowing piece of burning coal or wood', startRow: 1, startCol: 0, length: 5 },
      { number: 7, direction: 'across', word: 'ABUSE', clue: 'Cruel or improper treatment', startRow: 2, startCol: 0, length: 5 },
      { number: 8, direction: 'across', word: 'RESIN', clue: 'Sticky organic fluid from pine trees', startRow: 3, startCol: 0, length: 5 },
      { number: 9, direction: 'across', word: 'TREND', clue: 'General direction in which things are developing', startRow: 4, startCol: 0, length: 5 },
    ],
    downClues: [
      { number: 1, direction: 'down', word: 'HEART', clue: 'Center or core of an emotional issue', startRow: 0, startCol: 0, length: 5 },
      { number: 2, direction: 'down', word: 'EMBER', clue: 'Smoldering remnant of a dying campfire', startRow: 0, startCol: 1, length: 5 },
      { number: 3, direction: 'down', word: 'ABUSE', clue: 'Excessive or corrupt misuse of authority', startRow: 0, startCol: 2, length: 5 },
      { number: 4, direction: 'down', word: 'RESIN', clue: 'Tree secretion used in varnishes', startRow: 0, startCol: 3, length: 5 },
      { number: 5, direction: 'down', word: 'TREND', clue: 'Popular style or viral topic online', startRow: 0, startCol: 4, length: 5 },
    ],
  },
  {
    title: 'Standing Firm',
    grid: [
      ['S', 'T', 'A', 'N', 'D'],
      ['T', 'A', 'B', 'O', 'O'],
      ['A', 'B', 'B', 'O', 'T'],
      ['N', 'O', 'O', 'S', 'E'],
      ['D', 'O', 'T', 'E', 'D'],
    ],
    acrossClues: [
      { number: 1, direction: 'across', word: 'STAND', clue: "Remain upright on one's feet", startRow: 0, startCol: 0, length: 5 },
      { number: 6, direction: 'across', word: 'TABOO', clue: 'Prohibited by social custom or religion', startRow: 1, startCol: 0, length: 5 },
      { number: 7, direction: 'across', word: 'ABBOT', clue: 'Head of a community of monks', startRow: 2, startCol: 0, length: 5 },
      { number: 8, direction: 'across', word: 'NOOSE', clue: 'Loop with a running knot for hanging', startRow: 3, startCol: 0, length: 5 },
      { number: 9, direction: 'across', word: 'DOTED', clue: 'Showed excessive affection or fondness', startRow: 4, startCol: 0, length: 5 },
    ],
    downClues: [
      { number: 1, direction: 'down', word: 'STAND', clue: 'Take an assertive position on a dispute', startRow: 0, startCol: 0, length: 5 },
      { number: 2, direction: 'down', word: 'TABOO', clue: 'Forbidden topic or off-limits practice', startRow: 0, startCol: 1, length: 5 },
      { number: 3, direction: 'down', word: 'ABBOT', clue: 'Monastic leader in a priory', startRow: 0, startCol: 2, length: 5 },
      { number: 4, direction: 'down', word: 'NOOSE', clue: 'Rope trap or slipknot fastener', startRow: 0, startCol: 3, length: 5 },
      { number: 5, direction: 'down', word: 'DOTED', clue: 'Lavished unconditional love upon', startRow: 0, startCol: 4, length: 5 },
    ],
  },
  {
    title: 'Morning Clouds',
    grid: [
      ['C', 'L', 'O', 'U', 'D'],
      ['L', 'E', 'A', 'S', 'E'],
      ['O', 'A', 'K', 'E', 'N'],
      ['U', 'S', 'E', 'R', 'S'],
      ['D', 'E', 'N', 'S', 'E'],
    ],
    acrossClues: [
      { number: 1, direction: 'across', word: 'CLOUD', clue: 'Visible mass of condensed water vapor', startRow: 0, startCol: 0, length: 5 },
      { number: 6, direction: 'across', word: 'LEASE', clue: 'Contract granting land or property use', startRow: 1, startCol: 0, length: 5 },
      { number: 7, direction: 'across', word: 'OAKEN', clue: 'Made from hardwood of the genus Quercus', startRow: 2, startCol: 0, length: 5 },
      { number: 8, direction: 'across', word: 'USERS', clue: 'People operating a software system', startRow: 3, startCol: 0, length: 5 },
      { number: 9, direction: 'across', word: 'DENSE', clue: 'Closely compacted in substance or crowded', startRow: 4, startCol: 0, length: 5 },
    ],
    downClues: [
      { number: 1, direction: 'down', word: 'CLOUD', clue: 'Vapor gathering before precipitation', startRow: 0, startCol: 0, length: 5 },
      { number: 2, direction: 'down', word: 'LEASE', clue: 'Rental agreement between tenant and landlord', startRow: 0, startCol: 1, length: 5 },
      { number: 3, direction: 'down', word: 'OAKEN', clue: 'Crafted from sturdy oak timber', startRow: 0, startCol: 2, length: 5 },
      { number: 4, direction: 'down', word: 'USERS', clue: 'Subscribers utilizing an application', startRow: 0, startCol: 3, length: 5 },
      { number: 5, direction: 'down', word: 'DENSE', clue: 'Thickly packed with trees or foliage', startRow: 0, startCol: 4, length: 5 },
    ],
  },
  {
    title: 'Royal North',
    grid: [
      ['C', 'R', 'O', 'W', 'N'],
      ['R', 'E', 'T', 'R', 'O'],
      ['O', 'T', 'H', 'E', 'R'],
      ['W', 'R', 'E', 'S', 'T'],
      ['N', 'O', 'R', 'T', 'H'],
    ],
    acrossClues: [
      { number: 1, direction: 'across', word: 'CROWN', clue: 'Ornamental circular headdress of monarchs', startRow: 0, startCol: 0, length: 5 },
      { number: 6, direction: 'across', word: 'RETRO', clue: 'Imitative of past styles and fashions', startRow: 1, startCol: 0, length: 5 },
      { number: 7, direction: 'across', word: 'OTHER', clue: 'Different from one previously mentioned', startRow: 2, startCol: 0, length: 5 },
      { number: 8, direction: 'across', word: 'WREST', clue: "Forcibly pull or tear from someone's grasp", startRow: 3, startCol: 0, length: 5 },
      { number: 9, direction: 'across', word: 'NORTH', clue: 'Compass direction pointing to the pole', startRow: 4, startCol: 0, length: 5 },
    ],
    downClues: [
      { number: 1, direction: 'down', word: 'CROWN', clue: 'Peak or highest point of an arch or hill', startRow: 0, startCol: 0, length: 5 },
      { number: 2, direction: 'down', word: 'RETRO', clue: 'Vintage aesthetic looking back in time', startRow: 0, startCol: 1, length: 5 },
      { number: 3, direction: 'down', word: 'OTHER', clue: 'Alternative person or option', startRow: 0, startCol: 2, length: 5 },
      { number: 4, direction: 'down', word: 'WREST', clue: 'Snatch or wrench away with effort', startRow: 0, startCol: 3, length: 5 },
      { number: 5, direction: 'down', word: 'NORTH', clue: 'Direction opposite to south on a map', startRow: 0, startCol: 4, length: 5 },
    ],
  },
  {
    title: 'Sweet Dreams',
    grid: [
      ['D', 'R', 'E', 'A', 'M'],
      ['R', 'E', 'T', 'R', 'O'],
      ['E', 'T', 'H', 'E', 'R'],
      ['A', 'R', 'E', 'N', 'A'],
      ['M', 'O', 'R', 'A', 'L'],
    ],
    acrossClues: [
      { number: 1, direction: 'across', word: 'DREAM', clue: 'Series of thoughts and visions during sleep', startRow: 0, startCol: 0, length: 5 },
      { number: 6, direction: 'across', word: 'RETRO', clue: 'Nostalgic design reminiscent of the past', startRow: 1, startCol: 0, length: 5 },
      { number: 7, direction: 'across', word: 'ETHER', clue: 'Volatile liquid once used as an anesthetic', startRow: 2, startCol: 0, length: 5 },
      { number: 8, direction: 'across', word: 'ARENA', clue: 'Level area surrounded by seating for sports', startRow: 3, startCol: 0, length: 5 },
      { number: 9, direction: 'across', word: 'MORAL', clue: 'Lesson or ethical principle from a fable', startRow: 4, startCol: 0, length: 5 },
    ],
    downClues: [
      { number: 1, direction: 'down', word: 'DREAM', clue: 'Cherished hope, ambition, or slumber fantasy', startRow: 0, startCol: 0, length: 5 },
      { number: 2, direction: 'down', word: 'RETRO', clue: 'Throwback fashion or vintage pop style', startRow: 0, startCol: 1, length: 5 },
      { number: 3, direction: 'down', word: 'ETHER', clue: 'Upper air or classical element of the heavens', startRow: 0, startCol: 2, length: 5 },
      { number: 4, direction: 'down', word: 'ARENA', clue: 'Stadium setting for contests or gladiators', startRow: 0, startCol: 3, length: 5 },
      { number: 5, direction: 'down', word: 'MORAL', clue: 'Concerned with principles of right and wrong', startRow: 0, startCol: 4, length: 5 },
    ],
  },
];

export function createEmptyCrosswordGrid(): string[][] {
  return Array.from({ length: 5 }, () => Array(5).fill(''));
}

export function isCrosswordSolved(userGrid: string[][], solutionGrid: string[][]): boolean {
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const userChar = (userGrid[r]?.[c] || '').toUpperCase();
      const solutionChar = (solutionGrid[r]?.[c] || '').toUpperCase();
      if (!userChar || userChar !== solutionChar) {
        return false;
      }
    }
  }
  return true;
}
