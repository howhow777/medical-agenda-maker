export class CropController {
    constructor(canvas, overlayManager, updateCallback) {
        this.canvas = canvas;
        this.overlayManager = overlayManager;
        this.updateCallback = updateCallback;
        console.log('✅ CropController 基本初始化成功');
    }
    isInCropMode() {
        return false;
    }
    drawCropInterface(ctx) {
        // 空實作，測試用
    }
}
//# sourceMappingURL=cropController-basic.js.map