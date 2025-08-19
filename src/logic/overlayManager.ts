import { Overlay, CropperState } from '../assets/types.js';
import { OverlayProcessor } from './overlay-processor.js';

export class OverlayManager {
  private overlays: Overlay[] = [];
  private selectedIndex: number = -1;
  private canvas: HTMLCanvasElement;
  private isCropMode: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  // 取得所有圖層
  getOverlays(): Overlay[] {
    return this.overlays;
  }

  // 取得選中的圖層索引
  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  // 設定選中的圖層
  setSelectedIndex(index: number): void {
    this.selectedIndex = index;
  }

  // 取得選中的圖層
  getSelectedOverlay(): Overlay | null {
    return this.selectedIndex >= 0 ? this.overlays[this.selectedIndex] : null;
  }

  // 設定裁切模式
  setCropMode(cropMode: boolean): void {
    this.isCropMode = cropMode;
  }
  
  // 取得裁切模式狀態
  getCropMode(): boolean {
    return this.isCropMode;
  }

  // 新增圖層
  addOverlay(img: HTMLImageElement, name: string, src: string): Overlay {
    const overlay: Overlay = {
      id: Date.now() + Math.random(),
      name: name || 'overlay.png',
      img,
      src: src || '',
      x: this.canvas.width / 2,
      y: this.canvas.height / 2,
      w: img.naturalWidth || img.width,
      h: img.naturalHeight || img.height,
      scaleX: Math.max(0.05, (this.canvas.width * 0.4) / (img.naturalWidth || img.width)),
      scaleY: Math.max(0.05, (this.canvas.width * 0.4) / (img.naturalWidth || img.width)),
      rotation: 0,
      opacity: 1,
      visible: true,
      lockAspect: true,
      crop: {
        x: 0,
        y: 0,
        w: img.naturalWidth || img.width,
        h: img.naturalHeight || img.height
      }
    };
    this.overlays.push(overlay);
    this.selectedIndex = this.overlays.length - 1;
    return overlay;
  }

  // 移除圖層
  removeOverlay(index: number): void {
    if (index >= 0 && index < this.overlays.length) {
      this.overlays.splice(index, 1);
      if (this.selectedIndex >= this.overlays.length) {
        this.selectedIndex = this.overlays.length - 1;
      }
    }
  }

  // 移除選中的圖層
  removeSelectedOverlay(): void {
    if (this.selectedIndex >= 0) {
      this.removeOverlay(this.selectedIndex);
    }
  }

  // 清除所有圖層
  clearOverlays(): void {
    this.overlays = [];
    this.selectedIndex = -1;
  }

  // 圖層排序：移到最上層
  bringToFront(index: number): void {
    if (index >= 0 && index < this.overlays.length) {
      const overlay = this.overlays.splice(index, 1)[0];
      this.overlays.push(overlay);
      this.selectedIndex = this.overlays.length - 1;
    }
  }

  // 圖層排序：向上一層
  bringForward(index: number): void {
    if (index >= 0 && index < this.overlays.length - 1) {
      [this.overlays[index], this.overlays[index + 1]] = [this.overlays[index + 1], this.overlays[index]];
      this.selectedIndex = index + 1;
    }
  }

  // 圖層排序：向下一層
  sendBackward(index: number): void {
    if (index > 0 && index < this.overlays.length) {
      [this.overlays[index], this.overlays[index - 1]] = [this.overlays[index - 1], this.overlays[index]];
      this.selectedIndex = index - 1;
    }
  }

  // 圖層排序：移到最下層
  sendToBack(index: number): void {
    if (index >= 0 && index < this.overlays.length) {
      const overlay = this.overlays.splice(index, 1)[0];
      this.overlays.unshift(overlay);
      this.selectedIndex = 0;
    }
  }

  // 置中選中的圖層
  centerSelectedOverlay(): void {
    const overlay = this.getSelectedOverlay();
    if (overlay) {
      // overlay.x, overlay.y 本身就是中心點
      overlay.x = this.canvas.width / 2;
      overlay.y = this.canvas.height / 2;
    }
  }

  // 重設選中圖層的大小和角度
  resetSelectedOverlay(): void {
    const overlay = this.getSelectedOverlay();
    if (overlay) {
      overlay.scaleX = Math.max(0.05, (this.canvas.width * 0.4) / overlay.w);
      overlay.scaleY = overlay.lockAspect ? overlay.scaleX : Math.max(0.05, (this.canvas.width * 0.4) / overlay.w);
      overlay.rotation = 0;
    }
  }

  // 重設裁切
  resetCrop(index: number): void {
    const overlay = this.overlays[index];
    if (overlay) {
      overlay.crop = { x: 0, y: 0, w: overlay.w, h: overlay.h };
    }
  }

  // 取得圖層尺寸
  getOverlaySize(overlay: Overlay): { w: number; h: number } {
    return { w: overlay.w * overlay.scaleX, h: overlay.h * overlay.scaleY };
  }

  // 座標轉換：全域到本地
  toLocal(overlay: Overlay, point: { x: number; y: number }): { x: number; y: number } {
    const dx = point.x - overlay.x;
    const dy = point.y - overlay.y;
    const cos = Math.cos(-overlay.rotation);
    const sin = Math.sin(-overlay.rotation);
    return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
  }

  // 座標轉換：本地到全域
  toGlobal(overlay: Overlay, localPoint: { x: number; y: number }): { x: number; y: number } {
    const cos = Math.cos(overlay.rotation);
    const sin = Math.sin(overlay.rotation);
    return {
      x: overlay.x + (localPoint.x * cos - localPoint.y * sin),
      y: overlay.y + (localPoint.x * sin + localPoint.y * cos)
    };
  }

  // 取得控制把手位置
  getHandlePositions(overlay: Overlay): Array<{ name: string; x: number; y: number }> {
    const size = this.getOverlaySize(overlay);
    const hw = size.w / 2;
    const hh = size.h / 2;
    return [
      { name: 'nw', x: -hw, y: -hh }, { name: 'n', x: 0, y: -hh }, { name: 'ne', x: hw, y: -hh },
      { name: 'e', x: hw, y: 0 }, { name: 'se', x: hw, y: hh }, { name: 's', x: 0, y: hh },
      { name: 'sw', x: -hw, y: hh }, { name: 'w', x: -hw, y: 0 }
    ];
  }

  // 取得旋轉把手位置
  getRotateHandle(overlay: Overlay): { name: string; x: number; y: number } {
    const size = this.getOverlaySize(overlay);
    return { name: 'rot', x: 0, y: -(size.h / 2) - 30 };
  }

  // 取得裁切控制點位置
  getCropHandlePositions(overlay: Overlay): Array<{ name: string; x: number; y: number }> {
    const size = this.getOverlaySize(overlay);
    const crop = overlay.crop;
    
    // 計算裁切區域在顯示尺寸中的位置
    const cropX = (crop.x / overlay.w - 0.5) * size.w;
    const cropY = (crop.y / overlay.h - 0.5) * size.h;
    const cropW = (crop.w / overlay.w) * size.w;
    const cropH = (crop.h / overlay.h) * size.h;
    
    return [
      { name: 'nw', x: cropX, y: cropY },
      { name: 'n', x: cropX + cropW/2, y: cropY },
      { name: 'ne', x: cropX + cropW, y: cropY },
      { name: 'e', x: cropX + cropW, y: cropY + cropH/2 },
      { name: 'se', x: cropX + cropW, y: cropY + cropH },
      { name: 's', x: cropX + cropW/2, y: cropY + cropH },
      { name: 'sw', x: cropX, y: cropY + cropH },
      { name: 'w', x: cropX, y: cropY + cropH/2 }
    ];
  }

  // 碰撞檢測
  hitTest(point: { x: number; y: number }): { idx: number; hit: string; handle?: string } {
    for (let i = this.overlays.length - 1; i >= 0; i--) {
      const overlay = this.overlays[i];
      if (!overlay.visible) continue;

      const size = this.getOverlaySize(overlay);
      const localPoint = this.toLocal(overlay, point);
      const hw = size.w / 2;
      const hh = size.h / 2;

      if (this.isCropMode) {
        // 裁切模式：只檢測選中圖層的裁切控制點
        if (i !== this.selectedIndex) {
          // 非選中圖層，只檢測移動
          if (Math.abs(localPoint.x) <= hw && Math.abs(localPoint.y) <= hh) {
            return { idx: i, hit: 'move' };
          }
          continue;
        }
        
        const cropHandles = this.getCropHandlePositions(overlay);
        for (const handle of cropHandles) {
          const globalHandle = this.toGlobal(overlay, handle);
          if (Math.hypot(point.x - globalHandle.x, point.y - globalHandle.y) <= 15) {
            return { idx: i, hit: 'crop', handle: handle.name };
          }
        }
      } else {
        // 正常模式：原有的控制點檢測
        // 旋轉把手
        const rotHandle = this.toGlobal(overlay, this.getRotateHandle(overlay));
        const rotDist = Math.hypot(point.x - rotHandle.x, point.y - rotHandle.y);
        if (rotDist <= 12) return { idx: i, hit: 'rotate' };

        // 縮放把手
        const handles = this.getHandlePositions(overlay);
        for (const handle of handles) {
          const globalHandle = this.toGlobal(overlay, handle);
          if (Math.abs(point.x - globalHandle.x) <= 10 && Math.abs(point.y - globalHandle.y) <= 10) {
            return { idx: i, hit: 'scale', handle: handle.name };
          }
        }
      }

      // 內部（拖曳）
      if (Math.abs(localPoint.x) <= hw && Math.abs(localPoint.y) <= hh) {
        return { idx: i, hit: 'move' };
      }
    }
    return { idx: -1, hit: 'none' };
  }

  // 繪製圖層
  drawOverlay(ctx: CanvasRenderingContext2D, overlay: Overlay, isSelected: boolean): void {
    if (!overlay.img || !overlay.visible) return;

    const size = this.getOverlaySize(overlay);
    ctx.save();
    ctx.globalAlpha = overlay.opacity;
    ctx.translate(overlay.x, overlay.y);
    ctx.rotate(overlay.rotation);

    // 繪製完整圖片
    ctx.drawImage(overlay.img, -size.w / 2, -size.h / 2, size.w, size.h);
    
    // 暫時移除自動遮罩，只在裁切模式下手動顯示
    // 讓用戶先看到控制點
    ctx.restore();

    // 選中時繪製控制項
    if (isSelected) {
      this.drawOverlayControls(ctx, overlay);
    }
  }

  // 繪製裁切遮罩
  private drawCropMask(ctx: CanvasRenderingContext2D, overlay: Overlay, size: { w: number; h: number }): void {
    const crop = overlay.crop;
    
    // 計算裁切區域在顯示尺寸中的位置
    const cropX = (crop.x / overlay.w - 0.5) * size.w;
    const cropY = (crop.y / overlay.h - 0.5) * size.h;
    const cropW = (crop.w / overlay.w) * size.w;
    const cropH = (crop.h / overlay.h) * size.h;
    
    // 繪製半透明遮罩遮蓋被裁切的區域
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    
    // 上邊遮罩
    if (cropY > -size.h / 2) {
      ctx.fillRect(-size.w / 2, -size.h / 2, size.w, cropY + size.h / 2);
    }
    // 下邊遮罩
    if (cropY + cropH < size.h / 2) {
      ctx.fillRect(-size.w / 2, cropY + cropH, size.w, size.h / 2 - (cropY + cropH));
    }
    // 左邊遮罩
    if (cropX > -size.w / 2) {
      ctx.fillRect(-size.w / 2, cropY, cropX + size.w / 2, cropH);
    }
    // 右邊遮罩
    if (cropX + cropW < size.w / 2) {
      ctx.fillRect(cropX + cropW, cropY, size.w / 2 - (cropX + cropW), cropH);
    }
  }

  // 繪製所有圖層
  drawAllOverlays(ctx: CanvasRenderingContext2D): void {
    this.overlays.forEach((overlay, idx) => {
      this.drawOverlay(ctx, overlay, idx === this.selectedIndex);
    });
  }

  // 繪製圖層控制項
  private drawOverlayControls(ctx: CanvasRenderingContext2D, overlay: Overlay): void {
    const size = this.getOverlaySize(overlay);
    
    console.log('🎯 繪製控制項 - 裁切模式:', this.isCropMode, '選中索引:', this.selectedIndex);
    
    ctx.save();
    ctx.translate(overlay.x, overlay.y);
    ctx.rotate(overlay.rotation);

    if (this.isCropMode) {
      // 裁切模式：顯示裁切範圍和控制點
      this.drawCropControls(ctx, overlay, size);
    } else {
      // 正常模式：顯示縮放和旋轉控制點
      // 邊框
      ctx.strokeStyle = 'rgba(0,0,0,.7)';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(-size.w / 2, -size.h / 2, size.w, size.h);
      ctx.setLineDash([]);

      // 八個縮放把手  
      const handles = this.getHandlePositions(overlay);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(0,0,0,.85)';
      handles.forEach(handle => {
        ctx.beginPath();
        ctx.rect(handle.x - 6, handle.y - 6, 12, 12);
        ctx.fill();
        ctx.stroke();
      });

      // 旋轉把手
      const rotHandle = this.getRotateHandle(overlay);
      ctx.beginPath();
      ctx.moveTo(0, -size.h / 2);
      ctx.lineTo(0, rotHandle.y + 12);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(rotHandle.x, rotHandle.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    
    ctx.restore();
  }

  // 繪製裁切控制項
  private drawCropControls(ctx: CanvasRenderingContext2D, overlay: Overlay, size: { w: number; h: number }): void {
    const crop = overlay.crop;
    
    console.log('🎯 繪製裁切控制項 - 裁切區域:', crop, '圖片尺寸:', overlay.w, 'x', overlay.h);
    
    // 計算裁切區域在顯示尺寸中的位置
    const cropX = (crop.x / overlay.w - 0.5) * size.w;
    const cropY = (crop.y / overlay.h - 0.5) * size.h;
    const cropW = (crop.w / overlay.w) * size.w;
    const cropH = (crop.h / overlay.h) * size.h;
    
    // 繪製完整圖片的邊框
    ctx.strokeStyle = 'rgba(100,100,100,.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(-size.w / 2, -size.h / 2, size.w, size.h);
    ctx.setLineDash([]);
    
    // 繪製裁切框邊界
    ctx.strokeStyle = '#ff0000';  // 紅色邊框，更醒目
    ctx.lineWidth = 4;
    ctx.strokeRect(cropX, cropY, cropW, cropH);
    
    // 繪製裁切控制點（箭頭符號）
    console.log('🎯 繪製裁切控制點，裁切區域:', { cropX, cropY, cropW, cropH });
    const cropHandles = [
      { name: 'nw', x: cropX, y: cropY, symbol: '↖' },
      { name: 'n', x: cropX + cropW/2, y: cropY, symbol: '↑' },
      { name: 'ne', x: cropX + cropW, y: cropY, symbol: '↗' },
      { name: 'e', x: cropX + cropW, y: cropY + cropH/2, symbol: '→' },
      { name: 'se', x: cropX + cropW, y: cropY + cropH, symbol: '↘' },
      { name: 's', x: cropX + cropW/2, y: cropY + cropH, symbol: '↓' },
      { name: 'sw', x: cropX, y: cropY + cropH, symbol: '↙' },
      { name: 'w', x: cropX, y: cropY + cropH/2, symbol: '←' }
    ];
    
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#ff0000';  // 紅色邊框，更醒目
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    cropHandles.forEach(handle => {
      // 背景圓圈 - 更大更明顯
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      // 箭頭符號
      ctx.fillStyle = '#ff0000';
      ctx.fillText(handle.symbol, handle.x, handle.y);
      ctx.fillStyle = '#fff';
    });
  }

  // 調整圖層大小
  scaleOverlay(index: number, scaleX: number, scaleY: number): void {
    const overlay = this.overlays[index];
    if (overlay) {
      overlay.scaleX = Math.max(0.05, Math.min(50, scaleX));
      overlay.scaleY = Math.max(0.05, Math.min(50, scaleY));
    }
  }

  // 移動圖層
  moveOverlay(index: number, x: number, y: number): void {
    const overlay = this.overlays[index];
    if (overlay) {
      overlay.x = Math.max(0, Math.min(this.canvas.width, x));
      overlay.y = Math.max(0, Math.min(this.canvas.height, y));
    }
  }

  // 旋轉圖層
  rotateOverlay(index: number, rotation: number): void {
    const overlay = this.overlays[index];
    if (overlay) {
      overlay.rotation = rotation;
    }
  }

  // === 新增：高品質處理支持 ===

  /**
   * 檢查圖層是否需要高品質處理
   * @param overlay - 要檢查的圖層
   */
  needsHighQualityProcessing(overlay: Overlay): boolean {
    return OverlayProcessor.needsHighQualityProcessing(overlay);
  }

  /**
   * 取得所有需要高品質處理的圖層
   */
  getLayersNeedingProcessing(): Overlay[] {
    return this.overlays.filter(overlay => 
      overlay.visible && this.needsHighQualityProcessing(overlay)
    );
  }

  /**
   * 取得處理統計
   */
  getProcessingStats(): {
    total: number;
    needsProcessing: number;
    simple: number;
    complex: number;
  } {
    return OverlayProcessor.getProcessingStats(this.overlays);
  }

  /**
   * 創建圖層預覽
   * @param index - 圖層索引
   * @param size - 預覽尺寸
   */
  createOverlayPreview(index: number, size: number = 150): HTMLCanvasElement | null {
    const overlay = this.overlays[index];
    if (!overlay) return null;
    
    return OverlayProcessor.createPreview(overlay, size);
  }

  /**
   * 創建選中圖層的預覽
   * @param size - 預覽尺寸
   */
  createSelectedOverlayPreview(size: number = 150): HTMLCanvasElement | null {
    return this.createOverlayPreview(this.selectedIndex, size);
  }

  /**
   * 批次處理所有圖層
   * @param onProgress - 進度回調
   */
  async processAllOverlays(
    onProgress?: (processed: number, total: number, currentLayer?: string) => void
  ): Promise<Array<{
    overlay: Overlay;
    result: {
      blob: Blob;
      canvas: HTMLCanvasElement;
      processedImg: HTMLImageElement;
    };
  }>> {
    const layersToProcess = this.getLayersNeedingProcessing();
    
    return await OverlayProcessor.processMultipleOverlays(
      layersToProcess,
      {
        outputFormat: 'png',
        quality: 0.95,
        smoothing: true,
        maxSize: 2048,
        onProgress
      }
    );
  }
}
