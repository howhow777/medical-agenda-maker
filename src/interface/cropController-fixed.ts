import { OverlayManager } from '../logic/overlayManager.js';
import { Overlay } from '../assets/types.js';

// 裁切狀態
interface CropState {
  isActive: boolean;
  selectedIndex: number;
  cropRect: { x: number; y: number; w: number; h: number };
  isDragging: boolean;
  dragHandle: string | null;
  dragStart: { x: number; y: number };
  originalRect: { x: number; y: number; w: number; h: number };
}

// 推桿定義
interface CropHandle {
  name: string;
  x: number;
  y: number;
  cursor: string;
}

/**
 * 裁切控制器 - Bug修復版本
 */
export class CropController {
  private overlayManager: OverlayManager;
  private canvas: HTMLCanvasElement;
  private updateCallback: () => void;
  private cropState: CropState;
  
  // UI 按鈕元素
  private cropToggleBtn: HTMLButtonElement | null = null;
  private cropApplyBtn: HTMLButtonElement | null = null;
  private cropCancelBtn: HTMLButtonElement | null = null;
  
  // 事件監聽器引用
  private cropMouseDown: (e: MouseEvent) => void;
  private cropMouseMove: (e: MouseEvent) => void;
  private cropMouseUp: (e: MouseEvent) => void;
  
  constructor(
    canvas: HTMLCanvasElement, 
    overlayManager: OverlayManager, 
    updateCallback: () => void
  ) {
    this.canvas = canvas;
    this.overlayManager = overlayManager;
    this.updateCallback = updateCallback;
    
    this.cropState = {
      isActive: false,
      selectedIndex: -1,
      cropRect: { x: 0, y: 0, w: 0, h: 0 },
      isDragging: false,
      dragHandle: null,
      dragStart: { x: 0, y: 0 },
      originalRect: { x: 0, y: 0, w: 0, h: 0 }
    };
    
    // 綁定事件處理器
    this.cropMouseDown = this.onCropMouseDown.bind(this);
    this.cropMouseMove = this.onCropMouseMove.bind(this);
    this.cropMouseUp = this.onCropMouseUp.bind(this);
    
    this.initializeUI();
    this.bindEvents();
    console.log('✅ CropController Bug修復版本初始化完成');
  }
  
  /**
   * 初始化裁切UI按鈕
   */
  private initializeUI(): void {
    const buttonRow = document.querySelector('#centerOverlay')?.parentElement;
    if (!buttonRow) {
      console.error('❌ 找不到PNG控制按鈕區域');
      return;
    }
    
    const cropRow = document.createElement('div');
    cropRow.className = 'row crop-controls';
    cropRow.style.marginTop = '6px';
    cropRow.style.display = 'none';
    cropRow.innerHTML = `
      <button class="btn btn-primary" id="cropToggle" title="進入裁切模式">
        ✂️ 裁切
      </button>
      <button class="btn btn-success crop-action" id="cropApply" title="套用裁切" style="display: none;">
        ✅ 套用
      </button>
      <button class="btn btn-secondary crop-action" id="cropCancel" title="取消裁切" style="display: none;">
        ❌ 取消
      </button>
    `;
    
    buttonRow.parentNode?.insertBefore(cropRow, buttonRow.nextSibling);
    
    this.cropToggleBtn = document.getElementById('cropToggle') as HTMLButtonElement;
    this.cropApplyBtn = document.getElementById('cropApply') as HTMLButtonElement;
    this.cropCancelBtn = document.getElementById('cropCancel') as HTMLButtonElement;
    
    console.log('✅ 裁切UI按鈕初始化完成');
  }
  
  /**
   * 綁定基本事件監聽
   */
  private bindEvents(): void {
    this.cropToggleBtn?.addEventListener('click', () => {
      console.log('🎯 裁切按鈕被點擊');
      this.toggleCropMode();
    });
    
    this.cropApplyBtn?.addEventListener('click', () => {
      console.log('✅ 套用按鈕被點擊');
      this.applyCrop();
    });
    
    this.cropCancelBtn?.addEventListener('click', () => {
      console.log('❌ 取消按鈕被點擊');
      this.cancelCrop();
    });
    
    this.setupOverlaySelectionListener();
    console.log('✅ 基本事件綁定完成');
  }
  
  /**
   * 動態綁定裁切事件 - 只在裁切模式時啟用
   */
  private bindCropEvents(): void {
    // 使用 capture 模式和最高優先級來攔截事件
    this.canvas.addEventListener('mousedown', this.cropMouseDown, { capture: true });
    this.canvas.addEventListener('mousemove', this.cropMouseMove, { capture: true });
    this.canvas.addEventListener('mouseup', this.cropMouseUp, { capture: true });
    
    console.log('🔒 裁切事件已綁定（capture模式）');
  }
  
  /**
   * 移除裁切事件 - 退出裁切模式時清理
   */
  private unbindCropEvents(): void {
    this.canvas.removeEventListener('mousedown', this.cropMouseDown, { capture: true });
    this.canvas.removeEventListener('mousemove', this.cropMouseMove, { capture: true });
    this.canvas.removeEventListener('mouseup', this.cropMouseUp, { capture: true });
    
    console.log('🔓 裁切事件已移除');
  }
  
  /**
   * 裁切模式滑鼠按下事件 - 修復版本
   */
  private onCropMouseDown(e: MouseEvent): void {
    if (!this.cropState.isActive || e.button !== 0) return;
    
    const point = this.canvasPointFromMouse(e);
    const hitResult = this.cropHitTest(point);
    
    if (hitResult.hit) {
      console.log('🎯 裁切推桿被點擊:', hitResult.handle);
      
      // 立即阻止事件傳播
      e.preventDefault();
      e.stopImmediatePropagation();
      
      this.cropState.isDragging = true;
      this.cropState.dragHandle = hitResult.handle;
      this.cropState.dragStart = point;
      this.cropState.originalRect = { ...this.cropState.cropRect };
      
      // 設定游標樣式
      this.canvas.style.cursor = this.getCursorForHandle(hitResult.handle);
      
      // 事件已阻止
    }
  }
  
  /**
   * 裁切模式滑鼠移動事件 - 修復版本
   */
  private onCropMouseMove(e: MouseEvent): void {
    if (!this.cropState.isActive) return;
    
    const point = this.canvasPointFromMouse(e);
    
    if (this.cropState.isDragging && this.cropState.dragHandle) {
      // 拖拉推桿，調整裁切區域
      this.updateCropRect(point);
      this.updateCallback();
      
      // 完全阻止事件傳播
      e.preventDefault();
      e.stopImmediatePropagation();
      // 事件已阻止
    } else {
      // 懸停檢測，更新游標
      const hitResult = this.cropHitTest(point);
      if (hitResult.hit) {
        this.canvas.style.cursor = this.getCursorForHandle(hitResult.handle);
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }
  }
  
  /**
   * 裁切模式滑鼠釋放事件 - 修復版本
   */
  private onCropMouseUp(e: MouseEvent): void {
    if (!this.cropState.isActive) return;
    
    if (this.cropState.isDragging) {
      console.log('✅ 裁切拖拉結束');
      
      this.cropState.isDragging = false;
      this.cropState.dragHandle = null;
      this.canvas.style.cursor = 'default';
      
      e.preventDefault();
      e.stopImmediatePropagation();
      // 事件已阻止
    }
  }
  
  /**
   * 裁切推桿碰撞檢測 - 修復推桿位置計算
   */
  private cropHitTest(point: { x: number; y: number }): { hit: boolean; handle: string } {
    if (!this.cropState.isActive || this.cropState.selectedIndex < 0) {
      return { hit: false, handle: '' };
    }
    
    const overlay = this.overlayManager.getOverlays()[this.cropState.selectedIndex];
    if (!overlay) return { hit: false, handle: '' };
    
    const handles = this.getCropHandles(overlay);
    
    for (const handle of handles) {
      const globalHandle = this.transformPoint(overlay, handle);
      const distance = Math.hypot(point.x - globalHandle.x, point.y - globalHandle.y);
      
      if (distance <= 15) {
        console.log('🎯 推桿命中:', handle.name, '距離:', Math.round(distance));
        return { hit: true, handle: handle.name };
      }
    }
    
    return { hit: false, handle: '' };
  }
  
  /**
   * 獲取裁切推桿位置 - 修復計算邏輯
   */
  private getCropHandles(overlay: Overlay): CropHandle[] {
    const rect = this.cropState.cropRect;
    const hw = overlay.w / 2;
    const hh = overlay.h / 2;
    
    return [
      { name: 'top', x: -hw + rect.x + rect.w / 2, y: -hh + rect.y, cursor: 'n-resize' },
      { name: 'right', x: -hw + rect.x + rect.w, y: -hh + rect.y + rect.h / 2, cursor: 'e-resize' },
      { name: 'bottom', x: -hw + rect.x + rect.w / 2, y: -hh + rect.y + rect.h, cursor: 's-resize' },
      { name: 'left', x: -hw + rect.x, y: -hh + rect.y + rect.h / 2, cursor: 'w-resize' }
    ];
  }
  
  /**
   * 更新裁切區域 - 修復拖拉邏輯
   */
  private updateCropRect(currentPoint: { x: number; y: number }): void {
    if (!this.cropState.dragHandle) return;
    
    const overlay = this.overlayManager.getOverlays()[this.cropState.selectedIndex];
    if (!overlay) return;
    
    const localCurrent = this.inverseTransformPoint(overlay, currentPoint);
    const localStart = this.inverseTransformPoint(overlay, this.cropState.dragStart);
    
    const deltaX = localCurrent.x - localStart.x;
    const deltaY = localCurrent.y - localStart.y;
    
    const newRect = { ...this.cropState.originalRect };
    
    switch (this.cropState.dragHandle) {
      case 'top':
        newRect.y += deltaY;
        newRect.h -= deltaY;
        break;
      case 'right':
        newRect.w += deltaX;
        break;
      case 'bottom':
        newRect.h += deltaY;
        break;
      case 'left':
        newRect.x += deltaX;
        newRect.w -= deltaX;
        break;
    }
    
    // 嚴格的邊界限制
    newRect.x = Math.max(0, Math.min(newRect.x, overlay.w - 20));
    newRect.y = Math.max(0, Math.min(newRect.y, overlay.h - 20));
    newRect.w = Math.max(20, Math.min(newRect.w, overlay.w - newRect.x));
    newRect.h = Math.max(20, Math.min(newRect.h, overlay.h - newRect.y));
    
    this.cropState.cropRect = newRect;
    
    console.log('📐 裁切區域更新:', {
      handle: this.cropState.dragHandle,
      rect: this.cropState.cropRect
    });
  }
  
  /**
   * 獲取推桿對應的游標樣式
   */
  private getCursorForHandle(handle: string): string {
    const cursors: { [key: string]: string } = {
      'top': 'n-resize',
      'right': 'e-resize', 
      'bottom': 's-resize',
      'left': 'w-resize'
    };
    return cursors[handle] || 'default';
  }
  
  /**
   * 座標轉換：本地 → 全域
   */
  private transformPoint(overlay: Overlay, localPoint: { x: number; y: number }): { x: number; y: number } {
    const cos = Math.cos(overlay.rotation);
    const sin = Math.sin(overlay.rotation);
    
    const scaledX = localPoint.x * overlay.scaleX;
    const scaledY = localPoint.y * overlay.scaleY;
    
    return {
      x: overlay.x + (scaledX * cos - scaledY * sin),
      y: overlay.y + (scaledX * sin + scaledY * cos)
    };
  }
  
  /**
   * 座標轉換：全域 → 本地
   */
  private inverseTransformPoint(overlay: Overlay, globalPoint: { x: number; y: number }): { x: number; y: number } {
    const cos = Math.cos(-overlay.rotation);
    const sin = Math.sin(-overlay.rotation);
    
    const relativeX = globalPoint.x - overlay.x;
    const relativeY = globalPoint.y - overlay.y;
    
    const rotatedX = relativeX * cos - relativeY * sin;
    const rotatedY = relativeX * sin + relativeY * cos;
    
    return {
      x: rotatedX / overlay.scaleX,
      y: rotatedY / overlay.scaleY
    };
  }
  
  /**
   * 滑鼠座標轉換
   */
  private canvasPointFromMouse(e: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }
  
  /**
   * 監聽PNG選取狀態變化
   */
  private setupOverlaySelectionListener(): void {
    setInterval(() => {
      const selectedIndex = this.overlayManager.getSelectedIndex();
      const cropControlsRow = document.querySelector('.crop-controls') as HTMLElement;
      
      if (selectedIndex >= 0 && cropControlsRow) {
        if (cropControlsRow.style.display !== 'flex') {
          cropControlsRow.style.display = 'flex';
          console.log('🎯 PNG選中，顯示裁切按鈕');
        }
      } else if (cropControlsRow && !this.cropState.isActive) {
        if (cropControlsRow.style.display !== 'none') {
          cropControlsRow.style.display = 'none';
          console.log('🎯 PNG未選中，隱藏裁切按鈕');
        }
      }
    }, 100);
  }
  
  /**
   * 切換裁切模式
   */
  private toggleCropMode(): void {
    const selectedIndex = this.overlayManager.getSelectedIndex();
    if (selectedIndex < 0) {
      console.warn('⚠️ 沒有選中的PNG圖層');
      return;
    }
    
    if (this.cropState.isActive) {
      this.exitCropMode();
    } else {
      this.enterCropMode(selectedIndex);
    }
  }
  
  /**
   * 進入裁切模式 - 修復版本
   */
  private enterCropMode(selectedIndex: number): void {
    console.log('✂️ 進入裁切模式');
    
    const overlay = this.overlayManager.getOverlays()[selectedIndex];
    if (!overlay) return;
    
    this.cropState.isActive = true;
    this.cropState.selectedIndex = selectedIndex;
    
    this.cropState.cropRect = {
      x: 0,
      y: 0, 
      w: overlay.w,
      h: overlay.h
    };
    this.cropState.originalRect = { ...this.cropState.cropRect };
    
    this.bindCropEvents();
    this.updateCropUI(true);
    this.updateCallback();
  }
  
  /**
   * 退出裁切模式 - 修復版本
   */
  private exitCropMode(): void {
    console.log('🚪 退出裁切模式');
    
    this.cropState.isActive = false;
    this.cropState.selectedIndex = -1;
    this.cropState.isDragging = false;
    this.canvas.style.cursor = 'default';
    
    this.unbindCropEvents();
    this.updateCropUI(false);
    this.updateCallback();
  }
  
  /**
   * 套用裁切
   */
  private applyCrop(): void {
    console.log('✅ 套用裁切');
    
    const cropInfo = {
      裁切區域: this.cropState.cropRect,
      原始尺寸: {
        w: this.overlayManager.getOverlays()[this.cropState.selectedIndex]?.w,
        h: this.overlayManager.getOverlays()[this.cropState.selectedIndex]?.h
      }
    };
    
    alert('裁切區域已確定！\n\n' + JSON.stringify(cropInfo, null, 2));
    this.exitCropMode();
  }
  
  /**
   * 取消裁切
   */
  private cancelCrop(): void {
    console.log('❌ 取消裁切');
    this.exitCropMode();
  }
  
  /**
   * 更新裁切模式的UI狀態
   */
  private updateCropUI(isCropMode: boolean): void {
    if (this.cropToggleBtn) {
      this.cropToggleBtn.textContent = isCropMode ? '🚪 退出裁切' : '✂️ 裁切';
      this.cropToggleBtn.title = isCropMode ? '退出裁切模式' : '進入裁切模式';
    }
    
    const cropActions = document.querySelectorAll('.crop-action') as NodeListOf<HTMLElement>;
    cropActions.forEach(btn => {
      btn.style.display = isCropMode ? 'inline-block' : 'none';
    });
  }
  
  /**
   * 檢查是否處於裁切模式
   */
  public isInCropMode(): boolean {
    return this.cropState.isActive;
  }
  
  /**
   * 獲取當前裁切狀態
   */
  public getCropState(): Readonly<CropState> {
    return { ...this.cropState };
  }
  
  /**
   * 繪製裁切界面 - 修復渲染問題
   */
  public drawCropInterface(ctx: CanvasRenderingContext2D): void {
    if (!this.cropState.isActive || this.cropState.selectedIndex < 0) {
      return;
    }
    
    const overlay = this.overlayManager.getOverlays()[this.cropState.selectedIndex];
    if (!overlay) return;
    
    ctx.save();
    
    // 轉換到overlay的座標系統
    ctx.translate(overlay.x, overlay.y);
    ctx.rotate(overlay.rotation);
    ctx.scale(overlay.scaleX, overlay.scaleY);
    
    const rect = this.cropState.cropRect;
    const hw = overlay.w / 2;
    const hh = overlay.h / 2;
    
    // 1. 畫裁切框（紅色虛線）
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    
    ctx.strokeRect(
      -hw + rect.x,
      -hh + rect.y,
      rect.w,
      rect.h
    );
    
    // 2. 畫半透明遮罩
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    
    if (rect.y > 0) {
      ctx.fillRect(-hw, -hh, overlay.w, rect.y);
    }
    const bottomY = rect.y + rect.h;
    if (bottomY < overlay.h) {
      ctx.fillRect(-hw, -hh + bottomY, overlay.w, overlay.h - bottomY);
    }
    if (rect.x > 0) {
      ctx.fillRect(-hw, -hh + rect.y, rect.x, rect.h);
    }
    const rightX = rect.x + rect.w;
    if (rightX < overlay.w) {
      ctx.fillRect(-hw + rightX, -hh + rect.y, overlay.w - rightX, rect.h);
    }
    
    // 3. 畫裁切推桿
    const handles = this.getCropHandles(overlay);
    
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    
    handles.forEach(handle => {
      ctx.beginPath();
      ctx.arc(handle.x, handle.y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      if (this.cropState.isDragging && this.cropState.dragHandle === handle.name) {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(handle.x, handle.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
      }
    });
    
    // 4. 畫指示文字
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 3;
    ctx.fillText('✂️ 拖拉推桿調整裁切區域', 0, -hh - 30);
    
    ctx.restore();
  }
}
