// 最小功能版本 - 確保編譯通過
export class CropController {
    constructor(canvas, overlayManager, updateCallback) {
        this.canvas = canvas;
        this.overlayManager = overlayManager;
        this.updateCallback = updateCallback;
        console.log('✅ CropController 初始化完成');
    }
    isInCropMode() {
        return false;
    }
    drawCropInterface(ctx) {
        // 空實作，確保編譯通過
    }
}
//# sourceMappingURL=cropController-clean.js.map