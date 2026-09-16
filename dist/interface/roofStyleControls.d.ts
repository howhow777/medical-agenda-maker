import type { RoofSelection, RoofStyleId } from '../assets/roofTypes.js';
import type { CancerDesignPresetId } from '../logic/cancerDesignPresets.js';
import { RoofSelectionStore } from '../logic/roofSelection.js';
import { FormControls } from './formControls.js';
/** Two synchronized views, one state and the existing custom-color inputs. */
export declare class RoofStyleControls {
    readonly store: RoofSelectionStore;
    private form;
    private onChange;
    private cancerId;
    private coordinator;
    private status;
    private retryable;
    private hosts;
    constructor(store: RoofSelectionStore, form: FormControls, onChange: (cancerId: CancerDesignPresetId, selection?: RoofSelection) => void);
    setCancer(cancerId: CancerDesignPresetId): Promise<void>;
    select(styleId: RoofStyleId): Promise<void>;
    useLegacy(): Promise<void>;
    /** Called after ordinary form changes; no mutation if no optical style is active. */
    syncCustomColors(): void;
    readyForExport(): Promise<void>;
    private isRestoring;
    private applySelectionColors;
    private loadSelection;
    private render;
    private updateControls;
    private updateStatus;
}
