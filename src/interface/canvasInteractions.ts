import { OverlayManager } from '../logic/overlayManager.js';

export class CanvasInteractions {
  private canvas: HTMLCanvasElement;
  private overlayManager: OverlayManager;
  private updateCallback: () => void;
  private syncCallback: () => void;
  private refreshCallback: () => void;
  
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private dragMode = 'none'; // 'move', 'resize', 'rotate'
  private resizeHandle = '';

  constructor(
    canvas: HTMLCanvasElement,
    overlayManager: OverlayManager,
    updateCallback: () => void,
    syncCallback: () => void,
    refreshCallback: () => void
  ) {
    this.canvas = canvas;
    this.overlayManager = overlayManager;
    this.updateCallback = updateCallback;
    this.syncCallback = syncCallback;
    this.refreshCallback = refreshCallback;
  }

  // 綁定畫布事件
  bindEvents(): void {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
    
    // 觸控事件支援
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
  }

  // 滑鼠按下事件
  private handleMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const hitResult = this.overlayManager.hitTest(x, y);
    if (hitResult) {
      this.overlayManager.setSelectedIndex(hitResult.index);
      this.isDragging = true;
      this.dragStart = { x, y };
      this.dragMode = hitResult.handle ? 'resize' : 'move';
      this.resizeHandle = hitResult.handle || '';
      
      this.syncCallback();
      this.updateCallback();
    } else {
      this.overlayManager.setSelectedIndex(-1);
      this.syncCallback();
      this.updateCallback();
    }
  }

  // 滑鼠移動事件
  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const deltaX = x - this.dragStart.x;
    const deltaY = y - this.dragStart.y;
    
    const selectedOverlay = this.overlayManager.getSelectedOverlay();
    if (!selectedOverlay) return;
    
    if (this.dragMode === 'move') {
      selectedOverlay.x += deltaX;
      selectedOverlay.y += deltaY;
    } else if (this.dragMode === 'resize') {
      this.handleResize(selectedOverlay, deltaX, deltaY);
    }
    
    this.dragStart = { x, y };
    this.updateCallback();
  }

  // 滑鼠放開事件
  private handleMouseUp(e: MouseEvent): void {
    this.isDragging = false;
    this.dragMode = 'none';
    this.resizeHandle = '';
  }

  // 處理縮放調整
  private handleResize(overlay: any, deltaX: number, deltaY: number): void {
    const factor = 0.01;
    const scaleChange = (deltaX + deltaY) * factor;
    
    if (overlay.lockAspect) {
      overlay.scaleX = Math.max(0.1, overlay.scaleX + scaleChange);
      overlay.scaleY = overlay.scaleX;
    } else {
      overlay.scaleX = Math.max(0.1, overlay.scaleX + deltaX * factor);
      overlay.scaleY = Math.max(0.1, overlay.scaleY + deltaY * factor);
    }
  }

  // 滾輪縮放事件
  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    
    const selectedOverlay = this.overlayManager.getSelectedOverlay();
    if (!selectedOverlay) return;
    
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    selectedOverlay.scaleX *= scaleFactor;
    selectedOverlay.scaleY *= scaleFactor;
    
    this.updateCallback();
  }

  // 觸控開始事件
  private handleTouchStart(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.handleMouseDown(mouseEvent);
    }
  }

  // 觸控移動事件
  private handleTouchMove(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.handleMouseMove(mouseEvent);
    }
  }

  // 觸控結束事件
  private handleTouchEnd(e: TouchEvent): void {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    this.handleMouseUp(mouseEvent);
  }
}