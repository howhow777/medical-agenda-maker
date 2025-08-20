// Canvas 工具函數
// 提供高品質 Canvas 渲染和優化相關的工具函數
/**
 * Canvas 工具類
 */
export class CanvasUtils {
    /**
     * 創建高品質 Canvas 上下文
     * @param canvas - Canvas 元素
     * @param options - 渲染選項
     */
    static createHighQualityContext(canvas, options = {}) {
        const { alpha = true, smoothing = true, smoothingQuality = 'high' } = options;
        const ctx = canvas.getContext('2d', { alpha });
        if (!ctx) {
            throw new Error('無法創建 Canvas 上下文');
        }
        // 設置高品質渲染
        ctx.imageSmoothingEnabled = smoothing;
        if (smoothing) {
            ctx.imageSmoothingQuality = smoothingQuality;
        }
        return ctx;
    }
    /**
     * 優化 Canvas 尺寸（考慮設備像素比）
     * @param canvas - Canvas 元素
     * @param width - 邏輯寬度
     * @param height - 邏輯高度
     * @param pixelRatio - 像素比（默認自動檢測）
     */
    static optimizeCanvasSize(canvas, width, height, pixelRatio) {
        const ratio = pixelRatio || window.devicePixelRatio || 1;
        // 設置實際 Canvas 尺寸
        canvas.width = width * ratio;
        canvas.height = height * ratio;
        // 設置 CSS 顯示尺寸
        canvas.style.width = width + 'px';
        canvas.style.height = height + 'px';
        // 縮放上下文以匹配設備像素比
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(ratio, ratio);
        }
    }
    /**
     * 創建離屏 Canvas
     * @param width - 寬度
     * @param height - 高度
     * @param options - 選項
     */
    static createOffscreenCanvas(width, height, options = {}) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = this.createHighQualityContext(canvas, options);
        return { canvas, ctx };
    }
    /**
     * Canvas 轉 Blob（支援不同格式和品質）
     * @param canvas - Canvas 元素
     * @param format - 輸出格式
     * @param quality - 品質（0-1）
     */
    static canvasToBlob(canvas, format = 'png', quality = 0.95) {
        return new Promise((resolve, reject) => {
            const mimeType = format === 'png' ? 'image/png' : `image/${format}`;
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                }
                else {
                    reject(new Error('Canvas 轉換失敗'));
                }
            }, mimeType, quality);
        });
    }
    /**
     * Canvas 轉 DataURL（支援不同格式和品質）
     */
    static canvasToDataURL(canvas, format = 'png', quality = 0.95) {
        const mimeType = format === 'png' ? 'image/png' : `image/${format}`;
        return canvas.toDataURL(mimeType, quality);
    }
    /**
     * 複製 Canvas
     * @param sourceCanvas - 來源 Canvas
     * @param targetCanvas - 目標 Canvas（可選，會自動創建）
     */
    static cloneCanvas(sourceCanvas, targetCanvas) {
        const target = targetCanvas || document.createElement('canvas');
        target.width = sourceCanvas.width;
        target.height = sourceCanvas.height;
        const ctx = target.getContext('2d');
        ctx.drawImage(sourceCanvas, 0, 0);
        return target;
    }
    /**
     * 清除 Canvas
     * @param canvas - Canvas 元素
     * @param fillColor - 填充顏色（可選）
     */
    static clearCanvas(canvas, fillColor) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (fillColor) {
            ctx.fillStyle = fillColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    /**
     * 獲取 Canvas 的實際渲染尺寸
     * @param canvas - Canvas 元素
     */
    static getActualSize(canvas) {
        const rect = canvas.getBoundingClientRect();
        const ratio = canvas.width / rect.width;
        return {
            width: canvas.width,
            height: canvas.height,
            ratio
        };
    }
    /**
     * 將圖片繪製到 Canvas 中央
     * @param ctx - Canvas 上下文
     * @param img - 圖片元素
     * @param maxWidth - 最大寬度
     * @param maxHeight - 最大高度
     * @param maintainAspect - 是否保持長寬比
     */
    static drawImageCentered(ctx, img, maxWidth, maxHeight, maintainAspect = true) {
        let imgWidth;
        let imgHeight;
        if (img instanceof HTMLImageElement) {
            imgWidth = img.naturalWidth || img.width;
            imgHeight = img.naturalHeight || img.height;
        }
        else {
            imgWidth = img.width;
            imgHeight = img.height;
        }
        let drawWidth = imgWidth;
        let drawHeight = imgHeight;
        if (maintainAspect) {
            const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
            drawWidth = imgWidth * scale;
            drawHeight = imgHeight * scale;
        }
        else {
            drawWidth = maxWidth;
            drawHeight = maxHeight;
        }
        const x = (maxWidth - drawWidth) / 2;
        const y = (maxHeight - drawHeight) / 2;
        ctx.drawImage(img, x, y, drawWidth, drawHeight);
    }
    /**
     * 創建圓角矩形路徑
     * @param ctx - Canvas 上下文
     * @param x - X 座標
     * @param y - Y 座標
     * @param width - 寬度
     * @param height - 高度
     * @param radius - 圓角半徑
     */
    static roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    /**
     * 檢測瀏覽器支援的圖片格式
     */
    static getSupportedFormats() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        // 測試各種格式
        const testFormat = (format) => {
            try {
                const dataURL = canvas.toDataURL(`image/${format}`);
                return dataURL.startsWith(`data:image/${format}`);
            }
            catch (e) {
                return false;
            }
        };
        return {
            png: testFormat('png'),
            jpeg: testFormat('jpeg'),
            webp: testFormat('webp'),
            avif: testFormat('avif')
        };
    }
    /**
     * 獲取最佳輸出格式
     * @param hasTransparency - 是否有透明度
     * @param preferQuality - 是否偏好品質而非檔案大小
     */
    static getBestFormat(hasTransparency = false, preferQuality = true) {
        const supported = this.getSupportedFormats();
        if (hasTransparency) {
            // 需要透明度
            if (supported.webp)
                return 'webp';
            return 'png';
        }
        else {
            // 不需要透明度
            if (preferQuality) {
                if (supported.webp)
                    return 'webp';
                return 'png';
            }
            else {
                if (supported.webp)
                    return 'webp';
                return 'jpeg';
            }
        }
    }
}
//# sourceMappingURL=canvas-utils.js.map