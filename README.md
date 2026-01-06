# Skydevaaben Redirect Generator

A small, browser-only tool to generate and publish static redirect pages and OG images for skydevaaben.no. The tool lives at https://tools.skydevaaben.no and publishes to the `skydevaaben` GitHub repo.

## How it works
- HTML UI: `generator.html` (serve locally or open directly in the browser).
- Logic: `generator.js` handles validation, batch building, QR generation, and GitHub Content API writes.
- Output: writes `assets/og/<slug>.jpg` and `tracks/<slug>/<dest>/<utm_content>.html` into the repo.

## Requirements
- Fine-grained GitHub PAT with **Contents: Read & Write** scoped to the `skydevaaben` repo.
- Modern browser; everything runs client-side (no backend).

## Using the tool
1) Open https://tools.skydevaaben.no (or open `generator.html` locally).
2) Fill title and destination URLs; upload a square OG image (>630px high).
3) Optional: click **Use prefilled values** in Channels to auto-fill utm_content defaults for the selected channels.
4) Click **Preview** to validate and view the full grid of combinations (validation, preview, and log panels appear above the campaign section).
5) Click **Publish** and paste your PAT when prompted; the tool writes the redirect HTMLs and OG image to the repo.
6) Pages URLs and QR PNGs can be copied/generated from the UI.

## Domain defaults
- Pages base URL is locked to https://skydevaaben.no.
- Publishing targets GitHub repo `strikewolf76/skydevaaben` on branch `main`.

## Token storage
- The PAT is kept only in your browser `localStorage` under key `sv-generator-token` for the origin you use (e.g., `tools.skydevaaben.no`).
- Use the "Forget saved token" button or clear site storage to remove it.

## Local development
- Open `generator.html` directly in a browser.
- No build step; static files only.

## License
MIT
