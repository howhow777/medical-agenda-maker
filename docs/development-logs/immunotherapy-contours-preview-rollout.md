# Immunotherapy contours preview rollout and rollback

Last updated: 2026-09-14 (Asia/Taipei)

## Boundary and current status

- Development branch: `feature/cancer-design-switcher-preview`
- Preview Worker: `medical-agenda-preview`
- Preview URL: `https://medical-agenda-preview.promelink.link`
- Production/GitHub Pages branch is out of scope. Do not push or deploy to `origin/Try_to_remove_cutting_model`.
- Protected untracked directory: `assets/cancer-motifs-v2/`. Do not add, modify, delete, copy into the deployment bundle, or commit it.
- Approved 03/04 review: `qa/immunotherapy-contours-imagegen-review.html?rev=selected-first-pair`
- Current complete four-concept review: `qa/immunotherapy-contours-imagegen-review.html?rev=all-four-imagegen`
- The earlier SVG-only 01/02 review is superseded. On 2026-09-14 the user requested that 01 and 02 be redesigned with the same unconstrained ImageGen-first thinking used for 03 and 04.
- Design exploration method: built-in ImageGen compositing with the original poster as edit target and the supplied references limited to material, edge, and flow-language roles. The first-round 03/04 pair was preferred over the more reduced second-round pair.
- Partial design approval recorded on 2026-09-14: 03 `協同網絡｜有機晶面`, 04 `免疫級聯｜偏心流場`, and the colorectal Clinical Cobalt palette are approved.
- Final design approval recorded on 2026-09-14: new 01 `免疫訊號｜光徑共振` and new 02 `精準辨識｜折射焦域` are approved. Together with the earlier 03, 04, and colorectal-palette approval, all four concepts are approved and product implementation may proceed.
- Implementation commit: the commit containing this document. Resolve its full immutable hash with `git log -1 --format=%H -- docs/development-logs/immunotherapy-contours-preview-rollout.md` after checkout.
- New Cloudflare deployment version: `3023a8b8-2563-47af-9aa7-1beb93a9ce7f`.

## Design review evidence

- New 01 review asset: `qa/design-review-assets/contour-01-signal-resonance-imagegen.jpg`, SHA-256 `4af60fbddd8991520299b9bb7ac2c3822db17852749a4cc21e1cb9cc5c386874`, 1350 × 1165 source render converted non-destructively from the built-in ImageGen output.
- New 02 review asset: `qa/design-review-assets/contour-02-refractive-focus-imagegen.jpg`, SHA-256 `bc1b271fecce515a8af2eb670dcb8f125568d2448fd3d7e50bfdceb951eb828b`, 1350 × 1165, generated through one broad compositing pass followed by one focused optical-material edit.
- Approved 03 review asset: `qa/design-review-assets/contour-03-organic-facets-imagegen.jpg`, SHA-256 `30a95ba3007dee772993c5cc1ea596f125f0de227eedc581dd02d47f65daaccf`.
- Approved 04 review asset: `qa/design-review-assets/contour-04-eccentric-field-colorectal-imagegen.jpg`, SHA-256 `3087f1ffc251f55029c004946557253c3a4187cac57aa6c27dbd87d4e86979cb`.
- The complete four-concept page returned HTTP 200 and was visually reviewed in the existing in-app browser. A Chrome DevTools mobile emulation at 390 × 844 reported `innerWidth: 390`, `scrollWidth: 390`, and a 366px-wide main region, proving no horizontal overflow at the requested mobile width.
- The ImageGen review images are design evidence only and are excluded from the Cloudflare runtime deployment bundle. Product Canvas geometry must be recreated deterministically after final approval rather than shipping the raster mockups.
- Pre-implementation design-to-code contract: `docs/development-logs/immunotherapy-contours-geometry-spec.md`. It fixes the normalized boundary samples, decoration limits, palette mapping, title edge behavior, shared clipping route, and post-approval verification contract without modifying runtime code.

## Post-approval implementation map

This map was audited against the baseline and then implemented only after all four concepts were explicitly approved.

- `index.html`: change only the visible trigger label to `切換 癌別/特效`; preserve the existing trigger ID, sticky placement, ARIA relationship, and drawer behavior.
- `styles.css`: reuse the download button's five-color gradient, 8-second background drift, 3-second shimmer, text treatment, shadow, hover lift, and active feedback on the switcher. Add a separate 3.6-second low-amplitude breathing phase that starts after the three discovery cycles; hover/active pause it, and `prefers-reduced-motion: reduce` disables discovery, drift, shimmer, and breathing.
- `src/logic/headerContours.ts`: retain all four `HeaderContourId` values while changing labels and artwork. One canonical boundary helper must drive both `traceHeaderContourPath()` and `drawHeaderContour()`; decorative light-flow, broad-arc, dissolving-lattice, and converging-arc layers are drawn inside that boundary so preview, clipping, normal render, and high-resolution render cannot drift geometrically.
- `src/logic/cancerDesignPresets.ts` and `src/logic/colorSchemes.ts`: keep the three-color persisted palette tuple and all default contour mappings. Apply the approved six palettes to the roof and to the existing Agenda `border`/`accent`/row fields; derive any fourth pale roof layer through opacity or blending instead of changing the schema.
- `src/logic/posterRenderer.ts`: keep the current Agenda table geometry. Add a palette-derived title/subtitle edge before the existing fill so light roofs remain readable at both normal and 2400x1800 render sizes. The Agenda heading already consumes `scheme.agenda.border`, so its synchronized color needs no new public field.
- `src/interface/cancerDesignSwitcher.ts`: preserve storage migration, public methods, keyboard focus trap, and ARIA state; preview canvases continue to call the same contour renderer used by the poster.
- `test/cancer-design-presets.test.mjs` plus browser smoke QA: assert stable IDs/default mappings/migration, distinct geometry signatures, shared trace/draw boundaries, six palette-to-Agenda relationships, exact trigger text and motion fallbacks, 24 cancer/contour renders, overlay clipping, and the 2400x1800 export.

## Local implementation verification

- `npm test`: 17/17 passed, 0 failed, 0 skipped. This includes migration and default-map compatibility, four unique normalized geometry signatures, preview/poster/clipping/export path parity, six synchronized palettes, all 24 cancer/contour combinations, and the switcher motion contract.
- Browser runtime matrix: `qa/immunotherapy-contours-runtime-qa.html` rendered 24/24 combinations and reported `independentRelationsVerified: true`.
- Runtime QA generated non-empty 2400×1800 PNG canvases for all four contours: `soft-wave` 1,023,802 bytes; `arc-sweep` 951,042 bytes; `layered-ribbon` 1,154,006 bytes; `clean-diagonal` 993,137 bytes.
- The real `PosterRenderer.exportHighQuality()` path was separately executed for four 800×600 source canvases at scale 3. Every result reported 2400×1800 and returned a non-empty PNG blob: 2,028,984; 1,931,543; 2,109,254; and 1,989,669 bytes respectively.
- Desktop visual QA covered the real application, drawer open/closed, all four full-poster contours, the six preset cards, and the approved colorectal cobalt palette with matching Agenda heading and emphasis colors.
- Mobile browser emulation used an exact 390×844 CSS viewport. It reported `innerWidth: 390`, document scroll width 390, a 132.9×44.4px one-line trigger entirely inside the viewport, and a 390px open drawer with no document-level horizontal overflow.
- Normal motion verification: after the 3 × 900ms discovery cue, the discovery class was removed and computed animations were `gradientShift` 8s plus `designSwitcherBreathing` 3.6s; the pseudo-element ran `shimmer` at 3s.
- Reduced-motion verification: computed trigger and pseudo-element animation names were both `none`, transform was `none`, transition duration was `0s`, and the static five-color gradient remained present.
- The browser console contained normal initialization logs and no error-level application messages.
- Deployment package: 56 filesystem files; Wrangler 4.131.1 indexed 65 asset entries and uploaded exactly the eight changed runtime assets (`index.html`, `styles.css`, four compiled modules, and the runtime QA page) while reusing 48 unchanged assets.
- Online core verification: `index.html`, `styles.css`, `dist/logic/headerContours.js`, and `dist/interface/cancerDesignSwitcher.js` each returned HTTP 200 and matched the local implementation SHA-256 exactly. The runtime QA page used Cloudflare's expected 307 clean-URL redirect, then returned HTTP 200 and matched its local hash exactly.
- Online runtime QA reported `PASS · 24/24`, `independentRelationsVerified: true`, and the same four non-empty 2400×1800 outputs listed above.
- Online 1400×900 verification reported document scroll width 1400, a complete 131.7×44px one-line trigger inside the viewport, the `immunotherapy-contours-v1` marker, discovery class removal, and the expected gradient/breathing animation state.
- Online 390×844 verification reported document scroll width 390, a complete 133.2×44.5px one-line trigger inside the viewport, and a 390px-wide open drawer with `aria-hidden="false"` and trigger `aria-expanded="true"`.
- Post-deploy readback confirmed both local colleague-facing checkout and `origin/Try_to_remove_cutting_model` remained at `e786b82934417e8828b935d1c2b8dc593182934f`.

Implementation SHA-256 before deployment:

```text
99a8ffeb4b4b09be6e5c3f2e37ae45bd8141e0ffe4d68b7ee326424c13c5b06c  index.html
ba85df47176240b29344f7c69323c94f87c31faa269feac62dba1ce9558e39a2  styles.css
fd39cef6a33edb5b11fd2862cbe7335717edb3fbedaa2396a8edc5c60068e32f  dist/logic/headerContours.js
4881a27b165a8e4a1b703b94763b198a500b69f1ff54b4bb728c4b32a8d6302b  dist/interface/cancerDesignSwitcher.js
b2daaf86c696f22c595892031f693473fb83741b5fd3296a506e1865887bb472  qa/immunotherapy-contours-runtime-qa.html
```

## Verified baseline

- Baseline commit: `b31650847ea6981b4b5f5fd847d352ef4823ee81`
- Annotated safety tag: `preview/before-immunotherapy-contours-20260912`
- Safety tag peeled commit: `b31650847ea6981b4b5f5fd847d352ef4823ee81`
- Baseline Cloudflare version: `05a66c23-fca8-413e-bb96-901b42697d0c`
- Baseline build marker: `poster-view-zoom-v5`
- GitHub Pages source branch at baseline audit: `origin/Try_to_remove_cutting_model` at `e786b82934417e8828b935d1c2b8dc593182934f`
- Pre-implementation test baseline re-run on 2026-09-13: `npm test` completed the TypeScript build and passed 12/12 tests with 0 skipped, 0 failed, and exit code 0. The build produced no additional tracked or untracked files.

Baseline SHA-256:

```text
b1b3ebd219b21b0fe40570f59586653a7869e605c0ac5431d9e171daf65971d7  index.html
e27810e18baadfd1259c999f9a241a2b6f48f8464f0695538a30fe75b9552eba  styles.css
340cffafa14583824e0b61d7045fde30ac282ecae23ea99f9760df7c276a8653  dist/logic/headerContours.js
a546813858ee61f099a6bf0b5ea6e777cdf4b8be8745e0f4e9d5072015bb4d61  dist/interface/cancerDesignSwitcher.js
```

## Runtime asset scope

Deploy only the proven runtime subset:

- `index.html`
- `styles.css`
- `src/assets/feedback-modal.css`
- `dist/**/*.js`
- `assets/cancer-motifs-v3/**`
- `qa/immunotherapy-contours-runtime-qa.html`

This deliberately excludes source maps, declarations, tests, docs, ImageGen design-review assets/pages, `node_modules`, repository metadata, and `assets/cancer-motifs-v2/`. The one runtime QA HTML file is included so the deployed 24-combination smoke check can import exactly the online JavaScript bundle.

Create the package from the implementation checkout:

```sh
preview_package=$(mktemp -d /tmp/medical-agenda-preview.XXXXXX)
case "$preview_package" in /tmp/medical-agenda-preview.*) ;; *) exit 90 ;; esac
mkdir -p "$preview_package/dist" "$preview_package/src/assets" "$preview_package/assets" "$preview_package/qa"
cp index.html styles.css "$preview_package/"
cp src/assets/feedback-modal.css "$preview_package/src/assets/"
cp -R assets/cancer-motifs-v3 "$preview_package/assets/"
cp qa/immunotherapy-contours-runtime-qa.html "$preview_package/qa/"
rsync -a --include='*/' --include='*.js' --exclude='*' dist/ "$preview_package/dist/"
find "$preview_package" -type f | sort
```

## Preview rollout

Preconditions:

```sh
test "$(git branch --show-current)" = 'feature/cancer-design-switcher-preview'
test "$(git rev-parse 'preview/before-immunotherapy-contours-20260912^{}')" = 'b31650847ea6981b4b5f5fd847d352ef4823ee81'
git status --short
npm test
```

Before deploying, verify that `git status --short` contains only the scoped implementation changes and the protected untracked `assets/cancer-motifs-v2/`. After the single implementation commit, only the protected directory may remain.

Read only the required token from the Hermes environment file. Never `source` the file and never print the token:

```sh
export CLOUDFLARE_API_TOKEN="$(perl -ne 'if(/^CLOUDFLARE_API_TOKEN=(.*)$/){$v=$1;$v=~s/^[\x22\x27]|[\x22\x27]$//g;print $v;exit}' /Users/promelink/.hermes/.env)"
test -n "$CLOUDFLARE_API_TOKEN"
PATH=/Users/promelink/.local/bin:/opt/homebrew/bin:/usr/bin:/bin \
  npx --yes wrangler@4.131.1 deploy \
  --config wrangler.preview.jsonc \
  --assets "$preview_package"
unset CLOUDFLARE_API_TOKEN
```

Record the `Current Version ID` printed by Wrangler in the pending field above. The configuration names only `medical-agenda-preview` and its custom preview domain; do not substitute another config or run a Pages command.

Post-deploy verification:

```sh
preview_url='https://medical-agenda-preview.promelink.link'
cache_bust="$(git rev-parse --short=12 HEAD)"
curl -fsS "$preview_url/?verify=$cache_bust" -o /tmp/medical-agenda-preview-index.html
curl -fsS "$preview_url/styles.css?verify=$cache_bust" -o /tmp/medical-agenda-preview-styles.css
curl -fsS "$preview_url/dist/logic/headerContours.js?verify=$cache_bust" -o /tmp/medical-agenda-preview-headerContours.js
curl -fsS "$preview_url/dist/interface/cancerDesignSwitcher.js?verify=$cache_bust" -o /tmp/medical-agenda-preview-cancerDesignSwitcher.js
curl -fsS "$preview_url/qa/immunotherapy-contours-runtime-qa.html?verify=$cache_bust" -o /tmp/medical-agenda-preview-runtime-qa.html
shasum -a 256 \
  /tmp/medical-agenda-preview-index.html \
  /tmp/medical-agenda-preview-styles.css \
  /tmp/medical-agenda-preview-headerContours.js \
  /tmp/medical-agenda-preview-cancerDesignSwitcher.js \
  /tmp/medical-agenda-preview-runtime-qa.html
```

Compare those hashes with the committed local files. Also verify HTTP 200, the new build marker, the 24-combination browser smoke page, the 2400×1800 export, desktop/mobile layouts, drawer open/closed states, normal animation, reduced motion, and a clean browser console.

Wrangler may create `.wrangler/cache/wrangler-account.json` and `.wrangler/tmp`. Remove only those generated artifacts after inspecting them; final `git status` must not contain `.wrangler/`.

## Normal Git rollback

This preserves history and is the preferred rollback after an implementation commit exists:

```sh
implementation_commit="$(git log -1 --format=%H -- docs/development-logs/immunotherapy-contours-preview-rollout.md)"
test "$implementation_commit" = "$(git rev-parse HEAD)"
git status --short
git revert "$implementation_commit"
npm test
```

Then create the same minimal runtime package from the revert commit, redeploy it with `wrangler.preview.jsonc`, and repeat all online hashes and browser QA. Never use `git reset --hard`, `git checkout --`, force-push, or a GitHub Pages deployment.

## Emergency online preview rollback

This path restores the preview directly from the safety tag without moving the active development branch:

```sh
repo_root='/Users/promelink/Hermes/projects/medical-agenda-maker-wt-cancer-design'
rollback_worktree=$(mktemp -d /tmp/medical-agenda-preview-rollback-wt.XXXXXX)
rollback_package=$(mktemp -d /tmp/medical-agenda-preview-rollback-package.XXXXXX)
case "$rollback_worktree" in /tmp/medical-agenda-preview-rollback-wt.*) ;; *) exit 90 ;; esac
case "$rollback_package" in /tmp/medical-agenda-preview-rollback-package.*) ;; *) exit 91 ;; esac

git -C "$repo_root" worktree add --detach "$rollback_worktree" preview/before-immunotherapy-contours-20260912
test "$(git -C "$rollback_worktree" rev-parse HEAD)" = 'b31650847ea6981b4b5f5fd847d352ef4823ee81'

mkdir -p "$rollback_package/dist" "$rollback_package/src/assets" "$rollback_package/assets"
cp "$rollback_worktree/index.html" "$rollback_worktree/styles.css" "$rollback_package/"
cp "$rollback_worktree/src/assets/feedback-modal.css" "$rollback_package/src/assets/"
cp -R "$rollback_worktree/assets/cancer-motifs-v3" "$rollback_package/assets/"
rsync -a --include='*/' --include='*.js' --exclude='*' "$rollback_worktree/dist/" "$rollback_package/dist/"

shasum -a 256 \
  "$rollback_package/index.html" \
  "$rollback_package/styles.css" \
  "$rollback_package/dist/logic/headerContours.js" \
  "$rollback_package/dist/interface/cancerDesignSwitcher.js"

export CLOUDFLARE_API_TOKEN="$(perl -ne 'if(/^CLOUDFLARE_API_TOKEN=(.*)$/){$v=$1;$v=~s/^[\x22\x27]|[\x22\x27]$//g;print $v;exit}' /Users/promelink/.hermes/.env)"
test -n "$CLOUDFLARE_API_TOKEN"
PATH=/Users/promelink/.local/bin:/opt/homebrew/bin:/usr/bin:/bin \
  npx --yes wrangler@4.131.1 deploy \
  --config "$rollback_worktree/wrangler.preview.jsonc" \
  --assets "$rollback_package"
unset CLOUDFLARE_API_TOKEN
```

Verify that the four online hashes return exactly to the baseline values listed above. Confirm the build marker is `poster-view-zoom-v5`, the URL returns HTTP 200, and GitHub Pages remains unchanged.

Cleanup only after verification:

```sh
git -C "$repo_root" worktree list --porcelain
git -C "$repo_root" worktree remove "$rollback_worktree"
find "$rollback_package" -type f -delete
find "$rollback_package" -depth -type d -empty -delete
git -C "$repo_root" worktree list --porcelain
git -C "$repo_root" status --short --branch
```

## Emergency rollback dry-run evidence

Revalidated on 2026-09-14 after the implementation and preview deployment, without contacting or changing Cloudflare:

- Detached worktree resolved to `b31650847ea6981b4b5f5fd847d352ef4823ee81`.
- The minimal package contained 55 runtime files; Wrangler 4.131.1 read 63 asset entries.
- All four package hashes matched the baseline hashes above.
- `wrangler deploy --dry-run` completed with `No bindings found` and exited without upload.
- The temporary worktree and package were removed.
- The active development branch stayed on the implementation commit containing this document; the protected untracked `assets/cancer-motifs-v2/` remained untouched.
