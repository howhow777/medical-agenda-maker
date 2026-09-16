import { TemplateData, AgendaItem, Overlay, CustomColors } from '../assets/types.js';
import { DataManager } from './dataManager.js';

interface FileTemplate {
  name: string;
  createdAt: string;
  data: TemplateData;
}

export class TemplateManager {
  private dataManager: DataManager;

  constructor() {
    this.dataManager = new DataManager();
  }



  // 儲存範本
  saveTemplate(name: string, customState?: any): void {
    try {
      const templateData = this.collectCurrentState(customState);
      const template: FileTemplate = {
        name: name.trim() || '未命名範本',
        createdAt: new Date().toISOString(),
        data: templateData
      };

      // 生成檔案名稱
      const timestamp = new Date().toISOString().split('T')[0];
      const safeName = name.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, '_');
      const filename = `${safeName}_${timestamp}.json`;

      // 嘗試序列化範本資料
      let jsonString;
      try {
        jsonString = JSON.stringify(template, null, 2);
      } catch (stringifyError) {
        console.error('JSON 序列化失敗:', stringifyError);
        throw new Error(`範本資料序列化失敗: ${stringifyError instanceof Error ? stringifyError.message : '未知錯誤'}`);
      }

      // 下載檔案
      this.downloadFile(
        jsonString,
        filename,
        'application/json'
      );

      this.showToast(`範本已下載: ${filename}`);
    } catch (e) {
      console.error('儲存範本失敗:', e);
      throw e;
    }
  }

  // 載入範本
  loadTemplateFromFile(file: File, customStateCallback?: (customState: any) => void | Promise<void>): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          console.log('🔍 開始解析範本檔案...');
          const template: FileTemplate = JSON.parse(e.target?.result as string);
          console.log('✅ JSON 解析成功:', template.name);
          
          if (!this.validateTemplate(template)) {
            reject(new Error('無效的範本檔案格式'));
            return;
          }

          // 還原表單狀態（包含完整圖層）
          await this.dataManager.applyState({
            version: 'template-v2',
            savedAt: template.createdAt,
            title: template.name,
            form: template.data.form,
            customState: {
              agendaItems: template.data.agendaItems,
              overlays: template.data.overlays, // 恢復完整圖層，包含PNG資料
              customColors: template.data.customColors,
              meetupSettings: template.data.meetupSettings, // 🆕 恢復集合地點設定
              footerSettings: template.data.footerSettings, // 🆕 恢復頁尾設定
              moderatorDisplaySettings: template.data.moderatorDisplaySettings,
              cancerDesignState: template.data.cancerDesignState,
              roofSelectionState: template.data.roofSelectionState,
              basicInfo: template.data.basicInfo // 🆕 恢復基本資訊
            }
          }, customStateCallback);

          this.showToast(`範本已載入: ${template.name}`);

          resolve();
        } catch (e) {
          console.error('❌ 範本載入失敗:', e);
          reject(new Error(`解析範本檔案失敗: ${e instanceof Error ? e.message : '未知錯誤'}`));
        }
      };
      
      reader.readAsText(file);
    });
  }

  // 下載檔案
  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 收集當前狀態
  private collectCurrentState(customState?: any): TemplateData {
    const formState = this.dataManager.collectFormState();
    
    // 安全處理圖層資料
    let safeOverlays = [];
    try {
      safeOverlays = customState?.overlays || [];
      // 檢查圖層資料是否可序列化
      JSON.stringify(safeOverlays);
      console.log('✅ 圖層資料序列化測試通過');
    } catch (e) {
      console.warn('⚠️ 圖層資料序列化失敗，使用空陣列:', e);
      safeOverlays = [];
    }
    
    return {
      form: formState,
      agendaItems: customState?.agendaItems || [],
      overlays: safeOverlays, // 使用安全處理的圖層資料
      customColors: customState?.customColors || {},
      meetupSettings: customState?.meetupSettings || {
        showMeetupPoint: false,
        meetupType: 'same',
        meetupCustomText: ''
      },
      footerSettings: customState?.footerSettings || {
        showFooterNote: true,
        footerContent: ''
      },
      moderatorDisplaySettings: customState?.moderatorDisplaySettings || {
        hideModeratorColumn: false,
        mergeSameModerator: false
      },
      cancerDesignState: customState?.cancerDesignState,
      roofSelectionState: customState?.roofSelectionState,
      basicInfo: customState?.basicInfo || {
        title: '',
        subtitle: '',
        date: '',
        time: '',
        location: ''
      }
    };
  }

  // 驗證範本格式
  private validateTemplate(template: any): boolean {
    try {
      return template && 
             typeof template.name === 'string' &&
             template.data &&
             typeof template.data === 'object';
    } catch (e) {
      return false;
    }
  }

  // 顯示提示訊息
  private showToast(msg: string, duration: number = 2000): void {
    try {
      let bar = document.getElementById('toaster');
      if (!bar) {
        bar = document.createElement('div');
        bar.id = 'toaster';
        bar.style.cssText = 
          'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);' +
          'background:rgba(0,0,0,.75);color:#fff;padding:8px 12px;border-radius:10px;z-index:9999;pointer-events:none';
        document.body.appendChild(bar);
      }
      bar.textContent = msg;
      bar.style.opacity = '1';
      setTimeout(() => (bar!.style.opacity = '0'), duration);
    } catch (e) {
      // 忽略錯誤
    }
  }
}
