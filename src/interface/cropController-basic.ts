// 最小測試版本 - 檢查基本語法
import { OverlayManager } from '../logic/overlayManager.js';

export class CropController {
  private overlayManager: OverlayManager;
  private canvas: HTMLCanvasElement;
  private updateCallback: () => void;
  
  constructor(
    canvas: HTMLCanvasElement, 
    overlayManager: OverlayManager, 
    updateCallback: () => void
  ) {
    this.canvas = canvas;
    this.overlayManager = overlayManager;
    this.updateCallback = updateCallback;
    console.log('✅ CropController 基本初始化成功');
  }
  
  public isInCropMode(): boolean {
    return false;
  }
  
  public drawCropInterface(ctx: CanvasRenderingContext2D): void {
    // 空實作，測試用
  }
}
