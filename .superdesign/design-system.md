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

- Anchor a long pill-like button labeled exactly `切換` at the upper-right of the canvas workspace.
- The trigger performs a gentle vertical discovery bounce a few times on load, then stops; clicking stops it immediately. Disable animation under reduced motion.
- Clicking opens a right-side drawer containing six miniature poster cards in a 2-column × 3-row grid.
- Each card visibly previews its real palette, header geometry, table rhythm, cancer name, and representative modern-medical illustration before selection.
- Selecting a card applies it immediately without closing the drawer. Beneath the grid, show three motif thumbnails for the selected cancer.
- Active cards and motifs use a clear purple focus/selection ring. Support click-outside, close button, Escape, focus visibility, `aria-expanded`, and radio-style selection semantics.
- On narrow screens the drawer remains right-anchored, uses two columns, and never permanently covers the poster after dismissal.

## Poster preset families

### Lung — 清透呼吸
- Palette: `#123B5D`, `#2F8FA8`, `#71C9CE`, `#E8F8F7`, white.
- Form: open breathing arcs and an airy asymmetric curved header.
- Motifs: stylized lungs, branching airways, circular breath/cell composition.

### Head and neck — 口腔聚焦
- Palette: `#293C7A`, `#655FA3`, `#93B7D3`, `#EEF1FA`, white.
- Form: airy closed-lip profile, translucent cheek focus lens, watercolor contour layers, precise modular table.
- Motifs: abstract lateral-tongue/buccal-mucosa arc, soft oral locator rings, restrained oral-to-lymphatic pathway.
- Pathology emphasis stays inside the oral cavity; the neck remains quiet and anatomically secondary so the preset cannot read as esophageal cancer.
- Do not draw dental anatomy in this preset: no teeth, molars, gums, jawbone, dental arches, open mouth, or literal oral cutaway. Use an abstract mucosal arc and locator rings over the closed cheek instead.
- When this portrait is anchored on the poster's right side, mirror it to face left so the gaze leads inward toward the headline and agenda rather than out of the canvas.

### Endometrial — 柔韌花瓣
- Palette: `#6F315A`, `#B64F70`, `#D9828B`, `#FBECEF`, white.
- Form: petal curves and a soft arch header.
- Motifs: simplified uterus, protective petals, circular cellular bloom.

### Urinary tract — 水光臨床
- Palette: `#174B63`, `#268B8F`, `#79B8A5`, `#EDF8F7`, white.
- Form: water-line geometry, calm clinical cards, subtle grid.
- Motifs: paired kidneys, bladder/kidney pathway, concentric fluid drops.

### Colorectal — 路徑節奏
- Palette: `#213A50`, `#B65D45`, `#D48A22`, `#FFF4DE`, white.
- Form: directional pathway, modular bands, strong schedule rhythm.
- Motifs: simplified colon, pathway loop, connected screening nodes.

### Breast — 絲帶編輯
- Palette: `#7F294A`, `#B94768`, `#DA7C91`, `#FFF1F4`, white.
- Form: ribbon curves, editorial asymmetry, generous cream space.
- Motifs: ribbon/breast contour, protective embrace, floral cellular ribbon.

## Poster and motif behavior

- A visual preset changes palette, header geometry, background treatment, table styling, and exactly one managed built-in motif.
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
