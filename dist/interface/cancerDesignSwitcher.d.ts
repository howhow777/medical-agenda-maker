import { CancerDesignStateV2, HeaderContourId } from '../assets/types.js';
import { CancerDesignPresetId } from '../logic/cancerDesignPresets.js';
import type { RoofSelectionStateV1 } from '../assets/roofTypes.js';
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
} | {
    type: 'select-contour';
    presetId: CancerDesignPresetId;
    contourId: HeaderContourId;
};
type ActionHandler = (action: CancerDesignAction) => Promise<void>;
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
    private contourGrid;
    private state;
    private lastFocusedElement;
    private roofSelections;
    constructor(onAction: ActionHandler);
    initialize(): Promise<void>;
    getState(): CancerDesignStateV2;
    setRoofSelections(state: RoofSelectionStateV1): void;
    private renderPresetPreview;
    restoreState(value: unknown, persist?: boolean): CancerDesignStateV2;
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
