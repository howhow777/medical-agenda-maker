import type { CancerDesignPresetId } from '../logic/cancerDesignPresets.js';

export type RoofStyleId = 'optical-signal' | 'satin-arc' | 'waterlight' | 'rose-satin' | 'coral-arch' | 'peach-flow';
export type RoofColors = [string, string, string];
export interface OpticalRoofSelection {
  kind: 'optical';
  styleId: RoofStyleId;
  mode: 'recommended' | 'custom';
  colors: RoofColors;
}

export interface ClassicRoofSelection {
  kind: 'classic';
  mode: 'recommended' | 'custom';
  colors: RoofColors;
}

export type RoofSelection = OpticalRoofSelection | ClassicRoofSelection;

/** Every cancer has an explicit choice; undefined no longer means legacy. */
export interface RoofSelectionStateV2 {
  version: 2;
  byCancer: Record<CancerDesignPresetId, RoofSelection>;
}
