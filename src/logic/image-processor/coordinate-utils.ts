// 座標系統轉換工具

import { Rectangle, Size, Point } from './types.js';

/**
 * 座標轉換工具類
 * 處理顯示座標系與自然圖片座標系之間的轉換
 */
export class CoordinateUtils {
  
  /**
   * 將顯示座標矩形轉換為自然圖片座標
   * @param displayRect - 顯示座標系中的矩形
   * @param naturalSize - 原圖尺寸
   * @param displaySize - 顯示尺寸
   * @param displayOffset - 顯示偏移量
   */
  static displayToNatural(
    displayRect: Rectangle,
    naturalSize: Size,
    displaySize: Size,
    displayOffset: Point
  ): Rectangle {
    const scaleX = naturalSize.w / displaySize.w;
    const scaleY = naturalSize.h / displaySize.h;
    
    const x = Math.round((displayRect.x - displayOffset.x) * scaleX);
    const y = Math.round((displayRect.y - displayOffset.y) * scaleY);
    const w = Math.round(displayRect.w * scaleX);
    const h = Math.round(displayRect.h * scaleY);
    
    // 邊界限制
    return this.clampToSize({
      x: Math.max(0, x),
      y: Math.max(0, y),
      w: Math.max(1, Math.min(w, naturalSize.w - Math.max(0, x))),
      h: Math.max(1, Math.min(h, naturalSize.h - Math.max(0, y)))
    }, naturalSize);
  }

  /**
   * 將自然圖片座標轉換為顯示座標
   */
  static naturalToDisplay(
    naturalRect: Rectangle,
    naturalSize: Size,
    displaySize: Size,
    displayOffset: Point
  ): Rectangle {
    const scaleX = displaySize.w / naturalSize.w;
    const scaleY = displaySize.h / naturalSize.h;
    
    return {
      x: displayOffset.x + naturalRect.x * scaleX,
      y: displayOffset.y + naturalRect.y * scaleY,
      w: naturalRect.w * scaleX,
      h: naturalRect.h * scaleY
    };
  }

  /**
   * 計算圖片在容器中的最佳顯示尺寸和位置
   * @param naturalSize - 原圖尺寸
   * @param containerSize - 容器尺寸
   * @param margin - 邊距
   */
  static calculateDisplayLayout(
    naturalSize: Size,
    containerSize: Size,
    margin: number = 24
  ): { size: Size; offset: Point } {
    const maxW = Math.max(0, containerSize.w - margin * 2);
    const maxH = Math.max(0, containerSize.h - margin * 2);
    
    const imageRatio = naturalSize.w / naturalSize.h;
    const containerRatio = maxW / maxH;
    
    let displayW: number, displayH: number;
    
    if (imageRatio > containerRatio) {
      // 圖片較寬，以寬度為準
      displayW = Math.min(maxW, naturalSize.w);
      displayH = displayW / imageRatio;
    } else {
      // 圖片較高，以高度為準
      displayH = Math.min(maxH, naturalSize.h);
      displayW = displayH * imageRatio;
    }
    
    const offsetX = (containerSize.w - displayW) / 2;
    const offsetY = (containerSize.h - displayH) / 2;
    
    return {
      size: { w: displayW, h: displayH },
      offset: { x: offsetX, y: offsetY }
    };
  }

  /**
   * 限制矩形在指定尺寸範圍內
   */
  static clampToSize(rect: Rectangle, bounds: Size): Rectangle {
    const clamp = (value: number, min: number, max: number) => 
      Math.min(Math.max(value, min), max);
    
    return {
      x: clamp(rect.x, 0, bounds.w - 1),
      y: clamp(rect.y, 0, bounds.h - 1),
      w: clamp(rect.w, 1, bounds.w - rect.x),
      h: clamp(rect.h, 1, bounds.h - rect.y)
    };
  }

  /**
   * 計算兩點間距離
   */
  static distance(p1: Point, p2: Point): number {
    return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  }

  /**
   * 計算點到中心的角度 (radians)
   */
  static angleTo(center: Point, point: Point): number {
    return Math.atan2(point.y - center.y, point.x - center.x);
  }
}