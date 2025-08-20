import { OverlayManager } from '../logic/overlayManager.js';
export declare class CanvasInteractions {
    private canvas;
    private updateCallback;
    private syncOverlayControlsCallback;
    private refreshOverlayListCallback;
    private overlayManager;
    private drag;
    constructor(canvas: HTMLCanvasElement, overlayManager: OverlayManager, updateCallback: () => void, syncOverlayControlsCallback: () => void, refreshOverlayListCallback: () => void);
    bindEvents(): void;
    private onPointerDown;
    private onPointerMove;
    private handleScaling;
    private onPointerUp;
    private onWheel;
    private canvasPoint;
}
