// Category navigation, generated from the folders in library/.
//
// Two ways in, same links:
//  - the horizontal row of tabs, for quick jumps between favorites
//  - the ☰ list, a vertical list of every category (with a "find" box once
//    there are many), so you never have to scroll sideways hunting for one
//
// Every tab is a real link (#/fitness): the back button works and you can
// bookmark a category or add it to your phone's home screen.

import { config } from './config.js';

export function createNav({ navEl, sheet, menuBtn }, categories, total) {
  const entries = [
    { id: 'all', label: config.allLabel, count: total, star: true },
    ...categories.map((c) => ({ id: c.id, label: c.label, count: c.images.length })),
  ];
  const hrefFor = (id) => (id === 'all' ? '#/' : `#/${encodeURIComponent(id)}`);

  // ----- horizontal tabs -----
  navEl.replaceChildren(
    ...entries.map((e) => {
      const a = link(e, 'tab');
      a.append(`${e.star ? '✦ ' : ''}${e.label}`, count(e.count));
      return a;
    }),
  );

  // ----- vertical list -----
  const list = sheet.querySelector('.sheet-list');
  const find = sheet.querySelector('.sheet-find');
  const none = sheet.querySelector('.sheet-none');

  list.replaceChildren(
    ...entries.map((e) => {
      const li = document.createElement('li');
      const a = link(e, 'sheet-item');
      const name = document.createElement('span');
      name.className = 'sheet-name';
      name.textContent = `${e.star ? '✦ ' : ''}${e.label}`;
      a.append(name, count(e.count));
      a.addEventListener('click', () => sheet.close());
      li.append(a);
      return li;
    }),
  );

  find.hidden = categories.length < config.findFromCategories;
  find.addEventListener('input', () => {
    const q = normalize(find.value);
    let shown = 0;
    for (const li of list.children) {
      const match = !q || normalize(li.textContent).includes(q);
      li.hidden = !match;
      if (match) shown++;
    }
    none.hidden = shown > 0;
  });
  // Enter jumps to the first match.
  find.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const first = [...list.children].find((li) => !li.hidden)?.querySelector('a');
    if (first) first.click();
  });

  menuBtn.addEventListener('click', () => {
    find.value = '';
    find.dispatchEvent(new Event('input'));
    document.documentElement.classList.add('is-viewing');
    sheet.showModal();
    // Bring the current category into view inside the list.
    list.querySelector('[aria-current]')?.scrollIntoView({ block: 'center' });
  });
  sheet.querySelector('.sheet-close').addEventListener('click', () => sheet.close());
  sheet.addEventListener('click', (e) => { if (e.target === sheet) sheet.close(); });
  sheet.addEventListener('close', () => document.documentElement.classList.remove('is-viewing'));

  function link(entry, className) {
    const a = document.createElement('a');
    a.className = className;
    a.href = hrefFor(entry.id);
    a.dataset.id = entry.id;
    return a;
  }

  return {
    setActive(id) {
      for (const a of [...navEl.children, ...list.querySelectorAll('a')]) {
        if (a.dataset.id === id) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      }
      // Keep the active tab visible in the sideways row.
      const tab = navEl.querySelector('[aria-current]');
      if (tab) navEl.scrollTo({ left: tab.offsetLeft - navEl.offsetLeft - 8, behavior: 'smooth' });
    },
  };
}

function count(n) {
  const span = document.createElement('span');
  span.className = 'n';
  span.textContent = n.toLocaleString('en');
  return span;
}

const normalize = (text) =>
  text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
