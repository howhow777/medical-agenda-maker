// 裁切區域計算工具

import { Rectangle, Size, CropOptions } from './types.js';

/**
 * 裁切計算工具類
 * 處理裁切框的約束、比例鎖定等邏輯
 */
export class CropCalculator {

  /**
   * 約束裁切矩形在邊界內，並應用比例鎖定
   * @param rect - 原始矩形
   * @param bounds - 邊界限制
   * @param options - 裁切選項
   */
  static constrainRect(
    rect: Rectangle,
    bounds: Rectangle,
    options: CropOptions = {}
  ): Rectangle {
    const { aspectRatio, minSize = 16, keepAspect = false } = options;
    
    let { x, y, w, h } = rect;
    
    // 應用最小尺寸限制
    w = Math.max(minSize, w);
    h = Math.max(minSize, h);
    
    // 如果需要保持比例
    if (keepAspect && aspectRatio && aspectRatio > 0) {
      const currentRatio = w / h;
      if (Math.abs(currentRatio - aspectRatio) > 0.01) {
        // 調整尺寸以符合比例
        if (currentRatio > aspectRatio) {
          // 當前太寬，調整高度
          h = w / aspectRatio;
        } else {
          // 當前太高，調整寬度
          w = h * aspectRatio;
        }
      }
    }
    
    // 確保不超出邊界
    if (x + w > bounds.x + bounds.w) {
      if (keepAspect && aspectRatio) {
        // 保持比例時，從右邊界回推
        w = bounds.x + bounds.w - x;
        h = w / aspectRatio;
      } else {
        w = bounds.x + bounds.w - x;
      }
    }
    
    if (y + h > bounds.y + bounds.h) {
      if (keepAspect && aspectRatio) {
        // 保持比例時，從下邊界回推
        h = bounds.y + bounds.h - y;
        w = h * aspectRatio;
      } else {
        h = bounds.y + bounds.h - y;
      }
    }
    
    // 確保位置不超出邊界
    x = Math.max(bounds.x, Math.min(x, bounds.x + bounds.w - w));
    y = Math.max(bounds.y, Math.min(y, bounds.y + bounds.h - h));
    
    // 最終檢查最小尺寸
    w = Math.max(minSize, w);
    h = Math.max(minSize, h);
    
    return { x, y, w, h };
  }

  /**
   * 根據拖拽操作調整裁切矩形
   * @param startRect - 開始時的矩形
   * @param dragType - 拖拽類型 ('move', 'nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w')
   * @param deltaX - X軸移動距離
   * @param deltaY - Y軸移動距離
   * @param bounds - 邊界限制
   * @param options - 裁切選項
   */
  static applyDrag(
    startRect: Rectangle,
    dragType: string,
    deltaX: number,
    deltaY: number,
    bounds: Rectangle,
    options: CropOptions = {}
  ): Rectangle {
    let { x, y, w, h } = { ...startRect };
    const { aspectRatio, keepAspect = false } = options;
    
    if (dragType === 'move') {
      // 移動整個矩形
      x += deltaX;
      y += deltaY;
    } else {
      // 調整大小
      const resizeMap: Record<string, () => void> = {
        'n':  () => { y += deltaY; h -= deltaY; },
        's':  () => { h += deltaY; },
        'w':  () => { x += deltaX; w -= deltaX; },
        'e':  () => { w += deltaX; },
        'nw': () => { x += deltaX; w -= deltaX; y += deltaY; h -= deltaY; },
        'ne': () => { y += deltaY; h -= deltaY; w += deltaX; },
        'sw': () => { x += deltaX; w -= deltaX; h += deltaY; },
        'se': () => { w += deltaX; h += deltaY; }
      };
      
      resizeMap[dragType]?.();
      
      // 如果需要保持比例且是角落拖拽
      if (keepAspect && aspectRatio && /^(nw|ne|sw|se)$/.test(dragType)) {
        const centerX = startRect.x + startRect.w / 2;
        const centerY = startRect.y + startRect.h / 2;
        
        // 根據拖拽距離調整尺寸
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          h = Math.abs(w) / aspectRatio;
        } else {
          w = Math.abs(h) * aspectRatio;
        }
        
        // 重新定位以保持中心
        x = centerX - w / 2;
        y = centerY - h / 2;
      }
    }
    
    // 應用約束
    return this.constrainRect({ x, y, w, h }, bounds, options);
  }

  /**
   * 計算預設的裁切矩形（通常是圖片中央的80%區域）
   */
  static getDefaultCropRect(imageBounds: Rectangle, padding: number = 0.1): Rectangle {
    const padW = imageBounds.w * padding;
    const padH = imageBounds.h * padding;
    
    return {
      x: imageBounds.x + padW,
      y: imageBounds.y + padH,
      w: imageBounds.w - padW * 2,
      h: imageBounds.h - padH * 2
    };
  }

  /**
   * 檢查矩形是否有效
   */
  static isValidRect(rect: Rectangle): boolean {
    return rect.w > 0 && rect.h > 0 && 
           isFinite(rect.x) && isFinite(rect.y) && 
           isFinite(rect.w) && isFinite(rect.h);
  }

  /**
   * 計算常見比例的預設值
   */
  static getCommonAspectRatios(): Record<string, number> {
    return {
      'free': 0,
      '1:1': 1,
      '4:3': 4/3,
      '3:4': 3/4,
      '16:9': 16/9,
      '9:16': 9/16,
      '3:2': 3/2,
      '2:3': 2/3
    };
  }
}
