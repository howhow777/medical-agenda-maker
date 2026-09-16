import { cancerDesignPresetList, cancerDesignPresets } from '../dist/logic/cancerDesignPresets.js';
import { getRoofStylesForCancer, getRecommendedRoofScheme } from '../dist/logic/roofStyles.js';
import { roofFixture } from './approved-roofs-fixture.js';

const STORAGE_KEYS = [
  'agendaPoster.opticalRoofs.v1',
  'agendaPoster.opticalRoofs.unrecognized',
  'agendaPoster.autosave.v1',
  'medical-agenda-maker:cancer-design-selection:v1',
  'medical-agenda-maker:cancer-design-selection:v2',
  'medical-agenda-maker:update-notice:2026-07-09'
];
const V1_KEY = 'medical-agenda-maker:cancer-design-selection:v1';
const V2_KEY = 'medical-agenda-maker:cancer-design-selection:v2';
const ROOF_KEY = 'agendaPoster.opticalRoofs.v1';
const UPDATE_NOTICE_KEY = 'medical-agenda-maker:update-notice:2026-07-09';

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

async function waitFor(check, message, timeout = 15000) {
  const started = performance.now();
  while (performance.now() - started < timeout) {
    const value = check();
    if (value) return value;
    await wait(25);
  }
  throw new Error(`Timeout: ${message}`);
}

function storageBackup() {
  return Object.fromEntries(STORAGE_KEYS.map(key => [key, localStorage.getItem(key)]));
}

function restoreStorage(snapshot) {
  for (const [key, value] of Object.entries(snapshot)) {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  }
}

async function createMakerFrame(host, label) {
  const frame = document.createElement('iframe');
  frame.title = `正式 Maker 驗證：${label}`;
  frame.src = '../index.html';
  frame.style.cssText = 'display:block;width:1200px;height:760px;border:1px solid #cbd5e1;background:#fff;transform-origin:top left';
  host.replaceChildren(frame);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Maker load timeout: ${label}`)), 30000);
    frame.addEventListener('load', () => { clearTimeout(timer); resolve(); }, { once: true });
  });
  await waitFor(() => frame.contentWindow?.app, `window.app ${label}`, 30000);
  const win = frame.contentWindow, doc = frame.contentDocument, app = win.app;
  await waitFor(() => doc.querySelectorAll('[data-preset-id]').length === 6 &&
    doc.querySelectorAll('[data-roof-style-host="drawer"] [data-roof-style-id]').length === 3,
  `Maker controls ${label}`, 30000);
  return { frame, win, doc, app };
}

function fieldSnapshot(doc) {
  return Object.fromEntries(['conferenceTitle', 'conferenceSubtitle', 'conferenceDate', 'conferenceTime', 'conferenceLocation']
    .map(id => [id, doc.getElementById(id).value]));
}

function setFixtureContent(maker) {
  const { doc, app } = maker;
  const values = {
    conferenceTitle: roofFixture.conference.title,
    conferenceSubtitle: roofFixture.conference.subtitle,
    conferenceDate: roofFixture.conference.date,
    conferenceTime: roofFixture.conference.time,
    conferenceLocation: roofFixture.conference.location
  };
  for (const [id, value] of Object.entries(values)) {
    const input = doc.getElementById(id); input.value = value;
    input.dispatchEvent(new maker.win.Event('input', { bubbles: true }));
  }
  app.formControls.setAgendaItems(structuredClone(roofFixture.agenda));
  app.updatePoster();
  return { fields: fieldSnapshot(doc), agenda: structuredClone(app.getAppState().agendaItems) };
}

function primarySnapshot(app, cancerId) {
  const primary = app.overlayManager.getOverlays().find(item => item.cancerPresetId === cancerId && item.motifRole === 'primary');
  return primary ? { motifId: primary.motifId, x: primary.x, y: primary.y, opacity: primary.opacity,
    aboveHeader: primary.aboveHeader, aboveTable: primary.aboveTable } : null;
}

async function selectCancer(maker, cancerId) {
  const button = maker.doc.querySelector(`[data-preset-id="${cancerId}"]`);
  assert(button, `Missing cancer control ${cancerId}`); button.click();
  await waitFor(() => maker.app.cancerDesignSwitcher.getState().activePresetId === cancerId,
    `active cancer ${cancerId}`);
  await waitFor(() => primarySnapshot(maker.app, cancerId), `primary motif ${cancerId}`);
}

function canvasHasInk(canvas) {
  const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  for (let p = 0; p < pixels.length; p += 4) {
    if (pixels[p + 3] && (pixels[p] < 248 || pixels[p + 1] < 248 || pixels[p + 2] < 248)) return true;
  }
  return false;
}

async function selectStyle(maker, cancerId, styleId) {
  const selector = `[data-roof-style-host="drawer"] [data-roof-style-id="${styleId}"]`;
  const button = maker.doc.querySelector(selector);
  assert(button, `Missing style control ${cancerId}/${styleId}`); button.click();
  await waitFor(() => maker.app.roofStyleControls.store.get(cancerId)?.styleId === styleId,
    `stored style ${cancerId}/${styleId}`);
  await waitFor(() => maker.app.posterRenderer.roofSelection?.styleId === styleId,
    `renderer style ${cancerId}/${styleId}`);
  await waitFor(() => canvasHasInk(maker.doc.querySelector(selector + ' canvas')),
    `style preview ${cancerId}/${styleId}`);
  const selected = maker.doc.querySelectorAll('[data-roof-style-host="drawer"] [data-roof-style-id][aria-pressed="true"]');
  assert(selected.length === 1 && selected[0].dataset.roofStyleId === styleId,
    `ARIA selection mismatch ${cancerId}/${styleId}`);
}

async function useCustomColors(maker, cancerId, colors) {
  const host = maker.doc.querySelector('[data-roof-style-host="drawer"]');
  host.querySelector('[data-roof-action="custom"]').click();
  await waitFor(() => maker.app.roofStyleControls.store.get(cancerId)?.mode === 'custom',
    `custom mode ${cancerId}`);
  const inputs = [...host.querySelectorAll('[data-roof-channel]')];
  assert(inputs.length === 3, `Missing custom colors ${cancerId}`);
  for (let index = 0; index < 3; index++) {
    inputs[index].value = colors[index];
    inputs[index].dispatchEvent(new maker.win.Event('change', { bubbles: true }));
  }
  await waitFor(() => same(maker.app.roofStyleControls.store.get(cancerId)?.colors, colors),
    `custom colors ${cancerId}`);
  assert(/尚未經藝術／對比審核/.test(host.querySelector('[data-roof-notice]').textContent),
    `Custom contrast notice missing ${cancerId}`);
}

async function restoreRecommended(maker, cancerId, styleId) {
  const host = maker.doc.querySelector('[data-roof-style-host="drawer"]');
  host.querySelector('[data-roof-action="recommended"]').click();
  const expected = getRecommendedRoofScheme(cancerId, styleId).header.colors;
  await waitFor(() => {
    const selection = maker.app.roofStyleControls.store.get(cancerId);
    return selection?.mode === 'recommended' && same(selection.colors, expected);
  }, `recommended colors ${cancerId}/${styleId}`);
}

function diagnostics(maker) {
  return Array.isArray(maker.win.__medicalAgendaDiagnostics)
    ? structuredClone(maker.win.__medicalAgendaDiagnostics) : [];
}

function deferred(value) {
  let resolve;
  const promise = new Promise(done => { resolve = () => done(value); });
  return { promise, resolve, claimed: false };
}

async function verifyPrimaryRace(maker) {
  const cancerId = 'headneck';
  await selectCancer(maker, cancerId);
  const motifs = cancerDesignPresets[cancerId].motifs;
  const first = motifs[1], second = motifs[2];
  const original = maker.app.loadImage.bind(maker.app);
  const [firstImage, secondImage] = await Promise.all([original(first.src), original(second.src)]);
  const a1 = deferred(firstImage), b = deferred(secondImage), a2 = deferred(firstImage);
  const queues = new Map([[first.src, [a1, a2]], [second.src, [b]]]);
  maker.app.loadImage = src => {
    const item = queues.get(src)?.find(entry => !entry.claimed);
    if (!item) return original(src);
    item.claimed = true; return item.promise;
  };
  try {
    const clickMotif = id => {
      const button = maker.doc.querySelector(`[data-motif-id="${id}"] .design-motif-primary`);
      assert(button, `Missing motif control ${id}`); button.click();
    };
    clickMotif(first.id); await waitFor(() => a1.claimed, 'race A1 claimed');
    clickMotif(second.id); await waitFor(() => b.claimed, 'race B claimed');
    clickMotif(first.id); await waitFor(() => a2.claimed, 'race A2 claimed');
    a2.resolve();
    await waitFor(() => primarySnapshot(maker.app, cancerId)?.motifId === first.id, 'latest race request applied');
    b.resolve(); a1.resolve(); await wait(80);
    const primary = primarySnapshot(maker.app, cancerId);
    assert(primary?.motifId === first.id, 'stale motif load overrode latest selection');
    assert(maker.app.cancerDesignSwitcher.getState().primaryMotifByCancer[cancerId] === first.id,
      'switcher state diverged after motif race');
    return { sequence: [first.id, second.id, first.id], finalMotifId: primary.motifId, passed: true };
  } finally { maker.app.loadImage = original; }
}

function makeLegacyPayload(payload) {
  const legacy = structuredClone(payload);
  legacy.version = 'agenda-poster-v1';
  delete legacy.customState.roofSelectionState;
  return legacy;
}

export async function runMakerStateQA(host, onProgress = () => {}) {
  const before = storageBackup(), report = {
    version: 1, startedAt: new Date().toISOString(), makerURL: new URL('../index.html', location.href).href,
    noResearchQuery: true, combinations: [], persistenceByCancer: {}, contentPreserved: false,
    paletteStateRestored: false, legacyMigrationPreserved: false, sameDocumentSwitchingVerified: false,
    staleLoadCannotOverrideSelection: false, applicationConsoleErrors: 'unverified', applicationConsoleEvents: [],
    failures: []
  };
  let maker;
  try {
    for (const key of STORAGE_KEYS) localStorage.removeItem(key);
    localStorage.setItem(UPDATE_NOTICE_KEY, 'dismissed');
    localStorage.setItem(V1_KEY, JSON.stringify({ version: 1, presetId: 'headneck', motifId: 'headneck-oral-focus' }));
    maker = await createMakerFrame(host, '十八組與狀態');
    assert(new URL(maker.frame.src).search === '', 'Formal Maker used a query parameter');
    const migrated = JSON.parse(localStorage.getItem(V2_KEY));
    assert(migrated.version === 2 && migrated.activePresetId === 'headneck' &&
      migrated.primaryMotifByCancer.headneck === 'headneck-motif-02-closed-lip-diagnostic',
    'CancerDesign v1 did not migrate through the real Maker');
    assert(!localStorage.getItem(ROOF_KEY), 'Legacy load implicitly selected an optical roof');
    const fixture = setFixtureContent(maker);
    const customByCancer = {}, expectedState = { version: 1, byCancer: {} };
    for (let cancerIndex = 0; cancerIndex < cancerDesignPresetList.length; cancerIndex++) {
      const cancer = cancerDesignPresetList[cancerIndex];
      onProgress(`真實 Maker：${cancer.label} 3款屋簷`);
      await selectCancer(maker, cancer.id);
      const beforeContent = { fields: fieldSnapshot(maker.doc), agenda: structuredClone(maker.app.getAppState().agendaItems) };
      const styles = getRoofStylesForCancer(cancer.id);
      assert(styles.length === 3, `${cancer.id} does not expose exactly three styles`);
      for (const style of styles) {
        await selectStyle(maker, cancer.id, style.id);
        report.combinations.push({ cancerId: cancer.id, styleId: style.id, ariaSelected: true,
          rendererStyleId: maker.app.posterRenderer.roofSelection.styleId, previewHasInk: true });
      }
      const finalStyle = styles[2].id;
      const colors = [
        `#${(0x245080 + cancerIndex * 0x070303).toString(16).padStart(6, '0').slice(-6)}`,
        `#${(0x65A0C0 + cancerIndex * 0x030704).toString(16).padStart(6, '0').slice(-6)}`,
        `#${(0xB8E4E8 + cancerIndex * 0x020101).toString(16).padStart(6, '0').slice(-6)}`
      ].map(value => value.toLowerCase());
      await useCustomColors(maker, cancer.id, colors);
      customByCancer[cancer.id] = colors;
      await restoreRecommended(maker, cancer.id, finalStyle);
      await useCustomColors(maker, cancer.id, colors);
      expectedState.byCancer[cancer.id] = { styleId: finalStyle, mode: 'custom', colors };
      assert(same(beforeContent, { fields: fieldSnapshot(maker.doc), agenda: maker.app.getAppState().agendaItems }),
        `Cancer/style switching rewrote meeting content for ${cancer.id}`);
    }
    assert(report.combinations.length === 18, 'Real Maker did not exercise 18 combinations');
    assert(same(maker.app.roofStyleControls.store.getState(), expectedState), 'Six cancer states were not independent');
    report.sameDocumentSwitchingVerified = true;
    report.staleLoad = await verifyPrimaryRace(maker);
    report.staleLoadCannotOverrideSelection = report.staleLoad.passed;

    const activePrimary = maker.app.overlayManager.getOverlays().find(item => item.cancerPresetId === 'headneck' && item.motifRole === 'primary');
    activePrimary.x = 617; activePrimary.y = 241; activePrimary.opacity = .73;
    const savedCustomState = maker.app.templateController.collectCurrentAppState();
    const payload = maker.app.dataManager.buildStatePayload(savedCustomState);
    maker.doc.getElementById('conferenceTitle').value = 'MUTATED';
    maker.app.formControls.setAgendaItems([{ time: '00:00', topic: 'MUTATED', speaker: '', moderator: '' }]);
    await maker.app.dataManager.applyState(payload, maker.app.templateController.applyCustomState);
    assert(same(fieldSnapshot(maker.doc), fixture.fields), 'Agenda save/load rewrote meeting fields');
    assert(same(maker.app.getAppState().agendaItems, fixture.agenda), 'Agenda save/load rewrote agenda rows');
    assert(same(maker.app.roofStyleControls.store.getState(), expectedState), 'Agenda save/load lost optical roof state');
    const restoredPrimary = primarySnapshot(maker.app, 'headneck');
    assert(restoredPrimary.x === 617 && restoredPrimary.y === 241 && restoredPrimary.opacity === .73,
      'Agenda save/load lost organ settings');
    report.contentPreserved = true;
    report.saveLoad = { version: payload.version, fields: fixture.fields, agendaRows: fixture.agenda.length,
      organ: restoredPrimary, roofStateRestored: true };
    report.applicationConsoleEvents.push(...diagnostics(maker));

    const persistedRaw = localStorage.getItem(ROOF_KEY);
    maker.frame.remove(); maker = await createMakerFrame(host, '重新整理還原');
    const reloadedState = maker.app.roofStyleControls.store.getState();
    assert(localStorage.getItem(ROOF_KEY) === persistedRaw && same(reloadedState, expectedState),
      'Reload did not restore all six cancer roof states');
    const activeCancer = maker.app.cancerDesignSwitcher.getState().activePresetId;
    const active = expectedState.byCancer[activeCancer];
    assert(active && same([...maker.doc.querySelectorAll('[data-roof-style-host="drawer"] [data-roof-channel]')].map(input => input.value), active.colors),
      'Reloaded UI colors do not match stored active cancer');
    assert(maker.doc.querySelector(`[data-roof-style-host="drawer"] [data-roof-style-id="${active.styleId}"]`).getAttribute('aria-pressed') === 'true',
      'Reloaded UI style does not match stored active cancer');
    report.paletteStateRestored = true;
    report.persistenceByCancer = structuredClone(reloadedState.byCancer);
    report.applicationConsoleEvents.push(...diagnostics(maker));

    const legacyPayload = makeLegacyPayload(payload);
    await maker.app.dataManager.applyState(legacyPayload, maker.app.templateController.applyCustomState);
    assert(Object.keys(maker.app.roofStyleControls.store.getState().byCancer).length === 0,
      'Legacy agenda silently selected a new optical roof');
    assert(fieldSnapshot(maker.doc).conferenceTitle === fixture.fields.conferenceTitle &&
      same(maker.app.getAppState().agendaItems, fixture.agenda), 'Legacy agenda content did not load');
    const legacyDesign = maker.app.cancerDesignSwitcher.getState();
    assert(legacyDesign.version === 2 && Object.keys(legacyDesign.contourByCancer).length === 6,
      'Legacy agenda lost CancerDesign migration/defaults');
    report.legacyMigrationPreserved = true;
    report.legacy = { v1StorageMigrated: true, agendaV1LoadedWithoutOpticalDefault: true,
      contourIds: [...new Set(Object.values(legacyDesign.contourByCancer))].sort() };
    report.applicationConsoleEvents.push(...diagnostics(maker));
    report.applicationConsoleEvents = report.applicationConsoleEvents.filter((event, index, all) =>
      all.findIndex(other => same(other, event)) === index);
    report.applicationConsoleErrors = report.applicationConsoleEvents.length;
    assert(report.applicationConsoleErrors === 0, 'Application emitted runtime errors during Maker state QA');
    report.finishedAt = new Date().toISOString();
  } catch (error) {
    report.failures.push({ message: String(error), stack: error.stack || '' });
    if (maker) report.applicationConsoleEvents.push(...diagnostics(maker));
  } finally {
    maker?.frame.remove(); restoreStorage(before);
  }
  return report;
}
