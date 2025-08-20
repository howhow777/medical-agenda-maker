import { Overlay } from '../assets/types.js';
export declare class OverlayManager {
    private overlays;
    private selectedIndex;
    private canvas;
    constructor(canvas: HTMLCanvasElement);
    getOverlays(): Overlay[];
    getSelectedIndex(): number;
    setSelectedIndex(index: number): void;
    getSelectedOverlay(): Overlay | null;
    addOverlay(img: HTMLImageElement, name: string, src: string): Overlay;
    removeOverlay(index: number): void;
    removeSelectedOverlay(): void;
    clearOverlays(): void;
    bringToFront(index: number): void;
    bringForward(index: number): void;
    sendBackward(index: number): void;
    sendToBack(index: number): void;
    centerSelectedOverlay(): void;
    resetSelectedOverlay(): void;
    getOverlaySize(overlay: Overlay): {
        w: number;
        h: number;
    };
    toLocal(overlay: Overlay, point: {
        x: number;
        y: number;
    }): {
        x: number;
        y: number;
    };
    toGlobal(overlay: Overlay, localPoint: {
        x: number;
        y: number;
    }): {
        x: number;
        y: number;
    };
    getHandlePositions(overlay: Overlay): Array<{
        name: string;
        x: number;
        y: number;
    }>;
    getRotateHandle(overlay: Overlay): {
        name: string;
        x: number;
        y: number;
    };
    hitTest(point: {
        x: number;
        y: number;
    }): {
        idx: number;
        hit: string;
        handle?: string;
    };
    drawOverlay(ctx: CanvasRenderingContext2D, overlay: Overlay, isSelected: boolean): void;
    drawAllOverlays(ctx: CanvasRenderingContext2D): void;
    private drawOverlayControls;
    scaleOverlay(index: number, scaleX: number, scaleY: number): void;
    moveOverlay(index: number, x: number, y: number): void;
    rotateOverlay(index: number, rotation: number): void;
    /**
     * 檢查圖層是否需要高品質處理
     * @param overlay - 要檢查的圖層
     */
    needsHighQualityProcessing(overlay: Overlay): boolean;
    /**
     * 取得所有需要高品質處理的圖層
     */
    getLayersNeedingProcessing(): Overlay[];
    /**
     * 取得處理統計
     */
    getProcessingStats(): {
        total: number;
        needsProcessing: number;
        simple: number;
        complex: number;
    };
    /**
     * 創建圖層預覽
     * @param index - 圖層索引
     * @param size - 預覽尺寸
     */
    createOverlayPreview(index: number, size?: number): HTMLCanvasElement | null;
    /**
     * 創建選中圖層的預覽
     * @param size - 預覽尺寸
     */
    createSelectedOverlayPreview(size?: number): HTMLCanvasElement | null;
    /**
     * 批次處理所有圖層
     * @param onProgress - 進度回調
     */
    processAllOverlays(onProgress?: (processed: number, total: number, currentLayer?: string) => void): Promise<Array<{
        overlay: Overlay;
        result: {
            blob: Blob;
            canvas: HTMLCanvasElement;
            processedImg: HTMLImageElement;
        };
    }>>;
}
