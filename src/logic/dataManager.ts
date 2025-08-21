import { AgendaItem, CustomColors } from '../assets/types.js';

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
      
      // 🚫 跳過檔案輸入框 - 避免收集檔案路徑
      if (el instanceof HTMLInputElement && el.type === 'file') {
        continue;
      }
      
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
      (document.querySelector('input[name="title"]') as HTMLInputElement)?.value ||
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

    // 1) 表單
    const form = state.form || {};
    for (const [key, val] of Object.entries(form)) {
      const el = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
      if (!el) continue;
      
      // 🚫 跳過檔案輸入框 - 瀏覽器不允許程式設定檔案路徑
      if (el instanceof HTMLInputElement && el.type === 'file') {
        console.log('⚠️ 跳過檔案輸入框:', key);
        continue;
      }
      
      if (el instanceof HTMLInputElement && el.type === 'checkbox') {
        el.checked = Boolean(val);
      } else if (el instanceof HTMLInputElement && el.type === 'radio') {
        const radio = document.querySelector(`[name="${key}"][value="${val}"]`);
        if (radio instanceof HTMLInputElement) radio.checked = true;
      } else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        el.value = (val ?? '').toString();
      }
      
      // 觸發事件
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // 2) 自訂全域狀態
    if (state.customState && customStateCallback) {
      customStateCallback(state.customState);
    }
  }

  // 暫存到 localStorage
  tempSave(customState?: any): void {
    try {
      const payload = this.buildStatePayload(customState);
      localStorage.setItem(this.LS_KEY, JSON.stringify(payload));
      this.showToast('已暫存到瀏覽器。');
    } catch (e) {
      console.error(e);
      alert('暫存失敗：' + (e as Error).message);
    }
  }

  // 從 localStorage 讀回
  tempLoad(customStateCallback?: (customState: any) => void): void {
    try {
      const raw = localStorage.getItem(this.LS_KEY);
      if (!raw) {
        alert('找不到暫存。');
        return;
      }
      const state = JSON.parse(raw) as SavedState;
      this.applyState(state, customStateCallback);
      this.showToast('已讀取暫存並還原。');
    } catch (e) {
      console.error(e);
      alert('讀取暫存失敗：' + (e as Error).message);
    }
  }

  // 匯出 JSON 檔
  exportJson(customState?: any): void {
    try {
      const payload = this.buildStatePayload(customState);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const safe = (payload.title || 'agenda').replace(/[\\/:*?"<>|]/g, '_');
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safe}_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert('匯出失敗：' + (e as Error).message);
    }
  }

  // 匯入 JSON 檔
  importJson(file: File, customStateCallback?: (customState: any) => void): void {
    const reader = new FileReader();
    reader.onerror = () => alert('讀檔失敗。');
    reader.onload = () => {
      try {
        const state = JSON.parse(String(reader.result)) as SavedState;
        if (!state || !state.form) {
          alert('檔案格式不符：找不到表單內容。');
          return;
        }
        this.applyState(state, customStateCallback);
        this.showToast('已開啟檔案並還原。');
      } catch (e) {
        console.error(e);
        alert('解析失敗：' + (e as Error).message);
      }
    };
    reader.readAsText(file);
  }

  // 小型提示
  private showToast(msg: string): void {
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
      setTimeout(() => (bar!.style.opacity = '0'), 1500);
    } catch (e) {
      // 忽略錯誤
    }
  }
}
