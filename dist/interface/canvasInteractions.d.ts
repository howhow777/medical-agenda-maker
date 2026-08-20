import { OverlayManager } from '../logic/overlayManager.js';
export declare function isTapGesture(start: {
    x: number;
    y: number;
}, end: {
    x: number;
    y: number;
}, threshold?: number): boolean;
export declare function getPinchScale(startDistance: number, currentDistance: number): number;
export declare function clampPosterViewZoom(value: number): number;
export declare class CanvasInteractions {
    private canvas;
    private updateCallback;
    private syncOverlayControlsCallback;
    private refreshOverlayListCallback;
    private overlayManager;
    private touchDebug;
    private drag;
    private outsideTouchStart;
    private outsideTouchMoved;
    private outsideMouseStart;
    private outsideMouseMoved;
    private pinch;
    private viewZoom;
    private eventsBound;
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
    private beginPinch;
    private midpoint;
    private clampScale;
    private canvasPointFromClient;
    private applyViewZoomAtAnchor;
    private applyViewZoom;
    private onDocumentClick;
    getViewZoom(): number;
}
