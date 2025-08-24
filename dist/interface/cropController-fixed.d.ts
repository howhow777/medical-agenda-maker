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
 * 裁切控制器 - Bug修復版本
 */
export declare class CropController {
    private overlayManager;
    private canvas;
    private updateCallback;
    private cropState;
    private cropToggleBtn;
    private cropApplyBtn;
    private cropCancelBtn;
    private cropMouseDown;
    private cropMouseMove;
    private cropMouseUp;
    constructor(canvas: HTMLCanvasElement, overlayManager: OverlayManager, updateCallback: () => void);
    /**
     * 初始化裁切UI按鈕
     */
    private initializeUI;
    /**
     * 綁定基本事件監聽
     */
    private bindEvents;
    /**
     * 動態綁定裁切事件 - 只在裁切模式時啟用
     */
    private bindCropEvents;
    /**
     * 移除裁切事件 - 退出裁切模式時清理
     */
    private unbindCropEvents;
    /**
     * 裁切模式滑鼠按下事件 - 修復版本
     */
    private onCropMouseDown;
    /**
     * 裁切模式滑鼠移動事件 - 修復版本
     */
    private onCropMouseMove;
    /**
     * 裁切模式滑鼠釋放事件 - 修復版本
     */
    private onCropMouseUp;
    /**
     * 裁切推桿碰撞檢測 - 修復推桿位置計算
     */
    private cropHitTest;
    /**
     * 獲取裁切推桿位置 - 修復計算邏輯
     */
    private getCropHandles;
    /**
     * 更新裁切區域 - 修復拖拉邏輯
     */
    private updateCropRect;
    /**
     * 獲取推桿對應的游標樣式
     */
    private getCursorForHandle;
    /**
     * 座標轉換：本地 → 全域
     */
    private transformPoint;
    /**
     * 座標轉換：全域 → 本地
     */
    private inverseTransformPoint;
    /**
     * 滑鼠座標轉換
     */
    private canvasPointFromMouse;
    /**
     * 監聽PNG選取狀態變化
     */
    private setupOverlaySelectionListener;
    /**
     * 切換裁切模式
     */
    private toggleCropMode;
    /**
     * 進入裁切模式 - 修復版本
     */
    private enterCropMode;
    /**
     * 退出裁切模式 - 修復版本
     */
    private exitCropMode;
    /**
     * 套用裁切
     */
    private applyCrop;
    /**
     * 執行圖片裁切處理
     */
    private cropImageData;
    /**
     * 執行Canvas裁切操作
     */
    private performCrop;
    /**
     * 更新overlay為裁切後的圖片
     */
    private updateOverlayWithCroppedImage;
    /**
     * 設定載入中狀態
     */
    private setLoadingState;
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
     * 獲取當前裁切狀態
     */
    getCropState(): Readonly<CropState>;
    /**
     * 繪製裁切界面 - 修復渲染問題
     */
    drawCropInterface(ctx: CanvasRenderingContext2D): void;
}
export {};
