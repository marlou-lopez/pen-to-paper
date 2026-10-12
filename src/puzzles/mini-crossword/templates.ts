export interface CrosswordTemplate {
  id: string;
  name: string;
  grid: string[][];
  blockerCount: number;
}

export const CROSSWORD_TEMPLATES: CrosswordTemplate[] = [
  {
    id: 'tmpl-2-corners-a',
    name: 'Top-Right & Bottom-Left (2 blockers)',
    blockerCount: 2,
    grid: [
      ['.', '.', '.', '.', '#'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['#', '.', '.', '.', '.'],
    ],
  },
  {
    id: 'tmpl-2-corners-b',
    name: 'Top-Left & Bottom-Right (2 blockers)',
    blockerCount: 2,
    grid: [
      ['#', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '#'],
    ],
  },
  {
    id: 'tmpl-4-quad-corners',
    name: 'Quad Corners (4 blockers)',
    blockerCount: 4,
    grid: [
      ['#', '.', '.', '.', '#'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['#', '.', '.', '.', '#'],
    ],
  },
  {
    id: 'tmpl-4-corner-doublets-a',
    name: 'Corner Doublets Horizontal (4 blockers)',
    blockerCount: 4,
    grid: [
      ['#', '#', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '#', '#'],
    ],
  },
  {
    id: 'tmpl-4-corner-doublets-b',
    name: 'Corner Doublets Reverse Horizontal (4 blockers)',
    blockerCount: 4,
    grid: [
      ['.', '.', '.', '#', '#'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['#', '#', '.', '.', '.'],
    ],
  },
  {
    id: 'tmpl-4-corner-vertical-a',
    name: 'Corner Doublets Vertical (4 blockers)',
    blockerCount: 4,
    grid: [
      ['#', '.', '.', '.', '.'],
      ['#', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '#'],
      ['.', '.', '.', '.', '#'],
    ],
  },
  {
    id: 'tmpl-4-corner-vertical-b',
    name: 'Corner Doublets Reverse Vertical (4 blockers)',
    blockerCount: 4,
    grid: [
      ['.', '.', '.', '.', '#'],
      ['.', '.', '.', '.', '#'],
      ['.', '.', '.', '.', '.'],
      ['#', '.', '.', '.', '.'],
      ['#', '.', '.', '.', '.'],
    ],
  },
  {
    id: 'tmpl-6-corner-l-a',
    name: 'L-Corner Clusters (6 blockers)',
    blockerCount: 6,
    grid: [
      ['#', '#', '.', '.', '.'],
      ['#', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '.'],
      ['.', '.', '.', '.', '#'],
      ['.', '.', '.', '#', '#'],
    ],
  },
  {
    id: 'tmpl-6-corner-l-b',
    name: 'Reverse L-Corner Clusters (6 blockers)',
    blockerCount: 6,
    grid: [
      ['.', '.', '.', '#', '#'],
      ['.', '.', '.', '.', '#'],
      ['.', '.', '.', '.', '.'],
      ['#', '.', '.', '.', '.'],
      ['#', '#', '.', '.', '.'],
    ],
  },
];
