import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { cancerDesignPresetList, cancerDesignPresets, createDefaultCancerDesignState, normalizeCancerDesignState } from '../dist/logic/cancerDesignPresets.js';
import { colorSchemes } from '../dist/logic/colorSchemes.js';
import { roofStyles, approvedRoofPairs, getRoofStyle, getRoofStylesForCancer, isApprovedRoofPair, getRoofPlacement, getRecommendedRoofScheme, getRoofAssetURL } from '../dist/logic/roofStyles.js';
import { RoofSelectionStore, recommendedRoofSelection, parseRoofSelectionState, isRoofColors, ROOF_SELECTION_STORAGE_KEY, ROOF_SELECTION_DIAGNOSTIC_KEY } from '../dist/logic/roofSelection.js';
import { RoofMaterialLibrary, RoofLoadCoordinator, RoofSurfaceCache, roofSurfaceKey } from '../dist/logic/roofMaterials.js';
import { buildRoofMaps, recolorRoofPixels, rgbToLab, labToRGB, transferRoofChroma } from '../dist/logic/roofColorMath.js';
import { extractRoofCoverage, mixRoofCoverage } from '../dist/logic/roofCompositor.js';
import { RoofStyleControls } from '../dist/interface/roofStyleControls.js';
import { UIController } from '../dist/interface/uiController.js';
import { OverlayManager } from '../dist/logic/overlayManager.js';
import { getRoofAgendaInk, getRoofTitleInk } from '../dist/logic/roofTypography.js';

const manifest = JSON.parse(readFileSync(new URL('../assets/header-contour-materials-v2/manifest.json', import.meta.url)));
const memoryStorage = () => {
  const data = new Map();
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
};
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const fakeImage = style => ({ width: style.width, height: style.height, readPixels() { throw new Error('unexpected pixel read in loader test'); } });
const approvedSHAs = [
  'ac7361f47e39043b7a5ad161c77e6a62175c0297ce93eab0ee9612aea46980bd',
  '3b5f9e8bbcc2207736a53200187ac0f8670ed72669af694069aa30f2ecf679a2',
  'd67d51cd6c90ec512dbb777f3b6f2b8b24160610db5fa02c9998b47fd0479a88',
  '6333fb6102cc036d7db6b885b7547aa23f964f4ab2a4dbdc9d19cc18fe707d9b',
  '3fe7a009c0900cfb34151920942a74e803ade2df4452d4b37227ac1f8a2e9ce7',
  '6e53994e5023bd8fd5fc9d62c40125bf76c1dd7fa3848fcc1e222bdb2b385d8c'
];

test('B07 color input commits to its originating cancer before an immediate cancer switch', async () => {
  const savedDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const inputs = new Map(['headerC1', 'headerC2', 'headerC3'].map(id => [id, Object.assign(new EventTarget(), { value: '#FFFFFF' })]));
  globalThis.document = { documentElement: { dataset: {} }, querySelectorAll: () => [], querySelector: () => null,
    getElementById: id => inputs.get(id) || null };
  const store = new RoofSelectionStore(memoryStorage());
  store.select('lung', recommendedRoofSelection('lung', 'optical-signal'));
  const warm = recommendedRoofSelection('uterus', 'coral-arch'); store.select('uterus', warm);
  let colors = { headerC1: '#347F91', headerC2: '#55AABD', headerC3: '#A7DDE1' }, scheme = 'optical_recommended';
  for (const [id, input] of inputs) input.value = colors[id];
  const form = { getCustomColors: () => colors, getCurrentColorScheme: () => scheme,
    setCurrentColorScheme: value => { scheme = value; },
    setCustomColors: value => { colors = value; for (const [id, input] of inputs) input.value = value[id]; } };
  try {
    const controls = new RoofStyleControls(store, form, () => {});
    inputs.get('headerC1').value = '#12ABCD'; inputs.get('headerC1').dispatchEvent(new Event('input'));
    assert.deepEqual(store.get('lung'), { styleId: 'optical-signal', mode: 'custom', colors: ['#12ABCD', '#55AABD', '#A7DDE1'] });
    await controls.setCancer('uterus');
    assert.deepEqual(store.get('uterus'), warm);
    assert.deepEqual(store.get('lung').colors, ['#12ABCD', '#55AABD', '#A7DDE1']);
    assert.equal(form.getCurrentColorScheme(), 'optical_recommended');
  } finally {
    if (savedDocument) Object.defineProperty(globalThis, 'document', savedDocument);
    else delete globalThis.document;
  }
});

test('B01 six explicit optical styles expose exactly eighteen approved pairs; cross-family and unknown pairs rejected', () => {
  assert.equal(roofStyles.length, 6);
  assert.equal(new Set(roofStyles.map(s => s.id)).size, 6);
  assert.equal(approvedRoofPairs.length, 18);
  assert.equal(new Set(approvedRoofPairs.map(p => `${p.cancerId}/${p.styleId}`)).size, 18);
  for (const cancer of cancerDesignPresetList) {
    assert.equal(getRoofStylesForCancer(cancer.id).length, 3);
    for (const style of roofStyles) {
      const valid = ['breast', 'uterus'].includes(cancer.id) === (style.family === 'warm');
      assert.equal(isApprovedRoofPair(cancer.id, style.id), valid);
      if (!valid) assert.throws(() => getRecommendedRoofScheme(cancer.id, style.id));
    }
  }
  assert.equal(isApprovedRoofPair('unknown', 'optical-signal'), false);
  assert.equal(isApprovedRoofPair('lung', 'soft-wave'), false);
  assert.equal(getRoofStyle('constructor'), undefined);
});

test('B02 six immutable native PNGs match approved hashes, manifest dimensions/bytes/catalog and provenance', () => {
  assert.equal(manifest.version, 1);
  assert.equal(manifest.assets.length, 6);
  manifest.assets.forEach((asset, index) => {
    const bytes = readFileSync(new URL(`../assets/header-contour-materials-v2/${asset.file}`, import.meta.url));
    const style = getRoofStyle(asset.styleId);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), approvedSHAs[index]);
    assert.equal(asset.sha256, approvedSHAs[index]);
    assert.equal(style.sha256, approvedSHAs[index]);
    assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(bytes.readUInt32BE(16), asset.width);
    assert.equal(bytes.readUInt32BE(20), asset.height);
    assert.equal(bytes.length, asset.bytes);
    assert.equal(style.width, asset.width); assert.equal(style.height, asset.height); assert.equal(style.bytes, asset.bytes);
    assert.deepEqual(asset.sourceColors, style.sourceColors);
    assert.deepEqual([...asset.approvedFor].sort(), approvedRoofPairs.filter(p => p.styleId === style.id).map(p => p.cancerId).sort());
    assert.ok(asset.approvalRecords.length > 0);
    assert.match(getRoofAssetURL(style.id), /assets\/header-contour-materials-v2\//);
    assert.doesNotMatch(new URL(getRoofAssetURL(style.id)).pathname.split('/assets/')[1], /qa|tmp|Downloads/);
  });
});

test('B03 concurrent same-artwork requests share one promise and all six identities decode once', async () => {
  const counts = new Map();
  const library = new RoofMaterialLibrary(async style => { counts.set(style.id, (counts.get(style.id) || 0) + 1); return fakeImage(style); });
  for (const style of roofStyles) {
    const first = library.preload(style.id), second = library.preload(style.id);
    assert.equal(first, second);
    assert.equal(await first, await second);
    assert.equal(library.isReady(style.id), true);
    await library.preload(style.id);
    assert.equal(counts.get(style.id), 1);
  }
  assert.deepEqual(library.loadedStyleIds, roofStyles.map(s => s.id));
});

test('B04 delayed A then B cannot overwrite B; repeated A/B/A resolves only the latest selection', async () => {
  const a = deferred(), b = deferred();
  const library = new RoofMaterialLibrary(style => style.id === 'optical-signal' ? a.promise : b.promise);
  const coordinator = new RoofLoadCoordinator(library);
  const A = recommendedRoofSelection('lung', 'optical-signal'), B = recommendedRoofSelection('lung', 'satin-arc');
  const first = coordinator.select(A), second = coordinator.select(B);
  b.resolve(fakeImage(getRoofStyle(B.styleId)));
  assert.deepEqual(await second, { current: true });
  a.resolve(fakeImage(getRoofStyle(A.styleId)));
  assert.deepEqual(await first, { current: false });
  assert.deepEqual(await coordinator.readyForExport(), B);
  const third = coordinator.select(A), fourth = coordinator.select(B), fifth = coordinator.select(A);
  assert.equal((await third).current, false);
  assert.equal((await fourth).current, false);
  assert.equal((await fifth).current, true);
  assert.deepEqual(await coordinator.readyForExport(), A);
});

test('B04 delayed cancer primary loads cannot overwrite the newest motif or steal selection after a cancer switch', async () => {
  const controller = new UIController();
  const manager = new OverlayManager({ width: 800, height: 600 });
  const pending = new Map();
  let activePresetId = 'lung';
  const state = {
    activePresetId,
    contourByCancer: { lung: 'soft-wave', breast: 'layered-ribbon' },
    primaryMotifByCancer: {
      lung: 'lung-motif-01-tree-of-breath',
      breast: 'breast-motif-01-tissue-ribbon'
    }
  };
  controller.overlayManager = manager;
  controller.formControls = { setCurrentTemplate() {}, setCurrentColorScheme() {} };
  controller.cancerDesignSwitcher = { getState: () => ({ ...state, activePresetId }) };
  controller.roofStyleControls = { async setCancer() {}, async useLegacy() {} };
  controller.posterRenderer = { setHeaderContour() {} };
  controller.refreshOverlayList = () => {};
  controller.syncOverlayControls = () => {};
  controller.updatePoster = () => {};
  controller.loadImage = src => {
    const item = deferred();
    pending.set(src, item);
    return item.promise;
  };

  const lung = cancerDesignPresets.lung.motifs;
  const first = controller.handleCancerDesignAction({ type: 'select-primary', presetId: 'lung', motifId: lung[0].id });
  const second = controller.handleCancerDesignAction({ type: 'select-primary', presetId: 'lung', motifId: lung[1].id });
  pending.get(lung[1].src).resolve({ width: 300, height: 240 });
  await second;
  pending.get(lung[0].src).resolve({ width: 300, height: 240 });
  await first;
  assert.equal(manager.getOverlays().filter(item => item.cancerPresetId === 'lung').length, 1);
  assert.equal(manager.getOverlays().find(item => item.cancerPresetId === 'lung').motifId, lung[1].id);

  const delayedLung = controller.handleCancerDesignAction({ type: 'select-primary', presetId: 'lung', motifId: lung[2].id });
  activePresetId = 'breast';
  const breast = cancerDesignPresets.breast.motifs[0];
  const currentBreast = controller.handleCancerDesignAction({ type: 'select-primary', presetId: 'breast', motifId: breast.id });
  pending.get(lung[2].src).resolve({ width: 300, height: 240 });
  await delayedLung;
  assert.equal(manager.getSelectedOverlay(), null);
  pending.get(breast.src).resolve({ width: 300, height: 240 });
  await currentBreast;
  assert.equal(manager.getOverlays().find(item => item.cancerPresetId === 'lung').motifId, lung[2].id);
  assert.equal(manager.getSelectedOverlay()?.cancerPresetId, 'breast');
});

test('B05 404/decode/offline failures are visible and retryable; failed or stale selections cannot export', async () => {
  for (const reason of ['HTTP 404', 'decode failed', 'offline']) {
    let fail = true;
    const library = new RoofMaterialLibrary(async style => { if (fail) throw new Error(reason); return fakeImage(style); });
    const coordinator = new RoofLoadCoordinator(library);
    const choice = recommendedRoofSelection('lung', 'waterlight');
    const result = await coordinator.select(choice);
    assert.equal(result.current, true); assert.equal(result.error.message, reason);
    assert.equal(library.isReady(choice.styleId), false);
    await assert.rejects(() => coordinator.readyForExport(), new RegExp(reason));
    fail = false;
    assert.deepEqual(await coordinator.select(choice), { current: true });
    assert.equal(library.getError(choice.styleId), undefined);
    assert.deepEqual(await coordinator.readyForExport(), choice);
  }
  const image = deferred();
  const coordinator = new RoofLoadCoordinator(new RoofMaterialLibrary(() => image.promise));
  const selection = coordinator.select(recommendedRoofSelection('lung', 'optical-signal'));
  const exporting = coordinator.readyForExport();
  await coordinator.select(undefined);
  image.resolve(fakeImage(getRoofStyle('optical-signal')));
  assert.equal((await selection).current, false);
  await assert.rejects(exporting, /選擇已改變/);
  assert.equal(await coordinator.readyForExport(), undefined);
});

test('B05 wrong-size decoded artwork is rejected without poisoning retry', async () => {
  let wrong = true;
  const library = new RoofMaterialLibrary(async style => ({ ...fakeImage(style), width: wrong ? 800 : style.width }));
  await assert.rejects(library.preload('satin-arc'), /尺寸不符/);
  assert.equal(library.isReady('satin-arc'), false);
  wrong = false; await library.preload('satin-arc');
  assert.equal(library.isReady('satin-arc'), true);
});

test('B06 legacy defaults and V1 migration retain exact old meaning and never select an optical roof implicitly', () => {
  const legacy = createDefaultCancerDesignState();
  const storage = memoryStorage();
  storage.setItem('legacy-canary', JSON.stringify(legacy));
  const store = new RoofSelectionStore(storage);
  assert.deepEqual(store.getState(), { version: 1, byCancer: {} });
  for (const cancer of cancerDesignPresetList) assert.equal(store.get(cancer.id), undefined);
  assert.equal(storage.getItem(ROOF_SELECTION_STORAGE_KEY), null);
  store.select('lung', recommendedRoofSelection('lung', 'waterlight'));
  assert.equal(storage.getItem('legacy-canary'), JSON.stringify(legacy));
  assert.deepEqual(createDefaultCancerDesignState(), legacy);
  const migrated = normalizeCancerDesignState({ version: 1, presetId: 'urinary', motifId: 'urinary-system' });
  assert.equal(migrated.contourByCancer.urinary, 'arc-sweep');
  store.restore(undefined);
  assert.deepEqual(store.getState(), { version: 1, byCancer: {} });
});

test('B07 six cancer selections independently round-trip through reload with exact custom HEX and no shared references', () => {
  const storage = memoryStorage(), store = new RoofSelectionStore(storage);
  cancerDesignPresetList.forEach((cancer, index) => {
    const style = getRoofStylesForCancer(cancer.id)[index % 3];
    const selection = index % 2 ? { styleId: style.id, mode: 'custom', colors: ['#aA135E', '#FFB080', '#fffCe0'] }
      : recommendedRoofSelection(cancer.id, style.id);
    store.select(cancer.id, selection);
    assert.deepEqual(store.get(cancer.id), selection);
  });
  const snapshot = store.getState(), reloaded = new RoofSelectionStore(storage);
  assert.deepEqual(reloaded.getState(), snapshot);
  const cloned = store.get('lung'); cloned.colors[0] = '#000000';
  assert.deepEqual(store.getState(), snapshot);
  store.select('lung', undefined);
  for (const cancer of cancerDesignPresetList.filter(c => c.id !== 'lung')) assert.deepEqual(store.get(cancer.id), snapshot.byCancer[cancer.id]);
});

test('B07 invalid JSON/version/style survives reads and is backed up before explicit changes; storage errors do not erase it', () => {
  for (const raw of ['{broken', JSON.stringify({ version: 900, byCancer: {} }), JSON.stringify({ version: 1, byCancer: { lung: { styleId: 'coral-arch', mode: 'custom', colors: ['#FFFFFF', '#FFFFFF', '#FFFFFF'] } } })]) {
    const storage = memoryStorage(); storage.setItem(ROOF_SELECTION_STORAGE_KEY, raw);
    const store = new RoofSelectionStore(storage);
    assert.equal(storage.getItem(ROOF_SELECTION_STORAGE_KEY), raw);
    assert.ok(store.issues.length); assert.equal(store.get('lung'), undefined);
    store.select('lung', recommendedRoofSelection('lung', 'satin-arc'));
    assert.equal(storage.getItem(ROOF_SELECTION_DIAGNOSTIC_KEY), raw);
    assert.equal(new RoofSelectionStore(storage).get('lung').styleId, 'satin-arc');
  }
  const storage = memoryStorage(); storage.setItem(ROOF_SELECTION_STORAGE_KEY, '{bad');
  const store = new RoofSelectionStore({ getItem: storage.getItem, setItem() { throw new Error('quota'); } });
  store.select('lung', recommendedRoofSelection('lung', 'satin-arc'));
  assert.equal(storage.getItem(ROOF_SELECTION_STORAGE_KEY), '{bad');
  assert.match(store.issues.join(' '), /未能儲存/);
});

test('B07 invalid custom colors are rejected; recommended palettes restore exactly without mutating legacy palettes', () => {
  const before = JSON.stringify(colorSchemes);
  assert.equal(isRoofColors(['#FFF', '#000000', '#FFFFFF']), false);
  assert.equal(isRoofColors(['#zzzzzz', '#000000', '#FFFFFF']), false);
  for (const pair of approvedRoofPairs) {
    const selection = recommendedRoofSelection(pair.cancerId, pair.styleId);
    const parsed = parseRoofSelectionState({ version: 1, byCancer: { [pair.cancerId]: { ...selection, colors: ['#010203', '#040506', '#070809'] } } });
    assert.deepEqual(parsed.state.byCancer[pair.cancerId], selection);
    const scheme = getRecommendedRoofScheme(pair.cancerId, pair.styleId);
    scheme.header.colors[0] = '#000000'; scheme.agenda.accent = '#FFFFFF';
  }
  assert.equal(JSON.stringify(colorSchemes), before);
  assert.deepEqual(getRecommendedRoofScheme('headneck', 'waterlight').header.colors, ['#526FAD', '#779BD0', '#C3E1EF']);
  assert.equal(getRecommendedRoofScheme('breast', 'rose-satin').header.text, '#862452');
});

function syntheticPainting() {
  const width = 16, height = 20, pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const p = (y * width + x) * 4, white = y / (height - 1);
    pixels[p] = 30 + white * 225 + x; pixels[p + 1] = 80 + white * 175;
    pixels[p + 2] = 95 + white * 160; pixels[p + 3] = 255;
  }
  return { width, height, pixels };
}

test('B08 eighteen recommended and thirty-nine custom cases remain finite, nonempty and preserve supplied HEX', () => {
  const source = syntheticPainting(); let recommended = 0, custom = 0;
  for (const pair of approvedRoofPairs) {
    const style = getRoofStyle(pair.styleId), maps = buildRoofMaps(source.pixels, source.width, source.height, style.sourceColors);
    const variants = [getRecommendedRoofScheme(pair.cancerId, pair.styleId).header.colors,
      style.family === 'cool' ? ['#246989', '#67B7D9', '#C5EEFA'] : ['#F07397', '#FFB087', '#FFF1CA'],
      style.family === 'cool' ? ['#FA6580', '#FFB870', '#FFF4C8'] : ['#246989', '#67B7D9', '#C5EEFA']];
    variants.forEach((colors, index) => {
      const before = JSON.stringify(colors), pixels = recolorRoofPixels(maps, style.sourceColors, colors);
      assert.equal(JSON.stringify(colors), before);
      assert.equal(pixels.length, source.width * source.height * 4);
      assert.ok(pixels.every(Number.isFinite)); assert.ok(pixels.some(v => v > 0));
      assert.ok(new Set(pixels).size > 8, 'painted depth must not be flattened');
      if (index === 0) recommended++; else custom++;
    });
  }
  const maps = buildRoofMaps(source.pixels, source.width, source.height, roofStyles[0].sourceColors);
  for (const colors of [['#FFFFFF', '#FFFFFF', '#FFFFFF'], ['#010101', '#020202', '#030303'], ['#7DBBCD', '#7DBBCD', '#7DBBCD']]) {
    const pixels = recolorRoofPixels(maps, roofStyles[0].sourceColors, colors);
    assert.ok(pixels.every(Number.isFinite)); assert.ok(pixels.some(v => v > 0)); custom++;
  }
  assert.equal(recommended, 18); assert.equal(custom, 39);
});

test('B08 optical transfer preserves RGB round trips, native warm chroma and neutral white highlights', () => {
  for (const rgb of [[.1, .5, .6], [1, .6, .7], [.4, .2, .1], [1, 1, 1]]) {
    const restored = labToRGB(rgbToLab(rgb));
    restored.forEach((v, i) => assert.ok(Math.abs(v - rgb[i]) < 1e-6));
  }
  assert.deepEqual(transferRoofChroma(.03, .11, .02, .1, .02, .1), [.03, .11]);
  assert.deepEqual(transferRoofChroma(.03, -.1, -.02, -.1, 0, 0), [0, 0]);
  const maps = buildRoofMaps(new Uint8ClampedArray(4 * 4 * 4).fill(255), 4, 4, roofStyles[0].sourceColors);
  const out = recolorRoofPixels(maps, roofStyles[0].sourceColors, ['#E95590', '#FFAF78', '#FFF4C8']);
  for (let p = 0; p < out.length; p += 4) for (let c = 0; c < 3; c++) {
    const onWhite = out[p + c] * out[p + 3] / 255 + 255 - out[p + 3];
    assert.ok(onWhite >= 254, 'white highlights must not be tinted flat');
  }
});

test('B08 Agenda header ink keeps its cancer hue while reaching a 4.8:1 analytic contrast margin', () => {
  const linear = value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  const luminance = rgb => .2126 * linear(rgb[0]) + .7152 * linear(rgb[1]) + .0722 * linear(rgb[2]);
  const ratio = (a, b) => (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  const rgb = hex => [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  for (const pair of approvedRoofPairs) {
    const scheme = getRecommendedRoofScheme(pair.cancerId, pair.styleId);
    for (const position of [.111, .403, .728, .912]) {
      const t = position * (scheme.header.colors.length - 1), index = Math.min(scheme.header.colors.length - 2, Math.floor(t)), fraction = t - index;
      const background = [0, 1, 2].map(channel => rgb(scheme.header.colors[index])[channel] * (1 - fraction) + rgb(scheme.header.colors[index + 1])[channel] * fraction);
      const ink = getRoofAgendaInk(scheme.header.colors, position, scheme.agenda.accent);
      assert.ok(ratio(luminance(background), luminance(rgb(ink))) >= 4.8, `${pair.cancerId}/${pair.styleId}/${position}/${ink}`);
      assert.notEqual(ink, '#000000');
    }
  }
});

test('B08 cool roof title keeps a white fill with a thin palette-derived non-black edge', () => {
  const material = {
    width: 100,
    height: 100,
    getContext: () => ({ getImageData: (_x, _y, width, height) => ({ data: new Uint8ClampedArray(width * height * 4).fill(24) }) })
  };
  for (const styleId of ['optical-signal', 'satin-arc', 'waterlight']) {
    const colors = getRecommendedRoofScheme('lung', styleId).header.colors;
    const ink = getRoofTitleInk(styleId, colors, material);
    assert.equal(ink.fill, '#FFFFFF');
    assert.match(ink.edge, /^rgba\(18,44,51,\.98\)$/);
    assert.doesNotMatch(ink.edge, /rgba\(0,0,0/);
  }
});

test('B09 surface cache keys include style, every color and dimensions; LRU is bounded and reuses exact entries', () => {
  const colors = ['#123456', '#789ABC', '#DEF012'];
  const key = roofSurfaceKey('optical-signal', colors, 800, 268), cache = new RoofSurfaceCache(3), object = {};
  cache.set(key, object); assert.equal(cache.get(key), object);
  const keys = [roofSurfaceKey('satin-arc', colors, 800, 268), roofSurfaceKey('optical-signal', colors, 2400, 804)];
  for (let i = 0; i < 3; i++) { const changed = [...colors]; changed[i] = '#654321'; keys.push(roofSurfaceKey('optical-signal', changed, 800, 268)); }
  assert.equal(new Set([key, ...keys]).size, 6);
  keys.forEach(k => { assert.equal(cache.get(k), undefined); cache.set(k, {}); assert.ok(cache.size <= 3); });
  assert.equal(cache.get(key), undefined); assert.equal(cache.size, 3);
  assert.throws(() => roofSurfaceKey('optical-signal', colors, NaN, 200));
});

test('B10 every optical placement retains the full native aspect at thumbnail, 800px and 2400px sizes', () => {
  for (const style of roofStyles) {
    const normal = getRoofPlacement(style.id, 800);
    assert.ok(normal.height > 266 && normal.height < 269);
    assert.equal(normal.x, 0); assert.equal(normal.y, 0);
    for (const width of [240, 800, 2400]) {
      const placement = getRoofPlacement(style.id, width);
      assert.ok(Math.abs(placement.height / placement.width - style.height / style.width) < 1e-12);
    }
  }
  assert.throws(() => getRoofPlacement('unknown', 800));
  assert.throws(() => getRoofPlacement('waterlight', 0));
});

test('B10 native material uses a readback-stable context before first paint and reuses the same cached surface', async () => {
  const savedDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const contextOptions = [], writes = [];
  globalThis.document = { createElement(tag) {
    assert.equal(tag, 'canvas');
    return { width: 0, height: 0, getContext(kind, options) {
      assert.equal(kind, '2d'); contextOptions.push(options);
      return { createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData: image => writes.push(image.data.length) };
    } };
  } };
  try {
    const style = roofStyles[0], colors = recommendedRoofSelection('lung', style.id).colors;
    let reads = 0;
    const library = new RoofMaterialLibrary(async () => ({ width: style.width, height: style.height,
      readPixels() { reads++; return new Uint8ClampedArray(style.width * style.height * 4).fill(255); } }));
    await library.preload(style.id);
    const first = library.getSurface(style.id, colors);
    assert.equal(library.getSurface(style.id, colors), first);
    assert.deepEqual(contextOptions, [{ willReadFrequently: true }]);
    assert.deepEqual(writes, [style.width * style.height * 4]);
    assert.equal(reads, 1);
  } finally {
    if (savedDocument) Object.defineProperty(globalThis, 'document', savedDocument);
    else delete globalThis.document;
  }
});

test('B11 every 8-bit soft coverage and complement sum exactly to one without binary clipping', () => {
  const pixels = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) pixels[i * 4 + 3] = i;
  const { coverage, complement } = extractRoofCoverage(pixels);
  assert.equal(new Set(coverage).size, 256);
  for (let i = 0; i < 256; i++) assert.equal(coverage[i] + complement[i], 255);
});

test('B11 transparent/25/50/100-percent probes stay single-opacity across every soft-boundary coverage', () => {
  for (const alpha of [0, 64, 128, 255]) {
    const object = new Uint8ClampedArray([40, 170, 230, alpha]);
    for (let weight = 0; weight < 256; weight++) {
      const actual = mixRoofCoverage(object, object, new Uint8ClampedArray([weight]));
      assert.equal(actual[3], alpha, `alpha ${alpha}, coverage ${weight}`);
      if (alpha) assert.deepEqual([...actual], [...object]);
    }
  }
  const transparent = new Uint8ClampedArray([0, 0, 0, 0]);
  assert.deepEqual([...mixRoofCoverage(transparent, transparent, new Uint8ClampedArray([128]))], [0, 0, 0, 0]);
});

test('B11 coverage compositor agrees with independently expanded premultiplied scene reference, including differing alphas', () => {
  const scenes = [[25, 110, 230, 128], [245, 175, 120, 64], [0, 0, 0, 0], [255, 255, 255, 255]];
  for (const outside of scenes) for (const inside of scenes) for (const weight of [0, 1, 64, 127, 128, 192, 254, 255]) {
    const actual = mixRoofCoverage(new Uint8ClampedArray(outside), new Uint8ClampedArray(inside), new Uint8ClampedArray([weight]));
    // Independent area integration of two completed scenes, not source-over.
    const areaOutside = 255 - weight, areaInside = weight;
    const totalAlpha = (outside[3] * areaOutside + inside[3] * areaInside) / 255;
    const expected = new Uint8ClampedArray(4);
    expected[3] = totalAlpha;
    for (let c = 0; c < 3; c++) expected[c] = totalAlpha ?
      (outside[c] * outside[3] * areaOutside + inside[c] * inside[3] * areaInside) / (255 * totalAlpha) : 0;
    [...actual].forEach((value, channel) => assert.ok(Math.abs(value - expected[channel]) <= 1));
  }
});
