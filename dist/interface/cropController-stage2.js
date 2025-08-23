/**
 * 裁切控制器 - 階段2：完整拖拉功能
 */
export class CropController {
    constructor(canvas, overlayManager, updateCallback) {
        // UI 按鈕元素
        this.cropToggleBtn = null;
        this.cropApplyBtn = null;
        this.cropCancelBtn = null;
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
        this.initializeUI();
        this.bindEvents();
        this.bindCropEvents(); // 新增：裁切專用事件
        console.log('✅ CropController 階段2功能初始化完成');
    }
    /**
     * 初始化裁切UI按鈕
     */
    initializeUI() {
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
        this.cropToggleBtn = document.getElementById('cropToggle');
        this.cropApplyBtn = document.getElementById('cropApply');
        this.cropCancelBtn = document.getElementById('cropCancel');
        console.log('✅ 裁切UI按鈕初始化完成');
    }
    /**
     * 綁定基本事件監聽
     */
    bindEvents() {
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
     * 綁定裁切專用的拖拉事件 (新功能)
     */
    bindCropEvents() {
        // 滑鼠事件（桌面）
        this.canvas.addEventListener('mousedown', (e) => this.onCropMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onCropMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onCropMouseUp(e));
        // 觸控事件（手機）
        this.canvas.addEventListener('touchstart', (e) => this.onCropTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onCropTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onCropTouchEnd(e));
        console.log('✅ 裁切拖拉事件綁定完成');
    }
    /**
     * 裁切模式滑鼠按下事件
     */
    onCropMouseDown(e) {
        if (!this.cropState.isActive || e.button !== 0)
            return;
        const point = this.canvasPointFromMouse(e);
        const hitResult = this.cropHitTest(point);
        if (hitResult.hit) {
            console.log('🎯 裁切推桿被點擊:', hitResult.handle);
            this.cropState.isDragging = true;
            this.cropState.dragHandle = hitResult.handle;
            this.cropState.dragStart = point;
            this.cropState.originalRect = { ...this.cropState.cropRect };
            // 設定游標樣式
            this.canvas.style.cursor = this.getCursorForHandle(hitResult.handle);
            // 阻止事件冒泡，避免觸發現有的拖拉邏輯
            e.preventDefault();
            e.stopPropagation();
        }
    }
    /**
     * 裁切模式滑鼠移動事件
     */
    onCropMouseMove(e) {
        if (!this.cropState.isActive)
            return;
        const point = this.canvasPointFromMouse(e);
        if (this.cropState.isDragging && this.cropState.dragHandle) {
            // 拖拉推桿，調整裁切區域
            this.updateCropRect(point);
            this.updateCallback(); // 觸發重繪
            e.preventDefault();
            e.stopPropagation();
        }
        else {
            // 懸停檢測，更新游標
            const hitResult = this.cropHitTest(point);
            this.canvas.style.cursor = hitResult.hit ?
                this.getCursorForHandle(hitResult.handle) : 'default';
        }
    }
    /**
     * 裁切模式滑鼠釋放事件
     */
    onCropMouseUp(e) {
        if (!this.cropState.isActive || !this.cropState.isDragging)
            return;
        console.log('✅ 裁切拖拉結束');
        this.cropState.isDragging = false;
        this.cropState.dragHandle = null;
        this.canvas.style.cursor = 'default';
        e.preventDefault();
        e.stopPropagation();
    }
    /**
     * 裁切模式觸控開始事件
     */
    onCropTouchStart(e) {
        if (!this.cropState.isActive || e.touches.length !== 1)
            return;
        const point = this.canvasPointFromTouch(e.touches[0]);
        const hitResult = this.cropHitTest(point);
        if (hitResult.hit) {
            console.log('📱 裁切推桿被觸控:', hitResult.handle);
            this.cropState.isDragging = true;
            this.cropState.dragHandle = hitResult.handle;
            this.cropState.dragStart = point;
            this.cropState.originalRect = { ...this.cropState.cropRect };
            e.preventDefault();
            e.stopPropagation();
        }
    }
    /**
     * 裁切模式觸控移動事件
     */
    onCropTouchMove(e) {
        if (!this.cropState.isActive || !this.cropState.isDragging || e.touches.length !== 1)
            return;
        const point = this.canvasPointFromTouch(e.touches[0]);
        this.updateCropRect(point);
        this.updateCallback();
        e.preventDefault();
        e.stopPropagation();
    }
    /**
     * 裁切模式觸控結束事件
     */
    onCropTouchEnd(e) {
        if (!this.cropState.isActive || !this.cropState.isDragging)
            return;
        console.log('📱 裁切觸控結束');
        this.cropState.isDragging = false;
        this.cropState.dragHandle = null;
        e.preventDefault();
        e.stopPropagation();
    }
    /**
     * 裁切推桿碰撞檢測
     */
    cropHitTest(point) {
        if (!this.cropState.isActive || this.cropState.selectedIndex < 0) {
            return { hit: false, handle: '' };
        }
        const overlay = this.overlayManager.getOverlays()[this.cropState.selectedIndex];
        if (!overlay)
            return { hit: false, handle: '' };
        const handles = this.getCropHandles(overlay);
        for (const handle of handles) {
            const globalHandle = this.transformPoint(overlay, handle);
            const distance = Math.hypot(point.x - globalHandle.x, point.y - globalHandle.y);
            if (distance <= 12) { // 12px 點擊範圍
                return { hit: true, handle: handle.name };
            }
        }
        return { hit: false, handle: '' };
    }
    /**
     * 獲取裁切推桿位置
     */
    getCropHandles(overlay) {
        const rect = this.cropState.cropRect;
        const hw = overlay.w / 2;
        const hh = overlay.h / 2;
        // 裁切框的邊界推桿（4個邊的中點）
        return [
            { name: 'top', x: 0, y: -hh + rect.y, cursor: 'n-resize' },
            { name: 'right', x: hw - rect.w + rect.x, y: 0, cursor: 'e-resize' },
            { name: 'bottom', x: 0, y: hh - rect.h + rect.y, cursor: 's-resize' },
            { name: 'left', x: -hw + rect.x, y: 0, cursor: 'w-resize' }
        ];
    }
    /**
     * 更新裁切區域
     */
    updateCropRect(currentPoint) {
        if (!this.cropState.dragHandle)
            return;
        const overlay = this.overlayManager.getOverlays()[this.cropState.selectedIndex];
        if (!overlay)
            return;
        // 將當前點轉換到overlay本地座標系統
        const localCurrent = this.inverseTransformPoint(overlay, currentPoint);
        const localStart = this.inverseTransformPoint(overlay, this.cropState.dragStart);
        const deltaX = localCurrent.x - localStart.x;
        const deltaY = localCurrent.y - localStart.y;
        const newRect = { ...this.cropState.originalRect };
        // 根據推桿類型調整裁切區域
        switch (this.cropState.dragHandle) {
            case 'top':
                newRect.y += deltaY;
                newRect.h -= deltaY;
                break;
            case 'right':
                newRect.w -= deltaX;
                break;
            case 'bottom':
                newRect.h -= deltaY;
                break;
            case 'left':
                newRect.x += deltaX;
                newRect.w -= deltaX;
                break;
        }
        // 限制裁切區域在圖片範圍內
        newRect.x = Math.max(0, Math.min(newRect.x, overlay.w - 10));
        newRect.y = Math.max(0, Math.min(newRect.y, overlay.h - 10));
        newRect.w = Math.max(10, Math.min(newRect.w, overlay.w - newRect.x));
        newRect.h = Math.max(10, Math.min(newRect.h, overlay.h - newRect.y));
        this.cropState.cropRect = newRect;
        console.log('📐 裁切區域更新:', this.cropState.cropRect);
    }
    /**
     * 獲取推桿對應的游標樣式
     */
    getCursorForHandle(handle) {
        const cursors = {
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
    transformPoint(overlay, localPoint) {
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
    inverseTransformPoint(overlay, globalPoint) {
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
    canvasPointFromMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    /**
     * 觸控座標轉換
     */
    canvasPointFromTouch(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
        };
    }
    /**
     * 監聽PNG選取狀態變化
     */
    setupOverlaySelectionListener() {
        setInterval(() => {
            const selectedIndex = this.overlayManager.getSelectedIndex();
            const cropControlsRow = document.querySelector('.crop-controls');
            if (selectedIndex >= 0 && cropControlsRow) {
                if (cropControlsRow.style.display !== 'flex') {
                    cropControlsRow.style.display = 'flex';
                    console.log('🎯 PNG選中，顯示裁切按鈕 - 索引:', selectedIndex);
                }
            }
            else if (cropControlsRow && !this.cropState.isActive) {
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
    toggleCropMode() {
        const selectedIndex = this.overlayManager.getSelectedIndex();
        if (selectedIndex < 0) {
            console.warn('⚠️ 沒有選中的PNG圖層');
            return;
        }
        if (this.cropState.isActive) {
            this.exitCropMode();
        }
        else {
            this.enterCropMode(selectedIndex);
        }
    }
    /**
     * 進入裁切模式
     */
    enterCropMode(selectedIndex) {
        console.log('✂️ 進入裁切模式 - PNG索引:', selectedIndex);
        const overlay = this.overlayManager.getOverlays()[selectedIndex];
        if (!overlay)
            return;
        this.cropState.isActive = true;
        this.cropState.selectedIndex = selectedIndex;
        // 初始化裁切區域為整個圖片
        this.cropState.cropRect = {
            x: 0,
            y: 0,
            w: overlay.w,
            h: overlay.h
        };
        this.cropState.originalRect = { ...this.cropState.cropRect };
        this.updateCropUI(true);
        this.updateCallback();
        console.log('✂️ 裁切模式已啟動');
    }
    /**
     * 退出裁切模式
     */
    exitCropMode() {
        console.log('🚪 退出裁切模式');
        this.cropState.isActive = false;
        this.cropState.selectedIndex = -1;
        this.cropState.isDragging = false;
        this.canvas.style.cursor = 'default';
        this.updateCropUI(false);
        this.updateCallback();
    }
    /**
     * 套用裁切
     */
    applyCrop() {
        console.log('✅ 套用裁切');
        // TODO: 階段3將實作實際圖片裁切
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
    cancelCrop() {
        console.log('❌ 取消裁切');
        this.exitCropMode();
    }
    /**
     * 更新裁切模式的UI狀態
     */
    updateCropUI(isCropMode) {
        if (this.cropToggleBtn) {
            this.cropToggleBtn.textContent = isCropMode ? '🚪 退出裁切' : '✂️ 裁切';
            this.cropToggleBtn.title = isCropMode ? '退出裁切模式' : '進入裁切模式';
        }
        const cropActions = document.querySelectorAll('.crop-action');
        cropActions.forEach(btn => {
            btn.style.display = isCropMode ? 'inline-block' : 'none';
        });
    }
    /**
     * 檢查是否處於裁切模式
     */
    isInCropMode() {
        return this.cropState.isActive;
    }
    /**
     * 獲取當前裁切狀態
     */
    getCropState() {
        return { ...this.cropState };
    }
    /**
     * 繪製裁切界面 - 增強版
     */
    drawCropInterface(ctx) {
        if (!this.cropState.isActive || this.cropState.selectedIndex < 0) {
            return;
        }
        const overlay = this.overlayManager.getOverlays()[this.cropState.selectedIndex];
        if (!overlay)
            return;
        ctx.save();
        // 轉換到overlay的座標系統
        ctx.translate(overlay.x, overlay.y);
        ctx.rotate(overlay.rotation);
        ctx.scale(overlay.scaleX, overlay.scaleY);
        // 1. 畫裁切框（紅色虛線）
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        const rect = this.cropState.cropRect;
        const hw = overlay.w / 2;
        const hh = overlay.h / 2;
        ctx.strokeRect(-hw + rect.x, -hh + rect.y, rect.w, rect.h);
        // 2. 畫半透明遮罩（裁切區域外）
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        // 上遮罩
        ctx.fillRect(-hw, -hh, overlay.w, rect.y);
        // 下遮罩
        ctx.fillRect(-hw, -hh + rect.y + rect.h, overlay.w, overlay.h - rect.y - rect.h);
        // 左遮罩
        ctx.fillRect(-hw, -hh + rect.y, rect.x, rect.h);
        // 右遮罩
        ctx.fillRect(-hw + rect.x + rect.w, -hh + rect.y, overlay.w - rect.x - rect.w, rect.h);
        // 3. 畫裁切推桿（白色圓點）
        const handles = this.getCropHandles(overlay);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 2;
        handles.forEach(handle => {
            ctx.beginPath();
            ctx.arc(handle.x, handle.y, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
        // 4. 畫裁切模式指示文字
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 3;
        ctx.fillText('✂️ 拖拉推桿調整裁切區域', 0, -hh - 25);
        ctx.restore();
    }
}
//# sourceMappingURL=cropController-stage2.js.map