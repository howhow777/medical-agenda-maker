import { Overlay } from '../assets/types.js';

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
  
  // 新增圖層
  addOverlay(img: HTMLImageElement, name: string, src: string): void {
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
      if (this.selectedIndex === index) {
        this.selectedIndex = index + 1;
      }
    }
  }

  // 圖層排序：向下一層
  sendBackward(index: number): void {
    if (index > 0 && index < this.overlays.length) {
      [this.overlays[index], this.overlays[index - 1]] = [this.overlays[index - 1], this.overlays[index]];
      if (this.selectedIndex === index) {
        this.selectedIndex = index - 1;
      }
    }
  }

  // 圖層排序：移到最下層
  sendToBack(index: number): void {
    if (index > 0 && index < this.overlays.length) {
      const overlay = this.overlays.splice(index, 1)[0];
      this.overlays.unshift(overlay);
      this.selectedIndex = 0;
    }
  }

  // 取得圖層顯示尺寸
  getOverlaySize(overlay: Overlay): { w: number; h: number } {
    return {
      w: overlay.w * overlay.scaleX,
      h: overlay.h * overlay.scaleY
    };
  }

  // 取得控制點位置
  getHandlePositions(overlay: Overlay): Array<{ x: number; y: number; cursor: string }> {
    const size = this.getOverlaySize(overlay);
    const halfW = size.w / 2;
    const halfH = size.h / 2;
    
    return [
      { x: -halfW, y: -halfH, cursor: 'nw-resize' },
      { x: 0, y: -halfH, cursor: 'n-resize' },
      { x: halfW, y: -halfH, cursor: 'ne-resize' },
      { x: halfW, y: 0, cursor: 'e-resize' },
      { x: halfW, y: halfH, cursor: 'se-resize' },
      { x: 0, y: halfH, cursor: 's-resize' },
      { x: -halfW, y: halfH, cursor: 'sw-resize' },
      { x: -halfW, y: 0, cursor: 'w-resize' }
    ];
  }

  // 取得旋轉把手位置
  getRotateHandle(overlay: Overlay): { x: number; y: number } {
    const size = this.getOverlaySize(overlay);
    return { x: 0, y: -size.h / 2 - 25 };
  }

  // 檢測點擊位置
  hitTest(x: number, y: number): { index: number; handle?: string } | null {
    // 從最上層開始檢測
    for (let i = this.overlays.length - 1; i >= 0; i--) {
      const overlay = this.overlays[i];
      if (!overlay.visible) continue;
      
      // 轉換到圖層本地座標
      const localX = (x - overlay.x) * Math.cos(-overlay.rotation) - (y - overlay.y) * Math.sin(-overlay.rotation);
      const localY = (x - overlay.x) * Math.sin(-overlay.rotation) + (y - overlay.y) * Math.cos(-overlay.rotation);
      
      const size = this.getOverlaySize(overlay);
      const halfW = size.w / 2;
      const halfH = size.h / 2;
      
      // 檢測是否在圖層範圍內
      if (Math.abs(localX) <= halfW && Math.abs(localY) <= halfH) {
        return { index: i };
      }
    }
    
    return null;
  }

  // 置中圖層
  centerOverlay(index: number): void {
    if (index >= 0 && index < this.overlays.length) {
      const overlay = this.overlays[index];
      overlay.x = this.canvas.width / 2;
      overlay.y = this.canvas.height / 2;
    }
  }

  // 重設圖層大小和角度
  resetOverlay(index: number): void {
    if (index >= 0 && index < this.overlays.length) {
      const overlay = this.overlays[index];
      overlay.scaleX = 1;
      overlay.scaleY = 1;
      overlay.rotation = 0;
    }
  }

  // 更新圖層屬性
  updateOverlayProperty(index: number, property: keyof Overlay, value: any): void {
    if (index >= 0 && index < this.overlays.length) {
      (this.overlays[index] as any)[property] = value;
    }
  }
}