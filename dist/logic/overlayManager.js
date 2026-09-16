import { OverlayProcessor } from './overlay-processor.js';
export const CANCER_MOTIF_SAFE_ZONE = { x: 560, y: 145, width: 200, height: 170 };
export const OVERLAY_LAYER_BELOW_TABLE = -1;
export const OVERLAY_LAYER_BETWEEN_TABLE_AND_HEADER = 0;
export const OVERLAY_LAYER_ABOVE_HEADER = 1;
let lastOverlayId = 0;
function createOverlayId() {
    lastOverlayId = Math.max(lastOverlayId + 1, Date.now() * 1000);
    return lastOverlayId;
}
export function getOverlayFixedRelations(overlay) {
    const legacyRelations = overlay.zIndex < 0
        ? { aboveTable: false, aboveHeader: false }
        : overlay.zIndex === 0
            ? { aboveTable: true, aboveHeader: false }
            : { aboveTable: true, aboveHeader: true };
    return {
        aboveTable: overlay.aboveTable ?? legacyRelations.aboveTable,
        aboveHeader: overlay.aboveHeader ?? legacyRelations.aboveHeader
    };
}
export class OverlayManager {
    constructor(canvas) {
        this.overlays = [];
        this.selectedIndex = -1;
        this.activeCancerPresetId = 'lung';
        this.canvas = canvas;
    }
    // 取得所有圖層
    getOverlays() {
        return this.overlays;
    }
    getRenderableOverlays() {
        return this.overlays.filter(overlay => this.isOverlayRenderable(overlay));
    }
    getRenderableEntries() {
        return this.overlays
            .map((overlay, index) => ({ overlay, index }))
            .filter(({ overlay }) => this.isOverlayRenderable(overlay));
    }
    setActiveCancerPresetId(presetId) {
        this.activeCancerPresetId = presetId;
        const selected = this.getSelectedOverlay();
        if (selected && !this.isOverlayRenderable(selected))
            this.selectedIndex = -1;
    }
    isOverlayRenderable(overlay) {
        return overlay.sourceKind !== 'cancer-preset' || overlay.cancerPresetId === this.activeCancerPresetId;
    }
    // 取得選中的圖層索引
    getSelectedIndex() {
        return this.selectedIndex;
    }
    // 設定選中的圖層
    setSelectedIndex(index) {
        this.selectedIndex = index;
    }
    // 取得選中的圖層
    getSelectedOverlay() {
        return this.selectedIndex >= 0 ? this.overlays[this.selectedIndex] : null;
    }
    // 新增圖層
    addOverlay(img, name, src, metadata = {}) {
        const overlay = {
            id: createOverlayId(),
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
            zIndex: OVERLAY_LAYER_ABOVE_HEADER,
            aboveTable: true,
            aboveHeader: true,
            sourceKind: metadata.sourceKind || 'upload',
            cancerPresetId: metadata.cancerPresetId,
            motifId: metadata.motifId,
            motifRole: metadata.motifRole
        };
        this.overlays.push(overlay);
        this.selectedIndex = this.overlays.length - 1;
        return overlay;
    }
    upsertCancerPrimary(presetId, motifId, img, name, src, select = true) {
        const metadata = {
            sourceKind: 'cancer-preset', cancerPresetId: presetId, motifId, motifRole: 'primary'
        };
        let overlay = this.overlays.find(item => item.sourceKind === 'cancer-preset' && item.cancerPresetId === presetId && item.motifRole === 'primary');
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;
        if (overlay) {
            const visualWidth = overlay.w * overlay.scaleX;
            const preserved = {
                x: overlay.x,
                y: overlay.y,
                rotation: overlay.rotation,
                opacity: overlay.opacity,
                visible: overlay.visible,
                zIndex: overlay.zIndex,
                aboveTable: overlay.aboveTable,
                aboveHeader: overlay.aboveHeader
            };
            Object.assign(overlay, metadata, preserved, {
                name: `內建主圖｜${name}`,
                img,
                src,
                w: naturalWidth,
                h: naturalHeight,
                scaleX: Math.max(0.05, visualWidth / naturalWidth),
                scaleY: Math.max(0.05, visualWidth / naturalWidth),
                lockAspect: true
            });
        }
        else {
            overlay = this.createCancerOverlay(img, name, src, metadata, 0);
            this.overlays.push(overlay);
        }
        if (select)
            this.selectedIndex = this.overlays.indexOf(overlay);
        return overlay;
    }
    addCancerCopy(presetId, motifId, img, name, src, select = true) {
        const existingCopies = this.overlays.filter(item => item.sourceKind === 'cancer-preset' && item.cancerPresetId === presetId && item.motifRole === 'copy').length;
        const overlay = this.createCancerOverlay(img, name, src, {
            sourceKind: 'cancer-preset', cancerPresetId: presetId, motifId, motifRole: 'copy'
        }, existingCopies + 1);
        this.overlays.push(overlay);
        if (select)
            this.selectedIndex = this.overlays.length - 1;
        return overlay;
    }
    createCancerOverlay(img, name, src, metadata, offsetIndex) {
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;
        const widthScale = this.canvas.width / 800;
        const zone = {
            x: CANCER_MOTIF_SAFE_ZONE.x * widthScale,
            y: CANCER_MOTIF_SAFE_ZONE.y * widthScale,
            width: CANCER_MOTIF_SAFE_ZONE.width * widthScale,
            height: CANCER_MOTIF_SAFE_ZONE.height * widthScale
        };
        const containScale = Math.min(zone.width / naturalWidth, zone.height / naturalHeight);
        const offsets = [[0, 0], [12, -12], [-12, 12], [12, 12], [-12, -12], [0, 12], [12, 0]];
        const offset = offsets[offsetIndex % offsets.length];
        return {
            id: createOverlayId(),
            name: `${metadata.motifRole === 'primary' ? '內建主圖' : '內建副本'}｜${name}`,
            img,
            src,
            x: zone.x + zone.width / 2 + offset[0] * widthScale,
            y: zone.y + zone.height / 2 + offset[1] * widthScale,
            w: naturalWidth,
            h: naturalHeight,
            scaleX: containScale,
            scaleY: containScale,
            rotation: 0,
            opacity: 1,
            visible: true,
            lockAspect: true,
            zIndex: OVERLAY_LAYER_BETWEEN_TABLE_AND_HEADER,
            aboveTable: true,
            aboveHeader: false,
            ...metadata
        };
    }
    // 內建癌別圖案與使用者上傳圖層共用同一套拖曳／縮放控制，但以穩定 ID 避免重複插入。
    upsertManagedOverlay(managedId, img, name, src, placement) {
        const overlayName = `內建圖案｜${name}`;
        let overlay = this.overlays.find(item => item.name.startsWith('內建圖案｜'));
        const naturalWidth = img.naturalWidth || img.width;
        const naturalHeight = img.naturalHeight || img.height;
        const scale = Math.max(0.05, placement.width / naturalWidth);
        if (!overlay) {
            overlay = this.addOverlay(img, overlayName, src);
        }
        Object.assign(overlay, {
            name: overlayName,
            img,
            src,
            x: placement.x,
            y: placement.y,
            w: naturalWidth,
            h: naturalHeight,
            scaleX: scale,
            scaleY: scale,
            rotation: placement.rotation || 0,
            opacity: placement.opacity,
            visible: true,
            lockAspect: true,
            zIndex: placement.zIndex ?? 0,
            aboveTable: (placement.zIndex ?? 0) >= 0,
            aboveHeader: (placement.zIndex ?? 0) > 0
        });
        this.selectedIndex = this.overlays.indexOf(overlay);
        return overlay;
    }
    // 移除圖層
    removeOverlay(index) {
        if (index >= 0 && index < this.overlays.length) {
            this.overlays.splice(index, 1);
            if (this.selectedIndex >= this.overlays.length) {
                this.selectedIndex = this.overlays.length - 1;
            }
        }
    }
    // 移除選中的圖層
    removeSelectedOverlay() {
        if (this.selectedIndex >= 0) {
            this.removeOverlay(this.selectedIndex);
        }
    }
    // 清除所有圖層
    clearOverlays() {
        this.overlays = [];
        this.selectedIndex = -1;
    }
    // 圖層排序：移到最上層
    bringToFront(index) {
        if (index >= 0 && index < this.overlays.length) {
            const overlay = this.overlays.splice(index, 1)[0];
            this.overlays.push(overlay);
            this.selectedIndex = this.overlays.length - 1;
        }
    }
    // 圖層排序：向上一層
    bringForward(index) {
        if (index >= 0 && index < this.overlays.length - 1) {
            [this.overlays[index], this.overlays[index + 1]] = [this.overlays[index + 1], this.overlays[index]];
            this.selectedIndex = index + 1;
        }
    }
    // 圖層排序：向下一層
    sendBackward(index) {
        if (index > 0 && index < this.overlays.length) {
            [this.overlays[index], this.overlays[index - 1]] = [this.overlays[index - 1], this.overlays[index]];
            this.selectedIndex = index - 1;
        }
    }
    // 圖層排序：移到最下層
    sendToBack(index) {
        if (index >= 0 && index < this.overlays.length) {
            const overlay = this.overlays.splice(index, 1)[0];
            this.overlays.unshift(overlay);
            this.selectedIndex = 0;
        }
    }
    // 切換選中圖層到背景層（Table下方）
    moveSelectedToBackground() {
        this.setSelectedFixedRelation('aboveTable', false);
    }
    // 切換選中圖層到前景層（Table上方）
    moveSelectedToForeground() {
        this.setSelectedFixedRelation('aboveTable', true);
    }
    // 頂部主視覺與表格是兩個彼此獨立的固定物件。
    moveSelectedBelowHeader() {
        this.setSelectedFixedRelation('aboveHeader', false);
    }
    moveSelectedAboveHeader() {
        this.setSelectedFixedRelation('aboveHeader', true);
    }
    setSelectedFixedRelation(relation, value) {
        if (this.selectedIndex < 0 || this.selectedIndex >= this.overlays.length)
            return;
        const overlay = this.overlays[this.selectedIndex];
        const relations = getOverlayFixedRelations(overlay);
        relations[relation] = value;
        overlay.aboveTable = relations.aboveTable;
        overlay.aboveHeader = relations.aboveHeader;
        // 保留舊版 zIndex，讓舊資料讀取端仍能得到最接近的三層結果。
        overlay.zIndex = relations.aboveHeader
            ? OVERLAY_LAYER_ABOVE_HEADER
            : relations.aboveTable
                ? OVERLAY_LAYER_BETWEEN_TABLE_AND_HEADER
                : OVERLAY_LAYER_BELOW_TABLE;
    }
    // 置中選中的圖層
    centerSelectedOverlay() {
        const overlay = this.getSelectedOverlay();
        if (overlay) {
            // overlay.x, overlay.y 本身就是中心點
            overlay.x = this.canvas.width / 2;
            overlay.y = this.canvas.height / 2;
        }
    }
    // 重設選中圖層的大小和角度
    resetSelectedOverlay() {
        const overlay = this.getSelectedOverlay();
        if (overlay) {
            overlay.scaleX = Math.max(0.05, (this.canvas.width * 0.4) / overlay.w);
            overlay.scaleY = overlay.lockAspect ? overlay.scaleX : Math.max(0.05, (this.canvas.width * 0.4) / overlay.w);
            overlay.rotation = 0;
        }
    }
    // 取得圖層尺寸
    getOverlaySize(overlay) {
        return { w: overlay.w * overlay.scaleX, h: overlay.h * overlay.scaleY };
    }
    // 座標轉換：全域到本地
    toLocal(overlay, point) {
        const dx = point.x - overlay.x;
        const dy = point.y - overlay.y;
        const cos = Math.cos(-overlay.rotation);
        const sin = Math.sin(-overlay.rotation);
        return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
    }
    // 座標轉換：本地到全域
    toGlobal(overlay, localPoint) {
        const cos = Math.cos(overlay.rotation);
        const sin = Math.sin(overlay.rotation);
        return {
            x: overlay.x + (localPoint.x * cos - localPoint.y * sin),
            y: overlay.y + (localPoint.x * sin + localPoint.y * cos)
        };
    }
    // 取得控制把手位置
    getHandlePositions(overlay) {
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
    getRotateHandle(overlay) {
        const size = this.getOverlaySize(overlay);
        return { name: 'rot', x: 0, y: -(size.h / 2) - 30 };
    }
    // 碰撞檢測
    hitTest(point) {
        for (let i = this.overlays.length - 1; i >= 0; i--) {
            const overlay = this.overlays[i];
            if (!overlay.visible || !this.isOverlayRenderable(overlay))
                continue;
            const size = this.getOverlaySize(overlay);
            const localPoint = this.toLocal(overlay, point);
            const hw = size.w / 2;
            const hh = size.h / 2;
            // 旋轉把手
            const rotHandle = this.toGlobal(overlay, this.getRotateHandle(overlay));
            const rotDist = Math.hypot(point.x - rotHandle.x, point.y - rotHandle.y);
            if (rotDist <= 12)
                return { idx: i, hit: 'rotate' };
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
    drawOverlay(ctx, overlay, isSelected) {
        if (!overlay.img || !overlay.visible || !this.isOverlayRenderable(overlay))
            return;
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
    drawAllOverlays(ctx) {
        this.overlays.forEach((overlay, idx) => {
            this.drawOverlay(ctx, overlay, idx === this.selectedIndex);
        });
    }
    // 繪製圖層控制項
    drawOverlayControls(ctx, overlay) {
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
    scaleOverlay(index, scaleX, scaleY) {
        const overlay = this.overlays[index];
        if (overlay) {
            overlay.scaleX = Math.max(0.05, Math.min(50, scaleX));
            overlay.scaleY = Math.max(0.05, Math.min(50, scaleY));
        }
    }
    // 移動圖層
    moveOverlay(index, x, y) {
        const overlay = this.overlays[index];
        if (overlay) {
            overlay.x = Math.max(0, Math.min(this.canvas.width, x));
            overlay.y = Math.max(0, Math.min(this.canvas.height, y));
        }
    }
    // 旋轉圖層
    rotateOverlay(index, rotation) {
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
    needsHighQualityProcessing(overlay) {
        return OverlayProcessor.needsHighQualityProcessing(overlay);
    }
    /**
     * 取得所有需要高品質處理的圖層
     */
    getLayersNeedingProcessing() {
        return this.overlays.filter(overlay => overlay.visible && this.needsHighQualityProcessing(overlay));
    }
    /**
     * 取得處理統計
     */
    getProcessingStats() {
        return OverlayProcessor.getProcessingStats(this.overlays);
    }
    /**
     * 創建圖層預覽
     * @param index - 圖層索引
     * @param size - 預覽尺寸
     */
    createOverlayPreview(index, size = 150) {
        const overlay = this.overlays[index];
        if (!overlay)
            return null;
        return OverlayProcessor.createPreview(overlay, size);
    }
    /**
     * 創建選中圖層的預覽
     * @param size - 預覽尺寸
     */
    createSelectedOverlayPreview(size = 150) {
        return this.createOverlayPreview(this.selectedIndex, size);
    }
    /**
     * 批次處理所有圖層
     * @param onProgress - 進度回調
     */
    async processAllOverlays(onProgress) {
        const layersToProcess = this.getLayersNeedingProcessing();
        return await OverlayProcessor.processMultipleOverlays(layersToProcess, {
            outputFormat: 'png',
            quality: 0.95,
            smoothing: true,
            maxSize: 2048,
            onProgress
        });
    }
}
//# sourceMappingURL=overlayManager.js.map