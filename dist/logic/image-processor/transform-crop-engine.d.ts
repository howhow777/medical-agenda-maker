import { Transform, Size, TransformCropParams, ProcessResult, ProcessOptions } from './types.js';
/**
 * 圖片變形+裁切處理引擎
 * 核心算法：先套用變形（旋轉、縮放、位移），然後裁切指定區域
 */
export declare class TransformCropEngine {
    /**
     * 處理圖片：套用變形並裁切
     * @param image - 圖片元素或 ImageBitmap
     * @param params - 變形和裁切參數
     * @param options - 輸出選項
     */
    static process(image: HTMLImageElement | ImageBitmap, params: TransformCropParams, options?: ProcessOptions): Promise<ProcessResult>;
    /**
     * 從檔案載入圖片
     */
    static loadImageFromFile(file: File): Promise<HTMLImageElement>;
    /**
     * 從 URL 載入圖片
     */
    static loadImageFromUrl(url: string): Promise<HTMLImageElement>;
    /**
     * 獲取圖片的自然尺寸
     */
    static getImageNaturalSize(image: HTMLImageElement | ImageBitmap): Size;
    /**
     * 創建預設變形狀態
     */
    static createDefaultTransform(): Transform;
    /**
     * 驗證變形參數
     */
    static validateTransform(transform: Transform): Transform;
    /**
     * Canvas 轉 Blob（支援不同格式）
     */
    private static canvasToBlob;
    /**
     * 批次處理多張圖片
     */
    static processMultiple(images: (HTMLImageElement | File)[], paramsList: TransformCropParams[], options?: ProcessOptions): Promise<ProcessResult[]>;
}
