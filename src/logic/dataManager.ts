import { AgendaItem, AppState } from '../assets/types.js';

export interface SavedState {
  version: string;
  savedAt: string;
  title: string;
  form: Record<string, any>;
  customState?: any;
}

export class DataManager {
  private readonly LS_KEY = 'agendaPoster.autosave.v1';

  // 收集表單狀態
  collectFormState(): Record<string, any> {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    const form: Record<string, any> = {};
    
    for (const el of inputs) {
      const key = (el as HTMLInputElement).name || el.id;
      if (!key) continue;
      
      if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) {
        if (el.type === 'radio') {
          if (el.checked) form[key] = el.value;
          else if (!(key in form)) form[key] = null;
        } else {
          form[key] = el.checked;
        }
      } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        form[key] = el.value;
      }
    }
    return form;
  }

  // 建立狀態負載
  buildStatePayload(customState?: any): SavedState {
    const titleGuess = (
      (document.getElementById('conferenceTitle') as HTMLInputElement)?.value ||
      ''
    ).trim();
    
    return {
      version: 'agenda-poster-v1',
      savedAt: new Date().toISOString(),
      title: titleGuess || 'agenda',
      form: this.collectFormState(),
      customState: customState || null
    };
  }

  // 套用狀態到表單
  applyState(state: SavedState, customStateCallback?: (customState: any) => void): void {
    if (!state || typeof state !== 'object') return;

    // 套用表單狀態
    const form = state.form || {};
    for (const [key, val] of Object.entries(form)) {
      const el = document.getElementById(key);
      if (!el) continue;
      
      if (el instanceof HTMLInputElement && el.type === 'checkbox') {
        el.checked = Boolean(val);
      } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        el.value = (val ?? '').toString();
      }
      
      // 觸發事件
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 套用自訂狀態
    if (state.customState && customStateCallback) {
      customStateCallback(state.customState);
    }
  }

  // 暫存到 localStorage
  tempSave(appState: AppState): void {
    try {
      const statePayload = this.buildStatePayload(appState);
      localStorage.setItem(this.LS_KEY, JSON.stringify(statePayload));
      this.showToast('✅ 暫存成功');
    } catch (error) {
      console.error('暫存失敗:', error);
      this.showToast('❌ 暫存失敗');
    }
  }

  // 從 localStorage 載入
  tempLoad(): void {
    try {
      const saved = localStorage.getItem(this.LS_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        this.applyState(state);
        this.showToast('✅ 讀取成功');
      } else {
        this.showToast('❌ 沒有暫存資料');
      }
    } catch (error) {
      console.error('讀取失敗:', error);
      this.showToast('❌ 讀取失敗');
    }
  }

  // 匯出 JSON 檔案
  exportJson(appState: AppState): void {
    try {
      const statePayload = this.buildStatePayload(appState);
      const dataStr = JSON.stringify(statePayload, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `醫療議程海報_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      this.showToast('✅ 匯出成功');
    } catch (error) {
      console.error('匯出失敗:', error);
      this.showToast('❌ 匯出失敗');
    }
  }

  // 匯入 JSON 檔案
  importJson(file: File, callback?: () => void): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state = JSON.parse(e.target?.result as string);
        this.applyState(state);
        if (callback) callback();
        this.showToast('✅ 匯入成功');
      } catch (error) {
        console.error('匯入失敗:', error);
        this.showToast('❌ 匯入失敗');
      }
    };
    reader.readAsText(file);
  }

  // 顯示提示訊息
  private showToast(message: string): void {
    let toaster = document.getElementById('toaster');
    if (!toaster) {
      toaster = document.createElement('div');
      toaster.id = 'toaster';
      document.body.appendChild(toaster);
    }
    
    toaster.textContent = message;
    toaster.style.opacity = '1';
    
    setTimeout(() => {
      toaster!.style.opacity = '0';
    }, 2000);
  }
}