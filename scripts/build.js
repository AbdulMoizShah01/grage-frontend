#!/usr/bin/env node
import { spawnSync } from 'child_process';
import path from 'path';

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit' });
  if (res.error) {
    console.error(res.error);
    process.exit(1);
  }
  if (res.status !== 0) process.exit(res.status);
}

const tscPath = path.resolve('node_modules', 'typescript', 'bin', 'tsc');
console.log('Running tsc:', tscPath);
run('node', [tscPath]);

const vitePath = path.resolve('node_modules', 'vite', 'bin', 'vite.js');
console.log('Running vite build:', vitePath);
run('node', [vitePath, 'build']);

// success
process.exit(0);
