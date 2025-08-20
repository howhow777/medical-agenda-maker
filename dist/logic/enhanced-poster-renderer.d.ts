import { PosterRenderer } from './posterRenderer.js';
import { Overlay, AgendaItem, CustomColors } from '../assets/types.js';
/**
 * 增強版海報渲染器
 * 在原有功能基礎上整合高品質圖片處理
 */
export declare class EnhancedPosterRenderer extends PosterRenderer {
    private highQualityMode;
    private processedOverlays;
    /**
     * 設置高品質模式
     * @param enabled - 是否啟用高品質模式
     */
    setHighQualityMode(enabled: boolean): void;
    /**
     * 獲取高品質模式狀態
     */
    getHighQualityMode(): boolean;
    /**
     * 預處理所有圖層（批次高品質處理）
     * @param overlays - 要處理的圖層陣列
     * @param onProgress - 進度回調
     */
    preprocessOverlays(overlays: Overlay[], onProgress?: (processed: number, total: number, currentLayer?: string) => void): Promise<void>;
    /**
     * 渲染單個圖層（使用高品質處理或標準處理）
     * @param overlay - 要渲染的圖層
     * @param ctx - Canvas 上下文
     */
    private renderOverlay;
    /**
     * 渲染所有圖層（覆寫父類方法以使用高品質處理）
     * @param overlays - 圖層陣列
     */
    protected drawOverlays(overlays: Overlay[]): void;
    /**
     * 增強版海報繪製（支援高品質模式）
     * 保持與原版相同的 API，但內部使用高品質處理
     */
    drawPosterEnhanced(agendaItems: AgendaItem[], currentTemplate: string, currentColorScheme: string, currentGradientDirection: string, customColors: CustomColors, conferenceData: {
        title: string;
        subtitle: string;
        date: string;
        location: string;
    }, showFooter: boolean, footerText: string, overlays?: Overlay[], options?: {
        preprocess?: boolean;
        onProgress?: (processed: number, total: number, stage: string) => void;
    }): Promise<void>;
    /**
     * 導出高品質海報（覆寫基類方法）
     * @param format - 輸出格式
     * @param quality - 品質（0-1）
     * @param scaleFactor - 解析度倍數
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
     * 導出高品質海報並指定檔名
     * @param format - 輸出格式
     * @param quality - 品質（0-1）
     * @param filename - 檔案名稱
     */
    exportHighQualityWithFilename(format?: 'png' | 'jpeg' | 'webp', quality?: number, filename?: string): Promise<{
        blob: Blob;
        dataURL: string;
        filename: string;
    }>;
    /**
     * 獲取處理統計資訊
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
     * 獲取快取狀態
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
}
