export declare class UpdateNoticeController {
    private readonly storageKey;
    private readonly snoozeKey;
    private readonly notice;
    private readonly panel;
    private readonly title;
    private readonly summary;
    private readonly details;
    private readonly items;
    private readonly currentTab;
    private readonly previousTab;
    private readonly readMoreButton;
    private readonly remindLaterButton;
    private readonly dismissButton;
    constructor();
    private init;
    private selectPeriod;
    private handleTabKeydown;
    private toggleDetails;
    private setDetailsExpanded;
    private remindLater;
    private dismiss;
    private hideNotice;
    private wasDismissed;
    private wasSnoozed;
    private rememberDismissed;
    private rememberSnoozed;
}
