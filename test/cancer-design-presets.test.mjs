import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import {
  cancerDesignPresetList,
  createDefaultCancerDesignState,
  normalizeCancerDesignState
} from '../dist/logic/cancerDesignPresets.js';
import { headerContourIds } from '../dist/logic/headerContours.js';
import {
  CANCER_MOTIF_SAFE_ZONE,
  OVERLAY_LAYER_ABOVE_HEADER,
  OVERLAY_LAYER_BELOW_TABLE,
  OVERLAY_LAYER_BETWEEN_TABLE_AND_HEADER,
  getOverlayFixedRelations,
  OverlayManager
} from '../dist/logic/overlayManager.js';
import {
  clampPosterViewZoom,
  getPinchScale,
  isTapGesture
} from '../dist/interface/canvasInteractions.js';
import {
  AGENDA_POSTER_STATE_VERSION,
  AGENDA_POSTER_STORAGE_KEY,
  DataManager
} from '../dist/logic/dataManager.js';
import {
  AGENDA_START_Y,
  AGENDA_START_Y_WITH_MEETUP,
  partitionOverlayLayers
} from '../dist/logic/posterRenderer.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fakeCanvas = { width: 800, height: 900 };
const fakeImage = (width = 1200, height = 900) => ({
  naturalWidth: width, naturalHeight: height, width, height
});

test('six cancer presets expose 18 unique approved transparent PNG assets', () => {
  assert.equal(cancerDesignPresetList.length, 6);
  const motifs = cancerDesignPresetList.flatMap(preset => preset.motifs);
  assert.equal(motifs.length, 18);
  assert.equal(new Set(motifs.map(motif => motif.id)).size, 18);
  assert.equal(new Set(motifs.map(motif => motif.src)).size, 18);

  const hashes = new Set();
  motifs.forEach(motif => {
    const relative = motif.src.replace(/^\.\//, '');
    const absolute = resolve(projectRoot, relative);
    assert.equal(existsSync(absolute), true, `${relative} is missing`);
    const bytes = readFileSync(absolute);
    assert.equal(bytes.subarray(1, 4).toString(), 'PNG', `${relative} is not PNG`);
    assert.ok([4, 6].includes(bytes[25]), `${relative} has no alpha channel`);
    hashes.add(createHash('sha256').update(bytes).digest('hex'));
  });
  assert.equal(hashes.size, 18, 'motifs must be independently stored, not duplicated files');
});

test('default contour assignments cover all four native contour styles', () => {
  assert.deepEqual(headerContourIds, ['soft-wave', 'arc-sweep', 'layered-ribbon', 'clean-diagonal']);
  const defaults = new Map(cancerDesignPresetList.map(preset => [preset.id, preset.defaultContourId]));
  assert.equal(defaults.get('lung'), 'soft-wave');
  assert.equal(defaults.get('headneck'), 'arc-sweep');
  assert.equal(defaults.get('urinary'), 'arc-sweep');
  assert.equal(defaults.get('uterus'), 'layered-ribbon');
  assert.equal(defaults.get('breast'), 'layered-ribbon');
  assert.equal(defaults.get('colorectal'), 'clean-diagonal');
});

test('agenda starts below the fixed motif safe zone', () => {
  assert.equal(AGENDA_START_Y, 350);
  assert.equal(AGENDA_START_Y_WITH_MEETUP, 380);
  assert.ok(CANCER_MOTIF_SAFE_ZONE.y + CANCER_MOTIF_SAFE_ZONE.height < AGENDA_START_Y);
});

test('v1 selection migrates while every other cancer receives v2 defaults', () => {
  const defaults = createDefaultCancerDesignState();
  const migrated = normalizeCancerDesignState({
    presetId: 'headneck',
    motifId: 'headneck-oral-focus'
  });
  assert.equal(migrated.version, 2);
  assert.equal(migrated.activePresetId, 'headneck');
  assert.notEqual(migrated.primaryMotifByCancer.headneck, defaults.primaryMotifByCancer.headneck);
  assert.equal(migrated.primaryMotifByCancer.headneck, 'headneck-motif-02-closed-lip-diagnostic');
  assert.equal(migrated.primaryMotifByCancer.lung, defaults.primaryMotifByCancer.lung);
  assert.equal(migrated.contourByCancer.headneck, 'arc-sweep');
});

test('primary replacement preserves layout and clears cropped source geometry', () => {
  const manager = new OverlayManager(fakeCanvas);
  const primary = manager.upsertCancerPrimary('lung', 'a', fakeImage(), 'A', 'a.png');
  assert.equal(primary.x, CANCER_MOTIF_SAFE_ZONE.x + CANCER_MOTIF_SAFE_ZONE.width / 2);
  assert.equal(primary.y, CANCER_MOTIF_SAFE_ZONE.y + CANCER_MOTIF_SAFE_ZONE.height / 2);
  primary.x = 701;
  primary.y = 223;
  primary.rotation = 0.3;
  primary.opacity = 0.64;
  primary.src = 'data:image/png;base64,cropped';
  primary.w = 300;
  primary.h = 220;
  const visualWidth = primary.w * primary.scaleX;

  const replaced = manager.upsertCancerPrimary('lung', 'b', fakeImage(1000, 1000), 'B', 'b.png');
  assert.equal(replaced.id, primary.id);
  assert.equal(replaced.src, 'b.png');
  assert.equal(replaced.x, 701);
  assert.equal(replaced.y, 223);
  assert.equal(replaced.rotation, 0.3);
  assert.equal(replaced.opacity, 0.64);
  assert.equal(replaced.w * replaced.scaleX, visualWidth);
  assert.equal(replaced.motifRole, 'primary');
});

test('adding the same motif three times creates independent copies', () => {
  const manager = new OverlayManager(fakeCanvas);
  const copies = [0, 1, 2].map(() => manager.addCancerCopy('lung', 'same', fakeImage(), 'Same', 'same.png'));
  assert.equal(new Set(copies.map(copy => copy.id)).size, 3);
  copies[0].src = 'data:image/png;base64,crop-one';
  copies[0].w = 111;
  assert.equal(copies[1].src, 'same.png');
  assert.equal(copies[1].w, 1200);
  assert.equal(copies[2].src, 'same.png');
  assert.notDeepEqual([copies[0].x, copies[0].y], [copies[1].x, copies[1].y]);
});

test('cancer filtering preserves preset layers while uploads remain renderable', () => {
  const manager = new OverlayManager(fakeCanvas);
  const lung = manager.upsertCancerPrimary('lung', 'lung-a', fakeImage(), 'Lung', 'lung.png');
  const headneck = manager.upsertCancerPrimary('headneck', 'hn-a', fakeImage(), 'Head neck', 'hn.png');
  const upload = manager.addOverlay(fakeImage(), 'upload.png', 'data:image/png;base64,user');

  manager.setActiveCancerPresetId('lung');
  assert.deepEqual(manager.getRenderableOverlays(), [lung, upload]);
  manager.setActiveCancerPresetId('headneck');
  assert.deepEqual(manager.getRenderableOverlays(), [headneck, upload]);
  assert.equal(lung.visible, true);
  assert.equal(headneck.visible, true);
  assert.equal(upload.sourceKind, 'upload');
});

test('header and agenda table form independent fixed compositor dividers', () => {
  const manager = new OverlayManager(fakeCanvas);
  const overlay = manager.addOverlay(fakeImage(), 'independent.png', 'independent.png');

  assert.deepEqual(getOverlayFixedRelations(overlay), { aboveTable: true, aboveHeader: true });
  manager.moveSelectedToBackground();
  assert.deepEqual(getOverlayFixedRelations(overlay), { aboveTable: false, aboveHeader: true });
  manager.moveSelectedBelowHeader();
  assert.deepEqual(getOverlayFixedRelations(overlay), { aboveTable: false, aboveHeader: false });
  manager.moveSelectedToForeground();
  assert.deepEqual(getOverlayFixedRelations(overlay), { aboveTable: true, aboveHeader: false });
  manager.moveSelectedAboveHeader();
  assert.deepEqual(getOverlayFixedRelations(overlay), { aboveTable: true, aboveHeader: true });

  const aboveBoth = { ...overlay, id: 1, aboveTable: true, aboveHeader: true };
  const aboveTableOnly = { ...overlay, id: 2, aboveTable: true, aboveHeader: false };
  const aboveHeaderOnly = { ...overlay, id: 3, aboveTable: false, aboveHeader: true };
  const belowBoth = { ...overlay, id: 4, aboveTable: false, aboveHeader: false };
  assert.deepEqual(partitionOverlayLayers([aboveBoth, aboveTableOnly, aboveHeaderOnly, belowBoth]), {
    belowTable: [aboveHeaderOnly, belowBoth],
    aboveTable: [aboveBoth, aboveTableOnly],
    belowHeader: [aboveTableOnly, belowBoth],
    aboveHeader: [aboveBoth, aboveHeaderOnly]
  });
});

test('legacy zIndex states migrate to the matching two fixed-object relations', () => {
  assert.deepEqual(getOverlayFixedRelations({ zIndex: OVERLAY_LAYER_BELOW_TABLE }), {
    aboveTable: false, aboveHeader: false
  });
  assert.deepEqual(getOverlayFixedRelations({ zIndex: OVERLAY_LAYER_BETWEEN_TABLE_AND_HEADER }), {
    aboveTable: true, aboveHeader: false
  });
  assert.deepEqual(getOverlayFixedRelations({ zIndex: OVERLAY_LAYER_ABOVE_HEADER }), {
    aboveTable: true, aboveHeader: true
  });
});

test('touch gestures distinguish a tap from page dragging and clamp poster view zoom', () => {
  assert.equal(isTapGesture({ x: 10, y: 10 }, { x: 16, y: 17 }), true);
  assert.equal(isTapGesture({ x: 10, y: 10 }, { x: 10, y: 24 }), false);
  assert.equal(getPinchScale(100, 150), 1.5);
  assert.equal(getPinchScale(0, 150), 1);
  assert.equal(clampPosterViewZoom(0.1), 0.3);
  assert.equal(clampPosterViewZoom(1.25), 1.25);
  assert.equal(clampPosterViewZoom(5), 3);
});

test('v2 payload keeps the v1 autosave key and accepts a v1 restore callback', async () => {
  assert.equal(AGENDA_POSTER_STORAGE_KEY, 'agendaPoster.autosave.v1');
  const previousDocument = globalThis.document;
  globalThis.document = {
    documentElement: { dataset: {} },
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => []
  };
  try {
    const manager = new DataManager();
    const payload = manager.buildStatePayload({ cancerDesignState: createDefaultCancerDesignState() });
    assert.equal(payload.version, AGENDA_POSTER_STATE_VERSION);
    let restored;
    await manager.applyState({
      version: 'agenda-poster-v1',
      savedAt: '2025-01-01T00:00:00.000Z',
      title: 'legacy',
      form: {},
      customState: { overlays: [{ name: 'legacy upload', sourceKind: undefined }] }
    }, customState => { restored = customState; });
    assert.equal(restored.overlays[0].name, 'legacy upload');
  } finally {
    globalThis.document = previousDocument;
  }
});

test('overlay metadata and cancer state survive a JSON round trip', () => {
  const state = createDefaultCancerDesignState();
  const manager = new OverlayManager(fakeCanvas);
  const overlay = manager.addCancerCopy('breast', 'breast-motif-02-self-embrace', fakeImage(), 'Self embrace', 'breast.png');
  manager.moveSelectedToBackground();
  manager.moveSelectedAboveHeader();
  const roundTrip = JSON.parse(JSON.stringify({ overlays: [overlay], cancerDesignState: state }));
  assert.equal(roundTrip.overlays[0].sourceKind, 'cancer-preset');
  assert.equal(roundTrip.overlays[0].cancerPresetId, 'breast');
  assert.equal(roundTrip.overlays[0].motifRole, 'copy');
  assert.equal(roundTrip.overlays[0].aboveTable, false);
  assert.equal(roundTrip.overlays[0].aboveHeader, true);
  assert.deepEqual(roundTrip.cancerDesignState, state);
});
