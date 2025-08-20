import { PosterRenderer } from '../logic/posterRenderer.js';
import { OverlayManager } from '../logic/overlayManager.js';
/**
 * 高品質功能測試控制器
 */
export declare class HighQualityTestController {
    private posterRenderer;
    private overlayManager;
    private isHighQualityMode;
    private statusElement;
    constructor(posterRenderer: PosterRenderer, overlayManager: OverlayManager);
    /**
     * 初始化測試 UI
     */
    private initializeUI;
    /**
     * 創建狀態顯示
     */
    private createStatusDisplay;
    /**
     * 綁定按鈕事件
     */
    private bindEvents;
    /**
     * 切換高品質模式
     */
    toggleHighQualityMode(): Promise<void>;
    /**
     * 下載高品質版本
     */
    downloadHighQuality(): Promise<void>;
    /**
     * 下載標準版本
     */
    downloadStandard(): Promise<void>;
    /**
     * 顯示處理統計
     */
    showStats(): void;
    /**
     * 預處理圖層
     */
    preprocessLayers(): Promise<void>;
    /**
     * 清除快取
     */
    clearCache(): void;
    /**
     * 更新狀態顯示
     */
    private updateStatus;
    /**
     * 觸發海報更新
     */
    private triggerPosterUpdate;
    /**
     * 取得當前模式
     */
    getHighQualityMode(): boolean;
}
