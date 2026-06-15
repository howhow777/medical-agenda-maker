import { TemplateManager } from '../logic/templateManager.js';

export class TemplateController {
  private templateManager: TemplateManager;
  private collectCurrentAppState: () => any = () => ({});
  private applyCustomState: (customState: any) => void = () => {};

  constructor() {
    this.templateManager = new TemplateManager();
    this.init();
  }

  init(): void {
    this.renderTemplateButtons();
  }

  // 渲染範本按鈕
  renderTemplateButtons(): void {
    const container = document.querySelector('.template-selector');
    if (!container) return;

    container.innerHTML = '';

    // 簡單的兩個按鈕
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'template-buttons';
    buttonGroup.innerHTML = `
      <button class="btn btn-primary" id="btnSaveTemplate">💾 儲存</button>
      <button class="btn btn-outline" id="btnLoadTemplate">📂 載入</button>
      <input type="file" id="templateFileInput" accept=".json" style="display: none;">
    `;
    
    container.appendChild(buttonGroup);
    this.setupButtons();
  }

  // 設定按鈕事件
  private setupButtons(): void {
    const saveBtn = document.getElementById('btnSaveTemplate');
    const loadBtn = document.getElementById('btnLoadTemplate');
    const fileInput = document.getElementById('templateFileInput') as HTMLInputElement;

    saveBtn?.addEventListener('click', () => {
      const name = prompt('請輸入範本名稱:');
      if (name) {
        try {
          this.templateManager.saveTemplate(name, this.collectCurrentAppState());
        } catch (e) {
          alert('儲存失敗: ' + (e as Error).message);
        }
      }
    });

    loadBtn?.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput?.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (!file.name.endsWith('.json')) {
          alert('請選擇 .json 範本檔案');
          return;
        }

        try {
          await this.templateManager.loadTemplateFromFile(file, this.applyCustomState);
        } catch (e) {
          alert('載入失敗: ' + (e as Error).message);
        }
        
        // 清空 input
        (e.target as HTMLInputElement).value = '';
      }
    });
  }

  // 設定狀態收集器（從main.ts調用）
  setStateCollector(collector: () => any): void {
    this.collectCurrentAppState = collector;
  }

  // 設定狀態套用器（從main.ts調用）
  setStateApplier(applier: (customState: any) => void): void {
    this.applyCustomState = applier;
  }
}
