import { OverlayManager } from '../logic/overlayManager.js';
/**
 * 用戶回饋收集控制器
 */
export declare class FeedbackController {
    private overlayManager;
    private modal;
    private state;
    private readonly WEBHOOK_URL;
    private readonly STORAGE_KEY;
    private readonly SUBMIT_DATE_KEY;
    constructor(overlayManager: OverlayManager);
    /**
     * 初始化Modal DOM結構
     */
    private initializeModal;
    /**
     * 綁定事件監聽
     */
    private bindEvents;
    /**
     * 顯示回饋表單Modal
     */
    showModal(): Promise<boolean>;
    private resolveCallback?;
    /**
     * 隱藏Modal
     */
    private hideModal;
    /**
     * 處理表單提交
     */
    private handleSubmit;
    /**
     * 獲取表單資料
     */
    private getFormData;
    /**
     * 表單驗證
     */
    private validateForm;
    /**
     * 提交到Make.com Webhook
     */
    private submitToWebhook;
    /**
     * 獲取海報配置資訊
     */
    private getPosterConfig;
    /**
     * 保存用戶資料到本地
     */
    private saveUserData;
    /**
     * 載入已保存的用戶資料
     */
    private loadSavedData;
    /**
     * 檢查今日是否已提交
     */
    private checkTodaySubmission;
    /**
     * 標記今日已提交
     */
    private markTodaySubmitted;
    /**
     * 設定提交狀態
     */
    private setSubmitState;
    /**
     * 顯示成功狀態
     */
    private showSuccessState;
    /**
     * 顯示錯誤訊息
     */
    private showError;
    /**
     * 顯示欄位錯誤
     */
    private showFieldError;
    /**
     * 清除所有錯誤提示
     */
    private clearErrors;
    /**
     * 重設Modal狀態
     */
    resetModal(): void;
}
