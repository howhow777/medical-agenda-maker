import { TransformCropEngine } from './transform-crop-engine.js';
import { CoordinateUtils } from './coordinate-utils.js';
import { CropCalculator } from './crop-calculator.js';
import { Transform, Rectangle, Size, CropOptions } from './types.js';
/**
 * 創建簡化的圖片處理器
 * 提供更直觀的 API
 */
export declare function createImageProcessor(): {
    /**
     * 快速處理：載入圖片 → 變形 → 裁切 → 輸出
     */
    quickProcess(imageFile: File, options?: {
        transform?: Partial<Transform>;
        cropRect?: Rectangle;
        containerSize?: Size;
        outputFormat?: "png" | "jpeg" | "webp";
        quality?: number;
    }): Promise<import("./types.js").ProcessResult>;
    /**
     * 創建裁切工具的幫助函數
     */
    createCropHelper(naturalSize: Size, containerSize: Size): {
        layout: {
            size: Size;
            offset: import("./types.js").Point;
        };
        getDefaultCrop(padding?: number): Rectangle;
        constrainCrop(rect: Rectangle, options?: CropOptions): Rectangle;
        handleDrag(startRect: Rectangle, dragType: string, deltaX: number, deltaY: number, options?: CropOptions): Rectangle;
    };
    /**
     * 常用比例預設
     */
    aspectRatios: Record<string, number>;
    /**
     * 工具函數直接導出
     */
    utils: {
        CoordinateUtils: typeof CoordinateUtils;
        CropCalculator: typeof CropCalculator;
        TransformCropEngine: typeof TransformCropEngine;
    };
};
/**
 * 預設導出：已初始化的處理器實例
 */
export declare const imageProcessor: {
    /**
     * 快速處理：載入圖片 → 變形 → 裁切 → 輸出
     */
    quickProcess(imageFile: File, options?: {
        transform?: Partial<Transform>;
        cropRect?: Rectangle;
        containerSize?: Size;
        outputFormat?: "png" | "jpeg" | "webp";
        quality?: number;
    }): Promise<import("./types.js").ProcessResult>;
    /**
     * 創建裁切工具的幫助函數
     */
    createCropHelper(naturalSize: Size, containerSize: Size): {
        layout: {
            size: Size;
            offset: import("./types.js").Point;
        };
        getDefaultCrop(padding?: number): Rectangle;
        constrainCrop(rect: Rectangle, options?: CropOptions): Rectangle;
        handleDrag(startRect: Rectangle, dragType: string, deltaX: number, deltaY: number, options?: CropOptions): Rectangle;
    };
    /**
     * 常用比例預設
     */
    aspectRatios: Record<string, number>;
    /**
     * 工具函數直接導出
     */
    utils: {
        CoordinateUtils: typeof CoordinateUtils;
        CropCalculator: typeof CropCalculator;
        TransformCropEngine: typeof TransformCropEngine;
    };
};
