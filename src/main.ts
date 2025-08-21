/**
 * 醫學會議海報製作器 - 主程式入口
 */

import { UIController } from './interface/uiController.js';
import { FileUploader } from './interface/fileUploader.js';
import { AgendaData } from './assets/agendaTypes.js';

/**
 * 應用程式初始化
 */
async function initApp(): Promise<void> {
  try {
    const controller = new UIController();
    await controller.initialize();
    
    // 初始化 Excel 上傳功能
    const fileUploader = new FileUploader();
    
    // 設定議程資料解析完成的處理
    fileUploader.setOnDataParsed((agendaData: AgendaData) => {
      console.log('📋 議程資料解析完成:', agendaData);
      
      controller.loadAgendaData(agendaData);
    });
    
    console.log('✅ 應用程式初始化完成');
  } catch (error) {
    console.error('❌ 應用程式啟動失敗:', error);
    alert('應用程式啟動失敗，請重新整理頁面再試。');
  }
}

// DOM 載入完成後啟動應用
document.addEventListener('DOMContentLoaded', initApp);
