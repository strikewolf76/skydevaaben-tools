# Skydevaaben Redirect Generator

A small, browser-only tool to generate and publish static redirect pages and OG images for skydevaaben.no. The tool lives at https://tools.skydevaaben.no and publishes to the `skydevaaben` GitHub repo.

## How it works
- HTML UI: `generator.html` (serve locally or open directly in the browser).

Logic: `generator.js` handles validation, batch building, QR generation, and GitHub Content API writes.
Output: writes `assets/og/<slug>.jpg` and `tracks/<slug>/index.html` into the repo (one landing page per campaign with platform buttons). Also generates short URL redirects in `shorturl/<shortslug>/index.html` and `r/<platform><shortslug><reel>/index.html` for ultra-short shareable URLs.

## Requirements
- Fine-grained GitHub PAT with **Contents: Read & Write** scoped to the `skydevaaben` repo.
- Modern browser; everything runs client-side (no backend).

## Using the tool
1) Open https://tools.skydevaaben.no (or open `generator.html` locally).
2) Fill title, artist, destination URLs; upload a square OG image (>630px high).
3) Optionally, enter a short slug and select platforms/reels to generate short URL redirects.
4) Click **Preview** to validate and view the landing page details (validation, preview, and log panels appear above the campaign section).
5) Click **Publish** and paste your PAT when prompted; the tool writes the landing page HTML, OG image, and short URL files to the repo.
6) Pages URLs and QR PNGs can be copied/generated from the UI.
7) Use the **Theme** button in the top action row to cycle nine palettes (Base, Ocean, Forest, Sunset, Sand, Slate, Mint, Night, Aurora). Choice persists in `localStorage` under `sv-generator-theme-v1`.

## Domain defaults
- Pages base URL is locked to https://skydevaaben.no.
- Publishing targets GitHub repo `strikewolf76/skydevaaben` on branch `main`.

## Token storage
- The PAT is kept only in your browser `localStorage` under key `sv-generator-token` for the origin you use (e.g., `tools.skydevaaben.no`).
- Use the "Forget saved token" button or clear site storage to remove it.

## Slug Sanitization
Track slugs (used for page URLs and filenames) are automatically sanitized to contain only lowercase letters (a-z, åæø), numbers, and hyphens. Spaces and underscores are converted to hyphens, and multiple hyphens are collapsed.

Short slugs (used for ultra-short redirect URLs) are more restrictive, containing only lowercase letters (a-z, åæø) and numbers for clean, URL-safe identifiers. They are auto-generated from the first 2 artist letters plus the first letter of the first 3 title words, but can be manually edited if needed.

## Local development
- Open `generator.html` directly in a browser.
- No build step; static files only.

## License
MIT
