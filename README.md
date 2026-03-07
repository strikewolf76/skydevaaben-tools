# Skydevaaben Tools

Browser-only publishing tools for the Skydevaaben release pipeline.

Main production tool: https://tools.skydevaaben.no

## Quick Links
- Live tool: https://tools.skydevaaben.no
- Publish target repo: https://github.com/strikewolf76/skydevaaben
- Production site: https://skydevaaben.no

## Overview
This repository contains static tooling used to generate and publish:
- Track landing pages
- Short redirect routes (`shorturl` and `r`)
- OG image variants (`.jpg`, `-bg.jpg`, `-fg.jpg`)
- QR codes
- Redirect index data updates (`r/data.js`) in the target repo

All logic runs client-side in the browser and publishes through the GitHub Contents API.

Track runtime behavior is centralized in the target repo at `tracks/scripts/common.js`; the generator emits per-page variables and the shared runtime include.

## Repository Structure
- `generator.html` – UI shell
- `generator.js` – validation, batch generation, GitHub publish workflow
- `generator.css` – main UI styling
- `tooltip.js`, `tooltip.css` – helper UI components
- `meta-tools/` – supporting metadata docs/templates

## End-to-End Publish Flow
1. Fill track metadata and destination links
2. Upload OG source image
3. Optionally enable short slug + platform/reel redirects
4. Run Preview/validation
5. Publish with GitHub PAT

Generated output is committed to `strikewolf76/skydevaaben` on `main`.

## Requirements
- Fine-grained GitHub PAT with **Contents: Read & Write** on `strikewolf76/skydevaaben`
- Modern browser
- GitHub Pages enabled on both repos (tools host + content host)

## Safety Defaults
- Page base URL locked to `https://skydevaaben.no`
- Publish target locked to `strikewolf76/skydevaaben` / `main`
- Slug sanitization for both track slugs and short slugs
- Validation before publish to reduce malformed outputs

## Token Handling
- Token is stored locally in browser storage (`sv-generator-token`)
- Use “Forget saved token” to clear cached token
- Treat browser profile/device as sensitive while token is cached

## Local Development
No build step required.

Options:
- Open `generator.html` directly in a browser
- Or run a static server from repo root and open `generator.html`

## Deployment
GitHub Pages serves this repo from `main` root with custom domain `tools.skydevaaben.no`.

## Operational Checklist
Before promoting generator changes:
- Verify output script order in generated track HTML
- Verify follow CTA appears for supported artists
- Verify redirect chain (`r -> shorturl -> tracks`) and `cid` propagation
- Verify `r/data.js` updates include expected slugs and artist mappings

## Backlog
- Centralized idea log: `BACKLOG.md`
- Add new implementation ideas there instead of embedding them in README narrative sections.

## License
MIT
