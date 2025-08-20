/**
 * Canvas 工具類
 */
export declare class CanvasUtils {
    /**
     * 創建高品質 Canvas 上下文
     * @param canvas - Canvas 元素
     * @param options - 渲染選項
     */
    static createHighQualityContext(canvas: HTMLCanvasElement, options?: {
        alpha?: boolean;
        smoothing?: boolean;
        smoothingQuality?: 'low' | 'medium' | 'high';
    }): CanvasRenderingContext2D;
    /**
     * 優化 Canvas 尺寸（考慮設備像素比）
     * @param canvas - Canvas 元素
     * @param width - 邏輯寬度
     * @param height - 邏輯高度
     * @param pixelRatio - 像素比（默認自動檢測）
     */
    static optimizeCanvasSize(canvas: HTMLCanvasElement, width: number, height: number, pixelRatio?: number): void;
    /**
     * 創建離屏 Canvas
     * @param width - 寬度
     * @param height - 高度
     * @param options - 選項
     */
    static createOffscreenCanvas(width: number, height: number, options?: {
        alpha?: boolean;
        smoothing?: boolean;
        smoothingQuality?: 'low' | 'medium' | 'high';
    }): {
        canvas: HTMLCanvasElement;
        ctx: CanvasRenderingContext2D;
    };
    /**
     * Canvas 轉 Blob（支援不同格式和品質）
     * @param canvas - Canvas 元素
     * @param format - 輸出格式
     * @param quality - 品質（0-1）
     */
    static canvasToBlob(canvas: HTMLCanvasElement, format?: 'png' | 'jpeg' | 'webp', quality?: number): Promise<Blob>;
    /**
     * Canvas 轉 DataURL（支援不同格式和品質）
     */
    static canvasToDataURL(canvas: HTMLCanvasElement, format?: 'png' | 'jpeg' | 'webp', quality?: number): string;
    /**
     * 複製 Canvas
     * @param sourceCanvas - 來源 Canvas
     * @param targetCanvas - 目標 Canvas（可選，會自動創建）
     */
    static cloneCanvas(sourceCanvas: HTMLCanvasElement, targetCanvas?: HTMLCanvasElement): HTMLCanvasElement;
    /**
     * 清除 Canvas
     * @param canvas - Canvas 元素
     * @param fillColor - 填充顏色（可選）
     */
    static clearCanvas(canvas: HTMLCanvasElement, fillColor?: string): void;
    /**
     * 獲取 Canvas 的實際渲染尺寸
     * @param canvas - Canvas 元素
     */
    static getActualSize(canvas: HTMLCanvasElement): {
        width: number;
        height: number;
        ratio: number;
    };
    /**
     * 將圖片繪製到 Canvas 中央
     * @param ctx - Canvas 上下文
     * @param img - 圖片元素
     * @param maxWidth - 最大寬度
     * @param maxHeight - 最大高度
     * @param maintainAspect - 是否保持長寬比
     */
    static drawImageCentered(ctx: CanvasRenderingContext2D, img: HTMLImageElement | HTMLCanvasElement, maxWidth: number, maxHeight: number, maintainAspect?: boolean): void;
    /**
     * 創建圓角矩形路徑
     * @param ctx - Canvas 上下文
     * @param x - X 座標
     * @param y - Y 座標
     * @param width - 寬度
     * @param height - 高度
     * @param radius - 圓角半徑
     */
    static roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void;
    /**
     * 檢測瀏覽器支援的圖片格式
     */
    static getSupportedFormats(): {
        png: boolean;
        jpeg: boolean;
        webp: boolean;
        avif: boolean;
    };
    /**
     * 獲取最佳輸出格式
     * @param hasTransparency - 是否有透明度
     * @param preferQuality - 是否偏好品質而非檔案大小
     */
    static getBestFormat(hasTransparency?: boolean, preferQuality?: boolean): 'png' | 'jpeg' | 'webp';
}
