/**
 * 近期更新提示卡控制器
 * - 展開/收合更新內容
 * - 使用者按「下次提醒」後只在本次瀏覽階段暫時隱藏
 * - 使用者按「我知道了」後以 localStorage 記住，不再干擾流程
 */
export declare class UpdateNoticeController {
    private readonly storageKey;
    private readonly snoozeKey;
    private readonly notice;
    private readonly details;
    private readonly toggleButton;
    private readonly remindLaterButton;
    private readonly dismissButton;
    constructor();
    private init;
    private toggleDetails;
    private remindLater;
    private dismiss;
    private hideNotice;
    private wasDismissed;
    private wasSnoozed;
    private rememberDismissed;
    private rememberSnoozed;
}
