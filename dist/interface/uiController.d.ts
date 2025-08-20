/**
 * UI 主控制器 - 協調所有模組的核心控制器
 */
import { AppState } from '../assets/types.js';
export declare class UIController {
    private appState;
    private dragState;
    private cropperState;
    private canvasInteractions;
    private formControls;
    private overlayManager;
    private posterRenderer;
    private dataManager;
    private highQualityTest;
    private templateController;
    private canvas;
    private ctx;
    constructor();
    /**
     * 初始化整個應用程式
     */
    initialize(): Promise<void>;
    /**
     * 初始化所有模組
     */
    private initializeModules;
    /**
     * 綁定所有事件
     */
    private bindEvents;
    /**
     * 綁定全域事件
     */
    private bindGlobalEvents;
    /**
     * 綁定檔案相關事件
     */
    private bindFileEvents;
    /**
     * 載入初始資料
     */
    private loadInitialData;
    /**
     * 更新海報
     */
    updatePoster(): void;
    /**
     * 取得會議資料
     */
    private getConferenceData;
    /**
     * 取得頁尾註解文字
     */
    private getFooterText;
    /**
     * 下載海報
     */
    downloadPoster(): void;
    /**
     * 重新整理圖層列表
     */
    refreshOverlayList(): void;
    /**
     * 同步圖層控制項
     */
    syncOverlayControls(): void;
    /**
     * 渲染圖層控制框
     */
    private renderOverlayControls;
    /**
     * 只渲染控制點（不渲染圖層本體）
     */
    private renderOverlayHandles;
    /**
     * 取得應用狀態（供外部存取）
     */
    getAppState(): AppState;
}
