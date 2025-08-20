// 圖層處理器 - 簡化版，移除裁切功能
// 保留基本的圖層處理和預覽功能
/**
 * 圖層處理器 - 專門處理 Overlay 的基本處理
 */
export class OverlayProcessor {
    /**
     * 簡化版圖層處理（無裁切功能）
     * @param overlay - 要處理的圖層
     * @param options - 處理選項
     */
    static async processOverlay(overlay, options = {}) {
        const { outputFormat = 'png', quality = 0.95, smoothing = true, maxSize = 2048 } = options;
        // 計算輸出尺寸
        let outputW = Math.round(overlay.w * overlay.scaleX);
        let outputH = Math.round(overlay.h * overlay.scaleY);
        // 限制最大尺寸
        if (outputW > maxSize || outputH > maxSize) {
            const scale = Math.min(maxSize / outputW, maxSize / outputH);
            outputW = Math.round(outputW * scale);
            outputH = Math.round(outputH * scale);
        }
        // 創建處理用 Canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = outputW;
        canvas.height = outputH;
        // 設定高品質渲染選項
        if (smoothing) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
        }
        // 簡單的圖片縮放處理（無旋轉和裁切）
        ctx.drawImage(overlay.img, 0, 0, overlay.w, overlay.h, 0, 0, outputW, outputH);
        // 轉換為 Blob
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                }
                else {
                    reject(new Error('無法創建 Blob'));
                }
            }, `image/${outputFormat}`, quality);
        });
        // 創建處理後的圖片
        const processedImg = new Image();
        processedImg.src = canvas.toDataURL();
        return {
            blob,
            canvas,
            processedImg
        };
    }
    /**
     * 批次處理多個圖層
     */
    static async processMultipleOverlays(overlays, options = {}) {
        const results = [];
        const { onProgress } = options;
        for (let i = 0; i < overlays.length; i++) {
            const overlay = overlays[i];
            if (onProgress) {
                onProgress(i, overlays.length, overlay.name);
            }
            try {
                const result = await this.processOverlay(overlay, options);
                results.push({ overlay, result });
            }
            catch (error) {
                console.warn(`處理圖層 ${overlay.name} 失敗:`, error);
            }
        }
        if (onProgress) {
            onProgress(overlays.length, overlays.length);
        }
        return results;
    }
    /**
     * 檢查圖層是否需要高品質處理
     * @param overlay - 要檢查的圖層
     */
    static needsHighQualityProcessing(overlay) {
        // 簡化判斷：只要有縮放或旋轉就認為需要高品質處理
        if (Math.abs(overlay.scaleX - 1) > 0.01)
            return true;
        if (Math.abs(overlay.scaleY - 1) > 0.01)
            return true;
        if (Math.abs(overlay.rotation) > 0.01)
            return true;
        return false;
    }
    /**
     * 創建圖層預覽
     * @param overlay - 圖層
     * @param previewSize - 預覽尺寸
     */
    static createPreview(overlay, previewSize = 150) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = previewSize;
        canvas.height = previewSize;
        // 計算縮放比例
        const scale = Math.min(previewSize / overlay.w, previewSize / overlay.h);
        const w = overlay.w * scale;
        const h = overlay.h * scale;
        const x = (previewSize - w) / 2;
        const y = (previewSize - h) / 2;
        // 繪製預覽
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, previewSize, previewSize);
        ctx.drawImage(overlay.img, x, y, w, h);
        return canvas;
    }
    /**
     * 取得處理統計
     */
    static getProcessingStats(overlays) {
        let needsProcessing = 0;
        let simple = 0;
        let complex = 0;
        overlays.forEach(overlay => {
            if (this.needsHighQualityProcessing(overlay)) {
                needsProcessing++;
                // 簡化判斷：有旋轉就算複雜
                if (Math.abs(overlay.rotation) > 0.01) {
                    complex++;
                }
                else {
                    simple++;
                }
            }
        });
        return {
            total: overlays.length,
            needsProcessing,
            simple,
            complex
        };
    }
}
//# sourceMappingURL=overlay-processor.js.map