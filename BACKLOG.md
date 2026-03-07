# Backlog Idea Log

Centralized backlog for ideas previously scattered across README files in this workspace.

Last consolidated: 2026-03-07

## Priority candidates

- [ ] Make TikTok Pixel ID configurable from generator output while keeping TikTok-only CID gate logic (`org-tt-*`) in shared runtime.
  - Source: recent implementation discussion (post-change follow-up)

- [ ] Automate short URL + platform/reel redirect generation in the tools flow, instead of manual copy/update steps.
  - Source: README note that this process can be automated in tools repo
  - Source file: ../skydevaaben/shorturl/README.md

- [ ] Add a generator-assisted workflow for metadata passes (TikTok/Instagram/Facebook) with canonical numbering, duplicate detection, and per-platform output rules.
  - Source: platform metadata playbooks
  - Source files:
    - meta-tools/Spring Releases - Metadata/TikTok/README.md
    - meta-tools/Spring Releases - Metadata/Instagram/README.md
    - meta-tools/Spring Releases - Metadata/Facebook/README.md

## Metadata pipeline ideas

- [ ] Add automated anti-repetition QA checks for caption sets:
  - CTA rotation diversity
  - hashtag cluster rotation
  - hashtag count ceilings
  - no-duplicate caption structure checks
  - hook quality checks for first 1–2 lines
  - Source: TikTok reusable workflow + verification checklist
  - Source file: meta-tools/Spring Releases - Metadata/TikTok/README.md

- [ ] Add platform-specific lint profiles for caption style:
  - Instagram: concise emotional hooks + visual framing language
  - Facebook: slightly clearer context in line 2–3 while keeping punchy openers
  - Source: next platform pass notes
  - Source file: meta-tools/Spring Releases - Metadata/TikTok/README.md

- [ ] Add a command/script to scaffold canonical metadata file sets (`01`…`40`) from schedule CSV, then hydrate from YouTube metadata + Suno docs.
  - Source: reusable workflow sections in TikTok/Instagram/Facebook metadata READMEs
  - Source files:
    - meta-tools/Spring Releases - Metadata/TikTok/README.md
    - meta-tools/Spring Releases - Metadata/Instagram/README.md
    - meta-tools/Spring Releases - Metadata/Facebook/README.md

## Publishing/validation ideas

- [ ] Add one-click pre-publish validation in generator for runtime checks already listed in operational checklist:
  - script order in generated HTML
  - follow CTA rendering for mapped artists
  - redirect chain and CID propagation
  - expected `r/data.js` updates
  - Source: generator operational checklist
  - Source file: README.md

- [ ] Add redirect integrity checker for `r/` and `shorturl/` pairs to validate that each platform slug resolves to intended track slug and preserves CID.
  - Source: redirect README docs
  - Source files:
    - ../skydevaaben/r/README.md
    - ../skydevaaben/shorturl/README.md

## Notes

- This file is the single source of backlog ideas in `skydevaaben-tools`.
- New ideas should be logged here instead of being embedded in README narrative sections.
