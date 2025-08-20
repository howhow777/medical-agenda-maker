import { Overlay } from '../assets/types.js';
import { OverlayProcessor } from './overlay-processor.js';

export class OverlayManager {
  private overlays: Overlay[] = [];
  private selectedIndex: number = -1;
  private canvas: HTMLCanvasElement;

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
      lockAspect: true
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

  // 碰撞檢測
  hitTest(point: { x: number; y: number }): { idx: number; hit: string; handle?: string } {
    for (let i = this.overlays.length - 1; i >= 0; i--) {
      const overlay = this.overlays[i];
      if (!overlay.visible) continue;

      const size = this.getOverlaySize(overlay);
      const localPoint = this.toLocal(overlay, point);
      const hw = size.w / 2;
      const hh = size.h / 2;

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

  // 繪製所有圖層
  drawAllOverlays(ctx: CanvasRenderingContext2D): void {
    this.overlays.forEach((overlay, idx) => {
      this.drawOverlay(ctx, overlay, idx === this.selectedIndex);
    });
  }

  // 繪製圖層控制項
  private drawOverlayControls(ctx: CanvasRenderingContext2D, overlay: Overlay): void {
    const size = this.getOverlaySize(overlay);
    
    ctx.save();
    ctx.translate(overlay.x, overlay.y);
    ctx.rotate(overlay.rotation);

    // 顯示縮放和旋轉控制點
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
    
    ctx.restore();
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
