// 最小測試版本的裁切控制器
export class CropController {
    constructor(canvas, overlayManager, updateCallback) {
        this.canvas = canvas;
        this.overlayManager = overlayManager;
        this.updateCallback = updateCallback;
        console.log('✅ CropController 初始化成功');
    }
    /**
     * 檢查是否處於裁切模式
     */
    isInCropMode() {
        return false; // 暫時返回 false
    }
    /**
     * 繪製裁切界面（供posterRenderer調用）
     */
    drawCropInterface(ctx) {
        // 暫時為空，避免編譯錯誤
        return;
    }
}
//# sourceMappingURL=cropController-minimal.js.map