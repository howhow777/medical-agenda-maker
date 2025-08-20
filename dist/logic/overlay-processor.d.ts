import { Overlay } from '../assets/types.js';
/**
 * 圖層處理器 - 專門處理 Overlay 的高品質渲染
 */
export declare class OverlayProcessor {
    /**
     * 將 Overlay 轉換為高品質處理的圖片
     * @param overlay - 要處理的圖層
     * @param options - 處理選項
     */
    static processOverlay(overlay: Overlay, options?: {
        outputFormat?: 'png' | 'jpeg' | 'webp';
        quality?: number;
        smoothing?: boolean;
        maxSize?: number;
    }): Promise<{
        blob: Blob;
        canvas: HTMLCanvasElement;
        processedImg: HTMLImageElement;
    }>;
    /**
     * 批次處理多個圖層
     */
    static processMultipleOverlays(overlays: Overlay[], options?: {
        outputFormat?: 'png' | 'jpeg' | 'webp';
        quality?: number;
        smoothing?: boolean;
        maxSize?: number;
        onProgress?: (index: number, total: number, currentLayer?: string) => void;
    }): Promise<Array<{
        overlay: Overlay;
        result: {
            blob: Blob;
            canvas: HTMLCanvasElement;
            processedImg: HTMLImageElement;
        };
    }>>;
    /**
     * 檢查圖層是否需要高品質處理
     * @param overlay - 要檢查的圖層
     */
    static needsHighQualityProcessing(overlay: Overlay): boolean;
    /**
     * 創建圖層預覽（低品質，用於即時預覽）
     * @param overlay - 要預覽的圖層
     * @param previewSize - 預覽尺寸限制
     */
    static createPreview(overlay: Overlay, previewSize?: number): HTMLCanvasElement;
    /**
     * 獲取圖層處理統計
     */
    static getProcessingStats(overlays: Overlay[]): {
        total: number;
        needsProcessing: number;
        simple: number;
        complex: number;
    };
}
