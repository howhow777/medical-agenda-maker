# Shared UI Components

Framework: browser-native HTML + TypeScript classes. There is no React/Vue component library. Reusable UI behaviors are implemented as controller classes and styled through the global stylesheet.

## AccordionController
- Source: `src/interface/accordionController.ts`
- Description: Reusable accordion behavior for the left control panel.
- Key props: none; binds to `.accordion-header` and `.accordion-item`.

```ts
/**
 * 摺疊面板控制器
 */
export class AccordionController {
  private sections: NodeListOf<Element>;

  constructor() {
    this.sections = document.querySelectorAll('.accordion-section');
    this.init();
  }

  private init(): void {
    // 綁定點擊事件
    this.sections.forEach(section => {
      const header = section.querySelector('.accordion-header');
      if (header) {
        header.addEventListener('click', () => {
          this.toggleSection(section);
        });
      }
    });

    this.bindMenuToggle();

    // 所有區塊初始狀態為收合
  }

  private bindMenuToggle(): void {
    const toggle = document.getElementById('menuToggle') as HTMLButtonElement | null;
    const container = document.querySelector('.container');

    if (!toggle || !container) return;

    const label = toggle.querySelector('.menu-toggle-label');

    const syncLabel = (): void => {
      const isCollapsed = container.classList.contains('controls-collapsed');
      const actionText = isCollapsed ? '開啟設定' : '收合設定';
      toggle.setAttribute('aria-expanded', String(!isCollapsed));
      toggle.setAttribute('aria-label', actionText);
      toggle.title = actionText;
      if (label) label.textContent = actionText;
    };

    toggle.addEventListener('click', () => {
      container.classList.toggle('controls-collapsed');
      syncLabel();
    });

    syncLabel();
  }

  private toggleSection(targetSection: Element): void {
    const isActive = targetSection.classList.contains('active');

    if (isActive) {
      // 收合當前區塊
      targetSection.classList.remove('active');
    } else {
      // 展開目標區塊
      targetSection.classList.add('active');
    }
  }

  // 移除預設展開邏輯，所有區塊初始皆為收合狀態

  // 程式化控制方法
  public expandSection(sectionName: string): void {
    const section = document.querySelector(`[data-section="${sectionName}"]`);
    if (section) {
      section.classList.add('active');
    }
  }

  public collapseSection(sectionName: string): void {
    const section = document.querySelector(`[data-section="${sectionName}"]`);
    if (section) {
      section.classList.remove('active');
    }
  }
}
```

## UpdateNoticeController
- Source: `src/interface/updateNoticeController.ts`
- Description: Recent-update notice with details and dismissal behavior.
- Key props: none; uses fixed DOM ids.

```ts
/**
 * 近期更新提示卡控制器
 * - 展開/收合更新內容
 * - 使用者按「下次提醒」後只在本次瀏覽階段暫時隱藏
 * - 使用者按「我知道了」後以 localStorage 記住，不再干擾流程
 */
export class UpdateNoticeController {
  private readonly storageKey = 'medical-agenda-maker:update-notice:2026-07-09';
  private readonly snoozeKey = 'medical-agenda-maker:update-notice:2026-07-09:snoozed';
  private readonly notice: HTMLElement | null;
  private readonly details: HTMLElement | null;
  private readonly toggleButton: HTMLButtonElement | null;
  private readonly remindLaterButton: HTMLButtonElement | null;
  private readonly dismissButton: HTMLButtonElement | null;

  constructor() {
    this.notice = document.getElementById('updateNotice');
    this.details = document.getElementById('updateNoticeDetails');
    this.toggleButton = document.getElementById('updateNoticeToggle') as HTMLButtonElement | null;
    this.remindLaterButton = document.getElementById('updateNoticeRemindLater') as HTMLButtonElement | null;
    this.dismissButton = document.getElementById('updateNoticeDismiss') as HTMLButtonElement | null;

    this.init();
  }

  private init(): void {
    if (!this.notice) return;

    if (this.wasDismissed() || this.wasSnoozed()) {
      this.notice.classList.add('update-notice-hidden');
      return;
    }

    this.toggleButton?.addEventListener('click', () => this.toggleDetails());
    this.remindLaterButton?.addEventListener('click', () => this.remindLater());
    this.dismissButton?.addEventListener('click', () => this.dismiss());
  }

  private toggleDetails(): void {
    if (!this.details || !this.toggleButton || !this.notice) return;

    const willExpand = this.details.hidden;
    this.details.hidden = !willExpand;
    this.notice.classList.toggle('update-notice-expanded', willExpand);
    this.toggleButton.setAttribute('aria-expanded', String(willExpand));
    this.toggleButton.textContent = willExpand ? '收合更新內容' : '查看更新內容';
  }

  private remindLater(): void {
    if (!this.notice) return;

    this.rememberSnoozed();
    this.hideNotice();
  }

  private dismiss(): void {
    if (!this.notice) return;

    this.rememberDismissed();
    this.hideNotice();
  }

  private hideNotice(): void {
    if (!this.notice) return;

    this.notice.classList.add('update-notice-dismissing');

    window.setTimeout(() => {
      this.notice?.classList.add('update-notice-hidden');
    }, 240);
  }

  private wasDismissed(): boolean {
    try {
      return window.localStorage.getItem(this.storageKey) === 'dismissed';
    } catch (_error) {
      return false;
    }
  }

  private wasSnoozed(): boolean {
    try {
      return window.sessionStorage.getItem(this.snoozeKey) === 'snoozed';
    } catch (_error) {
      return false;
    }
  }

  private rememberDismissed(): void {
    try {
      window.localStorage.setItem(this.storageKey, 'dismissed');
    } catch (_error) {
      // localStorage 可能被瀏覽器隱私設定阻擋；不影響提示卡收合。
    }
  }

  private rememberSnoozed(): void {
    try {
      window.sessionStorage.setItem(this.snoozeKey, 'snoozed');
    } catch (_error) {
      // sessionStorage 可能被瀏覽器隱私設定阻擋；不影響提示卡收合。
    }
  }
}
```

## TemplateController
- Source: `src/interface/templateController.ts`
- Description: Reusable save/load template actions rendered into the template selector.
- Key props: state collector and state applier callbacks.

```ts
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
```
