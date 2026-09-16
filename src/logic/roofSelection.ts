import type {
  ClassicRoofSelection,
  OpticalRoofSelection,
  RoofColors,
  RoofSelection,
  RoofSelectionStateV2,
  RoofStyleId
} from '../assets/roofTypes.js';
import {
  cancerDesignPresetList,
  cancerDesignPresets,
  type CancerDesignPresetId
} from './cancerDesignPresets.js';
import {
  defaultRoofStyleByCancer,
  getRecommendedRoofScheme,
  isApprovedRoofPair
} from './roofStyles.js';

// Storage generation v3 deliberately starts every browser on the approved
// optical defaults. The payload schema remains V2 so saved templates stay
// compatible; the former browser preference is left untouched for rollback.
export const ROOF_SELECTION_STORAGE_KEY = 'agendaPoster.roofs.v3';
export const RETIRED_ROOF_SELECTION_STORAGE_KEY_V2 = 'agendaPoster.roofs.v2';
export const LEGACY_ROOF_SELECTION_STORAGE_KEY_V1 = 'agendaPoster.opticalRoofs.v1';
export const ROOF_SELECTION_DIAGNOSTIC_KEY = 'agendaPoster.roofs.unrecognized';

const LEGACY_CONTOUR_IDS = new Set(['soft-wave', 'arc-sweep', 'layered-ribbon', 'clean-diagonal']);

interface LegacyOpticalSelection {
  styleId: RoofStyleId;
  mode: 'recommended' | 'custom';
  colors: RoofColors;
}

type RoofStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function isRoofColors(value: unknown): value is RoofColors {
  return Array.isArray(value) && value.length === 3 && value.every(color =>
    typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color));
}

export function isOpticalRoofSelection(selection: RoofSelection): selection is OpticalRoofSelection {
  return selection.kind === 'optical';
}

export function recommendedRoofSelection(cancerId: CancerDesignPresetId, styleId: RoofStyleId): OpticalRoofSelection {
  return {
    kind: 'optical',
    styleId,
    mode: 'recommended',
    colors: [...getRecommendedRoofScheme(cancerId, styleId).header.colors] as RoofColors
  };
}

export function recommendedClassicRoofSelection(cancerId: CancerDesignPresetId): ClassicRoofSelection {
  return { kind: 'classic', mode: 'recommended', colors: [...cancerDesignPresets[cancerId].palette] };
}

export function createFreshRoofSelectionState(): RoofSelectionStateV2 {
  const byCancer = {} as Record<CancerDesignPresetId, RoofSelection>;
  cancerDesignPresetList.forEach(preset => {
    byCancer[preset.id] = recommendedRoofSelection(preset.id, defaultRoofStyleByCancer[preset.id]);
  });
  return { version: 2, byCancer };
}

export function createClassicRoofSelectionState(): RoofSelectionStateV2 {
  const byCancer = {} as Record<CancerDesignPresetId, RoofSelection>;
  cancerDesignPresetList.forEach(preset => {
    byCancer[preset.id] = recommendedClassicRoofSelection(preset.id);
  });
  return { version: 2, byCancer };
}

function copySelection(selection: RoofSelection): RoofSelection {
  return { ...selection, colors: [...selection.colors] };
}

function parseSelection(cancerId: CancerDesignPresetId, value: unknown): RoofSelection | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const input = value as Record<string, unknown>;
  if (!['recommended', 'custom'].includes(String(input.mode)) || !isRoofColors(input.colors)) return undefined;
  if (input.kind === 'classic') {
    return { kind: 'classic', mode: input.mode as 'recommended' | 'custom', colors: [...input.colors] };
  }
  if (input.kind === 'optical' && isApprovedRoofPair(cancerId, input.styleId)) {
    const styleId = input.styleId as RoofStyleId;
    return input.mode === 'recommended'
      ? recommendedRoofSelection(cancerId, styleId)
      : { kind: 'optical', styleId, mode: 'custom', colors: [...input.colors] };
  }
  return undefined;
}

function parseV2(value: Record<string, unknown>): { state: RoofSelectionStateV2; issues: string[] } {
  const state = createClassicRoofSelectionState();
  const issues: string[] = [];
  if (!value.byCancer || typeof value.byCancer !== 'object' || Array.isArray(value.byCancer)) {
    return { state, issues: ['屋簷癌別設定格式不正確；已安全使用最初版屋簷'] };
  }
  const byCancer = value.byCancer as Record<string, unknown>;
  cancerDesignPresetList.forEach(cancer => {
    const parsed = parseSelection(cancer.id, byCancer[cancer.id]);
    if (parsed) state.byCancer[cancer.id] = parsed;
    else issues.push(`屋簷設定缺漏或不適用：${cancer.id}；已安全使用最初版屋簷`);
  });
  Object.keys(byCancer).forEach(id => {
    if (!cancerDesignPresets[id as CancerDesignPresetId]) issues.push(`未知癌別屋簷設定：${id}`);
  });
  return { state, issues };
}

function parseV1(value: Record<string, unknown>): { state: RoofSelectionStateV2; issues: string[] } {
  const state = createClassicRoofSelectionState();
  const issues: string[] = [];
  if (!value.byCancer || typeof value.byCancer !== 'object' || Array.isArray(value.byCancer)) {
    return { state, issues: ['舊版屋簷癌別設定格式不正確；已安全使用最初版屋簷'] };
  }
  const byCancer = value.byCancer as Record<string, unknown>;
  for (const [id, raw] of Object.entries(byCancer)) {
    const cancerId = id as CancerDesignPresetId;
    const entry = raw as Partial<LegacyOpticalSelection> | null;
    if (!cancerDesignPresets[cancerId] || !entry || typeof entry !== 'object' ||
        !isApprovedRoofPair(cancerId, entry.styleId) ||
        !['recommended', 'custom'].includes(String(entry.mode)) || !isRoofColors(entry.colors)) {
      issues.push(`未識別或不適用的舊版屋簷設定：${id}`);
      continue;
    }
    state.byCancer[cancerId] = entry.mode === 'recommended'
      ? recommendedRoofSelection(cancerId, entry.styleId!)
      : { kind: 'optical', styleId: entry.styleId!, mode: 'custom', colors: [...entry.colors] };
  }
  return { state, issues };
}

/** Parse stored/template state. Missing input means an old template, so it resolves to classic. */
export function parseRoofSelectionState(value: unknown): { state: RoofSelectionStateV2; issues: string[] } {
  if (value === undefined || value === null) return { state: createClassicRoofSelectionState(), issues: [] };
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { state: createClassicRoofSelectionState(), issues: ['屋簷設定不是物件；已安全使用最初版屋簷'] };
  }
  const input = value as Record<string, unknown>;
  if (input.version === 2) return parseV2(input);
  if (input.version === 1) return parseV1(input);
  return { state: createClassicRoofSelectionState(), issues: ['未知屋簷設定版本；原資料已保留'] };
}

/** Isolated compatibility check; legacy IDs never escape into renderer or current state. */
export function hasLegacyContourSelection(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const contours = (value as Record<string, unknown>).contourByCancer;
  return Boolean(contours && typeof contours === 'object' && !Array.isArray(contours) &&
    Object.values(contours as Record<string, unknown>).some(id => LEGACY_CONTOUR_IDS.has(String(id))));
}

/** Reads migrate deterministically; invalid/future bytes remain untouched until an explicit write. */
export class RoofSelectionStore {
  private state: RoofSelectionStateV2 = createFreshRoofSelectionState();
  private unrecognizedRaw: string | null = null;
  public issues: string[] = [];

  constructor(private storage?: RoofStorage) {
    if (!storage) return;
    try {
      const currentRaw = storage.getItem(ROOF_SELECTION_STORAGE_KEY);
      if (currentRaw !== null) {
        this.readRaw(currentRaw);
        return;
      }

      // Do not migrate V1/V2 browser roof preferences into this release. The
      // product decision is that every browser starts this generation as new.
      // Explicitly loaded templates still use restore() and retain compatibility.
      this.state = createFreshRoofSelectionState();
      this.persist();
    } catch {
      this.state = createFreshRoofSelectionState();
      this.issues = ['無法讀取屋簷設定；本次使用最新建議屋簷'];
    }
  }

  getState(): RoofSelectionStateV2 {
    return JSON.parse(JSON.stringify(this.state)) as RoofSelectionStateV2;
  }

  get(cancerId: CancerDesignPresetId): RoofSelection {
    return copySelection(this.state.byCancer[cancerId]);
  }

  select(cancerId: CancerDesignPresetId, selection: RoofSelection): void {
    const parsed = parseSelection(cancerId, selection);
    if (!parsed) throw new Error('未識別或不適用的屋簷設定');
    this.state.byCancer[cancerId] = parsed;
    this.persist();
  }

  /** Missing roof state is an old template and therefore restores classic explicitly. */
  restore(value: unknown, persist = true): void {
    const result = parseRoofSelectionState(value);
    this.state = result.state;
    this.issues = result.issues;
    if (persist) this.persist();
  }

  private readRaw(raw: string): void {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.state = createClassicRoofSelectionState();
      this.unrecognizedRaw = raw;
      this.issues = ['屋簷設定無法解析；原資料已保留'];
      return;
    }
    const result = parseRoofSelectionState(parsed);
    this.state = result.state;
    this.issues = result.issues;
    if (result.issues.length) this.unrecognizedRaw = raw;
  }

  private persist(): void {
    if (!this.storage) return;
    try {
      if (this.unrecognizedRaw !== null) {
        this.storage.setItem(ROOF_SELECTION_DIAGNOSTIC_KEY, this.unrecognizedRaw);
        this.unrecognizedRaw = null;
      }
      this.storage.setItem(ROOF_SELECTION_STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      this.issues = [...this.issues, '屋簷設定未能儲存；本次選擇仍有效'];
    }
  }
}
