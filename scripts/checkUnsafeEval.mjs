#!/usr/bin/env node
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const distDir = path.resolve(process.cwd(), 'dist');

async function ensureDistExists() {
  try {
    const dirStats = await stat(distDir);
    if (!dirStats.isDirectory()) {
      console.error(`Expected \"${distDir}\" to be a directory with build artifacts.`);
      process.exit(1);
    }
  } catch (error) {
    if (error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')) {
      console.error('Build output not found. Run `npm run build` before running this check.');
      process.exit(1);
    }
    console.error('Unable to read build output directory:', error);
    process.exit(1);
  }
}

async function collectJsFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectJsFiles(fullPath)));
    } else if (entry.isFile() && /\.(js|mjs|cjs)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  await ensureDistExists();
  const jsFiles = await collectJsFiles(distDir);
  if (jsFiles.length === 0) {
    console.warn('No JavaScript bundles were found in the build output to scan.');
    process.exit(0);
  }

  const offenders = [];
  const pattern = 'new Function';

  for (const file of jsFiles) {
    const content = await readFile(file, 'utf8');
    if (content.includes(pattern)) {
      offenders.push(file);
    }
  }

  if (offenders.length > 0) {
    console.error('Found unsafe-eval patterns in the bundled output:');
    for (const offender of offenders) {
      console.error(` - ${offender}`);
    }
    process.exit(1);
  }

  console.log(`Scanned ${jsFiles.length} JavaScript bundle(s); no \"${pattern}\" occurrences detected.`);
}

await main();
