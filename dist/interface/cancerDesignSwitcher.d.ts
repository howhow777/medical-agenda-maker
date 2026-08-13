import { CancerDesignPresetId } from '../logic/cancerDesignPresets.js';
type SelectionHandler = (presetId: CancerDesignPresetId, motifId: string) => Promise<void>;
export declare class CancerDesignSwitcher {
    private onSelection;
    private trigger;
    private drawer;
    private backdrop;
    private closeButton;
    private cardGrid;
    private motifGrid;
    private motifTitle;
    private selectedPresetId;
    private selectedMotifs;
    private lastFocusedElement;
    constructor(onSelection: SelectionHandler);
    initialize(): Promise<void>;
    private bindEvents;
    private render;
    private createPalette;
    private applySelection;
    private open;
    private close;
    private isOpen;
    private trapFocus;
    private restoreSelection;
    private saveSelection;
    private requireElement;
}
export {};
