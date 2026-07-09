/**
 * 醫學會議海報製作器 - 主程式入口
 */
import { UIController } from './interface/uiController.js';
import { AccordionController } from './interface/accordionController.js';
import { FileUploader } from './interface/fileUploader.js';
import { TouchDebugController } from './interface/touchDebugController.js';
import { UpdateNoticeController } from './interface/updateNoticeController.js';
/**
 * 應用程式初始化
 */
async function initApp() {
    try {
        const controller = new UIController();
        await controller.initialize();
        // 初始化 Excel 上傳功能
        const fileUploader = new FileUploader();
        // 設定議程資料解析完成的處理
        fileUploader.setOnDataParsed((agendaData) => {
            console.log('📋 議程資料解析完成:', agendaData);
            controller.loadAgendaData(agendaData);
        });
        // 初始化摺疊面板控制器
        new AccordionController();
        // 初始化今日更新提示卡
        new UpdateNoticeController();
        // 初始化觸控除錯控制器（手機測試用）
        const touchDebugController = new TouchDebugController();
        // 開發模式自動啟用除錯（可根據需要調整）
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('🔍 開發模式：自動啟用觸控除錯');
            // touchDebugController.setEnabled(true); // 取消註解可自動啟用
        }
        console.log('✅ 應用程式初始化完成');
    }
    catch (error) {
        console.error('❌ 應用程式啟動失敗:', error);
        alert('應用程式啟動失敗，請重新整理頁面再試。');
    }
}
// DOM 載入完成後啟動應用
document.addEventListener('DOMContentLoaded', initApp);
//# sourceMappingURL=main.js.map