import { Overlay, DragState } from '../assets/types.js';
import { OverlayManager } from '../logic/overlayManager.js';

export class CanvasInteractions {
  private overlayManager: OverlayManager;
  private drag: DragState = {
    mode: 'none',
    idx: -1,
    start: { x: 0, y: 0 },
    startOv: null,
    handle: null,
    startAngle: 0
  };

  constructor(
    private canvas: HTMLCanvasElement,
    overlayManager: OverlayManager,
    private updateCallback: () => void,
    private syncOverlayControlsCallback: () => void,
    private refreshOverlayListCallback: () => void
  ) {
    this.overlayManager = overlayManager;
    this.bindEvents();
  }

  // 綁定 Canvas 事件
  public bindEvents(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
    this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this));
    this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
  }

  // 指標按下
  private onPointerDown(e: PointerEvent): void {
    this.canvas.setPointerCapture(e.pointerId);
    const point = this.canvasPoint(e);
    const hitResult = this.overlayManager.hitTest(point);
    
    this.drag.mode = hitResult.hit;
    this.drag.idx = hitResult.idx;
    this.drag.handle = hitResult.handle || null;
    this.drag.start = point;
    
    if (hitResult.idx >= 0) {
      this.overlayManager.setSelectedIndex(hitResult.idx);
      this.refreshOverlayListCallback();
      this.syncOverlayControlsCallback();
      
      const overlay = this.overlayManager.getSelectedOverlay();
      if (overlay) {
        this.drag.startOv = JSON.parse(JSON.stringify(overlay)); // 深拷貝
        
        if (this.drag.mode === 'rotate') {
          this.drag.startAngle = Math.atan2(point.y - overlay.y, point.x - overlay.x);
        }
      }
    } else {
      this.overlayManager.setSelectedIndex(-1);
      this.refreshOverlayListCallback();
      this.syncOverlayControlsCallback();
    }
    
    this.updateCallback();
  }

  // 指標移動
  private onPointerMove(e: PointerEvent): void {
    if (this.drag.idx < 0 || this.drag.mode === 'none') return;
    
    const point = this.canvasPoint(e);
    const overlay = this.overlayManager.getOverlays()[this.drag.idx];
    if (!overlay || !this.drag.startOv) return;
    
    if (this.drag.mode === 'move') {
      overlay.x += (point.x - this.drag.start.x);
      overlay.y += (point.y - this.drag.start.y);
      this.drag.start = point;
      this.updateCallback();
    } 
    else if (this.drag.mode === 'rotate') {
      const angle = Math.atan2(point.y - overlay.y, point.x - overlay.x);
      overlay.rotation = this.drag.startOv.rotation + (angle - this.drag.startAngle);
      this.updateCallback();
    }
    else if (this.drag.mode === 'scale' && this.drag.handle) {
      this.handleScaling(overlay, point);
    }
  }

  // 處理縮放
  private handleScaling(overlay: Overlay, point: { x: number; y: number }): void {
    if (!this.drag.startOv) return;
    
    const localPoint = this.overlayManager.toLocal(overlay, point);
    const startSize = this.overlayManager.getOverlaySize(this.drag.startOv);
    const hw0 = startSize.w / 2;
    const hh0 = startSize.h / 2;
    
    let scaleX = this.drag.startOv.scaleX;
    let scaleY = this.drag.startOv.scaleY;
    const lock = overlay.lockAspect;
    
    function clamp(v: number): number {
      return Math.max(0.05, Math.min(50, v));
    }
    
    switch (this.drag.handle) {
      case 'n':
      case 's':
        if (lock) {
          const ry = Math.abs(localPoint.y) / hh0;
          scaleX = clamp(this.drag.startOv.scaleX * ry);
          scaleY = scaleX;
        } else {
          const ry = Math.abs(localPoint.y) / hh0;
          scaleY = clamp(this.drag.startOv.scaleY * ry);
        }
        break;
      case 'e':
      case 'w':
        if (lock) {
          const rx = Math.abs(localPoint.x) / hw0;
          scaleX = clamp(this.drag.startOv.scaleX * rx);
          scaleY = scaleX;
        } else {
          const rx = Math.abs(localPoint.x) / hw0;
          scaleX = clamp(this.drag.startOv.scaleX * rx);
        }
        break;
      default: // 四角
        if (lock) {
          const rx = Math.abs(localPoint.x) / hw0;
          const ry = Math.abs(localPoint.y) / hh0;
          const r = Math.max(rx, ry);
          scaleX = clamp(this.drag.startOv.scaleX * r);
          scaleY = scaleX;
        } else {
          const rx = Math.abs(localPoint.x) / hw0;
          const ry = Math.abs(localPoint.y) / hh0;
          scaleX = clamp(this.drag.startOv.scaleX * rx);
          scaleY = clamp(this.drag.startOv.scaleY * ry);
        }
    }
    
    overlay.scaleX = scaleX;
    overlay.scaleY = scaleY;
    this.updateCallback();
  }

  // 指標放開
  private onPointerUp(e: PointerEvent): void {
    this.drag.mode = 'none';
    this.drag.idx = -1;
    this.drag.startOv = null;
    this.drag.handle = null;
  }

  // 滾輪縮放
  private onWheel(e: WheelEvent): void {
    const overlay = this.overlayManager.getSelectedOverlay();
    if (!overlay) return;
    
    e.preventDefault();
    const delta = (e.deltaY < 0) ? 1.06 : 0.94;
    overlay.scaleX = Math.max(0.05, Math.min(20, overlay.scaleX * delta));
    overlay.scaleY = overlay.lockAspect ? overlay.scaleX : Math.max(0.05, Math.min(20, overlay.scaleY * delta));
    this.updateCallback();
  }

  // 取得 Canvas 相對座標
  private canvasPoint(evt: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
  }
}
