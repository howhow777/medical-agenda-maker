/**
 * 近期更新提示卡控制器
 * - 在本期與上期更新之間切換單一內容區
 * - 使用者按「下次提醒」後只在本次瀏覽階段暫時隱藏
 * - 使用者按「我知道了」後以 localStorage 記住，不再干擾流程
 */
type UpdateNoticePeriod = 'current' | 'previous';

const updateNoticeContent: Readonly<Record<UpdateNoticePeriod, {
  title: string;
  summary: string;
  items: readonly string[];
}>> = {
  current: {
    title: '全新光影主視覺已成為預設設計',
    summary: '各癌別進入後會先顯示最新核准的頂部主視覺；需要原始風格時，仍可在「視覺設計」中切換。',
    items: [
      '各癌別進入後優先顯示最新核准的光影主視覺。',
      '每個癌別可在核准的新款主視覺間切換。',
      '最初版波浪主視覺仍保留在「視覺設計」選單中。',
      '建議配色與自訂三色均可搭配新款主視覺，Agenda 標題列同步配色。'
    ]
  },
  previous: {
    title: '手機審閱、議程編輯與 Moderator 顯示已優化',
    summary: '這次更新讓手機畫面更清爽，議程修改更直覺，也改善主持人欄位顯示。',
    items: [
      '設定區可收合，手機預覽空間更大。',
      '議程項目先看清單，點 ✏️ 再到下方編輯。',
      '可隱藏 Moderator 欄，Speaker 自動置中延展。',
      '相同 Moderator 可垂直合併置中，背景色更自然。',
      '修正集合地點在高畫質下載時遺失的問題。'
    ]
  }
};

export class UpdateNoticeController {
  private readonly storageKey = 'medical-agenda-maker:update-notice:2026-09-16-roof-defaults';
  private readonly snoozeKey = 'medical-agenda-maker:update-notice:2026-09-16-roof-defaults:snoozed';
  private readonly notice: HTMLElement | null;
  private readonly panel: HTMLElement | null;
  private readonly title: HTMLElement | null;
  private readonly summary: HTMLElement | null;
  private readonly details: HTMLElement | null;
  private readonly items: HTMLElement | null;
  private readonly currentTab: HTMLButtonElement | null;
  private readonly previousTab: HTMLButtonElement | null;
  private readonly readMoreButton: HTMLButtonElement | null;
  private readonly remindLaterButton: HTMLButtonElement | null;
  private readonly dismissButton: HTMLButtonElement | null;

  constructor() {
    this.notice = document.getElementById('updateNotice');
    this.panel = document.getElementById('updateNoticePanel');
    this.title = document.getElementById('updateNoticeTitle');
    this.summary = document.getElementById('updateNoticeSummary');
    this.details = document.getElementById('updateNoticeDetails');
    this.items = document.getElementById('updateNoticeItems');
    this.currentTab = document.getElementById('updateNoticeCurrentTab') as HTMLButtonElement | null;
    this.previousTab = document.getElementById('updateNoticePreviousTab') as HTMLButtonElement | null;
    this.readMoreButton = document.getElementById('updateNoticeReadMore') as HTMLButtonElement | null;
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

    this.currentTab?.addEventListener('click', () => this.selectPeriod('current'));
    this.previousTab?.addEventListener('click', () => this.selectPeriod('previous'));
    this.currentTab?.addEventListener('keydown', event => this.handleTabKeydown(event, 'current'));
    this.previousTab?.addEventListener('keydown', event => this.handleTabKeydown(event, 'previous'));
    this.readMoreButton?.addEventListener('click', () => this.toggleDetails());
    this.remindLaterButton?.addEventListener('click', () => this.remindLater());
    this.dismissButton?.addEventListener('click', () => this.dismiss());
    this.selectPeriod('current');
  }

  private selectPeriod(period: UpdateNoticePeriod): void {
    if (!this.currentTab || !this.previousTab || !this.panel || !this.title || !this.summary || !this.items) return;

    const content = updateNoticeContent[period];
    const isCurrent = period === 'current';
    this.currentTab.setAttribute('aria-selected', String(isCurrent));
    this.currentTab.tabIndex = isCurrent ? 0 : -1;
    this.previousTab.setAttribute('aria-selected', String(!isCurrent));
    this.previousTab.tabIndex = isCurrent ? -1 : 0;
    this.panel.setAttribute('aria-labelledby', isCurrent ? this.currentTab.id : this.previousTab.id);
    this.title.textContent = content.title;
    this.summary.textContent = content.summary;
    this.items.replaceChildren(...content.items.map(text => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    this.setDetailsExpanded(false);
  }

  private handleTabKeydown(event: KeyboardEvent, period: UpdateNoticePeriod): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

    event.preventDefault();
    const nextPeriod = period === 'current' ? 'previous' : 'current';
    this.selectPeriod(nextPeriod);
    (nextPeriod === 'current' ? this.currentTab : this.previousTab)?.focus();
  }

  private toggleDetails(): void {
    if (!this.details) return;
    this.setDetailsExpanded(this.details.hidden);
  }

  private setDetailsExpanded(expanded: boolean): void {
    if (!this.details || !this.readMoreButton) return;
    this.details.hidden = !expanded;
    this.readMoreButton.setAttribute('aria-expanded', String(expanded));
    this.readMoreButton.textContent = expanded ? '收合內容' : '閱讀更多';
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
