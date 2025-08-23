import { OverlayManager } from '../logic/overlayManager.js';
interface CropState {
    isActive: boolean;
    selectedIndex: number;
    cropRect: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    isDragging: boolean;
    dragHandle: string | null;
    dragStart: {
        x: number;
        y: number;
    };
    originalRect: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
}
/**
 * 裁切控制器 - 完整功能版本
 */
export declare class CropController {
    private overlayManager;
    private canvas;
    private updateCallback;
    private cropState;
    private cropToggleBtn;
    private cropApplyBtn;
    private cropCancelBtn;
    constructor(canvas: HTMLCanvasElement, overlayManager: OverlayManager, updateCallback: () => void);
    /**
     * 初始化裁切UI按鈕
     */
    private initializeUI;
    /**
     * 綁定事件監聽
     */
    private bindEvents;
    /**
     * 監聽PNG選取狀態變化
     */
    private setupOverlaySelectionListener;
    /**
     * 切換裁切模式
     */
    private toggleCropMode;
    /**
     * 進入裁切模式
     */
    private enterCropMode;
    /**
     * 退出裁切模式
     */
    private exitCropMode;
    /**
     * 套用裁切
     */
    private applyCrop;
    /**
     * 取消裁切
     */
    private cancelCrop;
    /**
     * 更新裁切模式的UI狀態
     */
    private updateCropUI;
    /**
     * 檢查是否處於裁切模式
     */
    isInCropMode(): boolean;
    /**
     * 獲取當前裁切狀態（供外部系統使用）
     */
    getCropState(): Readonly<CropState>;
    /**
     * 繪製裁切界面（供posterRenderer調用）
     */
    drawCropInterface(ctx: CanvasRenderingContext2D): void;
}
export {};
