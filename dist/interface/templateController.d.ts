export declare class TemplateController {
    private templateManager;
    private collectCurrentAppState;
    private applyCustomState;
    constructor();
    init(): void;
    renderTemplateButtons(): void;
    private setupButtons;
    setStateCollector(collector: () => any): void;
    setStateApplier(applier: (customState: any) => void): void;
}
