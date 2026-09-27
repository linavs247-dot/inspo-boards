// Everything you might want to tweak lives here.
export const config = {
  // Main heading, shown with a yellow highlighter stroke underneath.
  title: 'My Inspo Boards',
  // Small line next to the title. Set to '' to hide it.
  subtitle: 'A visual archive of things I want to remember, revisit, and use someday.',

  // Name of the "everything" tab.
  allLabel: 'All',

  // Show a "Find a category" box in the category list once you have this many.
  findFromCategories: 12,

  // How many images are added to the page at a time while scrolling.
  batchSize: 30,

  // Where the generated index lives (created by GitHub Actions).
  dataUrl: 'data/library.json',

  // Placeholder colors shown while an image is loading.
  placeholders: ['var(--yellow)', 'var(--pink)', 'var(--lav)', 'var(--violet)'],
};
