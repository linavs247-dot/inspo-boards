// Loads the generated index and turns it into simple image objects.
// Extending later (tags, notes, favorites) means adding fields here and in
// scripts/build-index.mjs; the gallery and viewer just pass objects along.

import { config } from './config.js';

export async function loadLibrary() {
  // A pre-bundled preview can inline the index instead of fetching it.
  const raw = window.__LIBRARY__ ?? (await fetchIndex());

  const categories = (raw.categories ?? [])
    .map((cat) => {
      const id = cat.id ?? cat.name;
      const label = cat.label ?? cat.name ?? id;
      const images = (cat.images ?? []).map((img) => toItem(img, id, label));
      return { id, label, images };
    })
    .filter((cat) => cat.images.length > 0);

  return { categories, all: mix(categories) };
}

async function fetchIndex() {
  // "no-cache" still uses the browser cache, but checks for a newer index first,
  // so fresh uploads show up as soon as GitHub finishes publishing.
  const res = await fetch(config.dataUrl, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Index request failed (${res.status})`);
  return res.json();
}

function toItem(img, categoryId, categoryLabel) {
  const src = typeof img === 'string' ? img : img.src;
  return {
    src,
    url: toUrl(src),
    w: img.w || 0,
    h: img.h || 0,
    category: categoryId,
    categoryLabel,
    alt: altFrom(img.name ?? src, categoryLabel),
    isGif: /\.gif$/i.test(src),
  };
}

// Encodes each part of the path so spaces, #, ?, accents and emoji all work.
export function toUrl(src) {
  if (/^(data:|blob:|https?:)/.test(src)) return src;
  return src.split('/').map(encodeURIComponent).join('/');
}

function altFrom(src, categoryLabel) {
  const name = src.split('/').pop()
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  return `${name} (${categoryLabel})`;
}

// The ALL view: every image from every category, shuffled on each visit so
// old saves keep resurfacing instead of sinking to the bottom.
function mix(categories) {
  const all = categories.flatMap((c) => c.images);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}
