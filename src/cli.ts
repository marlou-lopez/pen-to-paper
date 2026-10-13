#!/usr/bin/env node
import { runGenerator, RunOptions } from './index.js';

export function parseArgs(args: string[] = process.argv.slice(2)): RunOptions {
  const options: RunOptions = {
    difficulty: 'random',
    upload: false,
    outputDir: './output',
  };

  for (const arg of args) {
    if (arg.startsWith('--type=')) {
      options.type = arg.slice(arg.indexOf('=') + 1) as RunOptions['type'];
    } else if (arg.startsWith('--difficulty=')) {
      options.difficulty = arg.slice(arg.indexOf('=') + 1);
    } else if (arg.startsWith('--theme=')) {
      options.theme = arg.slice(arg.indexOf('=') + 1);
    } else if (arg.startsWith('--date=')) {
      options.date = arg.slice(arg.indexOf('=') + 1);
    } else if (arg.startsWith('--dest=')) {
      options.outputDir = arg.slice(arg.indexOf('=') + 1);
    } else if (arg === '--upload') {
      options.upload = true;
    } else if (arg === '--daily') {
      options.daily = true;
    } else if (arg.startsWith('--folder=')) {
      options.folder = arg.slice(arg.indexOf('=') + 1);
    } else if (arg.startsWith('--grid=')) {
      options.grid = arg.slice(arg.indexOf('=') + 1);
      if (!options.type) {
        options.type = 'sudoku';
      }
    } else if (arg.startsWith('--size=')) {
      const parsedSize = parseInt(arg.slice(arg.indexOf('=') + 1), 10);
      if (!isNaN(parsedSize)) {
        options.size = parsedSize;
      }
    }
  }

  if (options.type === 'kenken') {
    if (options.size === undefined) {
      options.size = 6;
    } else {
      options.size = Math.max(3, Math.min(9, options.size));
    }
    if (options.difficulty === 'random') {
      options.difficulty = 'medium';
    }
  } else if (options.type === 'kakuro') {
    if (options.size === undefined) {
      options.size = 8;
    } else {
      if (options.size <= 6) options.size = 6;
      else if (options.size <= 8) options.size = 8;
      else options.size = 10;
    }
    if (options.difficulty === 'random') {
      options.difficulty = 'medium';
    }
  } else if (options.type === 'futoshiki') {
    if (options.size === undefined) {
      options.size = 5;
    } else {
      options.size = Math.max(4, Math.min(6, options.size));
    }
    if (options.difficulty === 'random') {
      options.difficulty = 'medium';
    }
  }

  return options;
}

async function main() {
  const options = parseArgs();
  console.log(`--- Pen to Paper Daily Puzzle Generator ---`);
  console.log(`Type: ${options.type || 'all'} | Difficulty: ${options.difficulty || 'auto'} | Daily: ${Boolean(options.daily)} | Upload: ${Boolean(options.upload)}`);

  try {
    const results = await runGenerator(options);
    console.log(`\nSuccessfully generated ${results.length} puzzle(s):`);
    results.forEach((r) => {
      console.log(`- [${r.puzzle.metadata.displayName}] ${r.deliveredPath}`);
    });
  } catch (err: any) {
    console.error('Error generating puzzles:', err.message);
    process.exit(1);
  }
}

main();
