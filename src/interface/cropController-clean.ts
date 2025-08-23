import { OverlayManager } from '../logic/overlayManager.js';
import { Overlay } from '../assets/types.js';

// 最小功能版本 - 確保編譯通過
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
    console.log('✅ CropController 初始化完成');
  }
  
  public isInCropMode(): boolean {
    return false;
  }
  
  public drawCropInterface(ctx: CanvasRenderingContext2D): void {
    // 空實作，確保編譯通過
  }
}
