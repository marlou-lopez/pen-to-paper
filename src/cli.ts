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
