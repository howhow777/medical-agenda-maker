import type { ClassicRoofSelection, OpticalRoofSelection, RoofColors, RoofSelection, RoofSelectionStateV2, RoofStyleId } from '../assets/roofTypes.js';
import { type CancerDesignPresetId } from './cancerDesignPresets.js';
export declare const ROOF_SELECTION_STORAGE_KEY = "agendaPoster.roofs.v3";
export declare const RETIRED_ROOF_SELECTION_STORAGE_KEY_V2 = "agendaPoster.roofs.v2";
export declare const LEGACY_ROOF_SELECTION_STORAGE_KEY_V1 = "agendaPoster.opticalRoofs.v1";
export declare const ROOF_SELECTION_DIAGNOSTIC_KEY = "agendaPoster.roofs.unrecognized";
type RoofStorage = Pick<Storage, 'getItem' | 'setItem'>;
export declare function isRoofColors(value: unknown): value is RoofColors;
export declare function isOpticalRoofSelection(selection: RoofSelection): selection is OpticalRoofSelection;
export declare function recommendedRoofSelection(cancerId: CancerDesignPresetId, styleId: RoofStyleId): OpticalRoofSelection;
export declare function recommendedClassicRoofSelection(cancerId: CancerDesignPresetId): ClassicRoofSelection;
export declare function createFreshRoofSelectionState(): RoofSelectionStateV2;
export declare function createClassicRoofSelectionState(): RoofSelectionStateV2;
/** Parse stored/template state. Missing input means an old template, so it resolves to classic. */
export declare function parseRoofSelectionState(value: unknown): {
    state: RoofSelectionStateV2;
    issues: string[];
};
/** Isolated compatibility check; legacy IDs never escape into renderer or current state. */
export declare function hasLegacyContourSelection(value: unknown): boolean;
/** Reads migrate deterministically; invalid/future bytes remain untouched until an explicit write. */
export declare class RoofSelectionStore {
    private storage?;
    private state;
    private unrecognizedRaw;
    issues: string[];
    constructor(storage?: RoofStorage | undefined);
    getState(): RoofSelectionStateV2;
    get(cancerId: CancerDesignPresetId): RoofSelection;
    select(cancerId: CancerDesignPresetId, selection: RoofSelection): void;
    /** Missing roof state is an old template and therefore restores classic explicitly. */
    restore(value: unknown, persist?: boolean): void;
    private readRaw;
    private persist;
}
export {};
