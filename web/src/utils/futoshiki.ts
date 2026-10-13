export type FutoshikiDifficulty = 'easy' | 'medium' | 'hard';

export interface FutoshikiInequality {
  row1: number;
  col1: number;
  row2: number;
  col2: number;
  relation: '<' | '>';
}

export interface FutoshikiData {
  size: 4 | 5 | 6;
  difficulty: FutoshikiDifficulty;
  initialGrid: number[][];
  solution: number[][];
  inequalities: FutoshikiInequality[];
  title?: string;
  dateStr?: string;
}

export function createEmptyFutoshikiGrid(initialGrid: number[][]): number[][] {
  return initialGrid.map((row) => [...row]);
}

export function findFutoshikiViolations(
  userGrid: number[][],
  inequalities: FutoshikiInequality[]
): { duplicateCells: Set<string>; brokenInequalities: FutoshikiInequality[] } {
  const duplicateCells = new Set<string>();
  const size = userGrid.length;

  // Row duplicates (ignoring 0)
  for (let r = 0; r < size; r++) {
    const seen = new Map<number, number[]>();
    for (let c = 0; c < size; c++) {
      const val = userGrid[r]?.[c] ?? 0;
      if (val > 0) {
        const list = seen.get(val) || [];
        list.push(c);
        seen.set(val, list);
      }
    }
    for (const cols of seen.values()) {
      if (cols.length > 1) {
        for (const c of cols) {
          duplicateCells.add(`${r},${c}`);
        }
      }
    }
  }

  // Column duplicates (ignoring 0)
  for (let c = 0; c < size; c++) {
    const seen = new Map<number, number[]>();
    for (let r = 0; r < size; r++) {
      const val = userGrid[r]?.[c] ?? 0;
      if (val > 0) {
        const list = seen.get(val) || [];
        list.push(r);
        seen.set(val, list);
      }
    }
    for (const rows of seen.values()) {
      if (rows.length > 1) {
        for (const r of rows) {
          duplicateCells.add(`${r},${c}`);
        }
      }
    }
  }

  // Broken inequalities
  const brokenInequalities: FutoshikiInequality[] = [];
  for (const ineq of inequalities) {
    const v1 = userGrid[ineq.row1]?.[ineq.col1] ?? 0;
    const v2 = userGrid[ineq.row2]?.[ineq.col2] ?? 0;
    if (v1 > 0 && v2 > 0) {
      if (ineq.relation === '<' && !(v1 < v2)) {
        brokenInequalities.push(ineq);
      } else if (ineq.relation === '>' && !(v1 > v2)) {
        brokenInequalities.push(ineq);
      }
    }
  }

  return { duplicateCells, brokenInequalities };
}

export function isFutoshikiSolved(
  userGrid: number[][],
  solution: number[][],
  inequalities: FutoshikiInequality[]
): boolean {
  if (!userGrid || !solution || userGrid.length === 0 || userGrid.length !== solution.length) {
    return false;
  }
  const size = solution.length;
  for (let r = 0; r < size; r++) {
    if (!userGrid[r] || userGrid[r].length !== size) return false;
    for (let c = 0; c < size; c++) {
      const val = userGrid[r][c];
      if (val <= 0 || val !== solution[r][c]) {
        return false;
      }
    }
  }
  const { duplicateCells, brokenInequalities } = findFutoshikiViolations(userGrid, inequalities);
  if (duplicateCells.size > 0 || brokenInequalities.length > 0) {
    return false;
  }
  return true;
}

export function getSampleFutoshiki(
  size: 4 | 5 | 6,
  difficulty: FutoshikiDifficulty,
  index: number = 0
): FutoshikiData {
  const matching = SAMPLE_FUTOSHIKI_PUZZLES.filter(
    (p) => p.size === size && p.difficulty === difficulty
  );
  if (matching.length === 0) {
    return SAMPLE_FUTOSHIKI_PUZZLES[0];
  }
  return matching[Math.abs(index) % matching.length];
}

export const SAMPLE_FUTOSHIKI_PUZZLES: FutoshikiData[] = [
  {
    "size": 4,
    "difficulty": "easy",
    "initialGrid": [
      [
        0,
        4,
        0,
        0
      ],
      [
        0,
        0,
        4,
        2
      ],
      [
        0,
        0,
        0,
        4
      ],
      [
        0,
        2,
        0,
        0
      ]
    ],
    "solution": [
      [
        2,
        4,
        1,
        3
      ],
      [
        1,
        3,
        4,
        2
      ],
      [
        3,
        1,
        2,
        4
      ],
      [
        4,
        2,
        3,
        1
      ]
    ],
    "inequalities": [
      {
        "row1": 2,
        "col1": 2,
        "row2": 3,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 0,
        "row2": 1,
        "col2": 0,
        "relation": ">"
      },
      {
        "row1": 0,
        "col1": 1,
        "row2": 1,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 2,
        "col1": 1,
        "row2": 2,
        "col2": 2,
        "relation": "<"
      }
    ]
  },
  {
    "size": 4,
    "difficulty": "easy",
    "initialGrid": [
      [
        4,
        3,
        0,
        1
      ],
      [
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        4,
        0
      ],
      [
        1,
        0,
        0,
        2
      ]
    ],
    "solution": [
      [
        4,
        3,
        2,
        1
      ],
      [
        3,
        2,
        1,
        4
      ],
      [
        2,
        1,
        4,
        3
      ],
      [
        1,
        4,
        3,
        2
      ]
    ],
    "inequalities": [
      {
        "row1": 0,
        "col1": 2,
        "row2": 0,
        "col2": 3,
        "relation": ">"
      },
      {
        "row1": 0,
        "col1": 0,
        "row2": 1,
        "col2": 0,
        "relation": ">"
      },
      {
        "row1": 0,
        "col1": 1,
        "row2": 1,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 0,
        "col1": 0,
        "row2": 0,
        "col2": 1,
        "relation": ">"
      }
    ]
  },
  {
    "size": 4,
    "difficulty": "medium",
    "initialGrid": [
      [
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0
      ],
      [
        1,
        0,
        4,
        0
      ],
      [
        0,
        0,
        0,
        2
      ]
    ],
    "solution": [
      [
        3,
        4,
        2,
        1
      ],
      [
        2,
        3,
        1,
        4
      ],
      [
        1,
        2,
        4,
        3
      ],
      [
        4,
        1,
        3,
        2
      ]
    ],
    "inequalities": [
      {
        "row1": 0,
        "col1": 0,
        "row2": 1,
        "col2": 0,
        "relation": ">"
      },
      {
        "row1": 1,
        "col1": 1,
        "row2": 2,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 1,
        "col1": 0,
        "row2": 1,
        "col2": 1,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 0,
        "row2": 0,
        "col2": 1,
        "relation": "<"
      }
    ]
  },
  {
    "size": 4,
    "difficulty": "medium",
    "initialGrid": [
      [
        0,
        0,
        3,
        0
      ],
      [
        0,
        0,
        2,
        4
      ],
      [
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        1
      ]
    ],
    "solution": [
      [
        4,
        1,
        3,
        2
      ],
      [
        1,
        3,
        2,
        4
      ],
      [
        2,
        4,
        1,
        3
      ],
      [
        3,
        2,
        4,
        1
      ]
    ],
    "inequalities": [
      {
        "row1": 2,
        "col1": 1,
        "row2": 3,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 0,
        "col1": 2,
        "row2": 0,
        "col2": 3,
        "relation": ">"
      },
      {
        "row1": 1,
        "col1": 2,
        "row2": 1,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 1,
        "col1": 1,
        "row2": 1,
        "col2": 2,
        "relation": ">"
      }
    ]
  },
  {
    "size": 4,
    "difficulty": "hard",
    "initialGrid": [
      [
        0,
        0,
        0,
        0
      ],
      [
        3,
        0,
        0,
        0
      ],
      [
        2,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0
      ]
    ],
    "solution": [
      [
        1,
        3,
        4,
        2
      ],
      [
        3,
        2,
        1,
        4
      ],
      [
        2,
        4,
        3,
        1
      ],
      [
        4,
        1,
        2,
        3
      ]
    ],
    "inequalities": [
      {
        "row1": 0,
        "col1": 2,
        "row2": 0,
        "col2": 3,
        "relation": ">"
      },
      {
        "row1": 2,
        "col1": 2,
        "row2": 3,
        "col2": 2,
        "relation": ">"
      },
      {
        "row1": 1,
        "col1": 2,
        "row2": 2,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 2,
        "col1": 1,
        "row2": 2,
        "col2": 2,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 1,
        "row2": 3,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 1,
        "col1": 1,
        "row2": 2,
        "col2": 1,
        "relation": "<"
      }
    ]
  },
  {
    "size": 4,
    "difficulty": "hard",
    "initialGrid": [
      [
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0
      ],
      [
        0,
        4,
        0,
        0
      ],
      [
        0,
        3,
        0,
        0
      ]
    ],
    "solution": [
      [
        2,
        1,
        4,
        3
      ],
      [
        3,
        2,
        1,
        4
      ],
      [
        1,
        4,
        3,
        2
      ],
      [
        4,
        3,
        2,
        1
      ]
    ],
    "inequalities": [
      {
        "row1": 2,
        "col1": 0,
        "row2": 2,
        "col2": 1,
        "relation": "<"
      },
      {
        "row1": 3,
        "col1": 0,
        "row2": 3,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 1,
        "col1": 0,
        "row2": 1,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 1,
        "col1": 1,
        "row2": 1,
        "col2": 2,
        "relation": ">"
      }
    ]
  },
  {
    "size": 5,
    "difficulty": "easy",
    "initialGrid": [
      [
        0,
        0,
        0,
        1,
        0
      ],
      [
        5,
        0,
        0,
        0,
        0
      ],
      [
        4,
        1,
        2,
        0,
        0
      ],
      [
        2,
        0,
        0,
        4,
        0
      ],
      [
        0,
        5,
        0,
        0,
        0
      ]
    ],
    "solution": [
      [
        3,
        2,
        5,
        1,
        4
      ],
      [
        5,
        4,
        3,
        2,
        1
      ],
      [
        4,
        1,
        2,
        5,
        3
      ],
      [
        2,
        3,
        1,
        4,
        5
      ],
      [
        1,
        5,
        4,
        3,
        2
      ]
    ],
    "inequalities": [
      {
        "row1": 1,
        "col1": 1,
        "row2": 1,
        "col2": 2,
        "relation": ">"
      },
      {
        "row1": 2,
        "col1": 3,
        "row2": 3,
        "col2": 3,
        "relation": ">"
      },
      {
        "row1": 0,
        "col1": 1,
        "row2": 1,
        "col2": 1,
        "relation": "<"
      },
      {
        "row1": 1,
        "col1": 1,
        "row2": 2,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 1,
        "row2": 3,
        "col2": 2,
        "relation": ">"
      },
      {
        "row1": 0,
        "col1": 3,
        "row2": 0,
        "col2": 4,
        "relation": "<"
      }
    ]
  },
  {
    "size": 5,
    "difficulty": "easy",
    "initialGrid": [
      [
        0,
        1,
        0,
        0,
        0
      ],
      [
        3,
        0,
        0,
        1,
        0
      ],
      [
        4,
        0,
        0,
        2,
        5
      ],
      [
        2,
        0,
        0,
        4,
        1
      ],
      [
        0,
        0,
        0,
        0,
        0
      ]
    ],
    "solution": [
      [
        5,
        1,
        4,
        3,
        2
      ],
      [
        3,
        2,
        5,
        1,
        4
      ],
      [
        4,
        3,
        1,
        2,
        5
      ],
      [
        2,
        5,
        3,
        4,
        1
      ],
      [
        1,
        4,
        2,
        5,
        3
      ]
    ],
    "inequalities": [
      {
        "row1": 1,
        "col1": 3,
        "row2": 2,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 3,
        "row2": 0,
        "col2": 4,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 4,
        "row2": 4,
        "col2": 4,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 1,
        "row2": 0,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 2,
        "col1": 1,
        "row2": 3,
        "col2": 1,
        "relation": "<"
      }
    ]
  },
  {
    "size": 5,
    "difficulty": "medium",
    "initialGrid": [
      [
        0,
        0,
        1,
        0,
        0
      ],
      [
        0,
        0,
        5,
        0,
        0
      ],
      [
        0,
        4,
        2,
        0,
        0
      ],
      [
        3,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0
      ]
    ],
    "solution": [
      [
        5,
        2,
        1,
        4,
        3
      ],
      [
        2,
        3,
        5,
        1,
        4
      ],
      [
        1,
        4,
        2,
        3,
        5
      ],
      [
        3,
        1,
        4,
        5,
        2
      ],
      [
        4,
        5,
        3,
        2,
        1
      ]
    ],
    "inequalities": [
      {
        "row1": 0,
        "col1": 2,
        "row2": 1,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 2,
        "col1": 3,
        "row2": 2,
        "col2": 4,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 0,
        "row2": 0,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 1,
        "row2": 3,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 4,
        "row2": 1,
        "col2": 4,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 1,
        "row2": 1,
        "col2": 1,
        "relation": "<"
      },
      {
        "row1": 1,
        "col1": 0,
        "row2": 2,
        "col2": 0,
        "relation": ">"
      }
    ]
  },
  {
    "size": 5,
    "difficulty": "medium",
    "initialGrid": [
      [
        1,
        0,
        4,
        0,
        0
      ],
      [
        0,
        0,
        1,
        4,
        0
      ],
      [
        0,
        4,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        2,
        0,
        0
      ]
    ],
    "solution": [
      [
        1,
        2,
        4,
        5,
        3
      ],
      [
        2,
        3,
        1,
        4,
        5
      ],
      [
        3,
        4,
        5,
        2,
        1
      ],
      [
        4,
        5,
        3,
        1,
        2
      ],
      [
        5,
        1,
        2,
        3,
        4
      ]
    ],
    "inequalities": [
      {
        "row1": 0,
        "col1": 1,
        "row2": 1,
        "col2": 1,
        "relation": "<"
      },
      {
        "row1": 2,
        "col1": 3,
        "row2": 2,
        "col2": 4,
        "relation": ">"
      },
      {
        "row1": 2,
        "col1": 0,
        "row2": 3,
        "col2": 0,
        "relation": "<"
      },
      {
        "row1": 3,
        "col1": 0,
        "row2": 3,
        "col2": 1,
        "relation": "<"
      },
      {
        "row1": 1,
        "col1": 1,
        "row2": 2,
        "col2": 1,
        "relation": "<"
      },
      {
        "row1": 3,
        "col1": 4,
        "row2": 4,
        "col2": 4,
        "relation": "<"
      }
    ]
  },
  {
    "size": 5,
    "difficulty": "hard",
    "initialGrid": [
      [
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        3
      ],
      [
        5,
        0,
        0,
        0,
        0
      ]
    ],
    "solution": [
      [
        4,
        5,
        2,
        3,
        1
      ],
      [
        2,
        3,
        5,
        1,
        4
      ],
      [
        3,
        4,
        1,
        2,
        5
      ],
      [
        1,
        2,
        4,
        5,
        3
      ],
      [
        5,
        1,
        3,
        4,
        2
      ]
    ],
    "inequalities": [
      {
        "row1": 2,
        "col1": 3,
        "row2": 2,
        "col2": 4,
        "relation": "<"
      },
      {
        "row1": 4,
        "col1": 1,
        "row2": 4,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 1,
        "col1": 1,
        "row2": 1,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 1,
        "col1": 2,
        "row2": 1,
        "col2": 3,
        "relation": ">"
      },
      {
        "row1": 2,
        "col1": 1,
        "row2": 3,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 0,
        "col1": 3,
        "row2": 1,
        "col2": 3,
        "relation": ">"
      },
      {
        "row1": 0,
        "col1": 0,
        "row2": 1,
        "col2": 0,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 3,
        "row2": 4,
        "col2": 3,
        "relation": ">"
      },
      {
        "row1": 2,
        "col1": 0,
        "row2": 3,
        "col2": 0,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 4,
        "row2": 4,
        "col2": 4,
        "relation": ">"
      },
      {
        "row1": 2,
        "col1": 2,
        "row2": 2,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 1,
        "row2": 0,
        "col2": 2,
        "relation": ">"
      }
    ]
  },
  {
    "size": 5,
    "difficulty": "hard",
    "initialGrid": [
      [
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        2
      ],
      [
        0,
        0,
        0,
        3,
        0
      ],
      [
        2,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0
      ]
    ],
    "solution": [
      [
        5,
        3,
        4,
        2,
        1
      ],
      [
        4,
        5,
        3,
        1,
        2
      ],
      [
        1,
        4,
        2,
        3,
        5
      ],
      [
        2,
        1,
        5,
        4,
        3
      ],
      [
        3,
        2,
        1,
        5,
        4
      ]
    ],
    "inequalities": [
      {
        "row1": 3,
        "col1": 2,
        "row2": 3,
        "col2": 3,
        "relation": ">"
      },
      {
        "row1": 4,
        "col1": 0,
        "row2": 4,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 3,
        "row2": 4,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 3,
        "col1": 0,
        "row2": 4,
        "col2": 0,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 1,
        "row2": 1,
        "col2": 1,
        "relation": "<"
      },
      {
        "row1": 3,
        "col1": 1,
        "row2": 3,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 4,
        "col1": 2,
        "row2": 4,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 2,
        "col1": 0,
        "row2": 3,
        "col2": 0,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 1,
        "row2": 0,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 3,
        "col1": 1,
        "row2": 4,
        "col2": 1,
        "relation": "<"
      }
    ]
  },
  {
    "size": 6,
    "difficulty": "easy",
    "initialGrid": [
      [
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        2,
        0,
        6,
        0,
        0
      ],
      [
        0,
        6,
        3,
        0,
        0,
        0
      ],
      [
        3,
        0,
        0,
        0,
        2,
        0
      ],
      [
        2,
        1,
        0,
        3,
        0,
        4
      ],
      [
        6,
        5,
        0,
        0,
        0,
        0
      ]
    ],
    "solution": [
      [
        5,
        3,
        1,
        2,
        4,
        6
      ],
      [
        1,
        2,
        4,
        6,
        5,
        3
      ],
      [
        4,
        6,
        3,
        5,
        1,
        2
      ],
      [
        3,
        4,
        6,
        1,
        2,
        5
      ],
      [
        2,
        1,
        5,
        3,
        6,
        4
      ],
      [
        6,
        5,
        2,
        4,
        3,
        1
      ]
    ],
    "inequalities": [
      {
        "row1": 2,
        "col1": 2,
        "row2": 2,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 1,
        "col1": 4,
        "row2": 2,
        "col2": 4,
        "relation": ">"
      },
      {
        "row1": 0,
        "col1": 4,
        "row2": 1,
        "col2": 4,
        "relation": "<"
      },
      {
        "row1": 4,
        "col1": 1,
        "row2": 4,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 3,
        "col1": 4,
        "row2": 4,
        "col2": 4,
        "relation": "<"
      },
      {
        "row1": 5,
        "col1": 2,
        "row2": 5,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 1,
        "col1": 0,
        "row2": 2,
        "col2": 0,
        "relation": "<"
      },
      {
        "row1": 3,
        "col1": 3,
        "row2": 4,
        "col2": 3,
        "relation": "<"
      }
    ]
  },
  {
    "size": 6,
    "difficulty": "easy",
    "initialGrid": [
      [
        0,
        0,
        6,
        5,
        0,
        4
      ],
      [
        0,
        0,
        0,
        2,
        0,
        0
      ],
      [
        3,
        2,
        0,
        4,
        0,
        0
      ],
      [
        0,
        0,
        2,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        3,
        2,
        1
      ],
      [
        0,
        3,
        4,
        0,
        0,
        0
      ]
    ],
    "solution": [
      [
        2,
        1,
        6,
        5,
        3,
        4
      ],
      [
        5,
        4,
        3,
        2,
        1,
        6
      ],
      [
        3,
        2,
        1,
        4,
        6,
        5
      ],
      [
        6,
        5,
        2,
        1,
        4,
        3
      ],
      [
        4,
        6,
        5,
        3,
        2,
        1
      ],
      [
        1,
        3,
        4,
        6,
        5,
        2
      ]
    ],
    "inequalities": [
      {
        "row1": 5,
        "col1": 3,
        "row2": 5,
        "col2": 4,
        "relation": ">"
      },
      {
        "row1": 1,
        "col1": 3,
        "row2": 1,
        "col2": 4,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 4,
        "row2": 4,
        "col2": 4,
        "relation": ">"
      },
      {
        "row1": 2,
        "col1": 3,
        "row2": 2,
        "col2": 4,
        "relation": "<"
      },
      {
        "row1": 5,
        "col1": 2,
        "row2": 5,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 4,
        "col1": 3,
        "row2": 5,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 3,
        "col1": 0,
        "row2": 3,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 1,
        "col1": 1,
        "row2": 2,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 1,
        "col1": 0,
        "row2": 2,
        "col2": 0,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 5,
        "row2": 4,
        "col2": 5,
        "relation": ">"
      }
    ]
  },
  {
    "size": 6,
    "difficulty": "medium",
    "initialGrid": [
      [
        0,
        0,
        0,
        5,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        4,
        0
      ],
      [
        0,
        0,
        0,
        2,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        3,
        0
      ],
      [
        0,
        0,
        6,
        0,
        0,
        4
      ],
      [
        0,
        0,
        2,
        0,
        0,
        0
      ]
    ],
    "solution": [
      [
        1,
        4,
        3,
        5,
        2,
        6
      ],
      [
        2,
        6,
        1,
        3,
        4,
        5
      ],
      [
        6,
        5,
        4,
        2,
        1,
        3
      ],
      [
        4,
        1,
        5,
        6,
        3,
        2
      ],
      [
        3,
        2,
        6,
        1,
        5,
        4
      ],
      [
        5,
        3,
        2,
        4,
        6,
        1
      ]
    ],
    "inequalities": [
      {
        "row1": 0,
        "col1": 3,
        "row2": 0,
        "col2": 4,
        "relation": ">"
      },
      {
        "row1": 0,
        "col1": 4,
        "row2": 0,
        "col2": 5,
        "relation": "<"
      },
      {
        "row1": 1,
        "col1": 4,
        "row2": 2,
        "col2": 4,
        "relation": ">"
      },
      {
        "row1": 2,
        "col1": 2,
        "row2": 3,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 1,
        "row2": 1,
        "col2": 1,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 3,
        "row2": 1,
        "col2": 3,
        "relation": ">"
      },
      {
        "row1": 0,
        "col1": 2,
        "row2": 1,
        "col2": 2,
        "relation": ">"
      },
      {
        "row1": 0,
        "col1": 1,
        "row2": 0,
        "col2": 2,
        "relation": ">"
      },
      {
        "row1": 1,
        "col1": 1,
        "row2": 1,
        "col2": 2,
        "relation": ">"
      },
      {
        "row1": 4,
        "col1": 0,
        "row2": 4,
        "col2": 1,
        "relation": ">"
      }
    ]
  },
  {
    "size": 6,
    "difficulty": "medium",
    "initialGrid": [
      [
        4,
        1,
        0,
        0,
        0,
        5
      ],
      [
        6,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        3,
        0,
        0
      ],
      [
        0,
        0,
        6,
        0,
        1,
        0
      ],
      [
        0,
        0,
        0,
        0,
        6,
        0
      ]
    ],
    "solution": [
      [
        4,
        1,
        2,
        6,
        3,
        5
      ],
      [
        6,
        3,
        4,
        2,
        5,
        1
      ],
      [
        1,
        6,
        3,
        5,
        4,
        2
      ],
      [
        5,
        4,
        1,
        3,
        2,
        6
      ],
      [
        2,
        5,
        6,
        4,
        1,
        3
      ],
      [
        3,
        2,
        5,
        1,
        6,
        4
      ]
    ],
    "inequalities": [
      {
        "row1": 2,
        "col1": 4,
        "row2": 2,
        "col2": 5,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 4,
        "row2": 4,
        "col2": 4,
        "relation": ">"
      },
      {
        "row1": 1,
        "col1": 3,
        "row2": 2,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 5,
        "col1": 4,
        "row2": 5,
        "col2": 5,
        "relation": ">"
      },
      {
        "row1": 1,
        "col1": 5,
        "row2": 2,
        "col2": 5,
        "relation": "<"
      },
      {
        "row1": 3,
        "col1": 3,
        "row2": 4,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 1,
        "col1": 4,
        "row2": 2,
        "col2": 4,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 0,
        "row2": 3,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 5,
        "col1": 1,
        "row2": 5,
        "col2": 2,
        "relation": "<"
      }
    ]
  },
  {
    "size": 6,
    "difficulty": "hard",
    "initialGrid": [
      [
        0,
        4,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        2,
        0,
        0,
        4,
        0,
        0
      ],
      [
        0,
        0,
        2,
        0,
        5,
        0
      ],
      [
        0,
        0,
        0,
        0,
        3,
        0
      ]
    ],
    "solution": [
      [
        3,
        4,
        6,
        5,
        2,
        1
      ],
      [
        5,
        1,
        3,
        6,
        4,
        2
      ],
      [
        4,
        2,
        1,
        3,
        6,
        5
      ],
      [
        2,
        6,
        5,
        4,
        1,
        3
      ],
      [
        6,
        3,
        2,
        1,
        5,
        4
      ],
      [
        1,
        5,
        4,
        2,
        3,
        6
      ]
    ],
    "inequalities": [
      {
        "row1": 4,
        "col1": 1,
        "row2": 4,
        "col2": 2,
        "relation": ">"
      },
      {
        "row1": 2,
        "col1": 3,
        "row2": 2,
        "col2": 4,
        "relation": "<"
      },
      {
        "row1": 4,
        "col1": 5,
        "row2": 5,
        "col2": 5,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 3,
        "row2": 1,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 1,
        "col1": 4,
        "row2": 1,
        "col2": 5,
        "relation": ">"
      },
      {
        "row1": 2,
        "col1": 2,
        "row2": 2,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 4,
        "col1": 3,
        "row2": 4,
        "col2": 4,
        "relation": "<"
      },
      {
        "row1": 3,
        "col1": 1,
        "row2": 4,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 5,
        "row2": 4,
        "col2": 5,
        "relation": "<"
      },
      {
        "row1": 1,
        "col1": 1,
        "row2": 2,
        "col2": 1,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 1,
        "row2": 0,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 4,
        "col1": 2,
        "row2": 5,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 2,
        "col1": 4,
        "row2": 2,
        "col2": 5,
        "relation": ">"
      }
    ]
  },
  {
    "size": 6,
    "difficulty": "hard",
    "initialGrid": [
      [
        6,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        0,
        0,
        0,
        0,
        0,
        0
      ],
      [
        5,
        1,
        0,
        0,
        0,
        0
      ],
      [
        3,
        0,
        0,
        1,
        0,
        0
      ]
    ],
    "solution": [
      [
        6,
        5,
        4,
        2,
        3,
        1
      ],
      [
        4,
        3,
        2,
        5,
        1,
        6
      ],
      [
        1,
        2,
        5,
        6,
        4,
        3
      ],
      [
        2,
        6,
        1,
        3,
        5,
        4
      ],
      [
        5,
        1,
        3,
        4,
        6,
        2
      ],
      [
        3,
        4,
        6,
        1,
        2,
        5
      ]
    ],
    "inequalities": [
      {
        "row1": 1,
        "col1": 1,
        "row2": 1,
        "col2": 2,
        "relation": ">"
      },
      {
        "row1": 4,
        "col1": 2,
        "row2": 5,
        "col2": 2,
        "relation": "<"
      },
      {
        "row1": 2,
        "col1": 3,
        "row2": 3,
        "col2": 3,
        "relation": ">"
      },
      {
        "row1": 0,
        "col1": 4,
        "row2": 1,
        "col2": 4,
        "relation": ">"
      },
      {
        "row1": 1,
        "col1": 0,
        "row2": 1,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 2,
        "col1": 4,
        "row2": 2,
        "col2": 5,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 2,
        "row2": 3,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 3,
        "col1": 1,
        "row2": 4,
        "col2": 1,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 0,
        "row2": 3,
        "col2": 1,
        "relation": "<"
      },
      {
        "row1": 2,
        "col1": 2,
        "row2": 2,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 2,
        "row2": 0,
        "col2": 3,
        "relation": ">"
      },
      {
        "row1": 3,
        "col1": 3,
        "row2": 4,
        "col2": 3,
        "relation": "<"
      },
      {
        "row1": 0,
        "col1": 1,
        "row2": 0,
        "col2": 2,
        "relation": ">"
      }
    ]
  }
];
