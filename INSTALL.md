# MY LITTLE SPACE ♡ — New pages

This folder contains three frontend-only pages matching the existing `home.css` theme.

## Copy these files into the root of your GitHub repository

- `recipes.html` — The Kitchen page
- `recipes.js` — example recipes, search, category filters, details, and a local recipe editor
- `notes.html` — Little Thoughts page
- `notes.js` — example thoughts, search, category filters, details, and a local notes editor
- `games.html` — The Playroom page
- `games.js` — memory game, tic-tac-toe vs. computer, and lucky letters
- `inner-pages.css` — shared visual styling for all three pages

Keep your existing `home.css`, `index.html`, `about.html`, `about.css`, and `assets/` folder. No new framework, npm packages, or server-side code is needed.

The three HTML pages include `home.css` (existing shared header/footer) and `inner-pages.css` (new page designs).

## Expected images you already have

- `assets/home.png` — white home icon, displayed inside the existing pink circular background
- `assets/recipes.png` — The Kitchen heading illustration
- `assets/notes.png` — Little Thoughts heading illustration
- `assets/games.png` — The Playroom heading illustration
- `assets/favicon.png`

## Demo content vs. real content

- The recipe and notes collections show **clearly labeled sample entries** defined in `recipes.js` and `notes.js`.
- You can **add, edit, and delete your own local entries**. These are saved using **localStorage in the current browser**. They are *not* synced, backed up, published to other visitors, or stored in Supabase.
- Clearing browser data or using a different browser/device may make local drafts unavailable. Save important personal writing elsewhere until backend storage is implemented.
- The games run entirely in the browser and don't need a database.

## Run locally

From your website folder:

```bash
python -m http.server 5500
```

Open `http://localhost:5500/recipes.html`, `http://localhost:5500/notes.html`, and `http://localhost:5500/games.html`.

## Deploy

Push your updated files to the same GitHub Pages repository and branch as your homepage. All links are relative, so they work with GitHub Pages project URLs.
