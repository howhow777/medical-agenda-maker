# Medical Agenda Maker Design System

## Product context

A Traditional Chinese browser tool for turning an Excel medical-meeting agenda into an editable 800px-wide poster and exporting a high-resolution image. The primary user task is fast, safe poster preparation rather than free-form graphic design.

## Existing application shell

- Preserve the current purple application identity: `#667eea → #764ba2`.
- Preserve the desktop split layout, collapsible left controls, right poster workspace, accordion structure, and sticky download action.
- Use Microsoft JhengHei / PingFang TC / Arial throughout.
- UI surfaces remain white or cool gray with 8–16px radii, subtle purple focus states, and restrained shadows.
- New controls must look native to the existing custom CSS rather than introducing a new component library.

## New quick design switcher

- Anchor a long pill-like button labeled exactly `切換 癌別/特效` at the upper-right of the canvas workspace. Keep it on one line with a minimum 44px control height at desktop and mobile widths.
- Match the existing `下載高畫質 Agenda 海報` button exactly: use its five-color `#667eea → #764ba2 → #f093fb → #f5576c → #fda085` animated gradient, white text and text shadow, soft purple shadow, 8-second background drift, 3-second shimmer, hover lift, and pressed feedback. Do not change the download button itself.
- The trigger performs its existing three-cycle discovery cue first, then settles into a subtle 3.6-second ease-in-out breathing effect using only a low-amplitude shadow and brightness change (maximum 4% brightness change, no layout shift). Pause breathing on hover and active. Disable discovery, gradient motion, shimmer, and breathing under reduced motion while keeping a clear static gradient and focus state.
- Clicking opens a right-side drawer containing six miniature poster cards in a 2-column × 3-row grid.
- Each card visibly previews its real palette, header geometry, table rhythm, cancer name, and representative modern-medical illustration before selection.
- Selecting a card applies it immediately without closing the drawer. Beneath the grid, show three motif thumbnails for the selected cancer.
- Active cards and motifs use a clear purple focus/selection ring. Support click-outside, close button, Escape, focus visibility, `aria-expanded`, and radio-style selection semantics.
- On narrow screens the drawer remains right-anchored, uses two columns, and never permanently covers the poster after dismissal.

## Cancer immunotherapy header contours

- Keep the existing internal contour ids and saved-state mappings unchanged. The visual system is pure abstract clinical technology: controlled geometry, sparse signals, disciplined alignment, and no literal cells, anatomy, drug mechanisms, or treatment-effect claims.
- Treat the supplied Pinterest images only as visual-language references. Recompose their ideas for this product; never duplicate an exact silhouette, facet arrangement, crop, or full-page frame.
- The real poster header is `800 × 150px`. Protect a quiet title corridor at `x=104–696px, y=16–112px`: keep its backdrop medium-to-dark, low-frequency, and free from bright seams, nodes, hard facet edges, or busy lattice. White title and subtitle text must remain immediately readable without adding a card behind them. A lighter roof uses a restrained palette-derived dark outline and soft shadow around the white glyphs rather than forcing the whole roof back to near-black.
- Decorative complexity belongs at the top edge, side corners, and the lower contour boundary (`y=108–150px`). The outer boundary must use one continuous low-frequency Bézier silhouette with no teeth, stepped notches, repeated sharp peaks, or sawtooth rhythm. Create liveliness through one or two broad asymmetric rises and basins, not many vertices. Inside the central title span (`x=104–696px`) keep the darkest boundary at or below `y=116px`; outside it, a smooth controlled rise may reach `y=108px`. The header must still feel complete when reduced to a `~170 × 64px` selector thumbnail.
- Follow the reference image's transition principle without copying it: place three or four nested smooth bands beneath the dark roof, progressing from primary color to accent to the pale cancer color, with decreasing opacity and a final hairline highlight before the white poster area. The dark-to-white transition should feel optically gradual rather than clipped.
- `soft-wave` is labeled `免疫訊號` and presented as `光徑共振` (approved 2026-09-14): two broad translucent optical membranes travel at unequal direction and depth while three luminous paths vary independently in curvature, spacing, brightness, and origin. Place only sparse signal points at meaningful crossings. The lower contour uses one asymmetric basin and a delayed rising sweep, never a regular sine-wave rhythm.
- `arc-sweep` is labeled `精準辨識` and presented as `折射焦域` (approved 2026-09-14): two unequal translucent refractive surfaces approach without mirroring each other, creating one quiet off-center focus field through negative space and optical density. A single restrained calibration trace may graze the focus and dissolve. Avoid crosshairs, bullseyes, concentric circles, or repeated parallel arcs.
- `layered-ribbon` is labeled `協同網絡` and presented as `有機晶面` (approved 2026-09-14): use the user-approved first-round ImageGen direction as the visual reference. Large and small translucent planes overlap at unequal angles, spacing, scale, and opacity; preserve richer material depth at the sides while the title corridor dissolves into a quiet mist field. The outer boundary remains one smooth, living curve rather than inheriting the facets as a jagged cut edge.
- `clean-diagonal` is labeled `免疫級聯` and presented as `偏心流場` (approved 2026-09-14): use the user-approved first-round ImageGen direction as the visual reference. Several broad translucent flow surfaces enter with unequal direction, thickness, curvature, and light transmission, with sparse luminous filaments pulling the composition from the sides. It must feel energetic and open, never like equally spaced concentric arcs or repetitive stacked bands.
- Every contour uses the active cancer palette, preserves strong white-text contrast throughout the protected title corridor, and keeps its outer boundary identical between selector preview, full poster, overlay clipping, and high-resolution export. Keep white-on-anchor contrast at least `4.5:1`; add a 2.5–3.2px palette-derived dark edge and low-opacity shadow so letters remain stable over translucent layers.
- Across all four concepts, the title backdrop uses the darkest palette anchor, but that anchor should be a clear mid-depth clinical color rather than an unnecessarily heavy navy or wine tone. Primary and light tones are reserved for framing layers at reduced opacity. The accessibility edge may be a darker tonal mix derived from the anchor; otherwise no colors may be introduced outside the active cancer palette plus white.

## Poster preset families

### Lung — 清透呼吸
- Palette: airy teal `#347F91`, clear aqua `#55AABD`, oxygen mist `#A7DDE1`, ice white `#EDF9F8`, white; text edge derived as `#153E50`.
- Form: open breathing arcs and an airy asymmetric curved header.
- Motifs: stylized lungs, branching airways, circular breath/cell composition.

### Head and neck — 口腔聚焦
- Palette: softened indigo `#626CA9`, clinical violet `#8585C0`, periwinkle mist `#BCC9E8`, pale lavender `#F3F4FB`, white; text edge derived as `#2D356A`.
- Form: airy closed-lip profile, translucent cheek focus lens, watercolor contour layers, precise modular table.
- Motifs: abstract lateral-tongue/buccal-mucosa arc, soft oral locator rings, restrained oral-to-lymphatic pathway.
- Pathology emphasis stays inside the oral cavity; the neck remains quiet and anatomically secondary so the preset cannot read as esophageal cancer.
- Do not draw dental anatomy in this preset: no teeth, molars, gums, jawbone, dental arches, open mouth, or literal oral cutaway. Use an abstract mucosal arc and locator rings over the closed cheek instead.
- When this portrait is anchored on the poster's right side, mirror it to face left so the gaze leads inward toward the headline and agenda rather than out of the canvas.

### Endometrial — 柔韌花瓣
- Palette: softened plum `#9B587B`, berry rose `#C8738E`, coral mist `#E7AAB0`, soft blush `#FCEFF1`, white; text edge derived as `#5F2F4B`.
- Form: petal curves and a soft arch header.
- Motifs: simplified uterus, protective petals, circular cellular bloom.

### Urinary tract — 水光臨床
- Palette: blue-green `#3A7B84`, surgical teal `#54A09E`, sage aqua `#9ACBC0`, mint white `#EFF9F7`, white; text edge derived as `#174956`.
- Form: water-line geometry, calm clinical cards, subtle grid.
- Motifs: paired kidneys, bladder/kidney pathway, concentric fluid drops.

### Colorectal — 冷光路徑（approved 2026-09-14）
- Approved palette: deep clinical cobalt `#244F86`, cornflower `#5F8FC4`, cool jade `#76B8AE`, mist blue `#DCEAF4`, white; text edge derived from the cobalt anchor. The former orange-brown, copper, mustard, and ivory combination is rejected and must not return as the default proposal.
- Form: asymmetric clinical light paths, broad translucent flow surfaces, and a strong schedule rhythm. The Agenda heading bar follows the same cobalt-to-cornflower family.
- Motifs: simplified colon, pathway loop, connected screening nodes.

### Breast — 絲帶編輯
- Palette: softened wine rose `#A65372`, clinical rose `#CE6F8B`, dusty pink `#E9A5B2`, cream blush `#FFF2F5`, white; text edge derived as `#692A43`.
- Form: ribbon curves, editorial asymmetry, generous cream space.
- Motifs: ribbon/breast contour, protective embrace, floral cellular ribbon.

## Poster and motif behavior

- A visual preset changes palette, header geometry, background treatment, table styling, and exactly one managed built-in motif.
- The Agenda column-heading bar belongs to the same visual preset as the roof. Derive its background from the active cancer anchor and primary tones, use white heading text, and derive agenda-row emphasis text from the same dark accessibility edge used by the roof title. Changing cancer type must update roof, title edge, Agenda heading bar, and Agenda emphasis colors together.
- It never replaces imported agenda rows, conference information, display settings, footer content, or user-uploaded images.
- Built-in motif art is modern, soft, professional, non-photorealistic, and non-diagnostic. No external logos, text, people, or realistic pathology.
- Each motif is a transparent PNG with a curated non-central default anchor, scale, opacity, and foreground/background layer. Users may move, resize, rotate, hide, or replace it.
- Manual color customization remains available after applying a preset. A later preset selection resets colors to that preset's canonical palette.
- Text contrast must remain readable over decorative imagery. Motifs should use low visual weight behind content and stronger opacity only in safe margins.

## Responsive and motion rules

- Desktop target: 1400px container, 460px left panel, flexible workspace around an 800px poster.
- Mobile target: 390px viewport with vertically stacked control panel and horizontally scrollable canvas workspace.
- Keep controls at least 44px high where practical.
- Use 0.2–0.3s transitions; drawer slide may use 0.28s ease.
- Reduced-motion mode removes bounce and minimizes drawer animation.
