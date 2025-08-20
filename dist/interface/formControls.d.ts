import { AgendaItem, CustomColors, Overlay } from '../assets/types.js';
import { OverlayManager } from '../logic/overlayManager.js';
export declare class FormControls {
    private updateCallback;
    private overlayManager?;
    private agendaItems;
    private currentTemplate;
    private currentColorScheme;
    private currentGradientDirection;
    private customColors;
    private showFooterNote;
    private fileUploadHandler?;
    private eventsAlreadyBound;
    constructor(updateCallback: () => void, overlayManager?: OverlayManager | undefined);
    setOverlayManager(overlayManager: OverlayManager): void;
    private bindPngControls;
    private handleFileUpload;
    private createOverlayFromFile;
    private bindOverlayControls;
    private initializeForm;
    bindEvents(): void;
    private setInitialCropArea;
    private bindTemplateButtons;
    private bindColorSchemeControls;
    private bindAgendaControls;
    private bindCustomColorControls;
    private bindBasicInputs;
    private addOrUpdateAgenda;
    private refreshAgendaList;
    editAgenda(index: number): void;
    deleteAgenda(index: number): void;
    private applyCustomColors;
    private toggleCustomSection;
    private syncCustomColors;
    getAgendaItems(): AgendaItem[];
    getCurrentTemplate(): string;
    getCurrentColorScheme(): string;
    getCurrentGradientDirection(): string;
    getCustomColors(): CustomColors;
    setAgendaItems(items: AgendaItem[]): void;
    setCurrentTemplate(template: string): void;
    setCustomColors(colors: CustomColors): void;
    getShowFooterNote(): boolean;
    private bringToFront;
    private bringForward;
    private sendBackward;
    private sendToBack;
    private centerOverlay;
    private resetOverlay;
    private removeOverlay;
    private setOverlayOpacity;
    private setOverlayVisible;
    private setOverlayLockAspect;
    refreshOverlayList(): void;
    syncOverlayControls(): void;
    getOverlays(): Overlay[];
    getSelectedOverlayIndex(): number;
    updateAgendaList(): void;
    updateCustomColorInputs(): void;
}
declare global {
    interface Window {
        editAgenda: (index: number) => void;
        deleteAgenda: (index: number) => void;
    }
}
