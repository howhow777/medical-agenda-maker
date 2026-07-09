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
