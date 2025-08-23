import { OverlayManager } from '../logic/overlayManager.js';
export declare class CropController {
    private overlayManager;
    private canvas;
    private updateCallback;
    constructor(canvas: HTMLCanvasElement, overlayManager: OverlayManager, updateCallback: () => void);
    isInCropMode(): boolean;
    drawCropInterface(ctx: CanvasRenderingContext2D): void;
}
