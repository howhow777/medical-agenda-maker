import type { RoofSelection, RoofStyleId } from '../assets/roofTypes.js';
import type { CancerDesignPresetId } from '../logic/cancerDesignPresets.js';
import { RoofSelectionStore } from '../logic/roofSelection.js';
import { FormControls } from './formControls.js';
/** Two synchronized views, one explicit per-cancer state and the existing color inputs. */
export declare class RoofStyleControls {
    readonly store: RoofSelectionStore;
    private form;
    private onChange;
    private cancerId;
    private coordinator;
    private status;
    private retryable;
    private hosts;
    constructor(store: RoofSelectionStore, form: FormControls, onChange: (cancerId: CancerDesignPresetId, selection: RoofSelection) => void);
    setCancer(cancerId: CancerDesignPresetId): Promise<void>;
    select(styleId: RoofStyleId): Promise<void>;
    selectClassic(): Promise<void>;
    /** Called after ordinary form changes; keeps the selected geometry and updates its palette. */
    syncCustomColors(): void;
    readyForExport(): Promise<void>;
    private isRestoring;
    private applySelectionColors;
    /** Loading preserves the last complete frame. Classic appears only by choice or on a real failure. */
    private loadSelection;
    private render;
    private updateControls;
    private updateStatus;
}
