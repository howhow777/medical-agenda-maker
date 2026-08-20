import { TouchDebugController } from './touchDebugController.js';
const TAP_MOVE_THRESHOLD = 10;
export function isTapGesture(start, end, threshold = TAP_MOVE_THRESHOLD) {
    return Math.hypot(end.x - start.x, end.y - start.y) <= threshold;
}
export function getPinchScale(startDistance, currentDistance) {
    if (startDistance <= 0 || !Number.isFinite(startDistance) || !Number.isFinite(currentDistance))
        return 1;
    return currentDistance / startDistance;
}
export function clampPosterViewZoom(value) {
    return Math.max(0.3, Math.min(3, value));
}
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
            startAngle: 0
        };
        this.outsideTouchStart = null;
        this.outsideTouchMoved = false;
        this.outsideMouseStart = null;
        this.outsideMouseMoved = false;
        this.pinch = null;
        this.viewZoom = 1;
        this.eventsBound = false;
        this.overlayManager = overlayManager;
        this.touchDebug = new TouchDebugController();
        this.applyViewZoom(this.viewZoom);
        this.bindEvents();
    }
    // 綁定 Canvas 事件
    bindEvents() {
        if (this.eventsBound)
            return;
        this.eventsBound = true;
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
        document.addEventListener('click', this.onDocumentClick.bind(this), true);
    }
    // 指標按下
    // Touch 開始
    onTouchStart(e) {
        if (e.touches.length >= 2) {
            this.beginPinch(e);
            return;
        }
        if (e.touches.length !== 1)
            return;
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
        }
        else {
            // 未命中：允許滾動
            console.log('✅ [TouchStart] 移除 dragging 類別，允許滾動');
            this.canvas.classList.remove('dragging');
        }
        if (hitResult.idx >= 0) {
            this.outsideTouchStart = null;
            this.outsideTouchMoved = false;
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
            // 手機捲動畫面通常從 Canvas 空白處開始。先保留選取，只有 touchend
            // 確認是短距離點按時才取消，避免捲動一開始就讓 PNG 失焦。
            this.outsideTouchStart = point;
            this.outsideTouchMoved = false;
        }
        this.updateCallback();
    }
    // 指標移動
    // Touch 移動
    onTouchMove(e) {
        if (this.pinch && e.touches.length >= 2) {
            const [first, second] = [e.touches[0], e.touches[1]];
            const clientCenter = this.midpoint({ x: first.clientX, y: first.clientY }, { x: second.clientX, y: second.clientY });
            const distance = Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
            const ratio = getPinchScale(this.pinch.startDistance, distance);
            const nextZoom = clampPosterViewZoom(this.pinch.startZoom * ratio);
            this.applyViewZoomAtAnchor(nextZoom, this.pinch.anchorCanvasPoint, clientCenter);
            e.preventDefault();
            return;
        }
        if (e.touches.length > 1)
            return;
        if (this.outsideTouchStart && e.touches.length === 1) {
            const point = this.canvasPointFromTouch(e.touches[0]);
            if (!isTapGesture(this.outsideTouchStart, point))
                this.outsideTouchMoved = true;
            return;
        }
        if (this.drag.idx < 0 || this.drag.mode === 'none')
            return;
        if (e.touches.length !== 1)
            return; // 只處理單點觸控
        const touch = e.touches[0];
        const point = this.canvasPointFromTouch(touch);
        e.preventDefault();
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
        if (!overlay || !this.drag.startOv)
            return;
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
    // Touch 結束
    onTouchEnd(e) {
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
        if (this.pinch) {
            if (e.touches.length >= 2)
                return;
            this.pinch = null;
            this.outsideTouchStart = null;
            this.outsideTouchMoved = false;
        }
        else if (this.outsideTouchStart && e.touches.length === 0) {
            const changedTouch = e.changedTouches[0];
            const endPoint = changedTouch ? this.canvasPointFromTouch(changedTouch) : this.outsideTouchStart;
            const shouldDeselect = e.type !== 'touchcancel'
                && !this.outsideTouchMoved
                && isTapGesture(this.outsideTouchStart, endPoint);
            this.outsideTouchStart = null;
            this.outsideTouchMoved = false;
            if (shouldDeselect) {
                this.overlayManager.setSelectedIndex(-1);
                this.refreshOverlayListCallback();
                this.syncOverlayControlsCallback();
                this.updateCallback();
            }
        }
        // 清除拖拉狀態
        console.log('🧹 [TouchEnd] 清除 dragging 類別，恢復滾動');
        this.canvas.classList.remove('dragging');
        this.drag.mode = 'none';
        this.drag.idx = -1;
        this.drag.startOv = null;
        this.drag.handle = null;
    }
    // Touch座標轉換
    canvasPointFromTouch(touch) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (touch.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (touch.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }
    // Mouse座標轉換
    canvasPointFromMouse(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }
    // 滑鼠開始（桌面環境）
    onMouseDown(e) {
        const point = this.canvasPointFromMouse(e);
        const hitResult = this.overlayManager.hitTest(point);
        console.log('🖱️ [MouseDown] 滑鼠開始', {
            coordinates: point,
            hitTest: hitResult.hit,
            button: e.button
        });
        // 只處理左鍵
        if (e.button !== 0)
            return;
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
            this.outsideMouseStart = null;
            this.outsideMouseMoved = false;
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
        }
        else {
            this.canvas.classList.remove('dragging');
            this.outsideMouseStart = point;
            this.outsideMouseMoved = false;
        }
        this.updateCallback();
    }
    // 滑鼠移動（桌面環境）
    onMouseMove(e) {
        if (this.outsideMouseStart) {
            const point = this.canvasPointFromMouse(e);
            if (!isTapGesture(this.outsideMouseStart, point))
                this.outsideMouseMoved = true;
            return;
        }
        if (this.drag.idx < 0 || this.drag.mode === 'none')
            return;
        const point = this.canvasPointFromMouse(e);
        this.touchDebug.logTouchEvent({
            eventType: 'mousemove',
            pointerCount: 1,
            coordinates: [point],
            hitResult: 'dragging',
            dragMode: this.drag.mode
        });
        const overlay = this.overlayManager.getOverlays()[this.drag.idx];
        if (!overlay || !this.drag.startOv)
            return;
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
    onMouseUp(e) {
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
        if (this.outsideMouseStart && e.button === 0) {
            const endPoint = this.canvasPointFromMouse(e);
            if (!this.outsideMouseMoved && isTapGesture(this.outsideMouseStart, endPoint)) {
                this.overlayManager.setSelectedIndex(-1);
                this.refreshOverlayListCallback();
                this.syncOverlayControlsCallback();
                this.updateCallback();
            }
        }
        this.outsideMouseStart = null;
        this.outsideMouseMoved = false;
        this.canvas.classList.remove('dragging');
        this.drag.mode = 'none';
        this.drag.idx = -1;
        this.drag.startOv = null;
        this.drag.handle = null;
    }
    // 滾輪縮放
    onWheel(e) {
        // 一般滾輪只負責頁面捲動；觸控板縮放（ctrl/meta + wheel）則縮放整張海報。
        if (!e.ctrlKey && !e.metaKey)
            return;
        e.preventDefault();
        const factor = Math.exp(-e.deltaY * 0.01);
        const anchorCanvasPoint = this.canvasPointFromClient(e.clientX, e.clientY);
        this.applyViewZoomAtAnchor(clampPosterViewZoom(this.viewZoom * factor), anchorCanvasPoint, { x: e.clientX, y: e.clientY });
    }
    // 取得 Canvas 相對座標
    canvasPoint(evt) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }
    beginPinch(e) {
        const firstPoint = this.canvasPointFromTouch(e.touches[0]);
        const secondPoint = this.canvasPointFromTouch(e.touches[1]);
        this.outsideTouchStart = null;
        this.outsideTouchMoved = false;
        this.drag.mode = 'view-pinch';
        this.drag.idx = -1;
        this.pinch = {
            startDistance: Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY),
            startZoom: this.viewZoom,
            anchorCanvasPoint: this.midpoint(firstPoint, secondPoint)
        };
        this.canvas.classList.add('dragging');
        e.preventDefault();
    }
    midpoint(a, b) {
        return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
    clampScale(value) {
        return Math.max(0.05, Math.min(50, value));
    }
    canvasPointFromClient(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (this.canvas.width / rect.width),
            y: (clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }
    applyViewZoomAtAnchor(zoom, anchorCanvasPoint, anchorClientPoint) {
        const scrollContainer = this.canvas.closest('.canvas-container');
        this.applyViewZoom(zoom);
        if (!scrollContainer)
            return;
        const rect = this.canvas.getBoundingClientRect();
        const anchoredClientX = rect.left + anchorCanvasPoint.x * (rect.width / this.canvas.width);
        const anchoredClientY = rect.top + anchorCanvasPoint.y * (rect.height / this.canvas.height);
        scrollContainer.scrollLeft += anchoredClientX - anchorClientPoint.x;
        scrollContainer.scrollTop += anchoredClientY - anchorClientPoint.y;
    }
    applyViewZoom(zoom) {
        this.viewZoom = clampPosterViewZoom(zoom);
        const scaledWidth = this.canvas.width * this.viewZoom;
        this.canvas.style.width = `${scaledWidth}px`;
        this.canvas.style.height = 'auto';
        this.canvas.style.minWidth = '0';
        const canvasArea = this.canvas.parentElement;
        if (canvasArea)
            canvasArea.style.width = `${scaledWidth}px`;
    }
    onDocumentClick(e) {
        const target = e.target;
        if (!(target instanceof Element) || target === this.canvas)
            return;
        if (target.closest('#overlayControlsPanel, .crop-controls'))
            return;
        if (this.overlayManager.getSelectedIndex() < 0)
            return;
        this.overlayManager.setSelectedIndex(-1);
        this.refreshOverlayListCallback();
        this.syncOverlayControlsCallback();
        this.updateCallback();
    }
    getViewZoom() {
        return this.viewZoom;
    }
}
//# sourceMappingURL=canvasInteractions.js.map