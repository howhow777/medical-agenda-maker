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
    applyState(state: SavedState, customStateCallback?: (customState: any) => void): void;
    tempSave(customState?: any): void;
    tempLoad(customStateCallback?: (customState: any) => void): void;
    exportJson(customState?: any): void;
    importJson(file: File, customStateCallback?: (customState: any) => void): void;
    private showToast;
}
