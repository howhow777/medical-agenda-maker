import { PosterRenderer, AGENDA_START_Y } from '../dist/logic/posterRenderer.js';
import { roofMaterialLibrary } from '../dist/logic/roofMaterials.js';
import { roofStyles, getRoofPlacement, getRecommendedRoofScheme } from '../dist/logic/roofStyles.js';
import { recommendedRoofSelection } from '../dist/logic/roofSelection.js';
import { compositeOpticalRoof } from '../dist/logic/roofCompositor.js';
import { fixtureCustomColors, roofFixture } from './approved-roofs-fixture.js';

const makeCanvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
const pixels = c => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
const check = (ok, message) => { if (!ok) throw new Error(message); };

function compare(a, b) {
  let maximum = 0, sum = 0, outsideTolerance = 0;
  const examples = [];
  for (let i = 0; i < a.length; i++) {
    const difference = Math.abs(a[i] - b[i]);
    maximum = Math.max(maximum, difference); sum += difference;
    if (difference > 2) {
      outsideTolerance++;
      if (examples.length < 12) examples.push({ x: Math.floor(i / 4) % 800, y: Math.floor(i / 3200), channel: i % 4, actual: a[i], expected: b[i] });
    }
  }
  return { rgbaMAE: sum / a.length, maximumChannelError: maximum, channelsOutsideTwoByteTolerance: outsideTolerance, examples, pass: outsideTolerance === 0 };
}

function captureLayer(renderer, method, destination) {
  const original = renderer[method];
  renderer[method] = function (...args) {
    const saved = this.ctx;
    renderer[`qaArgs_${method}`] = args;
    if (method === 'drawPosterTitle') renderer.qaInsideBeforeTitle = saved.getImageData(0, 0, saved.canvas.width, saved.canvas.height).data;
    this.ctx = destination.getContext('2d');
    try { original.apply(this, args); } finally { this.ctx = saved; }
    return original.apply(this, args);
  };
  return () => { renderer[method] = original; };
}

function coverageImages(data, width, height) {
  const heatmap = makeCanvas(width, height), contours = makeCanvas(width, height);
  const heat = heatmap.getContext('2d').createImageData(width, height);
  const lines = contours.getContext('2d').createImageData(width, height);
  let softPixels = 0, maxComplementError = 0;
  const levels = [26, 128, 230], colors = [[30, 110, 210], [180, 40, 160], [230, 120, 30]];
  for (let p = 0; p < width * height; p++) {
    const a = data[p * 4 + 3];
    heat.data.set([a, a, a, 255], p * 4);
    if (a > 0 && a < 255) softPixels++;
    maxComplementError = Math.max(maxComplementError, Math.abs(a / 255 + (255 - a) / 255 - 1));
    levels.forEach((level, index) => {
      const right = p % width < width - 1 ? data[(p + 1) * 4 + 3] : a;
      const below = p + width < width * height ? data[(p + width) * 4 + 3] : a;
      if ((a < level) !== (right < level) || (a < level) !== (below < level)) lines.data.set([...colors[index], 255], p * 4);
    });
  }
  heatmap.getContext('2d').putImageData(heat, 0, 0); contours.getContext('2d').putImageData(lines, 0, 0);
  return { heatmap, contours, softPixels, maxComplementError };
}

export async function runCompositorQA(addArtifact = () => {}) {
  const result = { revision: 'fixed-object-baseline-20260916', method: 'Independent per-pixel straight-alpha source-over; real PosterRenderer output, six materials, four relations, four probe opacities', cases: [], transparentProbes: [], coverage: [], failures: [] };
  await document.fonts.ready;
  const width = 800, height = 600;
  const agenda = [{ time: '', topic: '', speaker: '', moderator: '' }];
  const conference = { ...roofFixture.conference, date: '', time: '', location: '' };
  for (const style of roofStyles) {
    const cancerId = style.id === 'optical-signal' || style.id === 'satin-arc' || style.id === 'waterlight' ? 'lung' : 'breast';
    await roofMaterialLibrary.preload(style.id);
    const scheme = getRecommendedRoofScheme(cancerId, style.id), surface = roofMaterialLibrary.getSurface(style.id, scheme.header.colors);
    const placement = getRoofPlacement(style.id, width), roofHeight = Math.ceil(placement.height);
    // Match only the browser's CPU resampling backend, not the composition.
    // GPU and CPU high-quality filters differ visibly on narrow light paths.
    const scaled = makeCanvas(width, roofHeight), scaledContext = scaled.getContext('2d', { willReadFrequently: true });
    scaledContext.imageSmoothingEnabled = true; scaledContext.imageSmoothingQuality = 'high';
    scaledContext.drawImage(surface, 0, 0, width, placement.height);
    const material = pixels(scaled), coverage = coverageImages(material, width, roofHeight);
    check(coverage.softPixels > 100 && coverage.maxComplementError <= 1 / 255, `${style.id}: invalid coverage`);
    result.coverage.push({ styleId: style.id, size: [width, roofHeight], softPixels: coverage.softPixels, maxComplementError: coverage.maxComplementError, levels: [.1, .5, .9] });
    addArtifact(`${style.id}-coverage`, coverage.heatmap); addArtifact(`${style.id}-isolines`, coverage.contours);

    const destination = makeCanvas(width, height), renderer = new PosterRenderer(destination);
    renderer.setRoofSelection(cancerId, recommendedRoofSelection(cancerId, style.id));
    const title = makeCanvas(width, roofHeight), table = makeCanvas(width, height);
    title.getContext('2d', { willReadFrequently: true });
    // Rasterize the fixed title on the same opaque substrate as the actual
    // painter. Flattening a translucent text/shadow layer first introduces a
    // separate quantization error; that is not an overlay-order discrepancy.
    const opaqueRoof = title.getContext('2d').createImageData(width, roofHeight);
    opaqueRoof.data.set(material);
    for (let k = 3; k < opaqueRoof.data.length; k += 4) opaqueRoof.data[k] = 255;
    title.getContext('2d').putImageData(opaqueRoof, 0, 0);
    const restoreTitle = captureLayer(renderer, 'drawPosterTitle', title), restoreTable = captureLayer(renderer, 'drawAgendaTable', table);
    const draw = overlays => renderer.drawPoster(agenda, cancerId, 'optical_recommended', 'horizontal', fixtureCustomColors(scheme), conference, false, '', overlays, .65);
    draw([]); restoreTitle(); restoreTable();
    const baselinePixels = pixels(destination);
    const repeatedScaled = makeCanvas(width, roofHeight), repeatContext = repeatedScaled.getContext('2d', { willReadFrequently: true });
    repeatContext.imageSmoothingEnabled = true; repeatContext.imageSmoothingQuality = 'high';
    repeatContext.drawImage(surface, 0, 0, width, placement.height);
    result.coverage[result.coverage.length - 1].samplingDiagnostic = {
      sourceIdentity: surface === roofMaterialLibrary.getSurface(style.id, recommendedRoofSelection(cancerId, style.id).colors),
      x24Expected: Array.from(material.slice(24 * 4, 24 * 4 + 4)),
      x24Inside: Array.from(renderer.qaInsideBeforeTitle.slice(24 * 4, 24 * 4 + 4)),
      x24Baseline: Array.from(baselinePixels.slice(24 * 4, 24 * 4 + 4)),
      sourceRepeatedDraw: compare(material, pixels(repeatedScaled)),
      placement
    };
    const titlePixels = pixels(title);
    const tableBottom = renderer.calculateAgendaTableEndY(agenda, width, AGENDA_START_Y, false);
    const roof = new Uint8ClampedArray(material.length);
    for (let k = 0; k < material.length; k += 4) {
      roof.set([titlePixels[k], titlePixels[k + 1], titlePixels[k + 2], material[k + 3]], k);
    }
    for (const alpha of [0, 64, 128, 255]) {
      const probe = makeCanvas(width, height), pc = probe.getContext('2d');
      pc.fillStyle = `rgba(51,102,204,${alpha / 255})`; pc.fillRect(0, 0, width, height);
      const probePixels = pixels(probe);
      const underTableScene = makeCanvas(width, height), underTableContext = underTableScene.getContext('2d', { willReadFrequently: true });
      underTableContext.fillStyle = '#FFFFFF'; underTableContext.fillRect(0, 0, width, height);
      underTableContext.save(); underTableContext.translate(width / 2, height / 2);
      underTableContext.drawImage(probe, -width / 2, -height / 2, width, height); underTableContext.restore();
      const savedContext = renderer.ctx; renderer.ctx = underTableContext;
      try { renderer.drawAgendaTable(...renderer.qaArgs_drawAgendaTable); } finally { renderer.ctx = savedContext; }
      const underTablePixels = pixels(underTableScene);
      for (const aboveHeader of [false, true]) for (const aboveTable of [false, true]) {
        const overlay = { id: 901, name: 'QA full-field probe', img: probe, visible: true, opacity: 1, x: width / 2, y: height / 2, w: width, h: height, scaleX: 1, scaleY: 1, rotation: 0, zIndex: 0, aboveHeader, aboveTable };
        // Canvas may promote its glyph raster cache after an earlier draw. A
        // case-local no-overlay scene keeps the fixed-object painter in the
        // same raster state while the source-over oracle remains independent.
        draw([]);
        const noOverlayScene = pixels(destination);
        draw([overlay]);
        const expected = new Uint8ClampedArray(width * height * 4);
        // Independent straight-alpha source-over oracle. Fixed-object glyph
        // painters are shared; coverage/mix, partition and clipping are not.
        for (let p = 0; p < width * height; p++) {
          const k = p * 4, x = p % width, y = Math.floor(p / width), opacity = probePixels[k + 3] / 255;
          const inTable = x >= 40 && x < width - 40 && y >= AGENDA_START_Y - 8 && y < tableBottom;
          for (let channel = 0; channel < 3; channel++) {
            const foreground = probePixels[k + channel];
            let value = foreground * opacity + 255 * (1 - opacity);
            if (y < roofHeight) {
              const a = roof[k + 3] / 255, color = roof[k + channel];
              value = aboveHeader ? foreground * opacity + (color * a + 255 * (1 - a)) * (1 - opacity) : color * a + value * (1 - a);
            }
            if (inTable) {
              value = aboveTable ? foreground * opacity + noOverlayScene[k + channel] * (1 - opacity) : underTablePixels[k + channel];
            }
            expected[k + channel] = value;
          }
          expected[k + 3] = 255;
        }
        const actualPixels = pixels(destination);
        const metric = compare(actualPixels, expected);
        const item = { styleId: style.id, alpha, aboveHeader, aboveTable, ...metric };
        result.cases.push(item);
        if (!metric.pass) result.failures.push(item);
        if (alpha === 128) {
          const reference = makeCanvas(width, height), referenceContext = reference.getContext('2d'), image = referenceContext.createImageData(width, height);
          image.data.set(expected); referenceContext.putImageData(image, 0, 0);
          addArtifact(`${style.id}-h${+aboveHeader}-t${+aboveTable}-actual`, destination);
          addArtifact(`${style.id}-h${+aboveHeader}-t${+aboveTable}-reference`, reference);
        }
      }
    }
    // Actual compositor on a transparent destination: no white matte can hide
    // repeated alpha. The uncovered lower region must remain 0/64/128/255.
    for (const alpha of [0, 64, 128, 255]) {
      const target = makeCanvas(width, height), context = target.getContext('2d');
      context.fillStyle = `rgba(51,102,204,${alpha / 255})`; context.fillRect(0, 0, width, height);
      compositeOpticalRoof(context, surface, style.id, width, inside => {
        inside.fillStyle = `rgba(51,102,204,${alpha / 255})`; inside.fillRect(0, 0, width, height);
      });
      const observed = context.getImageData(400, roofHeight + 20, 1, 1).data[3];
      const pass = Math.abs(observed - alpha) <= 1;
      result.transparentProbes.push({ styleId: style.id, expectedAlpha: alpha, observedAlpha: observed, pass });
      if (!pass) result.failures.push(`${style.id}: alpha ${alpha} became ${observed}`);
    }
    await new Promise(resolve => requestAnimationFrame(resolve));
  }
  result.independentRelationsVerified = result.cases.length === 96 && result.cases.every(item => item.pass);
  result.softCoverageVerified = result.independentRelationsVerified && result.coverage.length === 6 && result.transparentProbes.length === 24 && result.transparentProbes.every(item => item.pass);
  return result;
}
