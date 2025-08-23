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
 * 裁切控制器 - 階段2：完整拖拉功能
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
     * 綁定基本事件監聽
     */
    private bindEvents;
    /**
     * 綁定裁切專用的拖拉事件 (新功能)
     */
    private bindCropEvents;
    /**
     * 裁切模式滑鼠按下事件
     */
    private onCropMouseDown;
    /**
     * 裁切模式滑鼠移動事件
     */
    private onCropMouseMove;
    /**
     * 裁切模式滑鼠釋放事件
     */
    private onCropMouseUp;
    /**
     * 裁切模式觸控開始事件
     */
    private onCropTouchStart;
    /**
     * 裁切模式觸控移動事件
     */
    private onCropTouchMove;
    /**
     * 裁切模式觸控結束事件
     */
    private onCropTouchEnd;
    /**
     * 裁切推桿碰撞檢測
     */
    private cropHitTest;
    /**
     * 獲取裁切推桿位置
     */
    private getCropHandles;
    /**
     * 更新裁切區域
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
     * 觸控座標轉換
     */
    private canvasPointFromTouch;
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
     * 獲取當前裁切狀態
     */
    getCropState(): Readonly<CropState>;
    /**
     * 繪製裁切界面 - 增強版
     */
    drawCropInterface(ctx: CanvasRenderingContext2D): void;
}
export {};
