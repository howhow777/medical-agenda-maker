import { OverlayManager } from '../logic/overlayManager.js';
export declare class CanvasInteractions {
    private canvas;
    private updateCallback;
    private syncOverlayControlsCallback;
    private refreshOverlayListCallback;
    private overlayManager;
    private touchDebug;
    private drag;
    constructor(canvas: HTMLCanvasElement, overlayManager: OverlayManager, updateCallback: () => void, syncOverlayControlsCallback: () => void, refreshOverlayListCallback: () => void);
    bindEvents(): void;
    private onTouchStart;
    private onTouchMove;
    private handleScaling;
    private onTouchEnd;
    private canvasPointFromTouch;
    private canvasPointFromMouse;
    private onMouseDown;
    private onMouseMove;
    private onMouseUp;
    private onWheel;
    private canvasPoint;
}
