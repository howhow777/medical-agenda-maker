import { Overlay, DragState } from '../assets/types.js';
import { OverlayManager } from '../logic/overlayManager.js';
import { TouchDebugController } from './touchDebugController.js';

export class CanvasInteractions {
  private overlayManager: OverlayManager;
  private touchDebug: TouchDebugController;
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
    this.touchDebug = new TouchDebugController();
    this.bindEvents();
  }

  // 綁定 Canvas 事件
  public bindEvents(): void {
    // 使用Touch Events替代Pointer Events
    this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
    this.canvas.addEventListener('touchcancel', this.onTouchEnd.bind(this));
    
    // 保留滑鼠支援（桌面環境）
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
  }

  // 指標按下
  // Touch 開始
  private onTouchStart(e: TouchEvent): void {
    // 只處理第一個觸控點
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const point = this.canvasPointFromTouch(touch);
    const hitResult = this.overlayManager.hitTest(point);
    
    console.log('👆 [TouchStart] 觸控開始', {
      touchId: touch.identifier,
      coordinates: point,
      hitTest: hitResult.hit,
      hitIndex: hitResult.idx,
      handle: hitResult.handle
    });
    
    // 除錯記錄
    this.touchDebug.logTouchEvent({
      eventType: 'touchstart',
      pointerCount: e.touches.length,
      coordinates: [point],
      hitResult: hitResult.hit,
      dragMode: 'none'
    });
    
    this.drag.mode = hitResult.hit;
    this.drag.idx = hitResult.idx;
    this.drag.handle = hitResult.handle || null;
    this.drag.start = point;
    
    // 智能 touch-action 控制
    if (hitResult.idx >= 0) {
      // 命中物件：阻止滾動，啟用拖拉
      console.log('🚫 [TouchStart] 新增 dragging 類別，阻止滾動');
      this.canvas.classList.add('dragging');
      e.preventDefault(); // 阻止預設觸控行為
    } else {
      // 未命中：允許滾動
      console.log('✅ [TouchStart] 移除 dragging 類別，允許滾動');
      this.canvas.classList.remove('dragging');
    }
    
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
  // Touch 移動
  private onTouchMove(e: TouchEvent): void {
    if (this.drag.idx < 0 || this.drag.mode === 'none') return;
    if (e.touches.length !== 1) return; // 只處理單點觸控
    
    const touch = e.touches[0];
    const point = this.canvasPointFromTouch(touch);
    
    console.log('👆 [TouchMove] 拖拽進行中', {
      touchId: touch.identifier,
      coordinates: point,
      dragMode: this.drag.mode,
      dragIdx: this.drag.idx
    });
    
    // 除錯記錄（只在拖拉時記錄，避免過多日誌）
    this.touchDebug.logTouchEvent({
      eventType: 'touchmove',
      pointerCount: e.touches.length,
      coordinates: [point],
      hitResult: 'dragging',
      dragMode: this.drag.mode
    });
    
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
  // Touch 結束
  private onTouchEnd(e: TouchEvent): void {
    console.log('👆 [TouchEnd] 觸控結束', {
      remainingTouches: e.touches.length,
      wasDragging: this.drag.mode !== 'none',
      dragMode: this.drag.mode,
      dragIdx: this.drag.idx
    });
    
    // 除錯記錄
    this.touchDebug.logTouchEvent({
      eventType: 'touchend',
      pointerCount: e.touches.length,
      coordinates: [],
      hitResult: 'released',
      dragMode: this.drag.mode
    });
    
    // 清除拖拉狀態
    console.log('🧹 [TouchEnd] 清除 dragging 類別，恢復滾動');
    this.canvas.classList.remove('dragging');
    
    this.drag.mode = 'none';
    this.drag.idx = -1;
    this.drag.startOv = null;
    this.drag.handle = null;
  }

  // Touch座標轉換
  private canvasPointFromTouch(touch: Touch): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  // Mouse座標轉換
  private canvasPointFromMouse(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  // 滑鼠開始（桌面環境）
  private onMouseDown(e: MouseEvent): void {
    const point = this.canvasPointFromMouse(e);
    const hitResult = this.overlayManager.hitTest(point);
    
    console.log('🖱️ [MouseDown] 滑鼠開始', {
      coordinates: point,
      hitTest: hitResult.hit,
      button: e.button
    });
    
    // 只處理左鍵
    if (e.button !== 0) return;
    
    this.touchDebug.logTouchEvent({
      eventType: 'mousedown',
      pointerCount: 1,
      coordinates: [point],
      hitResult: hitResult.hit,
      dragMode: 'none'
    });
    
    this.drag.mode = hitResult.hit;
    this.drag.idx = hitResult.idx;
    this.drag.handle = hitResult.handle || null;
    this.drag.start = point;
    
    if (hitResult.idx >= 0) {
      this.canvas.classList.add('dragging');
      this.overlayManager.setSelectedIndex(hitResult.idx);
      this.refreshOverlayListCallback();
      this.syncOverlayControlsCallback();
      
      const overlay = this.overlayManager.getSelectedOverlay();
      if (overlay) {
        this.drag.startOv = JSON.parse(JSON.stringify(overlay));
        if (this.drag.mode === 'rotate') {
          this.drag.startAngle = Math.atan2(point.y - overlay.y, point.x - overlay.x);
        }
      }
    } else {
      this.canvas.classList.remove('dragging');
      this.overlayManager.setSelectedIndex(-1);
      this.refreshOverlayListCallback();
      this.syncOverlayControlsCallback();
    }
    
    this.updateCallback();
  }

  // 滑鼠移動（桌面環境）
  private onMouseMove(e: MouseEvent): void {
    if (this.drag.idx < 0 || this.drag.mode === 'none') return;
    
    const point = this.canvasPointFromMouse(e);
    
    this.touchDebug.logTouchEvent({
      eventType: 'mousemove',
      pointerCount: 1,
      coordinates: [point],
      hitResult: 'dragging',
      dragMode: this.drag.mode
    });
    
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

  // 滑鼠結束（桌面環境）
  private onMouseUp(e: MouseEvent): void {
    console.log('🖱️ [MouseUp] 滑鼠結束', {
      wasDragging: this.drag.mode !== 'none',
      button: e.button
    });
    
    this.touchDebug.logTouchEvent({
      eventType: 'mouseup',
      pointerCount: 0,
      coordinates: [],
      hitResult: 'released',
      dragMode: this.drag.mode
    });
    
    this.canvas.classList.remove('dragging');
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
