/**
 * 裁切控制器 - 完整功能版本
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
        console.log('✅ CropController 完整功能初始化完成');
    }
    /**
     * 初始化裁切UI按鈕
     */
    initializeUI() {
        // 找到PNG控制區域的按鈕行
        const buttonRow = document.querySelector('#centerOverlay')?.parentElement;
        if (!buttonRow) {
            console.error('❌ 找不到PNG控制按鈕區域');
            return;
        }
        // 在現有按鈕行下方新增裁切控制行
        const cropRow = document.createElement('div');
        cropRow.className = 'row crop-controls';
        cropRow.style.marginTop = '6px';
        cropRow.style.display = 'none'; // 預設隱藏
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
        // 插入到重設按鈕行後面
        buttonRow.parentNode?.insertBefore(cropRow, buttonRow.nextSibling);
        // 獲取按鈕引用
        this.cropToggleBtn = document.getElementById('cropToggle');
        this.cropApplyBtn = document.getElementById('cropApply');
        this.cropCancelBtn = document.getElementById('cropCancel');
        console.log('✅ 裁切UI按鈕初始化完成');
    }
    /**
     * 綁定事件監聽
     */
    bindEvents() {
        // 裁切按鈕點擊事件
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
        // 監聽PNG選取狀態變化
        this.setupOverlaySelectionListener();
        console.log('✅ 裁切事件綁定完成');
    }
    /**
     * 監聽PNG選取狀態變化
     */
    setupOverlaySelectionListener() {
        setInterval(() => {
            const selectedIndex = this.overlayManager.getSelectedIndex();
            const cropControlsRow = document.querySelector('.crop-controls');
            if (selectedIndex >= 0 && cropControlsRow) {
                // 有PNG被選中，顯示裁切按鈕
                if (cropControlsRow.style.display !== 'flex') {
                    cropControlsRow.style.display = 'flex';
                    console.log('🎯 PNG選中，顯示裁切按鈕 - 索引:', selectedIndex);
                }
            }
            else if (cropControlsRow && !this.cropState.isActive) {
                // 沒有PNG被選中且不在裁切模式，隱藏裁切按鈕
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
        if (!overlay) {
            console.error('❌ 無法獲取overlay');
            return;
        }
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
        // 更新UI狀態
        this.updateCropUI(true);
        // 觸發重繪
        this.updateCallback();
        console.log('✂️ 裁切模式已啟動，裁切區域:', this.cropState.cropRect);
    }
    /**
     * 退出裁切模式
     */
    exitCropMode() {
        console.log('🚪 退出裁切模式');
        this.cropState.isActive = false;
        this.cropState.selectedIndex = -1;
        this.cropState.isDragging = false;
        // 更新UI狀態
        this.updateCropUI(false);
        // 觸發重繪
        this.updateCallback();
    }
    /**
     * 套用裁切
     */
    applyCrop() {
        console.log('✅ 套用裁切');
        // TODO: 階段2將實作實際裁切邏輯
        alert('裁切功能即將實作！\n當前裁切區域: ' + JSON.stringify(this.cropState.cropRect, null, 2));
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
        console.log('🎯 UI狀態更新:', isCropMode ? '裁切模式' : '正常模式');
    }
    /**
     * 檢查是否處於裁切模式
     */
    isInCropMode() {
        return this.cropState.isActive;
    }
    /**
     * 獲取當前裁切狀態（供外部系統使用）
     */
    getCropState() {
        return { ...this.cropState };
    }
    /**
     * 繪製裁切界面（供posterRenderer調用）
     */
    drawCropInterface(ctx) {
        if (!this.cropState.isActive || this.cropState.selectedIndex < 0) {
            return;
        }
        const overlay = this.overlayManager.getOverlays()[this.cropState.selectedIndex];
        if (!overlay)
            return;
        console.log('🎨 繪製裁切界面 - overlay:', overlay.x, overlay.y);
        ctx.save();
        // 轉換到overlay的座標系統
        ctx.translate(overlay.x, overlay.y);
        ctx.rotate(overlay.rotation);
        ctx.scale(overlay.scaleX, overlay.scaleY);
        // 畫裁切框（紅色虛線）
        ctx.strokeStyle = '#ff4444';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 4]);
        ctx.strokeRect(-overlay.w / 2, -overlay.h / 2, overlay.w, overlay.h);
        // 畫裁切模式指示文字
        ctx.setLineDash([]);
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 3;
        ctx.fillText('✂️ 裁切模式', 0, -overlay.h / 2 - 25);
        ctx.restore();
    }
}
//# sourceMappingURL=cropController-full.js.map