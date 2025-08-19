// 圖片變形+裁切核心引擎

import { 
  Transform, 
  Rectangle, 
  Size, 
  Point, 
  TransformCropParams, 
  ProcessResult, 
  ProcessOptions 
} from './types.js';
import { CoordinateUtils } from './coordinate-utils.js';

/**
 * 圖片變形+裁切處理引擎
 * 核心算法：先套用變形（旋轉、縮放、位移），然後裁切指定區域
 */
export class TransformCropEngine {
  
  /**
   * 處理圖片：套用變形並裁切
   * @param image - 圖片元素或 ImageBitmap
   * @param params - 變形和裁切參數
   * @param options - 輸出選項
   */
  static async process(
    image: HTMLImageElement | ImageBitmap,
    params: TransformCropParams,
    options: ProcessOptions = {}
  ): Promise<ProcessResult> {
    
    const {
      outputFormat = 'png',
      quality = 0.95,
      smoothing = true,
      backgroundColor = '#ffffff'
    } = options;
    
    // 計算實際裁切區域（自然座標）
    const actualCropRect = CoordinateUtils.displayToNatural(
      params.cropRect,
      params.naturalSize,
      params.displaySize,
      params.displayOffset
    );
    
    // 計算輸出尺寸（基於顯示座標的裁切區域）
    const scaleToNatural = params.naturalSize.w / params.displaySize.w;
    const outputWidth = Math.max(1, Math.round(params.cropRect.w * scaleToNatural));
    const outputHeight = Math.max(1, Math.round(params.cropRect.h * scaleToNatural));
    
    // 創建 Canvas
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    
    const ctx = canvas.getContext('2d', { alpha: outputFormat === 'png' });
    if (!ctx) {
      throw new Error('無法創建 Canvas 上下文');
    }
    
    // 設置渲染品質
    ctx.imageSmoothingEnabled = smoothing;
    if (smoothing) {
      ctx.imageSmoothingQuality = 'high';
    }
    
    // 如果是 JPEG 格式，填充背景色
    if (outputFormat === 'jpeg') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, outputWidth, outputHeight);
    }
    
    // === 核心變形+裁切算法 ===
    
    // 1) 縮放輸出座標到顯示像素空間
    ctx.scale(scaleToNatural, scaleToNatural);
    
    // 2) 將裁切區域對齊到原點
    ctx.translate(-params.cropRect.x, -params.cropRect.y);
    
    // 3) 移動到圖片顯示中心，套用變形
    const displayCenterX = params.displayOffset.x + params.displaySize.w / 2;
    const displayCenterY = params.displayOffset.y + params.displaySize.h / 2;
    
    ctx.translate(
      displayCenterX + params.transform.tx,
      displayCenterY + params.transform.ty
    );
    
    // 4) 套用旋轉和縮放
    ctx.rotate(params.transform.rot);
    ctx.scale(params.transform.scale, params.transform.scale);
    
    // 5) 繪製圖片（以中心為原點）
    const drawWidth = params.displaySize.w;
    const drawHeight = params.displaySize.h;
    
    ctx.drawImage(
      image,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );
    
    // 生成輸出
    const blob = await this.canvasToBlob(canvas, outputFormat, quality);
    const dataURL = canvas.toDataURL(
      outputFormat === 'png' ? 'image/png' : `image/${outputFormat}`,
      quality
    );
    
    return {
      blob,
      dataURL,
      dimensions: { w: outputWidth, h: outputHeight },
      actualCropRect
    };
  }
  
  /**
   * 從檔案載入圖片
   */
  static async loadImageFromFile(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('圖片載入失敗'));
      };
      
      img.src = url;
    });
  }
  
  /**
   * 從 URL 載入圖片
   */
  static async loadImageFromUrl(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // 處理跨域問題
      
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('圖片載入失敗'));
      
      img.src = url;
    });
  }
  
  /**
   * 獲取圖片的自然尺寸
   */
  static getImageNaturalSize(image: HTMLImageElement | ImageBitmap): Size {
    if (image instanceof HTMLImageElement) {
      return { w: image.naturalWidth, h: image.naturalHeight };
    } else {
      return { w: image.width, h: image.height };
    }
  }
  
  /**
   * 創建預設變形狀態
   */
  static createDefaultTransform(): Transform {
    return { tx: 0, ty: 0, scale: 1, rot: 0 };
  }
  
  /**
   * 驗證變形參數
   */
  static validateTransform(transform: Transform): Transform {
    return {
      tx: isFinite(transform.tx) ? transform.tx : 0,
      ty: isFinite(transform.ty) ? transform.ty : 0,
      scale: isFinite(transform.scale) && transform.scale > 0 ? transform.scale : 1,
      rot: isFinite(transform.rot) ? transform.rot : 0
    };
  }
  
  /**
   * Canvas 轉 Blob（支援不同格式）
   */
  private static canvasToBlob(
    canvas: HTMLCanvasElement, 
    format: string, 
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve) => {
      const mimeType = format === 'png' ? 'image/png' : `image/${format}`;
      canvas.toBlob(
        (blob) => resolve(blob!),
        mimeType,
        quality
      );
    });
  }
  
  /**
   * 批次處理多張圖片
   */
  static async processMultiple(
    images: (HTMLImageElement | File)[],
    paramsList: TransformCropParams[],
    options: ProcessOptions = {}
  ): Promise<ProcessResult[]> {
    const results: ProcessResult[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const imageInput = images[i];
      const params = paramsList[i] || paramsList[0]; // 如果參數不足，重複使用第一個
      
      let image: HTMLImageElement;
      if (imageInput instanceof File) {
        image = await this.loadImageFromFile(imageInput);
      } else {
        image = imageInput;
      }
      
      const result = await this.process(image, params, options);
      results.push(result);
    }
    
    return results;
  }
}
