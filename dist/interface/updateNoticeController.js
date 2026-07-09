/**
 * 近期更新提示卡控制器
 * - 展開/收合更新內容
 * - 使用者按「下次提醒」後只在本次瀏覽階段暫時隱藏
 * - 使用者按「我知道了」後以 localStorage 記住，不再干擾流程
 */
export class UpdateNoticeController {
    constructor() {
        this.storageKey = 'medical-agenda-maker:update-notice:2026-07-09';
        this.snoozeKey = 'medical-agenda-maker:update-notice:2026-07-09:snoozed';
        this.notice = document.getElementById('updateNotice');
        this.details = document.getElementById('updateNoticeDetails');
        this.toggleButton = document.getElementById('updateNoticeToggle');
        this.remindLaterButton = document.getElementById('updateNoticeRemindLater');
        this.dismissButton = document.getElementById('updateNoticeDismiss');
        this.init();
    }
    init() {
        if (!this.notice)
            return;
        if (this.wasDismissed() || this.wasSnoozed()) {
            this.notice.classList.add('update-notice-hidden');
            return;
        }
        this.toggleButton?.addEventListener('click', () => this.toggleDetails());
        this.remindLaterButton?.addEventListener('click', () => this.remindLater());
        this.dismissButton?.addEventListener('click', () => this.dismiss());
    }
    toggleDetails() {
        if (!this.details || !this.toggleButton || !this.notice)
            return;
        const willExpand = this.details.hidden;
        this.details.hidden = !willExpand;
        this.notice.classList.toggle('update-notice-expanded', willExpand);
        this.toggleButton.setAttribute('aria-expanded', String(willExpand));
        this.toggleButton.textContent = willExpand ? '收合更新內容' : '查看更新內容';
    }
    remindLater() {
        if (!this.notice)
            return;
        this.rememberSnoozed();
        this.hideNotice();
    }
    dismiss() {
        if (!this.notice)
            return;
        this.rememberDismissed();
        this.hideNotice();
    }
    hideNotice() {
        if (!this.notice)
            return;
        this.notice.classList.add('update-notice-dismissing');
        window.setTimeout(() => {
            this.notice?.classList.add('update-notice-hidden');
        }, 240);
    }
    wasDismissed() {
        try {
            return window.localStorage.getItem(this.storageKey) === 'dismissed';
        }
        catch (_error) {
            return false;
        }
    }
    wasSnoozed() {
        try {
            return window.sessionStorage.getItem(this.snoozeKey) === 'snoozed';
        }
        catch (_error) {
            return false;
        }
    }
    rememberDismissed() {
        try {
            window.localStorage.setItem(this.storageKey, 'dismissed');
        }
        catch (_error) {
            // localStorage 可能被瀏覽器隱私設定阻擋；不影響提示卡收合。
        }
    }
    rememberSnoozed() {
        try {
            window.sessionStorage.setItem(this.snoozeKey, 'snoozed');
        }
        catch (_error) {
            // sessionStorage 可能被瀏覽器隱私設定阻擋；不影響提示卡收合。
        }
    }
}
//# sourceMappingURL=updateNoticeController.js.map