import type { RoofColors, RoofSelection, RoofSelectionStateV1, RoofStyleId } from '../assets/roofTypes.js';
import { type CancerDesignPresetId } from './cancerDesignPresets.js';
export declare const ROOF_SELECTION_STORAGE_KEY = "agendaPoster.opticalRoofs.v1";
export declare const ROOF_SELECTION_DIAGNOSTIC_KEY = "agendaPoster.opticalRoofs.unrecognized";
export declare function isRoofColors(value: unknown): value is RoofColors;
export declare function recommendedRoofSelection(cancerId: CancerDesignPresetId, styleId: RoofStyleId): RoofSelection;
export declare function parseRoofSelectionState(value: unknown): {
    state: RoofSelectionStateV1;
    issues: string[];
};
type RoofStorage = Pick<Storage, 'getItem' | 'setItem'>;
/** Reads never overwrite invalid/future data. Only explicit user changes persist. */
export declare class RoofSelectionStore {
    private storage?;
    private state;
    private unrecognizedRaw;
    issues: string[];
    constructor(storage?: RoofStorage | undefined);
    getState(): RoofSelectionStateV1;
    get(cancerId: CancerDesignPresetId): RoofSelection | undefined;
    select(cancerId: CancerDesignPresetId, selection: RoofSelection | undefined): void;
    /** A legacy template (undefined) explicitly restores legacy, not last local picks. */
    restore(value: unknown, persist?: boolean): void;
    private persist;
}
export {};
