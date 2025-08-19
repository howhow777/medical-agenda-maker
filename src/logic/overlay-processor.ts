// 圖層高品質處理器
// 整合圖片處理核心算法，專門處理 Overlay 圖層的高品質渲染

import { Overlay } from '../assets/types.js';
import { 
  TransformCropEngine, 
  CoordinateUtils, 
  Transform, 
  Rectangle, 
  Size, 
  TransformCropParams,
  ProcessOptions 
} from './image-processor/index.js';

/**
 * 圖層處理器 - 專門處理 Overlay 的高品質渲染
 */
export class OverlayProcessor {
  
  /**
   * 將 Overlay 轉換為高品質處理的圖片
   * @param overlay - 要處理的圖層
   * @param options - 處理選項
   */
  static async processOverlay(
    overlay: Overlay, 
    options: {
      outputFormat?: 'png' | 'jpeg' | 'webp';
      quality?: number;
      smoothing?: boolean;
      maxSize?: number; // 最大輸出尺寸限制
    } = {}
  ): Promise<{
    blob: Blob;
    canvas: HTMLCanvasElement;
    processedImg: HTMLImageElement;
  }> {
    
    const {
      outputFormat = 'png',
      quality = 0.95,
      smoothing = true,
      maxSize = 2048
    } = options;
    
    // 1. 準備變形參數
    const transform: Transform = {
      tx: 0, // 在處理時不需要位移（會在最後渲染時處理）
      ty: 0,
      scale: Math.min(overlay.scaleX, overlay.scaleY), // 使用較小的縮放值保持品質
      rot: overlay.rotation
    };
    
    // 2. 計算輸出尺寸
    const naturalSize: Size = {
      w: overlay.img.naturalWidth || overlay.img.width,
      h: overlay.img.naturalHeight || overlay.img.height
    };
    
    // 計算最終輸出尺寸（考慮縮放）
    let outputW = Math.round(overlay.crop.w * overlay.scaleX);
    let outputH = Math.round(overlay.crop.h * overlay.scaleY);
    
    // 限制最大尺寸
    if (maxSize > 0) {
      const scale = Math.min(1, maxSize / Math.max(outputW, outputH));
      outputW = Math.round(outputW * scale);
      outputH = Math.round(outputH * scale);
    }
    
    // 3. 設置虛擬顯示參數（用於座標計算）
    const displaySize: Size = { w: naturalSize.w, h: naturalSize.h };
    const displayOffset = { x: 0, y: 0 };
    
    // 4. 裁切區域（使用原始裁切座標）
    const cropRect: Rectangle = {
      x: overlay.crop.x,
      y: overlay.crop.y, 
      w: overlay.crop.w,
      h: overlay.crop.h
    };
    
    // 5. 處理參數
    const params: TransformCropParams = {
      transform,
      cropRect,
      naturalSize,
      displaySize,
      displayOffset
    };
    
    const processOptions: ProcessOptions = {
      outputFormat,
      quality,
      smoothing
    };
    
    // 6. 執行高品質處理
    const result = await TransformCropEngine.process(overlay.img, params, processOptions);
    
    // 7. 創建處理後的圖片元素
    const processedImg = new Image();
    processedImg.src = result.dataURL;
    
    // 8. 創建 Canvas 供直接使用
    const canvas = document.createElement('canvas');
    canvas.width = result.dimensions.w;
    canvas.height = result.dimensions.h;
    const ctx = canvas.getContext('2d')!;
    
    await new Promise<void>((resolve) => {
      processedImg.onload = () => {
        ctx.drawImage(processedImg, 0, 0);
        resolve();
      };
    });
    
    return {
      blob: result.blob,
      canvas,
      processedImg
    };
  }
  
  /**
   * 批次處理多個圖層
   */
  static async processMultipleOverlays(
    overlays: Overlay[],
    options: {
      outputFormat?: 'png' | 'jpeg' | 'webp';
      quality?: number;
      smoothing?: boolean;
      maxSize?: number;
      onProgress?: (index: number, total: number, currentLayer?: string) => void;
    } = {}
  ): Promise<Array<{
    overlay: Overlay;
    result: {
      blob: Blob;
      canvas: HTMLCanvasElement;
      processedImg: HTMLImageElement;
    };
  }>> {
    
    const results = [];
    
    for (let i = 0; i < overlays.length; i++) {
      const overlay = overlays[i];
      
      if (options.onProgress) {
        options.onProgress(i, overlays.length, overlay.name);
      }
      
      try {
        const result = await this.processOverlay(overlay, options);
        results.push({ overlay, result });
      } catch (error) {
        console.error(`處理圖層 ${overlay.name} 時發生錯誤:`, error);
        // 繼續處理其他圖層
      }
    }
    
    return results;
  }
  
  /**
   * 檢查圖層是否需要高品質處理
   * @param overlay - 要檢查的圖層
   */
  static needsHighQualityProcessing(overlay: Overlay): boolean {
    // 有旋轉
    if (Math.abs(overlay.rotation) > 0.01) return true;
    
    // 有縮放（非 1:1）
    if (Math.abs(overlay.scaleX - 1) > 0.01 || Math.abs(overlay.scaleY - 1) > 0.01) return true;
    
    // 有裁切
    if (overlay.crop.x > 0 || overlay.crop.y > 0 || 
        overlay.crop.w < overlay.w || overlay.crop.h < overlay.h) return true;
    
    // 透明度不是完全不透明
    if (overlay.opacity < 0.99) return false; // 透明度不影響是否需要高品質處理
    
    return false;
  }
  
  /**
   * 創建圖層預覽（低品質，用於即時預覽）
   * @param overlay - 要預覽的圖層
   * @param previewSize - 預覽尺寸限制
   */
  static createPreview(
    overlay: Overlay, 
    previewSize: number = 200
  ): HTMLCanvasElement {
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // 計算預覽尺寸
    const aspect = overlay.w / overlay.h;
    let w, h;
    
    if (aspect > 1) {
      w = previewSize;
      h = previewSize / aspect;
    } else {
      h = previewSize;
      w = previewSize * aspect;
    }
    
    canvas.width = w;
    canvas.height = h;
    
    // 快速渲染（不使用高品質算法）
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(overlay.rotation);
    ctx.scale(overlay.scaleX, overlay.scaleY);
    ctx.globalAlpha = overlay.opacity;
    
    // 繪製裁切區域
    ctx.drawImage(
      overlay.img,
      overlay.crop.x, overlay.crop.y, overlay.crop.w, overlay.crop.h,
      -overlay.crop.w / 2, -overlay.crop.h / 2, overlay.crop.w, overlay.crop.h
    );
    
    ctx.restore();
    
    return canvas;
  }
  
  /**
   * 獲取圖層處理統計
   */
  static getProcessingStats(overlays: Overlay[]): {
    total: number;
    needsProcessing: number;
    simple: number;
    complex: number;
  } {
    let needsProcessing = 0;
    let complex = 0;
    
    overlays.forEach(overlay => {
      if (this.needsHighQualityProcessing(overlay)) {
        needsProcessing++;
        
        // 複雜度判斷：同時有旋轉、縮放、裁切
        const hasRotation = Math.abs(overlay.rotation) > 0.01;
        const hasScaling = Math.abs(overlay.scaleX - 1) > 0.01 || Math.abs(overlay.scaleY - 1) > 0.01;
        const hasCropping = overlay.crop.x > 0 || overlay.crop.y > 0 || 
                          overlay.crop.w < overlay.w || overlay.crop.h < overlay.h;
        
        if ([hasRotation, hasScaling, hasCropping].filter(Boolean).length >= 2) {
          complex++;
        }
      }
    });
    
    return {
      total: overlays.length,
      needsProcessing,
      simple: needsProcessing - complex,
      complex
    };
  }
}
