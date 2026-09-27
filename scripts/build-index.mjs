// Builds data/library.json from the folders inside library/.
//
//   library/<category folder>/<any image file>
//
// Each folder becomes a category. Filenames are never treated as metadata,
// so "Screenshot 2026-09-20 at 10.34.21.png" works fine. Images inside
// sub-folders are included in their top-level category. Empty folders are
// left out, so a category only appears once it has at least one image.
//
// Run locally with:  npm run build   (or: node scripts/build-index.mjs)

import { readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { readImageSize } from './image-size.mjs';

const ROOT = process.cwd();
const LIBRARY_DIR = 'library';
const OUTPUT_FILE = 'data/library.json';

const SUPPORTED = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif', '.svg', '.bmp']);
// Formats most browsers can't show. They are skipped with a warning.
const UNSUPPORTED_HINTS = new Set(['.heic', '.heif', '.tif', '.tiff', '.psd', '.mp4', '.mov', '.webm']);

const warnings = [];

async function main() {
  const libraryPath = path.join(ROOT, LIBRARY_DIR);
  const addedTimes = gitAddedTimes();

  const folders = (await readdir(libraryPath, { withFileTypes: true }))
    .filter((d) => d.isDirectory() && !isHidden(d.name))
    .map((d) => d.name);

  const categories = [];
  for (const folder of folders) {
    const files = await collectFiles(path.join(libraryPath, folder));
    const images = [];

    for (const abs of files) {
      const rel = toPosix(path.relative(ROOT, abs));
      const ext = path.extname(abs).toLowerCase();
      if (!SUPPORTED.has(ext)) {
        if (UNSUPPORTED_HINTS.has(ext)) warnings.push(`Skipped ${rel} (${ext} files don't display in most browsers)`);
        continue;
      }
      const size = await readImageSize(abs);
      if (!size) warnings.push(`Couldn't read the size of ${rel}; the site will measure it when it loads`);
      const added = addedTimes.get(rel) ?? Math.round((await stat(abs)).mtimeMs / 1000);
      images.push({ src: rel, w: size?.w ?? 0, h: size?.h ?? 0, added });
    }

    if (!images.length) continue; // hide empty categories

    // Newest first, so recent saves show up at the top of a category.
    images.sort((a, b) => b.added - a.added || collator.compare(a.src, b.src));

    const { order, label } = parseFolderName(folder);
    categories.push({ id: slugify(label) || folder, folder, label, order, count: images.length, images });
  }

  categories.sort((a, b) => a.order - b.order || collator.compare(a.label, b.label));
  const total = categories.reduce((sum, c) => sum + c.count, 0);

  const index = {
    version: 1,
    generatedAt: new Date().toISOString(),
    total,
    categories: categories.map(({ order, ...rest }) => rest),
  };

  await mkdir(path.join(ROOT, path.dirname(OUTPUT_FILE)), { recursive: true });
  await writeFile(path.join(ROOT, OUTPUT_FILE), JSON.stringify(index));

  for (const w of warnings) console.warn(`⚠ ${w}`);
  console.log(`✓ ${total} images in ${categories.length} categories written to ${OUTPUT_FILE}`);
  for (const c of categories) console.log(`  ${c.label.padEnd(22)} ${c.count}`);
}

async function collectFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (isHidden(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await collectFiles(abs)));
    else if (entry.isFile()) out.push(abs);
  }
  return out;
}

// Optional ordering: a folder named "1-design" or "01_design" sorts first and
// shows up as "design". Folders without a number are sorted alphabetically.
function parseFolderName(folder) {
  const m = folder.match(/^(\d+)[-_ .]+(.+)$/);
  const raw = m ? m[2] : folder;
  const label = raw.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return { order: m ? Number(m[1]) : Number.MAX_SAFE_INTEGER, label };
}

function slugify(text) {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// When each file was first committed, read from git history in one command.
// Returns an empty map when git history isn't available (e.g. local copies).
function gitAddedTimes() {
  const times = new Map();
  try {
    const out = execFileSync(
      'git',
      ['-c', 'core.quotePath=false', 'log', '--no-renames', '--diff-filter=A', '--name-only', '--format=%x00%ct', '--', LIBRARY_DIR],
      { cwd: ROOT, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] },
    );
    for (const block of out.split('\0')) {
      const lines = block.split('\n').filter(Boolean);
      const ts = Number(lines.shift());
      if (!ts) continue;
      // git log lists newest commits first; keep the most recent "added" time.
      for (const file of lines) if (!times.has(file)) times.set(file, ts);
    }
  } catch {
    // Not a git checkout. File modification times are used instead.
  }
  return times;
}

const isHidden = (name) => name.startsWith('.') || name.startsWith('_');
const toPosix = (p) => p.split(path.sep).join('/');
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
