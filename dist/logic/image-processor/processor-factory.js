// 圖片處理器工廠函數
import { TransformCropEngine } from './transform-crop-engine.js';
import { CoordinateUtils } from './coordinate-utils.js';
import { CropCalculator } from './crop-calculator.js';
/**
 * 創建簡化的圖片處理器
 * 提供更直觀的 API
 */
export function createImageProcessor() {
    return {
        /**
         * 快速處理：載入圖片 → 變形 → 裁切 → 輸出
         */
        async quickProcess(imageFile, options = {}) {
            // 載入圖片
            const image = await TransformCropEngine.loadImageFromFile(imageFile);
            const naturalSize = TransformCropEngine.getImageNaturalSize(image);
            // 計算顯示佈局
            const containerSize = options.containerSize || { w: 800, h: 600 };
            const layout = CoordinateUtils.calculateDisplayLayout(naturalSize, containerSize);
            // 準備變形參數
            const transform = {
                tx: 0,
                ty: 0,
                scale: 1,
                rot: 0,
                ...options.transform
            };
            // 準備裁切區域（預設為中央80%）
            const cropRect = options.cropRect || CropCalculator.getDefaultCropRect({
                x: layout.offset.x,
                y: layout.offset.y,
                w: layout.size.w,
                h: layout.size.h
            });
            // 處理參數
            const params = {
                transform,
                cropRect,
                naturalSize,
                displaySize: layout.size,
                displayOffset: layout.offset
            };
            // 處理選項
            const processOptions = {
                outputFormat: options.outputFormat || 'png',
                quality: options.quality || 0.95
            };
            return await TransformCropEngine.process(image, params, processOptions);
        },
        /**
         * 創建裁切工具的幫助函數
         */
        createCropHelper(naturalSize, containerSize) {
            const layout = CoordinateUtils.calculateDisplayLayout(naturalSize, containerSize);
            return {
                layout,
                // 獲取預設裁切區域
                getDefaultCrop(padding = 0.1) {
                    return CropCalculator.getDefaultCropRect({
                        x: layout.offset.x,
                        y: layout.offset.y,
                        w: layout.size.w,
                        h: layout.size.h
                    }, padding);
                },
                // 約束裁切區域
                constrainCrop(rect, options = {}) {
                    const bounds = {
                        x: layout.offset.x,
                        y: layout.offset.y,
                        w: layout.size.w,
                        h: layout.size.h
                    };
                    return CropCalculator.constrainRect(rect, bounds, options);
                },
                // 處理拖拽
                handleDrag(startRect, dragType, deltaX, deltaY, options = {}) {
                    const bounds = {
                        x: layout.offset.x,
                        y: layout.offset.y,
                        w: layout.size.w,
                        h: layout.size.h
                    };
                    return CropCalculator.applyDrag(startRect, dragType, deltaX, deltaY, bounds, options);
                }
            };
        },
        /**
         * 常用比例預設
         */
        aspectRatios: CropCalculator.getCommonAspectRatios(),
        /**
         * 工具函數直接導出
         */
        utils: {
            CoordinateUtils,
            CropCalculator,
            TransformCropEngine
        }
    };
}
/**
 * 預設導出：已初始化的處理器實例
 */
export const imageProcessor = createImageProcessor();
//# sourceMappingURL=processor-factory.js.map