// Full-screen viewer. Uses the native <dialog> element, which gives us
// focus handling, ESC to close, and an inert background for free.

export function createLightbox(dialog, { onClose }) {
  const stage = dialog.querySelector('.lb-stage');
  const img = dialog.querySelector('.lb-img');
  const error = dialog.querySelector('.lb-error');
  const prevBtn = dialog.querySelector('.lb-prev');
  const nextBtn = dialog.querySelector('.lb-next');

  let list = [];
  let index = 0;

  img.addEventListener('load', () => img.classList.add('is-loaded'));
  img.addEventListener('error', () => {
    if (!img.getAttribute('src')) return;
    img.hidden = true;
    error.hidden = false;
  });

  dialog.querySelector('.lb-close').addEventListener('click', close);
  prevBtn.addEventListener('click', () => show(index - 1));
  nextBtn.addEventListener('click', () => show(index + 1));

  // Tap or click anywhere outside the image closes the viewer.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target === stage) close();
  });

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });

  // ESC and the phone's back gesture both end up here.
  dialog.addEventListener('close', () => {
    document.documentElement.classList.remove('is-viewing');
    img.removeAttribute('src'); // stops a GIF from animating in the background
    img.classList.remove('is-loaded');
    onClose?.(index);
  });

  // Swipe left / right on touch screens.
  let startX = 0;
  let startY = 0;
  stage.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  stage.addEventListener('touchend', (e) => {
    if (e.changedTouches.length !== 1 || !startX) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    startX = 0;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(index + (dx < 0 ? 1 : -1));
  }, { passive: true });

  function open(items, startIndex) {
    list = items;
    index = startIndex;
    document.documentElement.classList.add('is-viewing');
    if (!dialog.open) dialog.showModal();
    show(startIndex);
  }

  function close() {
    if (dialog.open) dialog.close();
  }

  function show(i) {
    if (!list.length) return;
    const step = i < index ? -1 : 1;
    index = (i + list.length) % list.length;
    // Skip images that already failed in the gallery.
    for (let tries = 0; list[index].broken && tries < list.length; tries++) {
      index = (index + step + list.length) % list.length;
    }
    const item = list[index];
    img.classList.remove('is-loaded');
    img.hidden = false;
    error.hidden = true;
    img.alt = item.alt;
    if (item.w && item.h) {
      img.width = item.w;
      img.height = item.h;
    } else {
      img.removeAttribute('width');
      img.removeAttribute('height');
    }
    img.src = item.url;

    const single = list.length < 2;
    prevBtn.hidden = single;
    nextBtn.hidden = single;
    preload(index + 1);
    preload(index - 1);
  }

  function preload(i) {
    const item = list[(i + list.length) % list.length];
    if (item && !item.broken) new Image().src = item.url;
  }

  return { open, close };
}
