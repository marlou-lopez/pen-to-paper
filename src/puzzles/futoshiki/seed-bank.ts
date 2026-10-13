import { FutoshikiData, FutoshikiDifficulty } from './types.js';

/**
 * 18 handcrafted and verified unique Futoshiki seed puzzles.
 * Covers sizes 4x4, 5x5, and 6x6 across easy, medium, and hard difficulty tiers.
 */
export const FUTOSHIKI_SEED_BANK: FutoshikiData[] = [
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

/**
 * Retrieves a seed puzzle deterministically selected based on date string.
 * Returns deep copies of initialGrid, solution, and inequalities.
 */
export function getSeedFutoshiki(
  size: number,
  difficulty: FutoshikiDifficulty,
  dateStr?: string
): FutoshikiData {
  const today = dateStr ?? new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) >>> 0;
  }

  const clampedSize = (size <= 4 ? 4 : size >= 6 ? 6 : 5) as 4 | 5 | 6;
  const matching = FUTOSHIKI_SEED_BANK.filter(
    (p) => p.size === clampedSize && p.difficulty === difficulty
  );
  const pool = matching.length > 0 ? matching : FUTOSHIKI_SEED_BANK;
  const base = pool[hash % pool.length];

  return {
    size: base.size,
    difficulty: base.difficulty,
    initialGrid: base.initialGrid.map((row) => [...row]),
    solution: base.solution.map((row) => [...row]),
    inequalities: base.inequalities.map((ineq) => ({ ...ineq })),
    dateStr: today,
  };
}
