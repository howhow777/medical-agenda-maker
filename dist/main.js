/**
 * 醫學會議海報製作器 - 主程式入口
 */
import { UIController } from './interface/uiController.js';
/**
 * 應用程式初始化
 */
async function initApp() {
    try {
        const controller = new UIController();
        await controller.initialize();
    }
    catch (error) {
        console.error('❌ 應用程式啟動失敗:', error);
        alert('應用程式啟動失敗，請重新整理頁面再試。');
    }
}
// DOM 載入完成後啟動應用
document.addEventListener('DOMContentLoaded', initApp);
//# sourceMappingURL=main.js.map