import type { CancerDesignPresetId } from '../logic/cancerDesignPresets.js';
/** Optical styles are independent of the four legacy HeaderContourIds. */
export type RoofStyleId = 'optical-signal' | 'satin-arc' | 'waterlight' | 'rose-satin' | 'coral-arch' | 'peach-flow';
export type RoofColors = [string, string, string];
export interface RoofSelection {
    styleId: RoofStyleId;
    mode: 'recommended' | 'custom';
    colors: RoofColors;
}
/** Missing cancer entries intentionally mean legacy; no implicit optical default. */
export interface RoofSelectionStateV1 {
    version: 1;
    byCancer: Partial<Record<CancerDesignPresetId, RoofSelection>>;
}
