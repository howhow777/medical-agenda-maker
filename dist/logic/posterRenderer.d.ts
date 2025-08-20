import { AgendaItem, ColorScheme, CancerTemplate, CustomColors, Overlay } from '../assets/types.js';
export declare class PosterRenderer {
    protected canvas: HTMLCanvasElement;
    protected ctx: CanvasRenderingContext2D;
    protected useHighQualityOverlays: boolean;
    protected processedOverlayCache: Map<number, HTMLCanvasElement>;
    constructor(canvas: HTMLCanvasElement);
    createGradient(w: number, h: number, colors: string[], direction: string): CanvasGradient;
    calculateTextLinesWithBreaks(text: string, maxWidth: number): number;
    wrapTextWithBreaks(text: string, x: number, y: number, maxWidth: number, lineHeight: number, align?: string): number;
    drawCenteredTextWithBreaks(text: string, x: number, y: number, maxWidth: number, lineHeight: number, cellHeight: number, align?: string): number;
    drawCancerDecorations(template: CancerTemplate, scheme: ColorScheme, W: number, H: number): void;
    calculateRequiredHeight(agendaItems: AgendaItem[], showFooter: boolean, footerText: string, W: number): number;
    drawPoster(agendaItems: AgendaItem[], currentTemplate: string, currentColorScheme: string, currentGradientDirection: string, customColors: CustomColors, conferenceData: {
        title: string;
        subtitle: string;
        date: string;
        location: string;
    }, showFooter: boolean, footerText: string, overlays?: Overlay[]): void;
    private drawAgendaTable;
    private drawFooterNote;
    private getActiveColorScheme;
    protected drawOverlays(overlays: Overlay[]): void;
    /**
     * 啟用/停用高品質圖層處理
     * @param enabled - 是否啟用高品質模式
     */
    enableHighQualityOverlays(enabled: boolean): void;
    /**
     * 預處理圖層（高品質處理）
     * @param overlays - 要處理的圖層陣列
     * @param onProgress - 進度回調
     */
    preprocessOverlays(overlays: Overlay[], onProgress?: (processed: number, total: number, currentLayer?: string) => void): Promise<void>;
    /**
     * 導出高品質海報
     * @param format - 輸出格式
     * @param quality - 品質（0-1）
     * @param scaleFactor - 解析度倍數（預設 2 倍）
     */
    exportHighQuality(format?: 'png' | 'jpeg' | 'webp', quality?: number, scaleFactor?: number): Promise<{
        blob: Blob;
        dataURL: string;
        originalSize: {
            width: number;
            height: number;
        };
        highQualitySize: {
            width: number;
            height: number;
        };
    }>;
    /**
     * 取得處理統計資訊
     * @param overlays - 圖層陣列
     */
    getProcessingStats(overlays: Overlay[]): {
        total: number;
        needsProcessing: number;
        processed: number;
        simple: number;
        complex: number;
    };
    /**
     * 清除處理快取
     */
    clearProcessingCache(): void;
    /**
     * 取得快取狀態
     */
    getCacheInfo(): {
        size: number;
        overlayIds: number[];
        memoryUsage: string;
    };
    /**
     * 創建圖層預覽
     * @param overlay - 要預覽的圖層
     * @param size - 預覽尺寸
     */
    createOverlayPreview(overlay: Overlay, size?: number): HTMLCanvasElement;
    /**
     * 渲染高品質海報
     * 需要重新取得海報數據並渲染
     */
    private renderHighQualityPoster;
    /**
     * 從 DOM 或全域狀態取得當前海報數據
     */
    private getCurrentPosterData;
    /**
     * 從 DOM 元素讀取當前海報數據
     */
    private getPosterDataFromDOM;
    /**
     * 輔助方法：從 DOM 取得輸入值
     */
    private getInputValue;
    /**
     * 輔助方法：從 DOM 取得 checkbox 值
     */
    private getCheckboxValue;
}
