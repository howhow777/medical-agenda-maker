import { cancerDesignPresetList, cancerDesignPresets } from './cancerDesignPresets.js';
import { defaultRoofStyleByCancer, getRecommendedRoofScheme, isApprovedRoofPair } from './roofStyles.js';
export const ROOF_SELECTION_STORAGE_KEY = 'agendaPoster.roofs.v2';
export const LEGACY_ROOF_SELECTION_STORAGE_KEY_V1 = 'agendaPoster.opticalRoofs.v1';
export const ROOF_SELECTION_DIAGNOSTIC_KEY = 'agendaPoster.roofs.unrecognized';
const LEGACY_CANCER_DESIGN_STORAGE_KEY_V2 = 'medical-agenda-maker:cancer-design-selection:v2';
const LEGACY_CONTOUR_IDS = new Set(['soft-wave', 'arc-sweep', 'layered-ribbon', 'clean-diagonal']);
export function isRoofColors(value) {
    return Array.isArray(value) && value.length === 3 && value.every(color => typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color));
}
export function isOpticalRoofSelection(selection) {
    return selection.kind === 'optical';
}
export function recommendedRoofSelection(cancerId, styleId) {
    return {
        kind: 'optical',
        styleId,
        mode: 'recommended',
        colors: [...getRecommendedRoofScheme(cancerId, styleId).header.colors]
    };
}
export function recommendedClassicRoofSelection(cancerId) {
    return { kind: 'classic', mode: 'recommended', colors: [...cancerDesignPresets[cancerId].palette] };
}
export function createFreshRoofSelectionState() {
    const byCancer = {};
    cancerDesignPresetList.forEach(preset => {
        byCancer[preset.id] = recommendedRoofSelection(preset.id, defaultRoofStyleByCancer[preset.id]);
    });
    return { version: 2, byCancer };
}
export function createClassicRoofSelectionState() {
    const byCancer = {};
    cancerDesignPresetList.forEach(preset => {
        byCancer[preset.id] = recommendedClassicRoofSelection(preset.id);
    });
    return { version: 2, byCancer };
}
function copySelection(selection) {
    return { ...selection, colors: [...selection.colors] };
}
function parseSelection(cancerId, value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return undefined;
    const input = value;
    if (!['recommended', 'custom'].includes(String(input.mode)) || !isRoofColors(input.colors))
        return undefined;
    if (input.kind === 'classic') {
        return { kind: 'classic', mode: input.mode, colors: [...input.colors] };
    }
    if (input.kind === 'optical' && isApprovedRoofPair(cancerId, input.styleId)) {
        const styleId = input.styleId;
        return input.mode === 'recommended'
            ? recommendedRoofSelection(cancerId, styleId)
            : { kind: 'optical', styleId, mode: 'custom', colors: [...input.colors] };
    }
    return undefined;
}
function parseV2(value) {
    const state = createClassicRoofSelectionState();
    const issues = [];
    if (!value.byCancer || typeof value.byCancer !== 'object' || Array.isArray(value.byCancer)) {
        return { state, issues: ['屋簷癌別設定格式不正確；已安全使用最初版屋簷'] };
    }
    const byCancer = value.byCancer;
    cancerDesignPresetList.forEach(cancer => {
        const parsed = parseSelection(cancer.id, byCancer[cancer.id]);
        if (parsed)
            state.byCancer[cancer.id] = parsed;
        else
            issues.push(`屋簷設定缺漏或不適用：${cancer.id}；已安全使用最初版屋簷`);
    });
    Object.keys(byCancer).forEach(id => {
        if (!cancerDesignPresets[id])
            issues.push(`未知癌別屋簷設定：${id}`);
    });
    return { state, issues };
}
function parseV1(value) {
    const state = createClassicRoofSelectionState();
    const issues = [];
    if (!value.byCancer || typeof value.byCancer !== 'object' || Array.isArray(value.byCancer)) {
        return { state, issues: ['舊版屋簷癌別設定格式不正確；已安全使用最初版屋簷'] };
    }
    const byCancer = value.byCancer;
    for (const [id, raw] of Object.entries(byCancer)) {
        const cancerId = id;
        const entry = raw;
        if (!cancerDesignPresets[cancerId] || !entry || typeof entry !== 'object' ||
            !isApprovedRoofPair(cancerId, entry.styleId) ||
            !['recommended', 'custom'].includes(String(entry.mode)) || !isRoofColors(entry.colors)) {
            issues.push(`未識別或不適用的舊版屋簷設定：${id}`);
            continue;
        }
        state.byCancer[cancerId] = entry.mode === 'recommended'
            ? recommendedRoofSelection(cancerId, entry.styleId)
            : { kind: 'optical', styleId: entry.styleId, mode: 'custom', colors: [...entry.colors] };
    }
    return { state, issues };
}
/** Parse stored/template state. Missing input means an old template, so it resolves to classic. */
export function parseRoofSelectionState(value) {
    if (value === undefined || value === null)
        return { state: createClassicRoofSelectionState(), issues: [] };
    if (typeof value !== 'object' || Array.isArray(value)) {
        return { state: createClassicRoofSelectionState(), issues: ['屋簷設定不是物件；已安全使用最初版屋簷'] };
    }
    const input = value;
    if (input.version === 2)
        return parseV2(input);
    if (input.version === 1)
        return parseV1(input);
    return { state: createClassicRoofSelectionState(), issues: ['未知屋簷設定版本；原資料已保留'] };
}
/** Isolated compatibility check; legacy IDs never escape into renderer or current state. */
export function hasLegacyContourSelection(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        return false;
    const contours = value.contourByCancer;
    return Boolean(contours && typeof contours === 'object' && !Array.isArray(contours) &&
        Object.values(contours).some(id => LEGACY_CONTOUR_IDS.has(String(id))));
}
/** Reads migrate deterministically; invalid/future bytes remain untouched until an explicit write. */
export class RoofSelectionStore {
    constructor(storage) {
        this.storage = storage;
        this.state = createFreshRoofSelectionState();
        this.unrecognizedRaw = null;
        this.issues = [];
        if (!storage)
            return;
        try {
            const currentRaw = storage.getItem(ROOF_SELECTION_STORAGE_KEY);
            if (currentRaw !== null) {
                this.readRaw(currentRaw);
                return;
            }
            const legacyRaw = storage.getItem(LEGACY_ROOF_SELECTION_STORAGE_KEY_V1);
            if (legacyRaw !== null) {
                this.readRaw(legacyRaw);
                if (this.unrecognizedRaw === null)
                    this.persist();
                return;
            }
            const legacyCancerRaw = storage.getItem(LEGACY_CANCER_DESIGN_STORAGE_KEY_V2);
            if (legacyCancerRaw !== null) {
                try {
                    if (hasLegacyContourSelection(JSON.parse(legacyCancerRaw))) {
                        this.state = createClassicRoofSelectionState();
                        this.persist();
                        return;
                    }
                }
                catch {
                    // A malformed unrelated legacy store must not prevent fresh defaults.
                }
            }
            this.state = createFreshRoofSelectionState();
            this.persist();
        }
        catch {
            this.state = createFreshRoofSelectionState();
            this.issues = ['無法讀取屋簷設定；本次使用最新建議屋簷'];
        }
    }
    getState() {
        return JSON.parse(JSON.stringify(this.state));
    }
    get(cancerId) {
        return copySelection(this.state.byCancer[cancerId]);
    }
    select(cancerId, selection) {
        const parsed = parseSelection(cancerId, selection);
        if (!parsed)
            throw new Error('未識別或不適用的屋簷設定');
        this.state.byCancer[cancerId] = parsed;
        this.persist();
    }
    /** Missing roof state is an old template and therefore restores classic explicitly. */
    restore(value, persist = true) {
        const result = parseRoofSelectionState(value);
        this.state = result.state;
        this.issues = result.issues;
        if (persist)
            this.persist();
    }
    readRaw(raw) {
        let parsed;
        try {
            parsed = JSON.parse(raw);
        }
        catch {
            this.state = createClassicRoofSelectionState();
            this.unrecognizedRaw = raw;
            this.issues = ['屋簷設定無法解析；原資料已保留'];
            return;
        }
        const result = parseRoofSelectionState(parsed);
        this.state = result.state;
        this.issues = result.issues;
        if (result.issues.length)
            this.unrecognizedRaw = raw;
    }
    persist() {
        if (!this.storage)
            return;
        try {
            if (this.unrecognizedRaw !== null) {
                this.storage.setItem(ROOF_SELECTION_DIAGNOSTIC_KEY, this.unrecognizedRaw);
                this.unrecognizedRaw = null;
            }
            this.storage.setItem(ROOF_SELECTION_STORAGE_KEY, JSON.stringify(this.state));
        }
        catch {
            this.issues = [...this.issues, '屋簷設定未能儲存；本次選擇仍有效'];
        }
    }
}
//# sourceMappingURL=roofSelection.js.map