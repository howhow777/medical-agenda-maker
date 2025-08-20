export declare class TemplateManager {
    private dataManager;
    constructor();
    saveTemplate(name: string, customState?: any): void;
    loadTemplateFromFile(file: File, customStateCallback?: (customState: any) => void): Promise<void>;
    private downloadFile;
    private collectCurrentState;
    private validateTemplate;
    private showToast;
}
