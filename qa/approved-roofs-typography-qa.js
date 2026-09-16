import { PosterRenderer, AGENDA_START_Y } from '../dist/logic/posterRenderer.js';
import { getRecommendedRoofScheme } from '../dist/logic/roofStyles.js';
import { recommendedRoofSelection } from '../dist/logic/roofSelection.js';
import { roofFixture, fixtureCustomColors } from './approved-roofs-fixture.js';

const makeCanvas = (width, height) => Object.assign(document.createElement('canvas'), { width, height });
const titleY = new Set([50, 85]);
const agendaLabels = new Set(['Time', 'Content', 'Speaker', 'Moderator']);

function isMeasuredText(text, y) {
  return titleY.has(y) || (agendaLabels.has(text) && y === AGENDA_START_Y + 15);
}

function installTextCapture(context, suppress = false) {
  const fills = [], strokes = [];
  const originalFill = context.fillText.bind(context), originalStroke = context.strokeText.bind(context);
  context.fillText = (text, x, y, maxWidth) => {
    if (isMeasuredText(text, y)) {
      fills.push({ text, x, y, font: context.font, textAlign: context.textAlign, textBaseline: context.textBaseline,
        color: String(context.fillStyle), globalAlpha: context.globalAlpha });
      if (suppress) return;
    }
    if (maxWidth === undefined) originalFill(text, x, y); else originalFill(text, x, y, maxWidth);
  };
  context.strokeText = (text, x, y, maxWidth) => {
    if (isMeasuredText(text, y)) {
      strokes.push({ text, x, y, font: context.font, textAlign: context.textAlign, textBaseline: context.textBaseline,
        color: String(context.strokeStyle), lineWidth: context.lineWidth, globalAlpha: context.globalAlpha });
      if (suppress) return;
    }
    if (maxWidth === undefined) originalStroke(text, x, y); else originalStroke(text, x, y, maxWidth);
  };
  return { fills, strokes };
}

function render(renderer, cancerId, styleId, overlays) {
  const scheme = getRecommendedRoofScheme(cancerId, styleId);
  renderer.setRoofSelection(cancerId, recommendedRoofSelection(cancerId, styleId));
  renderer.drawPoster(roofFixture.agenda, cancerId, 'optical_recommended', 'horizontal', fixtureCustomColors(scheme),
    roofFixture.conference, true, roofFixture.footer, overlays, 1);
}

function paintMask(run, stroke = false, width = roofFixture.width, height = roofFixture.height) {
  const canvas = makeCanvas(width, height), context = canvas.getContext('2d', { willReadFrequently: true });
  context.font = run.font; context.textAlign = run.textAlign; context.textBaseline = run.textBaseline;
  context.fillStyle = '#FFFFFF'; context.strokeStyle = '#FFFFFF'; context.lineJoin = 'round';
  if (stroke) { context.lineWidth = run.lineWidth; context.strokeText(run.text, run.x, run.y); }
  else context.fillText(run.text, run.x, run.y);
  return canvas;
}

function parseColor(value) {
  const canvas = makeCanvas(1, 1), context = canvas.getContext('2d', { willReadFrequently: true });
  context.clearRect(0, 0, 1, 1); context.fillStyle = value; context.fillRect(0, 0, 1, 1);
  return Array.from(context.getImageData(0, 0, 1, 1).data);
}

function compositeInk(ink, background, coverage) {
  const alpha = ink[3] / 255 * coverage;
  return ink.slice(0, 3).map((channel, index) => channel * alpha + background[index] * (1 - alpha));
}

function linear(value) {
  const unit = value / 255;
  return unit <= .04045 ? unit / 12.92 : ((unit + .055) / 1.055) ** 2.4;
}

function luminance(rgb) {
  return .2126 * linear(rgb[0]) + .7152 * linear(rgb[1]) + .0722 * linear(rgb[2]);
}

function contrast(first, second) {
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

function stats(values, target) {
  const sorted = [...values].sort((a, b) => a - b);
  const at = fraction => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
  return {
    pixelCount: sorted.length,
    min: sorted[0],
    p10: at(.10),
    median: at(.50),
    belowTarget: sorted.filter(value => value < target).length,
    target,
    pass: sorted.length > 0 && sorted[0] >= target
  };
}

function measureRun(run, strokeRun, actualPixels, backgroundPixels, compositeMask) {
  const fillCanvas = paintMask(run), fillMask = fillCanvas.getContext('2d').getImageData(0, 0, fillCanvas.width, fillCanvas.height).data;
  const ink = parseColor(run.color), target = titleY.has(run.y) ? 3 : 4.5, fillRatios = [];
  for (let p = 0; p < fillMask.length; p += 4) {
    if (fillMask[p + 3] < 245) continue;
    fillRatios.push(contrast(ink.slice(0, 3), backgroundPixels.slice(p, p + 3)));
    compositeMask[p] = titleY.has(run.y) ? 80 : 230;
    compositeMask[p + 1] = titleY.has(run.y) ? 145 : 150;
    compositeMask[p + 2] = titleY.has(run.y) ? 235 : 40;
    compositeMask[p + 3] = 255;
  }
  const measured = { role: run.y === 50 ? 'title' : run.y === 85 ? 'subtitle' : `agenda-${run.text.toLowerCase()}`,
    text: run.text, font: run.font, fill: run.color, fillContrast: stats(fillRatios, target) };
  if (strokeRun) {
    const strokeCanvas = paintMask(strokeRun, true), strokeMask = strokeCanvas.getContext('2d').getImageData(0, 0, strokeCanvas.width, strokeCanvas.height).data;
    const edgeInk = parseColor(strokeRun.color), edgeRatios = [], dualToneRatios = [];
    for (let p = 0; p < strokeMask.length; p += 4) {
      // Only measure the reproducible, substantially covered outer stroke. The
      // low-alpha antialias fringe is not treated as text ink.
      if (strokeMask[p + 3] < 192 || fillMask[p + 3] >= 96) continue;
      const background = backgroundPixels.slice(p, p + 3);
      const effectiveEdge = compositeInk(edgeInk, background, strokeMask[p + 3] / 255);
      const edgeRatio = contrast(effectiveEdge, background);
      const adjacentFillRatio = contrast(ink.slice(0, 3), background);
      edgeRatios.push(edgeRatio);
      // A two-tone outline is continuous when every solid outer-ring sample is
      // recognisable through either its edge ink or the immediately adjacent
      // fill. This is stricter than a percentile and retains all low fill data.
      dualToneRatios.push(Math.max(edgeRatio, adjacentFillRatio));
      compositeMask[p] = 245; compositeMask[p + 1] = 80; compositeMask[p + 2] = 130; compositeMask[p + 3] = 255;
    }
    measured.edge = strokeRun.color;
    measured.lineWidth = strokeRun.lineWidth;
    measured.effectiveEdgeContrast = stats(edgeRatios, target);
    measured.continuousDualToneEdge = stats(dualToneRatios, target);
    measured.edgeWithinLimit = strokeRun.lineWidth <= 2;
    measured.readabilityPass = measured.fillContrast.pass || (
      measured.edgeWithinLimit && measured.continuousDualToneEdge.pass
    );
  } else {
    measured.readabilityPass = measured.fillContrast.pass;
  }
  return measured;
}

export function runTypographyQA(cancerId, styleId, overlays, addArtifact = () => {}) {
  const actual = makeCanvas(roofFixture.width, roofFixture.height), renderer = new PosterRenderer(actual);
  const actualContext = actual.getContext('2d'), capture = installTextCapture(actualContext);
  const titleFills = [], titleStrokes = [], originalHeaderText = renderer.drawHeaderText;
  renderer.drawHeaderText = function (text, x, y, font, fill, edge, lineWidth) {
    titleFills.push({ text, x, y, font, textAlign: 'center', textBaseline: 'alphabetic', color: fill, globalAlpha: 1 });
    titleStrokes.push({ text, x, y, font, textAlign: 'center', textBaseline: 'alphabetic', color: edge, lineWidth, globalAlpha: 1 });
    return originalHeaderText.call(this, text, x, y, font, fill, edge, lineWidth);
  };
  render(renderer, cancerId, styleId, overlays);

  const background = makeCanvas(roofFixture.width, roofFixture.height), backgroundRenderer = new PosterRenderer(background);
  installTextCapture(background.getContext('2d'), true);
  backgroundRenderer.drawHeaderText = () => {};
  render(backgroundRenderer, cancerId, styleId, overlays);

  const actualPixels = actualContext.getImageData(0, 0, actual.width, actual.height).data;
  const backgroundPixels = background.getContext('2d').getImageData(0, 0, background.width, background.height).data;
  const compositeMask = new Uint8ClampedArray(actualPixels.length);
  const fills = [...titleFills, ...capture.fills], strokes = [...titleStrokes, ...capture.strokes];
  const runs = fills.map(run => {
    const stroke = strokes.find(item => item.text === run.text && item.x === run.x && item.y === run.y);
    return measureRun(run, stroke, actualPixels, backgroundPixels, compositeMask);
  });
  const mask = makeCanvas(actual.width, actual.height), image = mask.getContext('2d').createImageData(mask.width, mask.height);
  image.data.set(compositeMask); mask.getContext('2d').putImageData(image, 0, 0);
  addArtifact(`${cancerId}-${styleId}-glyph-mask`, mask);
  return { runs, titleFillPassed: runs.filter(item => item.role === 'title' || item.role === 'subtitle').every(item => item.fillContrast.pass),
    titleReadablePassed: runs.filter(item => item.role === 'title' || item.role === 'subtitle').every(item => item.readabilityPass),
    agendaInkPassed: runs.filter(item => item.role.startsWith('agenda-')).every(item => item.fillContrast.pass) };
}
