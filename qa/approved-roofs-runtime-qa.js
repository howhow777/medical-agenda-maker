import { PosterRenderer } from '../dist/logic/posterRenderer.js';
import { OverlayManager } from '../dist/logic/overlayManager.js';
import { roofMaterialLibrary } from '../dist/logic/roofMaterials.js';
import { roofStyles, approvedRoofPairs, getRoofStyle, getRoofAssetURL, getRoofPlacement, getRecommendedRoofScheme } from '../dist/logic/roofStyles.js';
import { recommendedClassicRoofSelection, recommendedRoofSelection } from '../dist/logic/roofSelection.js';
import { cancerDesignPresets } from '../dist/logic/cancerDesignPresets.js';
import { colorSchemes } from '../dist/logic/colorSchemes.js';
import { extractRoofCoverage, mixRoofCoverage } from '../dist/logic/roofCompositor.js';
import { roofFixture, fixtureCustomColors } from './approved-roofs-fixture.js';
import { runCompositorQA } from './approved-roofs-compositor-qa.js';
import { runTypographyQA } from './approved-roofs-typography-qa.js';
import { runMakerStateQA } from './approved-roofs-maker-state-qa.js';
import { runResponsiveQA } from './approved-roofs-responsive-qa.js';

const errors = [];
window.addEventListener('error', event => errors.push({ message: event.message, source: event.filename, line: event.lineno, stack: event.error?.stack || '' }));
window.addEventListener('unhandledrejection', event => errors.push({ message: String(event.reason), stack: event.reason?.stack || '' }));
const runButton = document.getElementById('runQA'), status = document.getElementById('status'), output = document.getElementById('report');
const gallery = document.getElementById('gallery');
let report, urls = [];
let compositorReport;
let compositorArtifacts = [];
let typographyArtifacts = [];
let makerStateReport;
let responsiveReport;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const canvas = (width, height) => { const c = document.createElement('canvas'); c.width = width; c.height = height; return c; };
const nextFrame = () => new Promise(resolve => requestAnimationFrame(resolve));
const sha256 = async bytes => [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(v => v.toString(16).padStart(2, '0')).join('');

function rgbMAE(a, b) {
  assert(a.length === b.length, 'MAE dimensions differ');
  let sum = 0;
  for (let p = 0; p < a.length; p += 4) for (let c = 0; c < 3; c++) sum += Math.abs(a[p + c] - b[p + c]);
  return sum / (a.length / 4 * 3);
}

async function decodeBlob(blob) {
  const url = URL.createObjectURL(blob), image = new Image();
  try { image.src = url; await image.decode(); return image; }
  finally { URL.revokeObjectURL(url); }
}

async function loadApprovedReferenceMetrics() {
  const response = await fetch('./approved-roofs-reference-metrics.json', { cache: 'no-store' });
  assert(response.ok, `approved reference metrics HTTP ${response.status}`);
  const metrics = await response.json();
  assert(metrics.version === 1 && metrics.sourceStable === true && metrics.approvedReferenceVerified === true,
    'approved reference audit is not stable/verified');
  assert(metrics.cases.length === 18, 'approved reference audit does not contain 18 cases');
  for (const file of metrics.candidateFiles) {
    const source = await fetch(file.url, { cache: 'no-store' });
    assert(source.ok, `reference provenance ${file.url} HTTP ${source.status}`);
    assert(await sha256(await source.arrayBuffer()) === file.sha256, `reference provenance drift ${file.url}`);
  }
  for (const item of metrics.cases) {
    assert(item.rawRoofMAE <= 3 && item.glyphExcludedMAE <= 3 && item.glyphMaskExcludedPixels > 0,
      `approved reference MAE failed ${item.cancerId}/${item.styleId}`);
  }
  return metrics;
}

async function fixtureOverlays(cancerId, destination) {
  const preset = cancerDesignPresets[cancerId], motif = preset.motifs[0];
  const image = new Image(); image.src = new URL(`../${motif.src}`, import.meta.url).href; await image.decode();
  const manager = new OverlayManager(destination); manager.setActiveCancerPresetId(cancerId);
  manager.upsertCancerPrimary(cancerId, motif.id, image, motif.name, image.src);
  return manager.getRenderableOverlays();
}

function renderFixture(renderer, cancerId, styleId, overlays, items = roofFixture.agenda) {
  const scheme = getRecommendedRoofScheme(cancerId, styleId);
  renderer.setRoofSelection(cancerId, recommendedRoofSelection(cancerId, styleId));
  renderer.drawPoster(items, cancerId, 'optical_recommended', 'horizontal', fixtureCustomColors(scheme), roofFixture.conference, true, roofFixture.footer, overlays, 1);
}

function renderClassicFixture(renderer, cancerId, overlays, items = roofFixture.agenda) {
  const preset = cancerDesignPresets[cancerId], scheme = colorSchemes[preset.colorScheme];
  renderer.setRoofSelection(cancerId, recommendedClassicRoofSelection(cancerId));
  renderer.drawPoster(items, cancerId, preset.colorScheme, 'horizontal', fixtureCustomColors(scheme), roofFixture.conference, true, roofFixture.footer, overlays, 1);
}

function coverageChecks(surface) {
  const rgba = surface.getContext('2d').getImageData(0, 0, surface.width, surface.height).data;
  const { coverage, complement } = extractRoofCoverage(rgba);
  let softPixels = 0;
  for (let i = 0; i < coverage.length; i++) {
    assert(coverage[i] + complement[i] === 255, 'coverage is not complementary');
    if (coverage[i] > 0 && coverage[i] < 255) softPixels++;
  }
  assert(softPixels > 100, 'continuous soft coverage missing');
  for (const alpha of [0, 64, 128, 255]) for (const weight of [0, 32, 64, 127, 128, 192, 255]) {
    const p = new Uint8ClampedArray([70, 120, 180, alpha]);
    const mixed = mixRoofCoverage(p, p, new Uint8ClampedArray([weight]));
    assert(mixed[3] === alpha, 'probe rendered more than once');
  }
  return { complementary: true, softPixels, sameSceneProbeAlphaPreserved: true };
}

function publish() { output.textContent = JSON.stringify(report, null, 2); }

runButton.addEventListener('click', async () => {
  runButton.disabled = true;
  document.getElementById('downloadReport').disabled = true;
  document.getElementById('downloadTypographyArtifacts').disabled = true;
  urls.forEach(url => URL.revokeObjectURL(url)); urls = []; gallery.replaceChildren();
  typographyArtifacts = [];
  report = { version: 1, startedAt: new Date().toISOString(), pageURL: location.href, fixture: roofFixture,
    materialAssetsLoaded: '0/6', approvedCombinationsRendered: '0/18', classicCombinationsRendered: '0/6',
    totalCombinationsRendered: '0/24', pngExportsVerified: '0/24', jpegExportsVerified: '0/24', sourceAssetHashesMatch: 'unverified',
    paletteStateRestored: 'unverified', legacyMigrationPreserved: 'unverified', sameDocumentSwitchingVerified: 'unverified',
    staleLoadCannotOverrideSelection: 'unverified', independentRelationsVerified: 'unverified', softCoverageVerified: 'unverified',
    approvedReferenceRoofMAE: 'unverified', applicationConsoleErrors: 'unverified', horizontalOverflowCases: 'unverified',
    typography: 'unverified', responsiveMotionKeyboard: 'unverified', assets: [], combinations: [], failures: [] };
  if (makerStateReport) {
    report.paletteStateRestored = makerStateReport.paletteStateRestored;
    report.legacyMigrationPreserved = makerStateReport.legacyMigrationPreserved;
    report.sameDocumentSwitchingVerified = makerStateReport.sameDocumentSwitchingVerified;
    report.staleLoadCannotOverrideSelection = makerStateReport.staleLoadCannotOverrideSelection;
    report.applicationConsoleErrors = makerStateReport.applicationConsoleErrors;
    report.makerState = makerStateReport;
  }
  if (responsiveReport) {
    report.horizontalOverflowCases = responsiveReport.horizontalOverflowCases;
    report.responsiveMotionKeyboard = responsiveReport.responsiveMotionKeyboard;
    report.responsive = responsiveReport;
  }
  publish();
  try {
    await document.fonts.ready;
    const approvedReference = await loadApprovedReferenceMetrics();
    for (const style of roofStyles) {
      status.textContent = `載入並核對原圖：${style.label}`;
      const response = await fetch(getRoofAssetURL(style.id), { cache: 'no-store' });
      assert(response.ok, `${style.id} HTTP ${response.status}`);
      const bytes = await response.arrayBuffer(), hash = await sha256(bytes);
      assert(hash === style.sha256 && bytes.byteLength === style.bytes, `${style.id} source SHA/bytes mismatch`);
      await roofMaterialLibrary.preload(style.id);
      report.assets.push({ styleId: style.id, sourceSHA256: hash, bytes: bytes.byteLength, width: style.width, height: style.height });
      report.materialAssetsLoaded = `${report.assets.length}/6`; publish(); await nextFrame();
    }
    report.sourceAssetHashesMatch = report.assets.length === 6;
    const destination = canvas(roofFixture.width, roofFixture.height), renderer = new PosterRenderer(destination);
    let pngCount = 0, jpegCount = 0;
    for (const pair of approvedRoofPairs) {
      const preset = cancerDesignPresets[pair.cancerId], style = getRoofStyle(pair.styleId);
      status.textContent = `真實 Canvas／輸出 ${report.combinations.length + 1}/18：${preset.label} · ${style.label}`;
      const overlays = await fixtureOverlays(pair.cancerId, destination);
      renderFixture(renderer, pair.cancerId, pair.styleId, overlays);
      const normal = canvas(destination.width, destination.height); normal.getContext('2d').drawImage(destination, 0, 0);
      const roofHeight = Math.ceil(getRoofPlacement(pair.styleId, normal.width).height);
      const normalPixels = normal.getContext('2d').getImageData(0, 0, normal.width, roofHeight).data;
      const card = document.createElement('article'), heading = document.createElement('h2');
      heading.textContent = `${preset.label} · ${style.label}`; card.append(heading, normal); gallery.append(card);
      const reference = approvedReference.cases.find(item => item.cancerId === pair.cancerId && item.styleId === pair.styleId);
      assert(reference, `missing approved reference ${pair.cancerId}/${pair.styleId}`);
      const metrics = { ...pair, palette: getRecommendedRoofScheme(pair.cancerId, pair.styleId).header.colors,
        sourceSHA256: style.sha256, normalSize: [normal.width, normal.height], roofROI: [0, 0, normal.width, roofHeight],
        approvedReferenceRoofMAE: reference.rawRoofMAE, approvedReferenceGlyphExcludedMAE: reference.glyphExcludedMAE,
        glyphMaskExcludedPixels: reference.glyphMaskExcludedPixels, typography: 'unverified', exports: [],
        coverage: coverageChecks(roofMaterialLibrary.getSurface(pair.styleId, getRecommendedRoofScheme(pair.cancerId, pair.styleId).header.colors)) };
      metrics.typography = runTypographyQA(pair.cancerId, pair.styleId, overlays, (name, source) => {
        const dataURL = source.toDataURL('image/png');
        typographyArtifacts.push({ name: `${name}.png`, width: source.width, height: source.height, dataURL });
        const link = document.createElement('a'); link.href = dataURL; link.download = `${name}.png`; link.textContent = '下載 glyph mask'; card.append(link);
      });
      if (!metrics.typography.titleReadablePassed) report.failures.push(`${pair.cancerId}/${pair.styleId} title has neither 3:1 fill nor a continuous effective edge`);
      if (!metrics.typography.agendaInkPassed) report.failures.push(`${pair.cancerId}/${pair.styleId} agenda label contrast below 4.5:1`);
      for (const format of ['png', 'jpeg']) {
        const result = await renderer.exportHighQuality(format, .95, 3), image = await decodeBlob(result.blob);
        assert(image.naturalWidth === 2400 && image.naturalHeight === 2490, `${pair.styleId} export size mismatch`);
        const downsampled = canvas(normal.width, normal.height), ctx = downsampled.getContext('2d');
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(image, 0, 0, normal.width, normal.height);
        const pixels = ctx.getImageData(0, 0, normal.width, roofHeight).data, mae = rgbMAE(normalPixels, pixels);
        assert(pixels.some(value => value !== 255 && value !== 0), 'empty export');
        const item = { format, width: image.naturalWidth, height: image.naturalHeight, bytes: result.blob.size, rawRoofMAE: mae, pass: mae <= 3 };
        metrics.exports.push(item);
        if (!item.pass) report.failures.push(`${pair.cancerId}/${pair.styleId}/${format} roof MAE ${mae} > 3`);
        const url = URL.createObjectURL(result.blob); urls.push(url);
        const link = document.createElement('a'); link.href = url; link.download = `${pair.cancerId}-${pair.styleId}.${format === 'jpeg' ? 'jpg' : 'png'}`;
        link.textContent = `下載 2400×2490 ${format.toUpperCase()} · MAE ${mae.toFixed(3)}`; card.append(link);
        if (format === 'png') pngCount++; else jpegCount++;
      }
      report.combinations.push(metrics);
      report.approvedCombinationsRendered = `${report.combinations.length}/18`;
      report.pngExportsVerified = `${pngCount}/24`; report.jpegExportsVerified = `${jpegCount}/24`; publish(); await nextFrame();
    }
    report.sameDocumentSwitchingVerified = new Set(report.combinations.map(item => item.styleId)).size === 6 && report.combinations.length === 18;
    report.approvedReferenceRoofMAE = approvedReference.cases.map(item => ({ cancerId: item.cancerId, styleId: item.styleId,
      rawRoofMAE: item.rawRoofMAE, glyphExcludedMAE: item.glyphExcludedMAE,
      glyphMaskExcludedPixels: item.glyphMaskExcludedPixels, pass: item.rawRoofMAE <= 3 && item.glyphExcludedMAE <= 3 }));
    report.approvedReferenceSource = { sourceProvenanceSHA256: approvedReference.sourceProvenanceSHA256,
      createdAt: approvedReference.createdAt, finishedAt: approvedReference.finishedAt,
      candidateFiles: approvedReference.candidateFiles };
    report.typography = {
      cases: report.combinations.length,
      titleFillPassed: report.combinations.every(item => item.typography.titleFillPassed),
      titleReadablePassed: report.combinations.every(item => item.typography.titleReadablePassed),
      agendaInkPassed: report.combinations.every(item => item.typography.agendaInkPassed),
      artifactCount: typographyArtifacts.length
    };
    let classicCount = 0;
    for (const preset of Object.values(cancerDesignPresets)) {
      status.textContent = `最初版波浪／輸出 ${classicCount + 1}/6：${preset.label}`;
      const overlays = await fixtureOverlays(preset.id, destination);
      renderClassicFixture(renderer, preset.id, overlays);
      const pixels = destination.getContext('2d').getImageData(0, 0, 800, 150).data;
      assert(pixels.some(v => v > 0 && v < 255), `classic ${preset.id} empty`);
      const card = document.createElement('article'), heading = document.createElement('h2');
      heading.textContent = `${preset.label} · 最初版波浪屋簷`; card.append(heading);
      const normal = canvas(destination.width, destination.height); normal.getContext('2d').drawImage(destination, 0, 0); card.append(normal); gallery.append(card);
      const exports = [];
      for (const format of ['png', 'jpeg']) {
        const result = await renderer.exportHighQuality(format, .95, 3), image = await decodeBlob(result.blob);
        assert(image.naturalWidth === 2400 && image.naturalHeight === 2490, `classic ${preset.id} export size mismatch`);
        const item = { format, width: image.naturalWidth, height: image.naturalHeight, bytes: result.blob.size, pass: result.blob.size > 0 };
        assert(item.pass, `classic ${preset.id}/${format} empty export`); exports.push(item);
        const url = URL.createObjectURL(result.blob); urls.push(url);
        const link = document.createElement('a'); link.href = url; link.download = `${preset.id}-classic.${format === 'jpeg' ? 'jpg' : 'png'}`;
        link.textContent = `下載 2400×2490 ${format.toUpperCase()}`; card.append(link);
        if (format === 'png') pngCount++; else jpegCount++;
      }
      report.combinations.push({ cancerId: preset.id, kind: 'classic', palette: preset.palette, exports });
      classicCount++;
      report.classicCombinationsRendered = `${classicCount}/6`;
      report.totalCombinationsRendered = `${18 + classicCount}/24`;
      report.pngExportsVerified = `${pngCount}/24`; report.jpegExportsVerified = `${jpegCount}/24`; publish(); await nextFrame();
    }
    // 600px fixture tests the non-truncated 2400x1800 export contract separately.
    destination.height = 600;
    renderFixture(renderer, 'lung', 'optical-signal', [], []);
    const compact = await renderer.exportHighQuality('png', .95, 3), compactImage = await decodeBlob(compact.blob);
    assert(compactImage.naturalWidth === 2400 && compactImage.naturalHeight === 1800, 'compact export dimension mismatch');
    report.compactExport = { width: compactImage.naturalWidth, height: compactImage.naturalHeight, verified: true };
    report.rawConsoleEvents = [...errors];
    // Error source attribution and responsive tests remain separately required.
    report.finishedAt = new Date().toISOString();
    status.textContent = `完成渲染 ${report.totalCombinationsRendered}（光影 ${report.approvedCombinationsRendered}、最初版 ${report.classicCombinationsRendered}），PNG ${report.pngExportsVerified}、JPEG ${report.jpegExportsVerified}。已記錄 ${report.failures.length} 個數值失敗；其他未驗收項仍為 unverified。`;
  } catch (error) {
    report.failures.push({ message: String(error), stack: error.stack || '' });
    status.textContent = `本次驗證中止：${error.message}`;
  } finally {
    publish(); runButton.disabled = false; document.getElementById('downloadReport').disabled = false;
    document.getElementById('downloadTypographyArtifacts').disabled = !typographyArtifacts.length;
  }
});

document.getElementById('downloadReport').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ ...report, compositor: compositorReport }, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'approved-roofs-runtime-qa.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

document.getElementById('downloadTypographyArtifacts').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ artifacts: typographyArtifacts })], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'approved-roofs-typography-artifacts.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

document.getElementById('runCompositorQA').addEventListener('click', async event => {
  const button = event.currentTarget, artifacts = document.getElementById('compositorGallery');
  button.disabled = true; compositorArtifacts = []; artifacts.replaceChildren(); status.textContent = '正在以獨立 reference compositor 驗證 96 組真實 Canvas…';
  document.getElementById('downloadCompositorArtifacts').disabled = true;
  try {
    compositorReport = await runCompositorQA((name, source) => {
      const link = document.createElement('a'); link.href = source.toDataURL('image/png'); link.download = `${name}.png`; link.textContent = `${name} PNG`; link.style.display = 'block'; artifacts.append(link);
      compositorArtifacts.push({ name: link.download, width: source.width, height: source.height, dataURL: link.href });
    });
    if (report) {
      report.independentRelationsVerified = compositorReport.independentRelationsVerified;
      report.softCoverageVerified = compositorReport.softCoverageVerified; publish();
    }
    status.textContent = `柔邊驗證：${compositorReport.cases.length} 組，${compositorReport.failures.length} 個失敗。`;
  } catch (error) { compositorReport = { failures: [{ message: String(error), stack: error.stack }] }; status.textContent = `柔邊驗證中止：${error.message}`; }
  finally {
    document.getElementById('compositorReport').textContent = JSON.stringify(compositorReport, null, 2);
    button.disabled = false; document.getElementById('downloadReport').disabled = false;
    document.getElementById('downloadCompositorArtifacts').disabled = !compositorArtifacts.length;
  }
});

document.getElementById('downloadCompositorArtifacts').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ report: compositorReport, artifacts: compositorArtifacts })], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'approved-roofs-compositor-artifacts.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

document.getElementById('runMakerStateQA').addEventListener('click', async event => {
  const button = event.currentTarget, makerOutput = document.getElementById('makerStateReport');
  button.disabled = true; status.textContent = '正在以無研究參數的正式 Maker 驗證 18 組光影、6 組最初版與 migration…';
  try {
    makerStateReport = await runMakerStateQA(document.getElementById('makerStateHost'), message => { status.textContent = message; });
    makerOutput.textContent = JSON.stringify(makerStateReport, null, 2);
    if (report) {
      report.paletteStateRestored = makerStateReport.paletteStateRestored;
      report.legacyMigrationPreserved = makerStateReport.legacyMigrationPreserved;
      report.sameDocumentSwitchingVerified = makerStateReport.sameDocumentSwitchingVerified;
      report.staleLoadCannotOverrideSelection = makerStateReport.staleLoadCannotOverrideSelection;
      report.applicationConsoleErrors = makerStateReport.applicationConsoleErrors;
      report.makerState = makerStateReport;
      if (makerStateReport.failures.length) report.failures.push(...makerStateReport.failures.map(item => ({ makerState: item })));
      publish();
    }
    status.textContent = makerStateReport.failures.length
      ? `正式 Maker 狀態驗證有 ${makerStateReport.failures.length} 個失敗。`
      : '正式 Maker：18/18 光影、6/6 最初版、fresh／V1／V2／模板 migration 與非同步競態全部通過。';
  } catch (error) {
    makerStateReport = { failures: [{ message: String(error), stack: error.stack || '' }] };
    makerOutput.textContent = JSON.stringify(makerStateReport, null, 2);
    status.textContent = `正式 Maker 狀態驗證中止：${error.message}`;
  } finally { button.disabled = false; document.getElementById('downloadReport').disabled = false; }
});

document.getElementById('runResponsiveQA').addEventListener('click', async event => {
  const button = event.currentTarget, responsiveOutput = document.getElementById('responsiveReport');
  button.disabled = true; status.textContent = '正在驗證 1400×900 與 390×844 的抽屜、鍵盤及動態規格…';
  try {
    responsiveReport = await runResponsiveQA(document.getElementById('responsiveHost'), message => { status.textContent = message; });
    responsiveOutput.textContent = JSON.stringify(responsiveReport, null, 2);
    if (report) {
      report.horizontalOverflowCases = responsiveReport.horizontalOverflowCases;
      report.responsiveMotionKeyboard = responsiveReport.responsiveMotionKeyboard;
      report.responsive = responsiveReport;
      if (responsiveReport.failures.length) report.failures.push(...responsiveReport.failures.map(item => ({ responsive: item })));
      publish();
    }
    status.textContent = responsiveReport.failures.length
      ? `響應式／鍵盤驗證有 ${responsiveReport.failures.length} 個失敗。`
      : '桌面／手機無水平溢出；抽屜、focus、ARIA、動畫與 reduced-motion CSS 規格通過。';
  } catch (error) {
    responsiveReport = { failures: [{ message: String(error), stack: error.stack || '' }] };
    responsiveOutput.textContent = JSON.stringify(responsiveReport, null, 2);
    status.textContent = `響應式／鍵盤驗證中止：${error.message}`;
  } finally { button.disabled = false; document.getElementById('downloadReport').disabled = false; }
});
