export type KenKenOp = '+' | '-' | '*' | '/' | 'none';

export type KenKenDifficulty = 'easy' | 'medium' | 'hard';

export interface KenKenCellCoord {
  row: number;
  col: number;
}

export interface KenKenCage {
  id: number;
  op: KenKenOp;
  target: number;
  cells: KenKenCellCoord[];
}

export interface KenKenData {
  size: number;
  grid: number[][];
  cages: KenKenCage[];
  date: string;
  difficulty: KenKenDifficulty;
}

export interface KenKenOptions {
  size?: number;
  difficulty?: KenKenDifficulty;
  date?: string;
  seed?: number | string;
}

export function createEmptyKenKenGrid(size: number): (number | null)[][] {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

export function isKenKenSolved(
  userGrid: (number | null)[][],
  puzzle: KenKenData
): boolean {
  const size = puzzle.size;
  if (!userGrid || userGrid.length !== size) return false;

  for (let r = 0; r < size; r++) {
    if (!userGrid[r] || userGrid[r].length !== size) return false;
    const rowSet = new Set<number>();
    for (let c = 0; c < size; c++) {
      const val = userGrid[r][c];
      if (val === null || val === undefined || val < 1 || val > size) return false;
      if (rowSet.has(val)) return false;
      rowSet.add(val);
    }
  }

  for (let c = 0; c < size; c++) {
    const colSet = new Set<number>();
    for (let r = 0; r < size; r++) {
      const val = userGrid[r][c];
      if (val === null || colSet.has(val)) return false;
      colSet.add(val);
    }
  }

  for (const cage of puzzle.cages) {
    const vals = cage.cells.map((cell) => userGrid[cell.row][cell.col]);
    if (vals.some((v) => v === null || v === undefined)) return false;
    const nums = vals as number[];

    if (cage.op === 'none') {
      if (nums[0] !== cage.target) return false;
    } else if (cage.op === '+') {
      const sum = nums.reduce((a, b) => a + b, 0);
      if (sum !== cage.target) return false;
    } else if (cage.op === '*') {
      const prod = nums.reduce((a, b) => a * b, 1);
      if (prod !== cage.target) return false;
    } else if (cage.op === '-') {
      if (nums.length !== 2) return false;
      if (Math.abs(nums[0] - nums[1]) !== cage.target) return false;
    } else if (cage.op === '/') {
      if (nums.length !== 2) return false;
      const max = Math.max(nums[0], nums[1]);
      const min = Math.min(nums[0], nums[1]);
      if (min === 0 || max % min !== 0 || max / min !== cage.target) return false;
    }
  }

  return true;
}

export function getBorderClasses(
  r: number,
  c: number,
  size: number,
  cellToCageId: Map<string, number>
): string {
  const currentCage = cellToCageId.get(`${r},${c}`);
  const topCage = r > 0 ? cellToCageId.get(`${r - 1},${c}`) : null;
  const bottomCage = r < size - 1 ? cellToCageId.get(`${r + 1},${c}`) : null;
  const leftCage = c > 0 ? cellToCageId.get(`${r},${c - 1}`) : null;
  const rightCage = c < size - 1 ? cellToCageId.get(`${r},${c + 1}`) : null;

  const classes: string[] = [];
  classes.push(r === 0 || topCage !== currentCage ? 'border-t-2 border-t-gray-950' : 'border-t border-t-gray-300 border-t-dashed');
  classes.push(r === size - 1 || bottomCage !== currentCage ? 'border-b-2 border-b-gray-950' : 'border-b border-b-gray-300 border-b-dashed');
  classes.push(c === 0 || leftCage !== currentCage ? 'border-l-2 border-l-gray-950' : 'border-l border-l-gray-300 border-l-dashed');
  classes.push(c === size - 1 || rightCage !== currentCage ? 'border-r-2 border-r-gray-950' : 'border-r border-r-gray-300 border-r-dashed');

  return classes.join(' ');
}

export function getBorderStylesForCell(
  r: number,
  c: number,
  size: number,
  cellToCageId: Map<string, number>
): Record<string, string> {
  const currentCage = cellToCageId.get(`${r},${c}`);
  const topCage = r > 0 ? cellToCageId.get(`${r - 1},${c}`) : null;
  const bottomCage = r < size - 1 ? cellToCageId.get(`${r + 1},${c}`) : null;
  const leftCage = c > 0 ? cellToCageId.get(`${r},${c - 1}`) : null;
  const rightCage = c < size - 1 ? cellToCageId.get(`${r},${c + 1}`) : null;

  return {
    borderTopWidth: r === 0 || topCage !== currentCage ? '2.5px' : '0.5px',
    borderBottomWidth: r === size - 1 || bottomCage !== currentCage ? '2.5px' : '0.5px',
    borderLeftWidth: c === 0 || leftCage !== currentCage ? '2.5px' : '0.5px',
    borderRightWidth: c === size - 1 || rightCage !== currentCage ? '2.5px' : '0.5px',
    borderTopStyle: r === 0 || topCage !== currentCage ? 'solid' : 'dotted',
    borderBottomStyle: r === size - 1 || bottomCage !== currentCage ? 'solid' : 'dotted',
    borderLeftStyle: c === 0 || leftCage !== currentCage ? 'solid' : 'dotted',
    borderRightStyle: c === size - 1 || rightCage !== currentCage ? 'solid' : 'dotted',
  };
}

export const SAMPLE_KENKEN_PUZZLES: Record<number, KenKenData> = {
  "3": {
    "size": 3,
    "grid": [
      [
        2,
        3,
        1
      ],
      [
        1,
        2,
        3
      ],
      [
        3,
        1,
        2
      ]
    ],
    "cages": [
      {
        "id": 0,
        "op": "/",
        "target": 2,
        "cells": [
          {
            "row": 0,
            "col": 0
          },
          {
            "row": 1,
            "col": 0
          }
        ]
      },
      {
        "id": 1,
        "op": "/",
        "target": 3,
        "cells": [
          {
            "row": 0,
            "col": 1
          },
          {
            "row": 0,
            "col": 2
          }
        ]
      },
      {
        "id": 2,
        "op": "*",
        "target": 6,
        "cells": [
          {
            "row": 1,
            "col": 1
          },
          {
            "row": 1,
            "col": 2
          }
        ]
      },
      {
        "id": 3,
        "op": "-",
        "target": 2,
        "cells": [
          {
            "row": 2,
            "col": 0
          },
          {
            "row": 2,
            "col": 1
          }
        ]
      },
      {
        "id": 4,
        "op": "none",
        "target": 2,
        "cells": [
          {
            "row": 2,
            "col": 2
          }
        ]
      }
    ],
    "date": "2026-10-12",
    "difficulty": "medium"
  },
  "4": {
    "size": 4,
    "grid": [
      [
        3,
        2,
        4,
        1
      ],
      [
        2,
        4,
        1,
        3
      ],
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
      ]
    ],
    "cages": [
      {
        "id": 0,
        "op": "+",
        "target": 5,
        "cells": [
          {
            "row": 0,
            "col": 0
          },
          {
            "row": 1,
            "col": 0
          }
        ]
      },
      {
        "id": 1,
        "op": "-",
        "target": 2,
        "cells": [
          {
            "row": 0,
            "col": 1
          },
          {
            "row": 1,
            "col": 1
          }
        ]
      },
      {
        "id": 2,
        "op": "-",
        "target": 3,
        "cells": [
          {
            "row": 0,
            "col": 2
          },
          {
            "row": 0,
            "col": 3
          }
        ]
      },
      {
        "id": 3,
        "op": "+",
        "target": 4,
        "cells": [
          {
            "row": 1,
            "col": 2
          },
          {
            "row": 2,
            "col": 2
          }
        ]
      },
      {
        "id": 4,
        "op": "-",
        "target": 1,
        "cells": [
          {
            "row": 1,
            "col": 3
          },
          {
            "row": 2,
            "col": 3
          }
        ]
      },
      {
        "id": 5,
        "op": "+",
        "target": 5,
        "cells": [
          {
            "row": 2,
            "col": 0
          },
          {
            "row": 2,
            "col": 1
          }
        ]
      },
      {
        "id": 6,
        "op": "/",
        "target": 3,
        "cells": [
          {
            "row": 3,
            "col": 0
          },
          {
            "row": 3,
            "col": 1
          }
        ]
      },
      {
        "id": 7,
        "op": "*",
        "target": 8,
        "cells": [
          {
            "row": 3,
            "col": 2
          },
          {
            "row": 3,
            "col": 3
          }
        ]
      }
    ],
    "date": "2026-10-12",
    "difficulty": "medium"
  },
  "5": {
    "size": 5,
    "grid": [
      [
        2,
        1,
        4,
        3,
        5
      ],
      [
        4,
        3,
        2,
        5,
        1
      ],
      [
        3,
        2,
        5,
        1,
        4
      ],
      [
        1,
        5,
        3,
        4,
        2
      ],
      [
        5,
        4,
        1,
        2,
        3
      ]
    ],
    "cages": [
      {
        "id": 0,
        "op": "/",
        "target": 2,
        "cells": [
          {
            "row": 0,
            "col": 0
          },
          {
            "row": 0,
            "col": 1
          }
        ]
      },
      {
        "id": 1,
        "op": "+",
        "target": 12,
        "cells": [
          {
            "row": 0,
            "col": 2
          },
          {
            "row": 0,
            "col": 3
          },
          {
            "row": 0,
            "col": 4
          }
        ]
      },
      {
        "id": 2,
        "op": "none",
        "target": 4,
        "cells": [
          {
            "row": 1,
            "col": 0
          }
        ]
      },
      {
        "id": 3,
        "op": "*",
        "target": 60,
        "cells": [
          {
            "row": 1,
            "col": 1
          },
          {
            "row": 1,
            "col": 2
          },
          {
            "row": 2,
            "col": 1
          },
          {
            "row": 2,
            "col": 2
          }
        ]
      },
      {
        "id": 4,
        "op": "+",
        "target": 11,
        "cells": [
          {
            "row": 1,
            "col": 3
          },
          {
            "row": 1,
            "col": 4
          },
          {
            "row": 2,
            "col": 4
          },
          {
            "row": 2,
            "col": 3
          }
        ]
      },
      {
        "id": 5,
        "op": "+",
        "target": 9,
        "cells": [
          {
            "row": 2,
            "col": 0
          },
          {
            "row": 3,
            "col": 0
          },
          {
            "row": 4,
            "col": 0
          }
        ]
      },
      {
        "id": 6,
        "op": "*",
        "target": 240,
        "cells": [
          {
            "row": 3,
            "col": 1
          },
          {
            "row": 4,
            "col": 1
          },
          {
            "row": 3,
            "col": 2
          },
          {
            "row": 3,
            "col": 3
          }
        ]
      },
      {
        "id": 7,
        "op": "-",
        "target": 1,
        "cells": [
          {
            "row": 3,
            "col": 4
          },
          {
            "row": 4,
            "col": 4
          }
        ]
      },
      {
        "id": 8,
        "op": "-",
        "target": 1,
        "cells": [
          {
            "row": 4,
            "col": 2
          },
          {
            "row": 4,
            "col": 3
          }
        ]
      }
    ],
    "date": "2026-10-12",
    "difficulty": "medium"
  },
  "6": {
    "size": 6,
    "grid": [
      [
        3,
        6,
        2,
        4,
        1,
        5
      ],
      [
        4,
        2,
        3,
        1,
        5,
        6
      ],
      [
        1,
        4,
        5,
        2,
        6,
        3
      ],
      [
        2,
        5,
        1,
        6,
        3,
        4
      ],
      [
        6,
        3,
        4,
        5,
        2,
        1
      ],
      [
        5,
        1,
        6,
        3,
        4,
        2
      ]
    ],
    "cages": [
      {
        "id": 0,
        "op": "+",
        "target": 15,
        "cells": [
          {
            "row": 0,
            "col": 0
          },
          {
            "row": 1,
            "col": 0
          },
          {
            "row": 0,
            "col": 1
          },
          {
            "row": 0,
            "col": 2
          }
        ]
      },
      {
        "id": 1,
        "op": "*",
        "target": 12,
        "cells": [
          {
            "row": 0,
            "col": 3
          },
          {
            "row": 1,
            "col": 3
          },
          {
            "row": 0,
            "col": 4
          },
          {
            "row": 1,
            "col": 2
          }
        ]
      },
      {
        "id": 2,
        "op": "-",
        "target": 1,
        "cells": [
          {
            "row": 0,
            "col": 5
          },
          {
            "row": 1,
            "col": 5
          }
        ]
      },
      {
        "id": 3,
        "op": "+",
        "target": 12,
        "cells": [
          {
            "row": 1,
            "col": 1
          },
          {
            "row": 2,
            "col": 1
          },
          {
            "row": 2,
            "col": 2
          },
          {
            "row": 3,
            "col": 2
          }
        ]
      },
      {
        "id": 4,
        "op": "+",
        "target": 18,
        "cells": [
          {
            "row": 1,
            "col": 4
          },
          {
            "row": 2,
            "col": 4
          },
          {
            "row": 2,
            "col": 5
          },
          {
            "row": 3,
            "col": 5
          }
        ]
      },
      {
        "id": 5,
        "op": "*",
        "target": 12,
        "cells": [
          {
            "row": 2,
            "col": 0
          },
          {
            "row": 3,
            "col": 0
          },
          {
            "row": 4,
            "col": 0
          }
        ]
      },
      {
        "id": 6,
        "op": "*",
        "target": 72,
        "cells": [
          {
            "row": 2,
            "col": 3
          },
          {
            "row": 3,
            "col": 3
          },
          {
            "row": 3,
            "col": 4
          },
          {
            "row": 4,
            "col": 4
          }
        ]
      },
      {
        "id": 7,
        "op": "none",
        "target": 5,
        "cells": [
          {
            "row": 3,
            "col": 1
          }
        ]
      },
      {
        "id": 8,
        "op": "*",
        "target": 3,
        "cells": [
          {
            "row": 4,
            "col": 1
          },
          {
            "row": 5,
            "col": 1
          }
        ]
      },
      {
        "id": 9,
        "op": "+",
        "target": 13,
        "cells": [
          {
            "row": 4,
            "col": 2
          },
          {
            "row": 5,
            "col": 2
          },
          {
            "row": 5,
            "col": 3
          }
        ]
      },
      {
        "id": 10,
        "op": "none",
        "target": 5,
        "cells": [
          {
            "row": 4,
            "col": 3
          }
        ]
      },
      {
        "id": 11,
        "op": "*",
        "target": 8,
        "cells": [
          {
            "row": 4,
            "col": 5
          },
          {
            "row": 5,
            "col": 5
          },
          {
            "row": 5,
            "col": 4
          }
        ]
      },
      {
        "id": 12,
        "op": "none",
        "target": 5,
        "cells": [
          {
            "row": 5,
            "col": 0
          }
        ]
      }
    ],
    "date": "2026-10-12",
    "difficulty": "medium"
  },
  "7": {
    "size": 7,
    "grid": [
      [
        6,
        1,
        4,
        7,
        3,
        2,
        5
      ],
      [
        2,
        4,
        3,
        5,
        6,
        1,
        7
      ],
      [
        7,
        3,
        6,
        2,
        1,
        5,
        4
      ],
      [
        5,
        2,
        1,
        3,
        4,
        7,
        6
      ],
      [
        4,
        7,
        2,
        1,
        5,
        6,
        3
      ],
      [
        3,
        5,
        7,
        6,
        2,
        4,
        1
      ],
      [
        1,
        6,
        5,
        4,
        7,
        3,
        2
      ]
    ],
    "cages": [
      {
        "id": 0,
        "op": "none",
        "target": 6,
        "cells": [
          {
            "row": 0,
            "col": 0
          }
        ]
      },
      {
        "id": 1,
        "op": "*",
        "target": 12,
        "cells": [
          {
            "row": 0,
            "col": 1
          },
          {
            "row": 0,
            "col": 2
          },
          {
            "row": 1,
            "col": 2
          }
        ]
      },
      {
        "id": 2,
        "op": "+",
        "target": 14,
        "cells": [
          {
            "row": 0,
            "col": 3
          },
          {
            "row": 1,
            "col": 3
          },
          {
            "row": 2,
            "col": 3
          }
        ]
      },
      {
        "id": 3,
        "op": "*",
        "target": 30,
        "cells": [
          {
            "row": 0,
            "col": 4
          },
          {
            "row": 0,
            "col": 5
          },
          {
            "row": 0,
            "col": 6
          },
          {
            "row": 1,
            "col": 5
          }
        ]
      },
      {
        "id": 4,
        "op": "*",
        "target": 14,
        "cells": [
          {
            "row": 1,
            "col": 0
          },
          {
            "row": 2,
            "col": 0
          }
        ]
      },
      {
        "id": 5,
        "op": "+",
        "target": 14,
        "cells": [
          {
            "row": 1,
            "col": 1
          },
          {
            "row": 2,
            "col": 1
          },
          {
            "row": 2,
            "col": 2
          },
          {
            "row": 3,
            "col": 2
          }
        ]
      },
      {
        "id": 6,
        "op": "*",
        "target": 72,
        "cells": [
          {
            "row": 1,
            "col": 4
          },
          {
            "row": 2,
            "col": 4
          },
          {
            "row": 3,
            "col": 4
          },
          {
            "row": 3,
            "col": 3
          }
        ]
      },
      {
        "id": 7,
        "op": "*",
        "target": 140,
        "cells": [
          {
            "row": 1,
            "col": 6
          },
          {
            "row": 2,
            "col": 6
          },
          {
            "row": 2,
            "col": 5
          }
        ]
      },
      {
        "id": 8,
        "op": "*",
        "target": 280,
        "cells": [
          {
            "row": 3,
            "col": 0
          },
          {
            "row": 4,
            "col": 0
          },
          {
            "row": 4,
            "col": 1
          },
          {
            "row": 3,
            "col": 1
          }
        ]
      },
      {
        "id": 9,
        "op": "*",
        "target": 252,
        "cells": [
          {
            "row": 3,
            "col": 5
          },
          {
            "row": 3,
            "col": 6
          },
          {
            "row": 4,
            "col": 5
          }
        ]
      },
      {
        "id": 10,
        "op": "+",
        "target": 18,
        "cells": [
          {
            "row": 4,
            "col": 2
          },
          {
            "row": 5,
            "col": 2
          },
          {
            "row": 6,
            "col": 2
          },
          {
            "row": 6,
            "col": 3
          }
        ]
      },
      {
        "id": 11,
        "op": "+",
        "target": 14,
        "cells": [
          {
            "row": 4,
            "col": 3
          },
          {
            "row": 5,
            "col": 3
          },
          {
            "row": 4,
            "col": 4
          },
          {
            "row": 5,
            "col": 4
          }
        ]
      },
      {
        "id": 12,
        "op": "+",
        "target": 8,
        "cells": [
          {
            "row": 4,
            "col": 6
          },
          {
            "row": 5,
            "col": 6
          },
          {
            "row": 5,
            "col": 5
          }
        ]
      },
      {
        "id": 13,
        "op": "*",
        "target": 18,
        "cells": [
          {
            "row": 5,
            "col": 0
          },
          {
            "row": 6,
            "col": 0
          },
          {
            "row": 6,
            "col": 1
          }
        ]
      },
      {
        "id": 14,
        "op": "none",
        "target": 5,
        "cells": [
          {
            "row": 5,
            "col": 1
          }
        ]
      },
      {
        "id": 15,
        "op": "*",
        "target": 42,
        "cells": [
          {
            "row": 6,
            "col": 4
          },
          {
            "row": 6,
            "col": 5
          },
          {
            "row": 6,
            "col": 6
          }
        ]
      }
    ],
    "date": "2026-10-12",
    "difficulty": "medium"
  },
  "8": {
    "size": 8,
    "grid": [
      [
        8,
        3,
        5,
        2,
        7,
        6,
        4,
        1
      ],
      [
        1,
        6,
        7,
        3,
        5,
        4,
        8,
        2
      ],
      [
        6,
        8,
        3,
        5,
        2,
        7,
        1,
        4
      ],
      [
        3,
        4,
        8,
        1,
        6,
        5,
        2,
        7
      ],
      [
        7,
        1,
        2,
        6,
        4,
        8,
        5,
        3
      ],
      [
        4,
        2,
        6,
        7,
        8,
        1,
        3,
        5
      ],
      [
        2,
        5,
        4,
        8,
        1,
        3,
        7,
        6
      ],
      [
        5,
        7,
        1,
        4,
        3,
        2,
        6,
        8
      ]
    ],
    "cages": [
      {
        "id": 0,
        "op": "+",
        "target": 18,
        "cells": [
          {
            "row": 0,
            "col": 0
          },
          {
            "row": 1,
            "col": 0
          },
          {
            "row": 1,
            "col": 1
          },
          {
            "row": 0,
            "col": 1
          }
        ]
      },
      {
        "id": 1,
        "op": "+",
        "target": 21,
        "cells": [
          {
            "row": 0,
            "col": 2
          },
          {
            "row": 1,
            "col": 2
          },
          {
            "row": 0,
            "col": 3
          },
          {
            "row": 0,
            "col": 4
          }
        ]
      },
      {
        "id": 2,
        "op": "*",
        "target": 24,
        "cells": [
          {
            "row": 0,
            "col": 5
          },
          {
            "row": 0,
            "col": 6
          }
        ]
      },
      {
        "id": 3,
        "op": "+",
        "target": 3,
        "cells": [
          {
            "row": 0,
            "col": 7
          },
          {
            "row": 1,
            "col": 7
          }
        ]
      },
      {
        "id": 4,
        "op": "+",
        "target": 10,
        "cells": [
          {
            "row": 1,
            "col": 3
          },
          {
            "row": 1,
            "col": 4
          },
          {
            "row": 2,
            "col": 4
          }
        ]
      },
      {
        "id": 5,
        "op": "none",
        "target": 4,
        "cells": [
          {
            "row": 1,
            "col": 5
          }
        ]
      },
      {
        "id": 6,
        "op": "+",
        "target": 16,
        "cells": [
          {
            "row": 1,
            "col": 6
          },
          {
            "row": 2,
            "col": 6
          },
          {
            "row": 3,
            "col": 6
          },
          {
            "row": 3,
            "col": 5
          }
        ]
      },
      {
        "id": 7,
        "op": "*",
        "target": 144,
        "cells": [
          {
            "row": 2,
            "col": 0
          },
          {
            "row": 3,
            "col": 0
          },
          {
            "row": 2,
            "col": 1
          }
        ]
      },
      {
        "id": 8,
        "op": "+",
        "target": 9,
        "cells": [
          {
            "row": 2,
            "col": 2
          },
          {
            "row": 2,
            "col": 3
          },
          {
            "row": 3,
            "col": 3
          }
        ]
      },
      {
        "id": 9,
        "op": "none",
        "target": 7,
        "cells": [
          {
            "row": 2,
            "col": 5
          }
        ]
      },
      {
        "id": 10,
        "op": "-",
        "target": 3,
        "cells": [
          {
            "row": 2,
            "col": 7
          },
          {
            "row": 3,
            "col": 7
          }
        ]
      },
      {
        "id": 11,
        "op": "*",
        "target": 224,
        "cells": [
          {
            "row": 3,
            "col": 1
          },
          {
            "row": 4,
            "col": 1
          },
          {
            "row": 4,
            "col": 0
          },
          {
            "row": 3,
            "col": 2
          }
        ]
      },
      {
        "id": 12,
        "op": "+",
        "target": 10,
        "cells": [
          {
            "row": 3,
            "col": 4
          },
          {
            "row": 4,
            "col": 4
          }
        ]
      },
      {
        "id": 13,
        "op": "+",
        "target": 14,
        "cells": [
          {
            "row": 4,
            "col": 2
          },
          {
            "row": 5,
            "col": 2
          },
          {
            "row": 4,
            "col": 3
          }
        ]
      },
      {
        "id": 14,
        "op": "-",
        "target": 3,
        "cells": [
          {
            "row": 4,
            "col": 5
          },
          {
            "row": 4,
            "col": 6
          }
        ]
      },
      {
        "id": 15,
        "op": "-",
        "target": 2,
        "cells": [
          {
            "row": 4,
            "col": 7
          },
          {
            "row": 5,
            "col": 7
          }
        ]
      },
      {
        "id": 16,
        "op": "*",
        "target": 8,
        "cells": [
          {
            "row": 5,
            "col": 0
          },
          {
            "row": 5,
            "col": 1
          }
        ]
      },
      {
        "id": 17,
        "op": "*",
        "target": 224,
        "cells": [
          {
            "row": 5,
            "col": 3
          },
          {
            "row": 6,
            "col": 3
          },
          {
            "row": 7,
            "col": 3
          }
        ]
      },
      {
        "id": 18,
        "op": "+",
        "target": 15,
        "cells": [
          {
            "row": 5,
            "col": 4
          },
          {
            "row": 6,
            "col": 4
          },
          {
            "row": 6,
            "col": 5
          },
          {
            "row": 7,
            "col": 4
          }
        ]
      },
      {
        "id": 19,
        "op": "+",
        "target": 17,
        "cells": [
          {
            "row": 5,
            "col": 5
          },
          {
            "row": 5,
            "col": 6
          },
          {
            "row": 6,
            "col": 6
          },
          {
            "row": 6,
            "col": 7
          }
        ]
      },
      {
        "id": 20,
        "op": "+",
        "target": 19,
        "cells": [
          {
            "row": 6,
            "col": 0
          },
          {
            "row": 7,
            "col": 0
          },
          {
            "row": 7,
            "col": 1
          },
          {
            "row": 6,
            "col": 1
          }
        ]
      },
      {
        "id": 21,
        "op": "/",
        "target": 4,
        "cells": [
          {
            "row": 6,
            "col": 2
          },
          {
            "row": 7,
            "col": 2
          }
        ]
      },
      {
        "id": 22,
        "op": "/",
        "target": 3,
        "cells": [
          {
            "row": 7,
            "col": 5
          },
          {
            "row": 7,
            "col": 6
          }
        ]
      },
      {
        "id": 23,
        "op": "none",
        "target": 8,
        "cells": [
          {
            "row": 7,
            "col": 7
          }
        ]
      }
    ],
    "date": "2026-10-12",
    "difficulty": "medium"
  },
  "9": {
    "size": 9,
    "grid": [
      [
        9,
        3,
        5,
        8,
        7,
        4,
        2,
        6,
        1
      ],
      [
        5,
        7,
        3,
        1,
        6,
        8,
        4,
        9,
        2
      ],
      [
        3,
        1,
        6,
        2,
        8,
        9,
        5,
        7,
        4
      ],
      [
        1,
        6,
        2,
        5,
        9,
        3,
        8,
        4,
        7
      ],
      [
        2,
        5,
        7,
        3,
        4,
        1,
        6,
        8,
        9
      ],
      [
        7,
        4,
        9,
        6,
        5,
        2,
        3,
        1,
        8
      ],
      [
        4,
        2,
        8,
        9,
        3,
        7,
        1,
        5,
        6
      ],
      [
        8,
        9,
        1,
        4,
        2,
        6,
        7,
        3,
        5
      ],
      [
        6,
        8,
        4,
        7,
        1,
        5,
        9,
        2,
        3
      ]
    ],
    "cages": [
      {
        "id": 0,
        "op": "+",
        "target": 22,
        "cells": [
          {
            "row": 0,
            "col": 0
          },
          {
            "row": 1,
            "col": 0
          },
          {
            "row": 1,
            "col": 1
          },
          {
            "row": 2,
            "col": 1
          }
        ]
      },
      {
        "id": 1,
        "op": "*",
        "target": 15,
        "cells": [
          {
            "row": 0,
            "col": 1
          },
          {
            "row": 0,
            "col": 2
          }
        ]
      },
      {
        "id": 2,
        "op": "none",
        "target": 8,
        "cells": [
          {
            "row": 0,
            "col": 3
          }
        ]
      },
      {
        "id": 3,
        "op": "+",
        "target": 13,
        "cells": [
          {
            "row": 0,
            "col": 4
          },
          {
            "row": 1,
            "col": 4
          }
        ]
      },
      {
        "id": 4,
        "op": "/",
        "target": 2,
        "cells": [
          {
            "row": 0,
            "col": 5
          },
          {
            "row": 0,
            "col": 6
          }
        ]
      },
      {
        "id": 5,
        "op": "+",
        "target": 22,
        "cells": [
          {
            "row": 0,
            "col": 7
          },
          {
            "row": 1,
            "col": 7
          },
          {
            "row": 2,
            "col": 7
          }
        ]
      },
      {
        "id": 6,
        "op": "-",
        "target": 1,
        "cells": [
          {
            "row": 0,
            "col": 8
          },
          {
            "row": 1,
            "col": 8
          }
        ]
      },
      {
        "id": 7,
        "op": "+",
        "target": 6,
        "cells": [
          {
            "row": 1,
            "col": 2
          },
          {
            "row": 1,
            "col": 3
          },
          {
            "row": 2,
            "col": 3
          }
        ]
      },
      {
        "id": 8,
        "op": "+",
        "target": 24,
        "cells": [
          {
            "row": 1,
            "col": 5
          },
          {
            "row": 1,
            "col": 6
          },
          {
            "row": 2,
            "col": 5
          },
          {
            "row": 3,
            "col": 5
          }
        ]
      },
      {
        "id": 9,
        "op": "+",
        "target": 4,
        "cells": [
          {
            "row": 2,
            "col": 0
          },
          {
            "row": 3,
            "col": 0
          }
        ]
      },
      {
        "id": 10,
        "op": "+",
        "target": 19,
        "cells": [
          {
            "row": 2,
            "col": 2
          },
          {
            "row": 3,
            "col": 2
          },
          {
            "row": 3,
            "col": 1
          },
          {
            "row": 3,
            "col": 3
          }
        ]
      },
      {
        "id": 11,
        "op": "-",
        "target": 1,
        "cells": [
          {
            "row": 2,
            "col": 4
          },
          {
            "row": 3,
            "col": 4
          }
        ]
      },
      {
        "id": 12,
        "op": "+",
        "target": 24,
        "cells": [
          {
            "row": 2,
            "col": 6
          },
          {
            "row": 3,
            "col": 6
          },
          {
            "row": 3,
            "col": 7
          },
          {
            "row": 3,
            "col": 8
          }
        ]
      },
      {
        "id": 13,
        "op": "none",
        "target": 4,
        "cells": [
          {
            "row": 2,
            "col": 8
          }
        ]
      },
      {
        "id": 14,
        "op": "+",
        "target": 15,
        "cells": [
          {
            "row": 4,
            "col": 0
          },
          {
            "row": 5,
            "col": 0
          },
          {
            "row": 6,
            "col": 0
          },
          {
            "row": 6,
            "col": 1
          }
        ]
      },
      {
        "id": 15,
        "op": "+",
        "target": 12,
        "cells": [
          {
            "row": 4,
            "col": 1
          },
          {
            "row": 4,
            "col": 2
          }
        ]
      },
      {
        "id": 16,
        "op": "+",
        "target": 26,
        "cells": [
          {
            "row": 4,
            "col": 3
          },
          {
            "row": 5,
            "col": 3
          },
          {
            "row": 6,
            "col": 3
          },
          {
            "row": 6,
            "col": 2
          }
        ]
      },
      {
        "id": 17,
        "op": "+",
        "target": 11,
        "cells": [
          {
            "row": 4,
            "col": 4
          },
          {
            "row": 5,
            "col": 4
          },
          {
            "row": 5,
            "col": 5
          }
        ]
      },
      {
        "id": 18,
        "op": "+",
        "target": 18,
        "cells": [
          {
            "row": 4,
            "col": 5
          },
          {
            "row": 4,
            "col": 6
          },
          {
            "row": 4,
            "col": 7
          },
          {
            "row": 5,
            "col": 6
          }
        ]
      },
      {
        "id": 19,
        "op": "*",
        "target": 72,
        "cells": [
          {
            "row": 4,
            "col": 8
          },
          {
            "row": 5,
            "col": 8
          }
        ]
      },
      {
        "id": 20,
        "op": "*",
        "target": 36,
        "cells": [
          {
            "row": 5,
            "col": 1
          },
          {
            "row": 5,
            "col": 2
          }
        ]
      },
      {
        "id": 21,
        "op": "+",
        "target": 10,
        "cells": [
          {
            "row": 5,
            "col": 7
          },
          {
            "row": 6,
            "col": 7
          },
          {
            "row": 6,
            "col": 6
          },
          {
            "row": 7,
            "col": 7
          }
        ]
      },
      {
        "id": 22,
        "op": "*",
        "target": 252,
        "cells": [
          {
            "row": 6,
            "col": 4
          },
          {
            "row": 7,
            "col": 4
          },
          {
            "row": 7,
            "col": 5
          },
          {
            "row": 6,
            "col": 5
          }
        ]
      },
      {
        "id": 23,
        "op": "+",
        "target": 16,
        "cells": [
          {
            "row": 6,
            "col": 8
          },
          {
            "row": 7,
            "col": 8
          },
          {
            "row": 8,
            "col": 8
          },
          {
            "row": 8,
            "col": 7
          }
        ]
      },
      {
        "id": 24,
        "op": "*",
        "target": 48,
        "cells": [
          {
            "row": 7,
            "col": 0
          },
          {
            "row": 8,
            "col": 0
          }
        ]
      },
      {
        "id": 25,
        "op": "*",
        "target": 72,
        "cells": [
          {
            "row": 7,
            "col": 1
          },
          {
            "row": 7,
            "col": 2
          },
          {
            "row": 8,
            "col": 1
          }
        ]
      },
      {
        "id": 26,
        "op": "+",
        "target": 16,
        "cells": [
          {
            "row": 7,
            "col": 3
          },
          {
            "row": 8,
            "col": 3
          },
          {
            "row": 8,
            "col": 2
          },
          {
            "row": 8,
            "col": 4
          }
        ]
      },
      {
        "id": 27,
        "op": "+",
        "target": 21,
        "cells": [
          {
            "row": 7,
            "col": 6
          },
          {
            "row": 8,
            "col": 6
          },
          {
            "row": 8,
            "col": 5
          }
        ]
      }
    ],
    "date": "2026-10-12",
    "difficulty": "medium"
  }
};
