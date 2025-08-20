import { Rectangle, CropOptions } from './types.js';
/**
 * 裁切計算工具類
 * 處理裁切框的約束、比例鎖定等邏輯
 */
export declare class CropCalculator {
    /**
     * 約束裁切矩形在邊界內，並應用比例鎖定
     * @param rect - 原始矩形
     * @param bounds - 邊界限制
     * @param options - 裁切選項
     */
    static constrainRect(rect: Rectangle, bounds: Rectangle, options?: CropOptions): Rectangle;
    /**
     * 根據拖拽操作調整裁切矩形
     * @param startRect - 開始時的矩形
     * @param dragType - 拖拽類型 ('move', 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w')
     * @param deltaX - X軸移動距離
     * @param deltaY - Y軸移動距離
     * @param bounds - 邊界限制
     * @param options - 裁切選項
     */
    static applyDrag(startRect: Rectangle, dragType: string, deltaX: number, deltaY: number, bounds: Rectangle, options?: CropOptions): Rectangle;
    /**
     * 計算預設的裁切矩形（通常是圖片中央的80%區域）
     */
    static getDefaultCropRect(imageBounds: Rectangle, padding?: number): Rectangle;
    /**
     * 檢查矩形是否有效
     */
    static isValidRect(rect: Rectangle): boolean;
    /**
     * 計算常見比例的預設值
     */
    static getCommonAspectRatios(): Record<string, number>;
}
