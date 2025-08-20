export class CanvasInteractions {
    constructor(canvas, overlayManager, updateCallback, syncOverlayControlsCallback, refreshOverlayListCallback) {
        this.canvas = canvas;
        this.updateCallback = updateCallback;
        this.syncOverlayControlsCallback = syncOverlayControlsCallback;
        this.refreshOverlayListCallback = refreshOverlayListCallback;
        this.drag = {
            mode: 'none',
            idx: -1,
            start: { x: 0, y: 0 },
            startOv: null,
            handle: null,
            startAngle: 0,
            cropMode: false
        };
        this.overlayManager = overlayManager;
        this.bindEvents();
    }
    // 綁定 Canvas 事件
    bindEvents() {
        this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this));
        this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
        this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
        this.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this));
        this.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    }
    // 指標按下
    onPointerDown(e) {
        this.canvas.setPointerCapture(e.pointerId);
        const point = this.canvasPoint(e);
        const hitResult = this.overlayManager.hitTest(point);
        this.drag.mode = hitResult.hit;
        this.drag.idx = hitResult.idx;
        this.drag.handle = hitResult.handle || null;
        this.drag.start = point;
        this.drag.cropMode = (hitResult.hit === 'crop');
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
        }
        else {
            this.overlayManager.setSelectedIndex(-1);
            this.refreshOverlayListCallback();
            this.syncOverlayControlsCallback();
        }
        this.updateCallback();
    }
    // 指標移動
    onPointerMove(e) {
        if (this.drag.idx < 0 || this.drag.mode === 'none')
            return;
        const point = this.canvasPoint(e);
        const overlay = this.overlayManager.getOverlays()[this.drag.idx];
        if (!overlay || !this.drag.startOv)
            return;
        if (this.drag.cropMode) {
            // 裁切模式：處理裁切拖拽
            this.handleCropping(overlay, point);
        }
        else {
            // 正常模式：原有的拖拽邏輯
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
    }
    // 處理縮放
    handleScaling(overlay, point) {
        if (!this.drag.startOv)
            return;
        const localPoint = this.overlayManager.toLocal(overlay, point);
        const startSize = this.overlayManager.getOverlaySize(this.drag.startOv);
        const hw0 = startSize.w / 2;
        const hh0 = startSize.h / 2;
        let scaleX = this.drag.startOv.scaleX;
        let scaleY = this.drag.startOv.scaleY;
        const lock = overlay.lockAspect;
        function clamp(v) {
            return Math.max(0.05, Math.min(50, v));
        }
        switch (this.drag.handle) {
            case 'n':
            case 's':
                if (lock) {
                    const ry = Math.abs(localPoint.y) / hh0;
                    scaleX = clamp(this.drag.startOv.scaleX * ry);
                    scaleY = scaleX;
                }
                else {
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
                }
                else {
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
                }
                else {
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
    onPointerUp(e) {
        this.drag.mode = 'none';
        this.drag.idx = -1;
        this.drag.startOv = null;
        this.drag.handle = null;
        this.drag.cropMode = false;
    }
    // 處理裁切拖拽
    handleCropping(overlay, point) {
        if (!this.drag.handle || !this.drag.startOv)
            return;
        console.log('🎯 處理裁切拖拽');
        console.log('   控制點:', this.drag.handle);
        console.log('   滑鼠位置:', point);
        console.log('   開始裁切區域:', this.drag.startOv.crop);
        // 暫時使用更簡單的邏輯來測試
        const startCrop = this.drag.startOv.crop;
        let newCrop = { ...startCrop };
        // 先使用最簡單的測試邏輯
        switch (this.drag.handle) {
            case 'e': // 右邊
                newCrop.w = Math.max(10, startCrop.w - 50); // 測試：每次減少50像素
                break;
        }
        console.log('   新裁切區域:', newCrop);
        overlay.crop = newCrop;
        this.updateCallback();
    }
    // 滾輪縮放
    onWheel(e) {
        const overlay = this.overlayManager.getSelectedOverlay();
        if (!overlay)
            return;
        e.preventDefault();
        const delta = (e.deltaY < 0) ? 1.06 : 0.94;
        overlay.scaleX = Math.max(0.05, Math.min(20, overlay.scaleX * delta));
        overlay.scaleY = overlay.lockAspect ? overlay.scaleX : Math.max(0.05, Math.min(20, overlay.scaleY * delta));
        this.updateCallback();
    }
    // 取得 Canvas 相對座標
    canvasPoint(evt) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }
}
//# sourceMappingURL=canvasInteractions.js.map