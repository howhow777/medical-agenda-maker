import type { RoofColors, RoofSelection, RoofSelectionStateV1, RoofStyleId } from '../assets/roofTypes.js';
import { cancerDesignPresetList, type CancerDesignPresetId } from './cancerDesignPresets.js';
import { getRecommendedRoofScheme, isApprovedRoofPair } from './roofStyles.js';

export const ROOF_SELECTION_STORAGE_KEY = 'agendaPoster.opticalRoofs.v1';
export const ROOF_SELECTION_DIAGNOSTIC_KEY = 'agendaPoster.opticalRoofs.unrecognized';

export function isRoofColors(value: unknown): value is RoofColors {
  return Array.isArray(value) && value.length === 3 && value.every(color =>
    typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color));
}

export function recommendedRoofSelection(cancerId: CancerDesignPresetId, styleId: RoofStyleId): RoofSelection {
  return { styleId, mode: 'recommended', colors: [...getRecommendedRoofScheme(cancerId, styleId).header.colors] as RoofColors };
}

export function parseRoofSelectionState(value: unknown): { state: RoofSelectionStateV1; issues: string[] } {
  const state: RoofSelectionStateV1 = { version: 1, byCancer: {} };
  const issues: string[] = [];
  if (value === undefined || value === null) return { state, issues };
  if (typeof value !== 'object' || Array.isArray(value)) return { state, issues: ['屋簷設定不是物件'] };
  const input = value as Record<string, unknown>;
  if (input.version !== 1) return { state, issues: ['未知屋簷設定版本；保留舊屋簷'] };
  if (!input.byCancer || typeof input.byCancer !== 'object' || Array.isArray(input.byCancer)) {
    return { state, issues: ['屋簷癌別設定格式不正確'] };
  }
  for (const [id, value] of Object.entries(input.byCancer)) {
    const cancer = cancerDesignPresetList.find(item => item.id === id);
    const entry = value as Partial<RoofSelection> | null;
    if (!cancer || !entry || typeof entry !== 'object' || !isApprovedRoofPair(id, entry.styleId) ||
        !['recommended', 'custom'].includes(String(entry.mode)) || !isRoofColors(entry.colors)) {
      issues.push(`未識別或不適用的屋簷設定：${id}`);
      continue;
    }
    state.byCancer[cancer.id] = entry.mode === 'recommended'
      ? recommendedRoofSelection(cancer.id, entry.styleId!)
      : { styleId: entry.styleId!, mode: 'custom', colors: [...entry.colors] };
  }
  return { state, issues };
}

type RoofStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Reads never overwrite invalid/future data. Only explicit user changes persist. */
export class RoofSelectionStore {
  private state: RoofSelectionStateV1 = { version: 1, byCancer: {} };
  private unrecognizedRaw: string | null = null;
  public issues: string[] = [];

  constructor(private storage?: RoofStorage) {
    try {
      const raw = storage?.getItem(ROOF_SELECTION_STORAGE_KEY);
      if (!raw) return;
      let parsed: unknown;
      try { parsed = JSON.parse(raw); }
      catch { this.unrecognizedRaw = raw; this.issues = ['屋簷設定無法解析；原資料已保留']; return; }
      const result = parseRoofSelectionState(parsed);
      this.state = result.state;
      this.issues = result.issues;
      if (result.issues.length) this.unrecognizedRaw = raw;
    } catch { this.issues = ['無法讀取屋簷設定；仍可在本次工作中選擇']; }
  }

  getState(): RoofSelectionStateV1 { return JSON.parse(JSON.stringify(this.state)); }

  get(cancerId: CancerDesignPresetId): RoofSelection | undefined {
    return this.getState().byCancer[cancerId];
  }

  select(cancerId: CancerDesignPresetId, selection: RoofSelection | undefined): void {
    if (selection) {
      const result = parseRoofSelectionState({ version: 1, byCancer: { [cancerId]: selection } });
      if (result.issues.length) throw new Error(result.issues.join('；'));
      this.state.byCancer[cancerId] = result.state.byCancer[cancerId];
    } else delete this.state.byCancer[cancerId];
    this.persist();
  }

  /** A legacy template (undefined) explicitly restores legacy, not last local picks. */
  restore(value: unknown, persist = true): void {
    const result = parseRoofSelectionState(value);
    this.state = result.state;
    this.issues = result.issues;
    if (persist) this.persist();
  }

  private persist(): void {
    if (!this.storage) return;
    try {
      if (this.unrecognizedRaw !== null) {
        // If preserving the raw bytes fails, do not overwrite them.
        this.storage.setItem(ROOF_SELECTION_DIAGNOSTIC_KEY, this.unrecognizedRaw);
        this.unrecognizedRaw = null;
      }
      this.storage.setItem(ROOF_SELECTION_STORAGE_KEY, JSON.stringify(this.state));
    } catch { this.issues = [...this.issues, '屋簷設定未能儲存；本次選擇仍有效']; }
  }
}
