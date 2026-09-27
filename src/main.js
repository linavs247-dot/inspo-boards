// Wires everything together: load the index, build the tabs, show the gallery.

import { config } from './config.js';
import { loadLibrary } from './data.js';
import { createNav } from './nav.js';
import { createGallery } from './gallery.js';
import { createLightbox } from './lightbox.js';

const $ = (id) => document.getElementById(id);

init();

async function init() {
  applyText();

  let library;
  try {
    library = await loadLibrary();
  } catch (err) {
    console.error(err);
    return showStatus(
      'The library index is missing',
      location.protocol === 'file:'
        ? 'Open the site through a local server: run <code>npm run dev</code> in the project folder.'
        : 'It\'s created automatically after each push. Check the Actions tab on GitHub for a failed run, or run <code>npm run build</code> locally.',
    );
  }

  if (!library.categories.length) {
    return showStatus(
      'Your library is empty',
      'Add images to a folder inside <code>library/</code>, then commit and push. They\'ll appear here a minute later.',
    );
  }

  const nav = createNav(
    { navEl: $('nav'), sheet: $('sheet'), menuBtn: $('menu-btn') },
    library.categories,
    library.all.length,
  );
  let currentList = [];

  const lightbox = createLightbox($('lightbox'), {
    onClose: (index) => gallery.reveal(index),
  });
  const gallery = createGallery($('gallery'), {
    onOpen: (index) => lightbox.open(currentList, index),
  });

  const route = () => {
    const id = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    const category = library.categories.find((c) => c.id === id);
    currentList = category ? category.images : library.all;

    nav.setActive(category ? category.id : 'all');
    gallery.setItems(currentList, { tags: !category });
    $('count').textContent = category
      ? `${plural(currentList.length)} in ${category.label}`
      : `${plural(currentList.length)}, all mixed together`;

    // When switching tabs further down the page, jump back to the first row.
    const navWrap = $('nav-wrap');
    const galleryTop = $('count').getBoundingClientRect().top + window.scrollY - navWrap.offsetHeight;
    if (window.scrollY > galleryTop) window.scrollTo({ top: galleryTop });
  };

  window.addEventListener('hashchange', route);
  route();
  watchStickyNav();
}

function applyText() {
  const titleText = document.querySelector('.title-text');
  titleText.textContent = config.title;
  document.title = config.title;
  $('subtitle').textContent = config.subtitle;
  $('subtitle').hidden = !config.subtitle;
}

function showStatus(heading, html) {
  const el = $('status');
  el.innerHTML = `<h2>${heading}</h2><p>${html}</p>`;
  el.hidden = false;
  $('gallery').hidden = true;
}

// Draws a thin line under the tabs once they stick to the top of the screen.
function watchStickyNav() {
  const navWrap = $('nav-wrap');
  const marker = document.createElement('div');
  navWrap.before(marker);
  new IntersectionObserver(([e]) => navWrap.classList.toggle('is-stuck', !e.isIntersecting)).observe(marker);
}

const plural = (n) => `${n.toLocaleString('en')} ${n === 1 ? 'image' : 'images'}`;
