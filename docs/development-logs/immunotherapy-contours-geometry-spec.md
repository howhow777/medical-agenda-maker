# Immunotherapy contour design-to-code geometry specification

Status: approved design-to-code specification. New 01 and 02, previously approved 03 and 04, and the colorectal palette were all explicitly approved by the user on 2026-09-14. Product implementation may proceed while preserving the compatibility and deployment boundaries in the rollout record.

## Canonical coordinate system

- Author all geometry in normalized coordinates and scale it to the supplied `width` and `height`. The production header is 800 × 150; the high-resolution export is expected to reach 2400 × 450 for the same header region.
- Preserve `HeaderContourId` values and ordering: `soft-wave`, `arc-sweep`, `layered-ribbon`, `clean-diagonal`.
- Keep one canonical lower-boundary definition per ID. `traceHeaderContourPath()` and `drawHeaderContour()` must call the same boundary helper; no contour may duplicate its outer path in separate branches.
- The title baseline remains at y=50 and the subtitle baseline at y=85. Protect x=104–696 and y=16–112 as the quiet title corridor. Decorative seams, bright nodes, hard facet edges, and focal caustics stay outside that corridor or below 14% opacity inside it.
- The header must cover the title corridor at every x. Its lower boundary therefore stays at or below y=117 in canvas coordinates, expressed as normalized y >= 0.78.
- Use deterministic cubic curves only. No runtime randomness, line segments, sawtooth vertices, or motif-specific raster masks may define the outer boundary.

## Shared smooth-boundary model

Use monotonic x knots and a tension-limited cubic interpolation (Catmull-Rom-to-Bézier or monotone cubic Hermite) to turn the following normalized samples into one continuous lower edge. The helper traces from `(0,0)` to `(1,0)`, down to the final right-hand sample, traverses the smooth lower boundary right-to-left, then closes at `(0,0)`.

| ID | x knots | normalized y samples, left-to-right | visual signature |
| --- | --- | --- | --- |
| `soft-wave` | 0, .16, .34, .52, .68, .84, 1 | .84, .88, .94, .97, .93, .86, .80 | one delayed asymmetric basin with a long right recovery |
| `arc-sweep` | 0, .14, .30, .48, .65, .82, 1 | .82, .78, .81, .90, .95, .87, .79 | shallow entry, offset focus dip, controlled recovery |
| `layered-ribbon` | 0, .15, .32, .50, .68, .84, 1 | .89, .85, .88, .94, .91, .84, .88 | quiet center-weighted drift without inheriting facet corners |
| `clean-diagonal` | 0, .16, .34, .52, .70, .86, 1 | .79, .88, .97, .94, .86, .81, .77 | energetic left-weighted descent followed by an open right lift |

Implementation constraints:

- Clamp cubic tangents so the curve never overshoots y=1.0 or rises above y=.76.
- Create three subordinate transition bands from the same boundary by applying smooth y offsets of approximately +.035, +.065, and +.09, tapering the offset near y=1.0. The bands progress from primary to accent to pale/mist, with decreasing opacity and a final 1–1.5px highlight. They are not separately designed silhouettes.
- Scale all stroke widths by `width / 800`; at 2400px wide, a 1.5px reference stroke becomes 4.5px.
- Expose a deterministic sample helper to tests or use a recording canvas context so every contour produces a stable geometry signature without adding a runtime dependency.

## 01 `soft-wave` — 免疫訊號｜光徑共振

ImageGen review reference: `qa/design-review-assets/contour-01-signal-resonance-imagegen.jpg`.

- Clip all decoration to the canonical `soft-wave` boundary.
- Draw two broad optical membranes, each as a closed cubic surface rather than a stroke. The first travels upper-left to lower-center; the second enters upper-right and recovers toward the center. Their control points, thicknesses, and opacity ramps must differ.
- Draw exactly three luminous paths. Give each a different start edge, Bézier count, curvature sign changes, alpha, and width. None may be a translated copy of another.
- Draw at most three small signal nodes, only where two paths meaningfully approach or cross. Keep every node outside the title glyph bounding boxes; nodes use a soft outer halo plus a small pale center, never a repeated dot grid.
- In the quiet title corridor, keep membranes below 24% alpha and filaments below 18% alpha. The palette-derived text edge supplies stability without turning the title into a badge.
- Reject implementation if the lower edge reads as a sine wave, if the paths become evenly spaced, or if nodes repeat at regular intervals.

## 02 `arc-sweep` — 精準辨識｜折射焦域

ImageGen review reference: `qa/design-review-assets/contour-02-refractive-focus-imagegen.jpg`.

- Clip all decoration to the canonical `arc-sweep` boundary.
- Construct two unequal translucent lens surfaces from paired cubic curves. One enters shallowly from the left; the second descends from the upper-right. They may overlap, but they must not mirror each other.
- Create one off-center almond-shaped focus field in the right outer third through a bounded overlap path and a change in optical density. Do not use a radial target, bright point, crosshair, sun flare, or symmetric lens icon.
- Draw one thin calibration trace that grazes the focus field and dissolves before intersecting title glyphs. Its alpha decreases continuously along the final segment.
- Use frosted indigo/periwinkle fills with subtle caustic highlights. Keep the center behind the title low-frequency and avoid repeated parallel arcs.
- Reject implementation if the composition reads as draped fabric alone, a spotlight, a bullseye, or a series of equally spaced ribbons.

## 03 `layered-ribbon` — 協同網絡｜有機晶面

Approved ImageGen reference: `qa/design-review-assets/contour-03-organic-facets-imagegen.jpg`.

- Clip all decoration to the canonical `layered-ribbon` boundary; facet corners never alter the clipping edge.
- Use a fixed array of approximately 10–14 large translucent planes. Vary angle, width, height, overlap depth, and alpha. Concentrate higher-contrast planes in the outer thirds and cap central-title planes near 12% alpha.
- Allow two or three planes to bridge across regions so the composition feels cooperative rather than tiled. Avoid a complete row, column, lattice, or repeated triangle size.
- Add a broad mist field behind the title to dissolve hard edges gradually into the white information area.
- Reject implementation if the planes form a matrix, if the lower edge becomes polygonal, or if the center acquires a hard V-shaped seam.

## 04 `clean-diagonal` — 免疫級聯｜偏心流場

Approved ImageGen reference: `qa/design-review-assets/contour-04-eccentric-field-colorectal-imagegen.jpg`.

- Clip all decoration to the canonical `clean-diagonal` boundary.
- Build three broad translucent flow surfaces with independent control points, unequal widths, and unequal opacity. Their curvature centers must differ so they do not read as concentric or parallel bands.
- Add no more than two fine light filaments. They may pull from opposite sides but must not become a symmetrical frame.
- Preserve the open center and let energy accumulate asymmetrically in one side basin before dispersing toward the opposite edge.
- Reject implementation if the result becomes repeated layered arcs, a staircase, a diagonal polygon, or a dense bundle of parallel lines.

## Palette and text relationships

- Keep the persisted three-color palette tuple and `ColorScheme` shape unchanged.
- Map the approved colorectal palette as follows: persisted/header colors `#244F86`, `#5F8FC4`, `#76B8AE`; Agenda background `#DCEAF4`; alternate Agenda background white; Agenda border/accent derived from or equal to `#244F86`.
- Derive pale transition layers through opacity and the Agenda background rather than adding a fourth persisted palette field.
- Draw title and subtitle with `paint-order` semantics in Canvas: palette-derived dark edge first, then the existing white fill, then a low-opacity shadow. Reference edge widths are 3.0px for the title and 2.4px for the subtitle at 800px width, scaled with export size.
- Agenda heading fill, time/topic/speaker accent, and roof colors must change together when a cancer preset changes. Do not alter Agenda geometry.

## Canonical rendering order

1. Trace and fill the canonical outer contour with the active three-color gradient.
2. Save and clip to that same contour.
3. Draw contour-specific optical surfaces, planes, filaments, and sparse nodes.
4. Draw the three subordinate transition bands from offset copies of the same canonical boundary.
5. Restore clipping.
6. Draw title edge, title fill, subtitle edge, and subtitle fill.
7. Continue the existing poster compositor and overlay order. Header-clipped overlays and outside-fixed-object masks continue to call `traceHeaderContourPath()`.

## Verification contract after approval

- Unit tests preserve all IDs, default cancer-to-contour mappings, migration behavior, public method signatures, and the three-color persisted tuple.
- A path-recording test samples every boundary at fixed x positions, verifies finite coordinates and normalized bounds, and proves four unique signatures.
- Preview/full/export parity test compares the canonical path command sequence after normalization; `renderContourPreview()`, header clipping, normal poster rendering, and 2400 × 1800 export must all resolve to the same signature.
- Decorative-layer tests assert exact maximum counts: three signal paths and three nodes for 01; two lens surfaces, one focus, and one calibration trace for 02; bounded facet array for 03; three flow surfaces and at most two filaments for 04.
- Browser smoke QA covers 6 cancer palettes × 4 contours, records `independentRelationsVerified: true`, exercises header overlay clipping, and exports one 2400 × 1800 artifact per contour.
- Visual QA checks 1400 × 900 desktop and 390 × 844 mobile, drawer open/closed, normal animation, reduced motion, and a clean console.
