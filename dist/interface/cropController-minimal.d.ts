import { OverlayManager } from '../logic/overlayManager.js';
export declare class CropController {
    private overlayManager;
    private canvas;
    private updateCallback;
    constructor(canvas: HTMLCanvasElement, overlayManager: OverlayManager, updateCallback: () => void);
    /**
     * 檢查是否處於裁切模式
     */
    isInCropMode(): boolean;
    /**
     * 繪製裁切界面（供posterRenderer調用）
     */
    drawCropInterface(ctx: CanvasRenderingContext2D): void;
}
