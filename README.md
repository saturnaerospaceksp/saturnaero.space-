# Saturn Aerospace Website

Static marketing site for `saturnaero.space`, built as plain HTML, CSS, JSON, and browser-side JavaScript. There is no build step, package manager, or framework in this repository. Each page is served directly from the repo root and can be deployed as-is through GitHub Pages or any static host.

## Live Setup

- Domain: `saturnaero.space`
- Custom domain file: `CNAME`
- Main stylesheet: `style/style.css`
- Shared site behavior: `js/script.js`
- Shared assets: `img/`, `fonts/`, `misc/`

## Current Site Map

- `index.html`: homepage hero and primary entry point
- `cosmic-news.html`: public news page plus in-browser employee editor
- `daphnis.html`: launcher page
- `hyperion.html`: launcher page
- `rhea.html`: launcher page
- `volunteering.html`: volunteering / recruitment page
- `employee-login.html`: browser-session employee login page

## Repo Structure

```text
.
|-- CNAME
|-- *.html
|-- data/
|   |-- cosmic-news.json
|   `-- audit-log.json
|-- fonts/
|-- img/
|-- js/
|   |-- script.js
|   |-- cosmic-news.js
|   |-- employee-auth.js
|   |-- employee-audit.js
|   |-- employee-credentials.js
|   |-- employee-login.js
|   |-- github-sync-config.js
|   `-- github-sync.js
|-- misc/
`-- templates/
    |-- future-page-notes.md
    `-- hero-page-shell.html
```

## How The Site Works

### Static pages

Every page is a standalone HTML file. Shared navigation, footer behavior, dropdowns, reveal animations, and community links are handled by `js/script.js`.

### Styling

All visual styling lives in `style/style.css`. The current design language is:

- dark, cinematic, image-led
- gold accent color system
- KH Interference font family from `fonts/`
- reusable hero, media-grid, forum, editor, and footer components

### Cosmic News

`cosmic-news.html` is partly data-driven:

- public content is loaded from `data/cosmic-news.json`
- browser fallback uses `localStorage`
- staff edits are enabled after login
- optional GitHub write-back is controlled by `js/github-sync-config.js` and `js/github-sync.js`

### Employee login

`employee-login.html` and the news editor use browser-only auth:

- credentials are defined in `js/employee-credentials.js`
- auth state is stored in `sessionStorage`
- audit entries are stored in `localStorage`
- this is not secure server-side authentication

## Local Preview

Because this is a static site, you can preview it with any simple local server from the repo root.

### Option 1: Python

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000`.

### Option 2: VS Code Live Server

Open the repo and run a static server extension against the root folder.

Do not rely on opening files directly with the `file://` protocol when testing behavior that uses fetch, storage, or relative paths.

## Content Update Instructions

### Update standard page copy or images

1. Edit the target `*.html` page.
2. Replace copy, image paths, alt text, and CTA targets as needed.
3. Keep the shared header and footer structure consistent with the rest of the site.
4. Preview the page on desktop and mobile widths.

### Update navigation links

If a page is renamed, added, or removed, update navigation in every live page. Navigation is duplicated in the HTML, so there is no single shared include.

At minimum, check:

- header nav
- footer links
- dropdown items for launcher pages
- `data-page` and `data-nav-link` values for active-state highlighting

### Update Cosmic News manually

Edit `data/cosmic-news.json` directly when you want source-controlled news content without using the browser editor.

Expected shape:

```json
{
  "featured": {
    "tag": "Cosmic News",
    "title": "Latest news from Saturn Aerospace",
    "meta": "Official updates, mission notes, fleet news, and community announcements.",
    "body": "Summary text",
    "note": "Side note text",
    "image": ""
  },
  "posts": [
    {
      "id": "post-123",
      "tag": "Mission Update",
      "title": "Headline",
      "meta": "Short meta line",
      "body": "Post summary",
      "image": "",
      "author": "Saturn Aerospace",
      "updatedAt": "2026-04-09T12:00:00.000Z"
    }
  ]
}
```

Rules:

- keep valid JSON
- keep `featured` and `posts` keys
- keep `posts` as an array
- each post must have `id`, `tag`, `title`, `meta`, and `body`
- use unique `id` values
- use ISO timestamps for `updatedAt`

### Update Cosmic News from the website

This only persists back to GitHub if `js/github-sync-config.js` contains a real token and valid repo settings. Otherwise, edits stay in the current browser only.

Current sync target:

- owner: `saturnaerospaceksp`
- repo: `saturnaero.space-`
- branch: `main`

Important:

- the token is client-side if added here
- that means anyone with browser access can extract it
- use this only if you fully accept that risk

### Update employee credentials

Edit `js/employee-credentials.js`.

Current model:

- credentials are shipped to the browser
- passwords are visible to anyone who can inspect site files
- this is suitable only for lightweight gating, not real security

If real access control is required, replace this system with a server-side auth flow.

## Rules For Updates

### HTML rules

- Keep one page per root-level HTML file.
- Keep `data-page` accurate for each page.
- Keep `<title>` and `<meta name="description">` page-specific.
- Keep image `alt` text meaningful.
- Keep the skip link, header, main landmark, and footer in place.
- Do not change asset paths casually; many pages use shared relative paths.

### CSS rules

- Prefer reusing existing component classes before adding new patterns.
- Keep the current Saturn Aerospace visual language: dark background, gold accents, cinematic imagery, restrained motion.
- Add new variables in `:root` before scattering hard-coded colors.
- Preserve responsive behavior at `900px` and `640px` breakpoints unless intentionally redesigning the whole system.

### JavaScript rules

- Keep shared site behavior in `js/script.js`.
- Keep page-specific behavior in separate files like `js/cosmic-news.js` and `js/employee-login.js`.
- Do not move page-specific logic into inline `<script>` tags.
- Preserve the `data-*` hooks used by JS before renaming classes or elements.
- Treat `localStorage` and `sessionStorage` keys as part of the app contract unless you are deliberately migrating them.

### Data rules

- Keep `data/cosmic-news.json` and `data/audit-log.json` valid JSON at all times.
- Do not hand-edit generated audit entries unless there is a clear cleanup reason.
- If adding uploaded news images through GitHub sync, keep them under the configured `imageDirectory`.

### Security rules

- Do not commit a real GitHub token to `js/github-sync-config.js`.
- Do not present the employee login as secure authentication.
- Do not store private or sensitive information in `data/` or browser-shipped JS files.

## New Page Workflow

Use `templates/hero-page-shell.html` as the starting point for new top-level pages. Follow `templates/future-page-notes.md` when deciding whether a page is ready to surface in navigation.

Before making a new page live:

1. Finalize page copy.
2. Finalize hero image.
3. Update header and footer nav across live pages.
4. Set page-specific `title`, `description`, and `data-page`.
5. Test desktop and mobile layouts.

## Recommended Update Checklist

Before committing changes:

1. Open the affected page locally.
2. Check navigation, dropdowns, and footer links.
3. Check layout at desktop and mobile widths.
4. Check console for JS errors.
5. Verify all changed images and links resolve correctly.
6. If you changed news data, verify `cosmic-news.html` still renders featured content and posts.
7. If you changed login or sync files, verify the browser session flow still works.

## Known Constraints

- No templating system, so shared markup is duplicated across pages.
- No automated tests in this repo.
- Employee auth is client-side only.
- GitHub sync from the browser is possible but unsafe for real secret management.

## Suggested Future Improvements

- Move repeated header and footer markup into a proper static-site generator or include system.
- Replace browser-only employee auth with server-side authentication.
- Move GitHub write operations out of client-side JavaScript.
- Add image organization rules for the many screenshots in `img/`.
- Add a simple validation step for HTML and JSON before deploy.
