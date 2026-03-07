# TikTok Metadata — Execution Summary + Reusable Playbook

## What was completed (March 1, 2026)

### File set and numbering
- Cleaned folder to a canonical set of **40** TikTok metadata files (`01` → `40`) + this `README.md`.
- Removed duplicate/legacy variants and normalized filenames to posting order by date.

### Scheduling decisions applied
- Used YouTube schedule as baseline.
- Kept future releases aligned with planned cadence.
- Backfilled earlier releases into free slots, starting from March 22, 2026, without overlap.

### Caption optimization pass applied
- Broke structural uniformity (multiple caption shapes and line rhythms).
- Replaced repeated CTA/hashtag patterns with rotating variants.
- Reduced repetitive AI phrasing and removed generic engagement filler.
- Enforced compact format (short, high-retention copy).

### Final enforced constraints
- At least 30% of captions avoid title in first 3 lines.
- At least 30% use direct emotional tension language.
- In the raw-emotion subset, banned terms removed: `echo`, `memory`, `trace`, `aftermath`, `atmosphere`, `outline`.
- Hashtag distribution enforced:
  - 5 captions with **0 hashtags**
  - 5 captions with **exactly 2 hashtags**
  - all captions keep hashtag count at **5 or fewer**
- 3 captions are **single-sentence** only.

---

## Reusable workflow for Instagram and Facebook

Use this section as the standard process when repeating this work for:
- `meta-tools/Spring Releases - Metadata/Instagram/`
- `meta-tools/Spring Releases - Metadata/Facebook/`

### 1) Canonical file strategy
- Keep exactly one metadata file per release.
- Number files in strict publish order (`01`…`40`) by date.
- Remove duplicates immediately before writing new variants.

### 2) Source-of-truth mapping
- Schedule source: `meta-tools/templates/Release Plan - Music - Schedule.csv`
- Long-form reference: `meta-tools/Spring Releases - Metadata/YouTube/`
- Theme/provenance source: `meta-tools/sunodoc/`

### 3) Platform adaptation rules
- Keep the same release identity per song (title/version/artist).
- Rewrite caption style for platform behavior (do not copy TikTok text 1:1).
- Preserve brand tone: cinematic, experimental, intelligent.
- Avoid over-disclosure repetition and repeated sentence templates.

### 4) Anti-repetition controls (copy QA)
- Rotate at least 5 CTA styles.
- Rotate at least 5 hashtag clusters.
- Ensure a meaningful subset with no hashtags and reduced hashtags.
- Ensure hooks are strong in first 1–2 lines (standalone value).
- Keep captions concise; remove filler and generic viral bait wording.

### 5) Verification checklist (must pass)
- [ ] Correct file count (one per release)
- [ ] Correct numbering (chronological)
- [ ] No duplicate filenames/releases
- [ ] No repeated boilerplate CTA across all posts
- [ ] Hashtag limits respected
- [ ] Hook quality: first two lines create tension/curiosity
- [ ] Random sample review for tone consistency

### 6) Rollout order recommendation
1. Build canonical filename list from schedule.
2. Generate or rewrite captions platform-specifically.
3. Apply anti-repetition constraints.
4. Run QA checklist.
5. Freeze metadata and schedule posts.

---

## Backlog reference

- Cross-platform and future-pass ideas are tracked in `BACKLOG.md` at repo root.
- Keep this README focused on completed work and reusable process only.