export declare const AGENDA_POSTER_STORAGE_KEY = "agendaPoster.autosave.v1";
export declare const AGENDA_POSTER_STATE_VERSION = "agenda-poster-v2";
export interface SavedState {
    version: string;
    savedAt: string;
    title: string;
    form: Record<string, any>;
    customState?: any;
}
export declare class DataManager {
    private readonly LS_KEY;
    collectFormState(): Record<string, any>;
    buildStatePayload(customState?: any): SavedState;
    applyState(state: SavedState, customStateCallback?: (customState: any) => void | Promise<void>): Promise<void>;
    tempSave(customState?: any): void;
    tempLoad(customStateCallback?: (customState: any) => void | Promise<void>): Promise<void>;
    exportJson(customState?: any): void;
    importJson(file: File, customStateCallback?: (customState: any) => void | Promise<void>): void;
    private showToast;
}
