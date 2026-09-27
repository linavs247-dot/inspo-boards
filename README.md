# My Inspo Boards

A small, personal visual archive for screenshots, GIFs and visual references.
Folders become categories. You add images, push, and the website updates itself.

```
You drop a screenshot into library/fitness/
        ↓  commit + push
GitHub Actions scans library/ and writes data/library.json
        ↓
GitHub Pages publishes the site
        ↓
The website reads library.json and shows your images
```

There is no database, no login, no upload screen. Your GitHub repository is the storage,
and the folders inside `library/` are the only organization you ever do.

---

## What's in the project

```
inspiration-library/
├── .github/
│   └── workflows/
│       └── deploy.yml        ← the automation (runs on every push, don't edit)
├── library/                  ← YOUR IMAGES LIVE HERE
│   ├── content/
│   ├── creators/
│   ├── design/
│   ├── fitness/
│   ├── food/
│   ├── products/
│   └── stretching/
├── src/                      ← the website's code
│   ├── config.js             ← title, subtitle and a few settings you can change
│   ├── main.js               ← connects everything
│   ├── data.js               ← reads the image index
│   ├── nav.js                ← category tabs + the ☰ category list
│   ├── gallery.js            ← masonry layout + endless scrolling
│   └── lightbox.js           ← full-screen viewer
├── styles/
│   └── main.css              ← colors, fonts, layout
├── scripts/
│   ├── build-index.mjs       ← finds your images and writes the index
│   ├── image-size.mjs        ← reads each image's width and height
│   └── serve.mjs             ← optional local preview
├── assets/                   ← favicon and phone home-screen icon
├── index.html
├── package.json
└── README.md
```

**Why a `library/` folder instead of putting categories at the top level?**
It keeps your images separate from the website's own files. That way `src`, `styles` or
`assets` can never accidentally show up as a category, and you always know where images go.

**Why no framework (React, Vue, etc.)?**
The site does four things: read a list, lay out images, filter by category, open a viewer.
Plain JavaScript does that in about 500 lines, with nothing to install, update or break.
There is no build step for the website itself.

---

## Setup (about 10 minutes, once)

### 1. Create the repository

1. Go to [github.com/new](https://github.com/new).
2. Name it something like `inspiration-library`. The name becomes part of your web address.
3. Choose **Public** (see the next section before you decide).
4. Don't add a README, .gitignore or license. The project already has them.
5. Click **Create repository**.

### 2. Public or private?

This is the most important thing to understand before you start:

- **On a free GitHub account, GitHub Pages only works with public repositories.**
  Anyone who finds the repository can see every image in it.
- **On a paid plan (GitHub Pro), the repository can be private**, but the **website is still
  public**. Anyone who has the link can open it. Only the files on GitHub stay private.
- The site includes a "noindex" tag, so Google and other search engines are asked not to
  list it or its images. That makes it hard to stumble upon, not locked.

**In practice:** treat the library as "unlisted." It's fine for design references, content ideas,
food and exercises. Don't put anything in it that you would mind a stranger seeing
(IDs, bank screens, private messages, client work under NDA).

If you ever need it truly private with a password, that's a future upgrade (for example,
hosting on Cloudflare Pages with Cloudflare Access). The files and folders would stay exactly the same.

### 3. Add the project files

The easiest way, with no command line:

1. Install [GitHub Desktop](https://desktop.github.com/) and sign in.
2. In GitHub Desktop: **File → Clone repository**, pick your new repository, choose a folder on your computer.
3. Unzip this project and copy **everything inside it** into that folder.
   Include the hidden `.github` folder. On a Mac, press `Cmd + Shift + .` in Finder to see hidden files.
   On Windows, turn on **View → Show → Hidden items**.
4. Back in GitHub Desktop, write a summary like "First version" and click **Commit to main**, then **Push origin**.

### 4. Turn on GitHub Pages

1. On github.com, open your repository → **Settings** → **Pages** (left sidebar).
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. That's it. There's nothing else to select.

### 5. Run it the first time

1. Open the **Actions** tab of your repository.
2. If you see a workflow called **Update library**, it may already be running from your push.
   If not, click **Update library → Run workflow → Run workflow**.
3. Wait for the green check mark (usually 1 to 2 minutes).

GitHub Actions is turned on by default for new repositories. If the Actions tab says workflows
are disabled, click the button to enable them.

### 6. Open your library

Your address is:

```
https://YOUR-GITHUB-USERNAME.github.io/REPOSITORY-NAME/
```

For example: `https://linabell.github.io/inspiration-library/`

You can also find it in **Settings → Pages** ("Your site is live at…").

**On your phone:** open the link in Safari or Chrome and use **Share → Add to Home Screen**.
It gets its own icon. You can also bookmark a single category, like `…/inspiration-library/#/fitness`.

### 7. Remove the sample images

The project comes with a few placeholder images so the first version isn't empty.
They all start with the word `sample`. Delete them once your own images are in.

---

## Everyday use

### Where to put images

Inside a category folder in `library/`:

```
library/fitness/Screenshot 2026-09-20 at 10.34.21.png
library/food/IMG_4821.jpg
library/stretching/hip opener.gif
```

Then commit and push (GitHub Desktop: **Commit to main → Push origin**).
The site updates by itself about 1 to 2 minutes later.

### Supported file types

| Works | Doesn't work (skipped, with a warning in the Actions log) |
| --- | --- |
| `.png` `.jpg` `.jpeg` `.gif` `.webp` `.avif` `.svg` `.bmp` | `.heic` `.heif` (iPhone camera photos), `.tif`, `.psd`, videos (`.mp4`, `.mov`) |

Extensions work in any capitalization (`.PNG`, `.Jpg`).

iPhone **screenshots** are PNG and work as-is. iPhone **camera photos** are often HEIC:
export them as JPG first, or set **Settings → Camera → Formats → Most Compatible**.

### Adding a new category

Create a new folder inside `library/` and put at least one image in it. Push. The tab appears automatically.

- A folder with no images is hidden until you add one. (Git also can't store a completely empty folder.)
- Folder names can use spaces, dashes or underscores: `home-decor` shows as **HOME DECOR**.
- Every category shows up twice: in the sideways row of tabs, and in the **☰ Categories** list,
  which shows them all vertically. Once you have 12 or more categories, the list also gets a
  "Find a category" box: type a few letters (accents don't matter) and press Enter.
- Tabs are sorted alphabetically. To choose the order, start folder names with a number:
  `1-design`, `2-content`, `3-fitness`. The number is hidden in the tab.
- Images inside sub-folders are included in their top-level category
  (`library/fitness/legs/squat.gif` shows under **FITNESS**).

### Renaming a category

Rename the folder on your computer (in Finder or File Explorer), then commit and push with GitHub Desktop.
GitHub Desktop shows it as many files moved; that's normal.

The github.com website can't rename folders directly, which is why doing it on your computer is easier.

### Deleting an image

- **On your computer:** delete the file, then commit and push in GitHub Desktop.
- **On github.com:** open the image → click the **⋯** menu (top right) → **Delete file** → **Commit changes**.

It disappears from the site after the next update.

### Adding images without a computer

On github.com (also works in a phone browser): open the category folder → **Add file → Upload files**
→ drop images → **Commit changes**. The web upload takes up to 100 files at a time.
For hundreds of existing screenshots, GitHub Desktop is much faster.

### How long updates take

Usually 1 to 2 minutes after you push. Your browser may keep showing already-seen images for up to
10 minutes (GitHub's standard caching); a normal refresh fixes it.

---

## Filenames

Filenames are **never** used as data. You don't need to rename anything.
Spaces, accents, emoji, `#`, `%`, parentheses and long macOS screenshot names all work:

```
library/design/Screenshot 2026-09-20 at 10.34.21.png   ✓
library/food/café #3 (final).jpg                        ✓
```

The only rule: files and folders that start with `.` or `_` are ignored (useful for hiding a folder temporarily).

The filename is used only as the image description for screen readers.

---

## How it works (the short version)

**Image detection.** Every time you push, GitHub Actions runs `scripts/build-index.mjs`.
It looks through every folder in `library/`, keeps files with a supported extension, reads each
image's width and height straight from the file (no image libraries needed), and writes
everything into `data/library.json`. You never edit that file; it isn't even stored in the repository.
It's rebuilt fresh on every update.

**Categories.** Each folder in `library/` is one category. Empty folders are skipped.

**Order.** Inside a category, the newest images (by the date they were first committed) come first.
The **ALL** view shuffles everything on each visit, so old saves keep resurfacing.

**GitHub Actions** is GitHub's built-in automation. The instructions live in
`.github/workflows/deploy.yml`: "whenever something is pushed to `main`, build the index and publish the site."
You can watch every run in the **Actions** tab. It's free for public repositories.

**GitHub Pages** is GitHub's free hosting for static websites. The workflow hands it the finished
files, and Pages serves them at your `github.io` address.

**Performance.** The page never loads all your images at once:

- Cards are added in batches of 30 as you scroll.
- Because the index already knows every image's size, space is reserved before the image
  arrives, so nothing jumps around.
- Images only download when they're about to scroll into view.
- Images far off screen are released again. This matters most for GIFs, which keep using
  memory and battery while they animate. Scrolling back brings them back instantly from cache.

Tested with 3,200 images: the index is about 22 KB to download, and only around 50 images are
held in memory at any moment, no matter how far you scroll.

---

## What you do vs. what happens automatically

**You do (once):** create the repository, copy the files in, set Pages to "GitHub Actions".

**You do (each time):** put images into folders, commit, push.

**Automatic:** finding new images and folders, forgetting deleted ones, hiding empty categories,
reading image sizes, sorting, building the index, publishing the website.

---

## Troubleshooting

**An image doesn't appear**

1. Open the **Actions** tab. Is the latest run green? If it's red, click it to see the error.
   If it's still yellow, wait a minute.
2. Check the file is inside a category folder (`library/food/pic.jpg`), not directly in `library/`
   or outside it.
3. Check the file type is supported. In the Actions run, open **Build the image index**: skipped files
   are listed with a ⚠.
4. Refresh the page. On a phone, pull down to refresh.

**A GIF doesn't animate**

1. Make sure it's really a GIF. Many "GIFs" saved from Instagram, TikTok or Giphy are actually
   short videos (`.mp4`), which v1 doesn't show. Open the file on your computer to check.
2. If a GIF shows the first frame only, the file itself may have a single frame (it happens with
   some screenshot tools). Re-download it.
3. Very large GIFs (over ~20 MB) can take a while to load on mobile data; they start animating once loaded.

**A broken image** (corrupted file, wrong extension) is simply hidden. The rest of the gallery keeps working.

**The Actions run fails with "Pages not enabled" or a permissions error**
Go to **Settings → Pages** and make sure **Source** is **GitHub Actions**, then run the workflow again
from the Actions tab.

**The site shows "The library index is missing"**
The workflow hasn't finished successfully yet. Check the Actions tab.

---

## Limits to know about

These come from GitHub, not from the code:

- **Published site size: 1 GB maximum** on GitHub Pages. This is the one you'll hit first.
  Phone screenshots saved as PNG are often 1 to 3 MB each, so 1 GB is roughly 400 to 1,000 of them.
  The same screenshots as JPG or WebP are usually 150 to 400 KB, which fits several thousand.
  **Simplest fix:** save or export screenshots as JPG/WebP before adding them, especially big batches.
  If you outgrow this, the next step would be having the workflow automatically shrink images
  while publishing. Your folders wouldn't change.
- **Repository size:** GitHub recommends staying under 1 GB and warns around 5 GB.
  Deleted images stay in the repository's history, so deleting doesn't shrink it much.
- **Single files:** files over 100 MB are rejected by GitHub (there's a warning at 50 MB).
- **Traffic:** Pages has a soft limit of 100 GB of downloads per month, far more than one person browsing uses.
- **Privacy:** the website is public to anyone with the link (see step 2).
- **Videos** aren't supported in version 1. GIFs are.

---

## Customizing

- **Title and subtitle:** edit `src/config.js`.
- **Colors and fonts:** the top of `styles/main.css` has all colors as named variables.
- **Images per batch:** `batchSize` in `src/config.js`.

## Optional: preview on your computer

Only needed if you want to see changes before pushing. Requires [Node.js](https://nodejs.org) 18 or newer.

```
npm run dev
```

Then open http://localhost:8080. (Opening `index.html` by double-clicking won't work; the page needs to be served.)

## Growing it later

Version 1 is intentionally just "folder = category." The code is split so each future idea has an obvious home:

- **Search, tags, notes, favorites:** add fields to each image in `scripts/build-index.mjs`
  (for example from an optional `notes.json` per folder), carry them through `src/data.js`,
  and filter in `src/main.js`.
- **Sub-categories:** `build-index.mjs` already walks sub-folders; it would record the sub-folder
  name instead of merging it.
- **Automatic image shrinking:** one extra step in `.github/workflows/deploy.yml`.

## Setup checklist

- [ ] Create GitHub repository (public, unless you have Pro)
- [ ] Add project files (including the hidden `.github` folder) and push
- [ ] Settings → Pages → Source: **GitHub Actions**
- [ ] Check the Actions tab shows a green run
- [ ] Open `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`
- [ ] Add your first real screenshots to category folders and push
- [ ] Delete the `sample` images
- [ ] On your phone: Add to Home Screen
