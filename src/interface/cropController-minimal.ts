import { OverlayManager } from '../logic/overlayManager.js';
import { Overlay } from '../assets/types.js';

// 最小測試版本的裁切控制器
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
    
    console.log('✅ CropController 初始化成功');
  }
  
  /**
   * 檢查是否處於裁切模式
   */
  public isInCropMode(): boolean {
    return false; // 暫時返回 false
  }
  
  /**
   * 繪製裁切界面（供posterRenderer調用）
   */
  public drawCropInterface(ctx: CanvasRenderingContext2D): void {
    // 暫時為空，避免編譯錯誤
    return;
  }
}
