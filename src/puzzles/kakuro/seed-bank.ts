import { extractKakuroRuns } from './templates.js';
import { KakuroCell, KakuroData, KakuroDifficulty } from './types.js';

interface RawSeedPuzzle {
  title: string;
  size: number;
  difficulty: KakuroDifficulty;
  layout: string[];
}

const RAW_SEEDS: RawSeedPuzzle[] = [
  // 6x6
  {
    title: 'Cascade Six Alpha',
    size: 6,
    difficulty: 'easy',
    layout: [
      '######',
      '#89###',
      '#537##',
      '##142#',
      '###94#',
      '######',
    ],
  },
  {
    title: 'Cascade Six Beta',
    size: 6,
    difficulty: 'easy',
    layout: [
      '######',
      '###91#',
      '##672#',
      '#431##',
      '#61###',
      '######',
    ],
  },
  {
    title: 'Cross Sum Echo',
    size: 6,
    difficulty: 'medium',
    layout: [
      '######',
      '#83###',
      '#419##',
      '##279#',
      '###31#',
      '######',
    ],
  },
  {
    title: 'Valley Six',
    size: 6,
    difficulty: 'medium',
    layout: [
      '######',
      '###23#',
      '##281#',
      '#796##',
      '#16###',
      '######',
    ],
  },
  {
    title: 'Summit Six',
    size: 6,
    difficulty: 'hard',
    layout: [
      '######',
      '#79###',
      '#968##',
      '##729#',
      '###67#',
      '######',
    ],
  },
  {
    title: 'Canyon Six',
    size: 6,
    difficulty: 'hard',
    layout: [
      '######',
      '###89#',
      '##721#',
      '#791##',
      '#85###',
      '######',
    ],
  },

  // 8x8
  {
    title: 'Cascade Eight Alpha',
    size: 8,
    difficulty: 'easy',
    layout: [
      '########',
      '#12#####',
      '#749####',
      '##142###',
      '###142##',
      '####985#',
      '#####51#',
      '########',
    ],
  },
  {
    title: 'Cascade Eight Beta',
    size: 8,
    difficulty: 'easy',
    layout: [
      '########',
      '#####57#',
      '####389#',
      '###619##',
      '##894###',
      '#715####',
      '#52#####',
      '########',
    ],
  },
  {
    title: 'River Eight',
    size: 8,
    difficulty: 'medium',
    layout: [
      '########',
      '#59#####',
      '#153####',
      '##762###',
      '###876##',
      '####876#',
      '#####95#',
      '########',
    ],
  },
  {
    title: 'Glade Eight',
    size: 8,
    difficulty: 'medium',
    layout: [
      '########',
      '#####61#',
      '####253#',
      '###914##',
      '##284###',
      '#614####',
      '#85#####',
      '########',
    ],
  },
  {
    title: 'Summit Eight',
    size: 8,
    difficulty: 'hard',
    layout: [
      '########',
      '#61#####',
      '#987####',
      '##953###',
      '###819##',
      '####234#',
      '#####89#',
      '########',
    ],
  },
  {
    title: 'Ridge Eight',
    size: 8,
    difficulty: 'hard',
    layout: [
      '########',
      '#####49#',
      '####123#',
      '###723##',
      '##793###',
      '#796####',
      '#42#####',
      '########',
    ],
  },

  // 10x10
  {
    title: 'Cascade Ten Alpha',
    size: 10,
    difficulty: 'easy',
    layout: [
      '##########',
      '#71#######',
      '#973######',
      '##869#####',
      '###145####',
      '####315###',
      '#####893##',
      '######894#',
      '#######86#',
      '##########',
    ],
  },
  {
    title: 'Cascade Ten Beta',
    size: 10,
    difficulty: 'easy',
    layout: [
      '##########',
      '#######13#',
      '######968#',
      '#####264##',
      '####218###',
      '###876####',
      '##521#####',
      '#395######',
      '#17#######',
      '##########',
    ],
  },
  {
    title: 'Mountain Ten',
    size: 10,
    difficulty: 'medium',
    layout: [
      '##########',
      '#21#######',
      '#485######',
      '##986#####',
      '###917####',
      '####768###',
      '#####198##',
      '######697#',
      '#######56#',
      '##########',
    ],
  },
  {
    title: 'Canyon Ten',
    size: 10,
    difficulty: 'medium',
    layout: [
      '##########',
      '#######92#',
      '######981#',
      '#####436##',
      '####784###',
      '###819####',
      '##869#####',
      '#129######',
      '#69#######',
      '##########',
    ],
  },
  {
    title: 'Pinnacle Ten',
    size: 10,
    difficulty: 'hard',
    layout: [
      '##########',
      '#98#######',
      '#753######',
      '##956#####',
      '###986####',
      '####986###',
      '#####759##',
      '######489#',
      '#######53#',
      '##########',
    ],
  },
  {
    title: 'Abyss Ten',
    size: 10,
    difficulty: 'hard',
    layout: [
      '##########',
      '#######52#',
      '######481#',
      '#####986##',
      '####986###',
      '###983####',
      '##987#####',
      '#512######',
      '#62#######',
      '##########',
    ],
  },
];

function buildSeedKakuro(seed: RawSeedPuzzle): KakuroData {
  const size = seed.size;
  const grid: KakuroCell[][] = seed.layout.map((row) =>
    row.split('').map((ch): KakuroCell => {
      if (ch === '#') {
        return { type: 'block' };
      }
      return {
        type: 'white',
        solution: parseInt(ch, 10),
      };
    })
  );

  const runs = extractKakuroRuns(grid);
  for (const run of runs) {
    const clueCell = grid[run.clueRow][run.clueCol];
    clueCell.type = 'clue';
    if (run.direction === 'across') {
      clueCell.acrossSum = run.targetSum;
    } else {
      clueCell.downSum = run.targetSum;
    }
  }

  return {
    title: seed.title,
    date: '2026-10-13',
    size,
    difficulty: seed.difficulty,
    grid,
    runs,
  };
}

export const SEED_KAKURO_PUZZLES: KakuroData[] = RAW_SEEDS.map(buildSeedKakuro);

export function getSeedKakuro(
  size: number,
  difficulty: KakuroDifficulty,
  dateStr: string
): KakuroData {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0;
  }

  const matching = SEED_KAKURO_PUZZLES.filter(
    (p) => p.size === size && p.difficulty === difficulty
  );
  const pool = matching.length > 0 ? matching : SEED_KAKURO_PUZZLES;
  const base = pool[hash % pool.length];

  return {
    title: base.title,
    date: dateStr,
    size: base.size,
    difficulty: base.difficulty,
    grid: base.grid.map((row) => row.map((cell) => ({ ...cell }))),
    runs: base.runs.map((run) => ({
      ...run,
      cells: run.cells.map(([r, c]) => [r, c]),
    })),
  };
}
