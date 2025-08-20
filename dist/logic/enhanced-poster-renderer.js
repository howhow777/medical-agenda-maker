// 增強版海報渲染器
// 整合高品質圖片處理算法的海報渲染器
import { PosterRenderer } from './posterRenderer.js';
import { OverlayProcessor } from './overlay-processor.js';
/**
 * 增強版海報渲染器
 * 在原有功能基礎上整合高品質圖片處理
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
            // 預處理的圖片已經包含旋轉和裁切，只需要定位
            ctx.drawImage(processedCanvas, -processedCanvas.width / 2, -processedCanvas.height / 2);
        }
        else {
            // 使用標準渲染（保持向後兼容）
            ctx.translate(overlay.x, overlay.y);
            ctx.rotate(overlay.rotation);
            const drawW = overlay.w * overlay.scaleX;
            const drawH = overlay.h * overlay.scaleY;
            ctx.drawImage(overlay.img, overlay.crop.x, overlay.crop.y, overlay.crop.w, overlay.crop.h, -drawW / 2, -drawH / 2, drawW, drawH);
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
        const { preprocess = this.highQualityMode, onProgress } = options;
        // 1. 預處理圖層（如果需要）
        if (preprocess && overlays.length > 0) {
            if (onProgress) {
                onProgress(0, overlays.length, '預處理圖層中...');
            }
            await this.preprocessOverlays(overlays, (processed, total, currentLayer) => {
                if (onProgress) {
                    onProgress(processed, total, `處理中: ${currentLayer}`);
                }
            });
        }
        // 2. 執行標準海報繪製
        if (onProgress) {
            onProgress(overlays.length, overlays.length, '繪製海報中...');
        }
        this.drawPoster(agendaItems, currentTemplate, currentColorScheme, currentGradientDirection, customColors, conferenceData, showFooter, footerText, overlays);
        if (onProgress) {
            onProgress(overlays.length, overlays.length, '完成');
        }
    }
    /**
     * 導出高品質海報（覆寫基類方法）
     * @param format - 輸出格式
     * @param quality - 品質（0-1）
     * @param scaleFactor - 解析度倍數
     */
    async exportHighQuality(format, quality, scaleFactor) {
        // 確保使用高品質模式
        const wasHighQuality = this.highQualityMode;
        this.setHighQualityMode(true);
        try {
            // 呼叫父類的高品質導出方法
            return await super.exportHighQuality(format, quality, scaleFactor);
        }
        finally {
            // 恢復原始設定
            this.setHighQualityMode(wasHighQuality);
        }
    }
    /**
     * 導出高品質海報並指定檔名
     * @param format - 輸出格式
     * @param quality - 品質（0-1）
     * @param filename - 檔案名稱
     */
    async exportHighQualityWithFilename(format = 'png', quality = 0.95, filename) {
        const result = await this.exportHighQuality(format, quality, 2);
        const exportFilename = filename || `poster-hq-${Date.now()}.${format}`;
        return {
            blob: result.blob,
            dataURL: result.dataURL,
            filename: exportFilename
        };
    }
    /**
     * 獲取處理統計資訊
     * @param overlays - 圖層陣列
     */
    getProcessingStats(overlays) {
        const stats = OverlayProcessor.getProcessingStats(overlays);
        const processed = overlays.filter(overlay => this.processedOverlays.has(overlay.id)).length;
        return {
            ...stats,
            processed
        };
    }
    /**
     * 清除處理快取
     */
    clearProcessingCache() {
        this.processedOverlays.clear();
    }
    /**
     * 獲取快取狀態
     */
    getCacheInfo() {
        let totalPixels = 0;
        const overlayIds = Array.from(this.processedOverlays.keys());
        this.processedOverlays.forEach(canvas => {
            totalPixels += canvas.width * canvas.height;
        });
        // 估算記憶體使用量（RGBA = 4 bytes per pixel）
        const memoryBytes = totalPixels * 4;
        const memoryMB = (memoryBytes / (1024 * 1024)).toFixed(2);
        return {
            size: this.processedOverlays.size,
            overlayIds,
            memoryUsage: `${memoryMB} MB`
        };
    }
    /**
     * 創建圖層預覽
     * @param overlay - 要預覽的圖層
     * @param size - 預覽尺寸
     */
    createOverlayPreview(overlay, size = 150) {
        return OverlayProcessor.createPreview(overlay, size);
    }
}
//# sourceMappingURL=enhanced-poster-renderer.js.map