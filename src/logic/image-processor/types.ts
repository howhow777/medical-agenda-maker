// 圖片處理核心類型定義

export interface Transform {
  tx: number;    // X軸位移 (pixels)
  ty: number;    // Y軸位移 (pixels) 
  scale: number; // 縮放比例 (1.0 = 原尺寸)
  rot: number;   // 旋轉角度 (radians)
}

export interface Rectangle {
  x: number;     // 左上角 X 座標
  y: number;     // 左上角 Y 座標
  w: number;     // 寬度
  h: number;     // 高度
}

export interface Size {
  w: number;     // 寬度
  h: number;     // 高度
}

export interface Point {
  x: number;
  y: number;
}

export interface CropOptions {
  aspectRatio?: number;     // 長寬比鎖定 (w/h)
  minSize?: number;        // 最小尺寸限制
  keepAspect?: boolean;    // 是否保持比例
}

export interface TransformCropParams {
  transform: Transform;
  cropRect: Rectangle;
  naturalSize: Size;
  displaySize: Size;
  displayOffset: Point;
}

export interface ProcessResult {
  blob: Blob;
  dataURL: string;
  dimensions: Size;
  actualCropRect: Rectangle;  // 實際裁切區域（自然座標）
}

export interface ProcessOptions {
  outputFormat?: 'png' | 'jpeg' | 'webp';
  quality?: number;           // JPEG/WebP 品質 (0-1)
  smoothing?: boolean;        // 圖片平滑處理
  backgroundColor?: string;   // 背景色（JPEG用）
}
