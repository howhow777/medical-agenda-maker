import { Rectangle, Size, Point } from './types.js';
/**
 * 座標轉換工具類
 * 處理顯示座標系與自然圖片座標系之間的轉換
 */
export declare class CoordinateUtils {
    /**
     * 將顯示座標矩形轉換為自然圖片座標
     * @param displayRect - 顯示座標系中的矩形
     * @param naturalSize - 原圖尺寸
     * @param displaySize - 顯示尺寸
     * @param displayOffset - 顯示偏移量
     */
    static displayToNatural(displayRect: Rectangle, naturalSize: Size, displaySize: Size, displayOffset: Point): Rectangle;
    /**
     * 將自然圖片座標轉換為顯示座標
     */
    static naturalToDisplay(naturalRect: Rectangle, naturalSize: Size, displaySize: Size, displayOffset: Point): Rectangle;
    /**
     * 計算圖片在容器中的最佳顯示尺寸和位置
     * @param naturalSize - 原圖尺寸
     * @param containerSize - 容器尺寸
     * @param margin - 邊距
     */
    static calculateDisplayLayout(naturalSize: Size, containerSize: Size, margin?: number): {
        size: Size;
        offset: Point;
    };
    /**
     * 限制矩形在指定尺寸範圍內
     */
    static clampToSize(rect: Rectangle, bounds: Size): Rectangle;
    /**
     * 計算兩點間距離
     */
    static distance(p1: Point, p2: Point): number;
    /**
     * 計算點到中心的角度 (radians)
     */
    static angleTo(center: Point, point: Point): number;
}
