import { CancerDesignState } from '../assets/types.js';
import type { RoofSelectionStateV2 } from '../assets/roofTypes.js';
import { CancerDesignPresetId } from '../logic/cancerDesignPresets.js';
export type CancerDesignAction = {
    type: 'select-cancer';
    presetId: CancerDesignPresetId;
} | {
    type: 'select-primary';
    presetId: CancerDesignPresetId;
    motifId: string;
} | {
    type: 'add-copy';
    presetId: CancerDesignPresetId;
    motifId: string;
};
type ActionHandler = (action: CancerDesignAction) => Promise<void>;
export declare const CANCER_DESIGN_STORAGE_KEY = "medical-agenda-maker:cancer-design-selection:v3";
export declare const CANCER_DESIGN_STORAGE_KEY_V2 = "medical-agenda-maker:cancer-design-selection:v2";
export declare const CANCER_DESIGN_STORAGE_KEY_V1 = "medical-agenda-maker:cancer-design-selection:v1";
export declare class CancerDesignSwitcher {
    private onAction;
    private trigger;
    private drawer;
    private backdrop;
    private closeButton;
    private cardGrid;
    private motifGrid;
    private motifTitle;
    private state;
    private lastFocusedElement;
    private roofSelections;
    constructor(onAction: ActionHandler);
    initialize(): Promise<void>;
    getState(): CancerDesignState;
    setRoofSelections(state: RoofSelectionStateV2): void;
    private renderPresetPreview;
    restoreState(value: unknown, persist?: boolean): CancerDesignState;
    private get activePresetId();
    private bindEvents;
    private render;
    private createPalette;
    private open;
    private close;
    private isOpen;
    private trapFocus;
    private restoreSelection;
    private saveSelection;
    private requireElement;
}
export {};
