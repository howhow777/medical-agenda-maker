// 增強版海報渲染器 - 簡化版
// 保留基本的高品質渲染功能，移除裁切功能
import { PosterRenderer } from './posterRenderer.js';
import { OverlayProcessor } from './overlay-processor.js';
import { CanvasUtils } from './canvas-utils.js';
/**
 * 增強版海報渲染器
 * 在原有功能基礎上整合基本的高品質圖片處理
 */
export class EnhancedPosterRenderer extends PosterRenderer {
    constructor() {
        super(...arguments);
        this.highQualityMode = false;
        this.processedOverlays = new Map();
    }
    /**
     * 設置高品質模式
     * @param enabled - 是否啟用高品質模式
     */
    setHighQualityMode(enabled) {
        this.highQualityMode = enabled;
        // 清除快取，強制重新處理
        this.processedOverlays.clear();
    }
    /**
     * 獲取高品質模式狀態
     */
    getHighQualityMode() {
        return this.highQualityMode;
    }
    /**
     * 預處理所有圖層（批次高品質處理）
     * @param overlays - 要處理的圖層陣列
     * @param onProgress - 進度回調
     */
    async preprocessOverlays(overlays, onProgress) {
        if (!this.highQualityMode) {
            return; // 非高品質模式不需要預處理
        }
        // 清除舊的快取
        this.processedOverlays.clear();
        // 過濾需要處理的圖層
        const layersToProcess = overlays.filter(overlay => overlay.visible && OverlayProcessor.needsHighQualityProcessing(overlay));
        let processed = 0;
        for (const overlay of layersToProcess) {
            if (onProgress) {
                onProgress(processed, layersToProcess.length, overlay.name);
            }
            try {
                const result = await OverlayProcessor.processOverlay(overlay, {
                    outputFormat: 'png', // 保持透明度
                    quality: 0.95,
                    smoothing: true,
                    maxSize: 2048 // 限制最大尺寸避免記憶體問題
                });
                // 快取處理結果
                this.processedOverlays.set(overlay.id, result.canvas);
            }
            catch (error) {
                console.error(`預處理圖層 ${overlay.name} 失敗:`, error);
                // 繼續處理其他圖層
            }
            processed++;
        }
        if (onProgress) {
            onProgress(processed, layersToProcess.length, '完成');
        }
    }
    /**
     * 渲染單個圖層（使用高品質處理或標準處理）
     * @param overlay - 要渲染的圖層
     * @param ctx - Canvas 上下文
     */
    renderOverlay(overlay, ctx) {
        if (!overlay.visible || !overlay.img)
            return;
        ctx.save();
        ctx.globalAlpha = overlay.opacity;
        // 檢查是否有預處理的高品質版本
        const processedCanvas = this.processedOverlays.get(overlay.id);
        if (this.highQualityMode && processedCanvas) {
            // 使用預處理的高品質版本
            ctx.translate(overlay.x, overlay.y);
            // 預處理的圖片已經包含縮放，只需要定位
            ctx.drawImage(processedCanvas, -processedCanvas.width / 2, -processedCanvas.height / 2);
        }
        else {
            // 使用標準渲染（無裁切功能）
            ctx.translate(overlay.x, overlay.y);
            ctx.rotate(overlay.rotation);
            const drawW = overlay.w * overlay.scaleX;
            const drawH = overlay.h * overlay.scaleY;
            // 簡化：使用整個圖片，不進行裁切
            ctx.drawImage(overlay.img, -drawW / 2, -drawH / 2, drawW, drawH);
        }
        ctx.restore();
    }
    /**
     * 渲染所有圖層（覆寫父類方法以使用高品質處理）
     * @param overlays - 圖層陣列
     */
    drawOverlays(overlays) {
        overlays.forEach(overlay => {
            this.renderOverlay(overlay, this.ctx);
        });
    }
    /**
     * 增強版海報繪製（支援高品質模式）
     * 保持與原版相同的 API，但內部使用高品質處理
     */
    async drawPosterEnhanced(agendaItems, currentTemplate, currentColorScheme, currentGradientDirection, customColors, conferenceData, showFooter, footerText, overlays = [], options = {}) {
        // 如果需要預處理且啟用高品質模式
        if (options.preprocess && this.highQualityMode) {
            await this.preprocessOverlays(overlays, options.onProgress);
        }
        // 使用父類的標準渲染方法
        this.drawPoster(agendaItems, currentTemplate, currentColorScheme, currentGradientDirection, customColors, conferenceData, showFooter, footerText, overlays);
    }
    /**
     * 導出高品質海報
     * @param format - 輸出格式
     * @param quality - 品質設定
     * @param scaleFactor - 縮放係數（保持與父類兼容）
     */
    async exportHighQuality(format = 'png', quality = 0.95, scaleFactor = 1) {
        const originalSize = { width: this.canvas.width, height: this.canvas.height };
        const highQualitySize = {
            width: Math.round(this.canvas.width * scaleFactor),
            height: Math.round(this.canvas.height * scaleFactor)
        };
        const blob = await CanvasUtils.canvasToBlob(this.canvas, format, quality);
        const dataURL = this.canvas.toDataURL(`image/${format}`, quality);
        return {
            blob,
            dataURL,
            originalSize,
            highQualitySize
        };
    }
    /**
     * 清除處理快取
     */
    clearProcessingCache() {
        this.processedOverlays.clear();
    }
    /**
     * 取得快取資訊
     */
    getCacheInfo() {
        return {
            size: this.processedOverlays.size,
            overlayIds: Array.from(this.processedOverlays.keys()),
            memoryUsage: `${this.processedOverlays.size} 個快取項目`
        };
    }
    /**
     * 取得處理統計
     * @param overlays - 圖層陣列
     */
    getProcessingStats(overlays) {
        const baseStats = OverlayProcessor.getProcessingStats(overlays);
        const processed = overlays.filter(overlay => this.processedOverlays.has(overlay.id)).length;
        return {
            ...baseStats,
            processed
        };
    }
}
//# sourceMappingURL=enhanced-poster-renderer.js.map