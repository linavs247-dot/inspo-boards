// Masonry gallery with endless scrolling.
//
// How it stays fast with thousands of images:
//  1. Cards are added in small batches as you get close to the bottom.
//  2. Every card already knows its image's shape (from the index), so the
//     layout never jumps while images load.
//  3. An image only starts downloading when it's about to scroll into view.
//  4. Images far off screen are released again (important for GIFs, which
//     keep using memory and battery while animating). They come back from
//     the browser cache instantly when you scroll back.

import { config } from './config.js';

const LOAD_MARGIN = '1200px 0px';   // start loading this far before the screen
const UNLOAD_MARGIN = '5000px 0px'; // release images further away than this
const FILL_AHEAD = 1600;            // keep this many pixels of cards ready below

export function createGallery(root, { onOpen }) {
  let items = [];
  let cards = [];
  let columns = [];
  let heights = [];
  let columnCount = 0;
  let rendered = 0;
  let showTags = false;
  let filling = false;

  const sentinel = document.createElement('div');
  sentinel.className = 'sentinel';
  sentinel.setAttribute('aria-hidden', 'true');
  root.after(sentinel);

  const loader = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && load(e.target)),
    { rootMargin: LOAD_MARGIN },
  );
  const releaser = new IntersectionObserver(
    (entries) => entries.forEach((e) => !e.isIntersecting && release(e.target)),
    { rootMargin: UNLOAD_MARGIN },
  );
  const more = new IntersectionObserver(
    (entries) => entries.some((e) => e.isIntersecting) && fill(),
    { rootMargin: `${FILL_AHEAD}px 0px` },
  );
  more.observe(sentinel);

  root.addEventListener('click', (event) => {
    const card = event.target.closest('.card');
    if (card) onOpen(Number(card.dataset.index));
  });

  new ResizeObserver(() => {
    if (columnsFor(root.clientWidth) !== columnCount) relayout();
  }).observe(root);

  // ----- public -----

  function setItems(list, { tags = false } = {}) {
    loader.disconnect();
    releaser.disconnect();
    items = list;
    cards = [];
    rendered = 0;
    showTags = tags;
    buildColumns();
    fill();
  }

  // Makes sure a card exists (used after browsing far ahead in the viewer).
  function reveal(index) {
    while (rendered <= index && rendered < items.length) appendBatch();
    const card = cards[index];
    if (!card || card.hidden) return;
    card.scrollIntoView({ block: 'nearest' });
    card.focus({ preventScroll: true });
  }

  // ----- layout -----

  function columnsFor(width) {
    if (width < 540) return 2;
    if (width < 880) return 3;
    if (width < 1240) return 4;
    return 5;
  }

  function buildColumns() {
    columnCount = columnsFor(root.clientWidth || window.innerWidth);
    columns = Array.from({ length: columnCount }, () => {
      const col = document.createElement('div');
      col.className = 'col';
      return col;
    });
    heights = new Array(columnCount).fill(0);
    root.replaceChildren(...columns);
  }

  function relayout() {
    const existing = cards.slice(0, rendered);
    buildColumns();
    existing.forEach((card, i) => place(card, items[i]));
  }

  // Shortest column first, measured in "image heights per column width",
  // so the math works before any image has loaded.
  function place(card, item) {
    let target = 0;
    for (let i = 1; i < columnCount; i++) if (heights[i] < heights[target] - 0.01) target = i;
    columns[target].append(card);
    heights[target] += ratioOf(item) + 0.03;
  }

  const ratioOf = (item) => (item.w && item.h ? Math.min(item.h / item.w, 4) : 1.25);

  // ----- endless scrolling -----

  function fill() {
    if (filling) return;
    filling = true;
    const step = () => {
      appendBatch();
      const needsMore = rendered < items.length &&
        sentinel.getBoundingClientRect().top < window.innerHeight + FILL_AHEAD;
      if (needsMore) requestAnimationFrame(step);
      else filling = false;
    };
    requestAnimationFrame(step);
  }

  function appendBatch() {
    const end = Math.min(rendered + config.batchSize, items.length);
    for (let i = rendered; i < end; i++) {
      const card = makeCard(items[i], i);
      cards[i] = card;
      place(card, items[i]);
      loader.observe(card);
      releaser.observe(card);
    }
    rendered = end;
  }

  // ----- cards -----

  function makeCard(item, index) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.dataset.index = index;
    card.style.aspectRatio = item.w && item.h ? `${item.w} / ${item.h}` : '4 / 5';
    card.style.setProperty('--ph', config.placeholders[index % config.placeholders.length]);

    const img = document.createElement('img');
    img.alt = item.alt;
    img.decoding = 'async';
    img.draggable = false;
    img.addEventListener('load', () => {
      card.classList.add('is-loaded');
      if (!item.w || !item.h) {
        item.w = img.naturalWidth;
        item.h = img.naturalHeight;
        card.style.aspectRatio = `${item.w} / ${item.h}`;
      }
    });
    img.addEventListener('error', () => {
      if (!img.getAttribute('src')) return; // released on purpose, not broken
      item.broken = true;
      card.hidden = true; // one broken file never breaks the rest
      loader.unobserve(card);
      releaser.unobserve(card);
    });
    card.append(img);

    if (showTags) {
      const tag = document.createElement('span');
      tag.className = 'tag';
      tag.textContent = item.categoryLabel;
      tag.setAttribute('aria-hidden', 'true');
      card.append(tag);
    }
    return card;
  }

  function load(card) {
    const img = card.firstElementChild;
    if (!img.getAttribute('src')) img.src = items[card.dataset.index].url;
  }

  function release(card) {
    const img = card.firstElementChild;
    if (!img.getAttribute('src')) return;
    card.classList.remove('is-loaded');
    img.removeAttribute('src');
  }

  return { setItems, reveal };
}
