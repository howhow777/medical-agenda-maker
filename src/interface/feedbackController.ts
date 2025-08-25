import { OverlayManager } from '../logic/overlayManager.js';

interface FeedbackData {
  organization: string;
  name: string;
  feedback: string;
  timestamp: string;
  posterConfig?: any;
}

interface FeedbackState {
  isVisible: boolean;
  isSubmitting: boolean;
  hasSubmittedToday: boolean;
}

/**
 * 用戶回饋收集控制器
 */
export class FeedbackController {
  private overlayManager: OverlayManager;
  private modal: HTMLElement | null = null;
  private state: FeedbackState = {
    isVisible: false,
    isSubmitting: false,
    hasSubmittedToday: false
  };

  // Make.com Webhook URL - 需要用戶設定
  private readonly WEBHOOK_URL = 'https://hook.us1.make.com/4tdgiobki4ktgfeg1ht8d01ysqwzgmbf';
  
  // 本地存儲key
  private readonly STORAGE_KEY = 'medical-agenda-user-data';
  private readonly SUBMIT_DATE_KEY = 'medical-agenda-last-submit';

  constructor(overlayManager: OverlayManager) {
    this.overlayManager = overlayManager;
    this.initializeModal();
    this.bindEvents();
    this.checkTodaySubmission();
    console.log('✅ FeedbackController 初始化完成');
  }

  /**
   * 初始化Modal DOM結構
   */
  private initializeModal(): void {
    const modalHTML = `
      <div id="feedbackModal" class="feedback-modal" style="display: none;">
        <div class="feedback-modal-backdrop"></div>
        <div class="feedback-modal-content">
          <div class="feedback-modal-header">
            <h3>🎯 獲取您的專屬海報</h3>
            <p>請分享一些基本資訊，幫助我們為您提供更好的服務</p>
          </div>
          
          <form id="feedbackForm" class="feedback-form">
            <div class="feedback-form-group">
              <label for="organization" class="required">機構/組織名稱</label>
              <input type="text" id="organization" name="organization" 
                     placeholder="例：台大醫院、陽明醫學院" required>
              <div class="feedback-error" id="organization-error"></div>
            </div>
            
            <div class="feedback-form-group">
              <label for="userName" class="required">您的姓名</label>
              <input type="text" id="userName" name="userName" 
                     placeholder="請輸入真實姓名" required>
              <div class="feedback-error" id="userName-error"></div>
            </div>
            
            <div class="feedback-form-group">
              <label for="feedback">使用心得或建議 (選填)</label>
              <textarea id="feedback" name="feedback" rows="4" 
                        placeholder="分享您的使用體驗，或告訴我們可以改進的地方..."></textarea>
            </div>
            
            <div class="feedback-privacy">
              <small>
                🔒 您的資料僅用於改善服務品質，我們承諾妥善保護您的隱私
              </small>
            </div>
            
            <div class="feedback-form-actions">
              <button type="button" class="btn btn-secondary" id="feedbackCancel">
                稍後下載
              </button>
              <button type="submit" class="btn btn-primary" id="feedbackSubmit">
                <span class="btn-text">提交並下載</span>
                <span class="btn-loading" style="display: none;">⏳ 提交中...</span>
              </button>
            </div>
          </form>
          
          <div class="feedback-success" id="feedbackSuccess" style="display: none;">
            <div class="success-icon">✅</div>
            <h4>感謝您的回饋！</h4>
            <p>海報下載已開始，祝您使用愉快！</p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.modal = document.getElementById('feedbackModal');
  }

  /**
   * 綁定事件監聽
   */
  private bindEvents(): void {
    const form = document.getElementById('feedbackForm') as HTMLFormElement;
    const cancelBtn = document.getElementById('feedbackCancel');
    const backdrop = document.querySelector('.feedback-modal-backdrop');

    // 表單提交
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // 取消按鈕
    cancelBtn?.addEventListener('click', () => {
      this.hideModal();
    });

    // 點擊背景關閉
    backdrop?.addEventListener('click', () => {
      this.hideModal();
    });

    // 輸入時載入記憶的資料
    const orgInput = document.getElementById('organization') as HTMLInputElement;
    const nameInput = document.getElementById('userName') as HTMLInputElement;
    
    orgInput?.addEventListener('focus', () => this.loadSavedData());
    nameInput?.addEventListener('focus', () => this.loadSavedData());

    // ESC鍵關閉
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.isVisible) {
        this.hideModal();
      }
    });
  }

  /**
   * 顯示回饋表單Modal
   */
  public showModal(): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.state.hasSubmittedToday) {
        // 今日已提交，直接下載
        resolve(true);
        return;
      }

      this.state.isVisible = true;
      this.modal!.style.display = 'flex';
      this.loadSavedData();
      
      // 聚焦第一個輸入框
      setTimeout(() => {
        const firstInput = document.getElementById('organization') as HTMLInputElement;
        firstInput?.focus();
      }, 100);

      // 設定解析回調
      this.resolveCallback = resolve;
    });
  }

  private resolveCallback?: (value: boolean) => void;

  /**
   * 隱藏Modal
   */
  private hideModal(): void {
    this.state.isVisible = false;
    this.modal!.style.display = 'none';
    
    // 清除載入狀態
    this.setSubmitState(false);
    
    // 回調false表示用戶取消
    this.resolveCallback?.(false);
  }

  /**
   * 處理表單提交
   */
  private async handleSubmit(): Promise<void> {
    if (this.state.isSubmitting) return;

    const formData = this.getFormData();
    if (!this.validateForm(formData)) {
      return;
    }

    this.setSubmitState(true);

    try {
      // 提交到Make.com
      await this.submitToWebhook(formData);
      
      // 保存用戶資料
      this.saveUserData(formData);
      
      // 記錄今日已提交
      this.markTodaySubmitted();
      
      // 立即觸發下載
      this.resolveCallback?.(true);
      
      // 顯示成功狀態
      this.showSuccessState();
      
      // 1秒後關閉Modal（讓用戶看到成功訊息）
      setTimeout(() => {
        this.hideModal();
      }, 1000);

    } catch (error) {
      console.error('❌ 提交回饋失敗:', error);
      this.showError('提交失敗，請檢查網路連線後重試');
      this.setSubmitState(false);
    }
  }

  /**
   * 獲取表單資料
   */
  private getFormData(): FeedbackData {
    const form = document.getElementById('feedbackForm') as HTMLFormElement;
    const formData = new FormData(form);
    
    return {
      organization: (formData.get('organization') as string)?.trim() || '',
      name: (formData.get('userName') as string)?.trim() || '',
      feedback: (formData.get('feedback') as string)?.trim() || '',
      timestamp: new Date().toISOString(),
      posterConfig: this.getPosterConfig()
    };
  }

  /**
   * 表單驗證
   */
  private validateForm(data: FeedbackData): boolean {
    let isValid = true;
    
    // 清除之前的錯誤
    this.clearErrors();

    // 驗證機構名稱
    if (!data.organization || data.organization.length < 2) {
      this.showFieldError('organization', '請輸入機構或組織名稱（至少2個字元）');
      isValid = false;
    }

    // 驗證姓名
    if (!data.name || data.name.length < 2) {
      this.showFieldError('userName', '請輸入您的姓名（至少2個字元）');
      isValid = false;
    }

    return isValid;
  }

  /**
   * 提交到Make.com Webhook
   */
  private async submitToWebhook(data: FeedbackData): Promise<void> {
    const response = await fetch(this.WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        source: 'medical-agenda-maker',
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  /**
   * 獲取海報配置資訊
   */
  private getPosterConfig(): any {
    const overlays = this.overlayManager.getOverlays();
    return {
      overlayCount: overlays.length,
      hasImages: overlays.some(o => o.src && o.src.length > 0),
      hasTexts: overlays.length > 0, // PNG圖層都算作圖片類型
      canvasSize: {
        width: document.querySelector('canvas')?.width || 0,
        height: document.querySelector('canvas')?.height || 0
      }
    };
  }

  /**
   * 保存用戶資料到本地
   */
  private saveUserData(data: FeedbackData): void {
    const userData = {
      organization: data.organization,
      name: data.name,
      lastUsed: new Date().toISOString()
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(userData));
  }

  /**
   * 載入已保存的用戶資料
   */
  private loadSavedData(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        const userData = JSON.parse(saved);
        
        const orgInput = document.getElementById('organization') as HTMLInputElement;
        const nameInput = document.getElementById('userName') as HTMLInputElement;
        
        if (!orgInput.value && userData.organization) {
          orgInput.value = userData.organization;
        }
        if (!nameInput.value && userData.name) {
          nameInput.value = userData.name;
        }
      }
    } catch (error) {
      console.warn('載入用戶資料失敗:', error);
    }
  }

  /**
   * 檢查今日是否已提交
   */
  private checkTodaySubmission(): void {
    const lastSubmit = localStorage.getItem(this.SUBMIT_DATE_KEY);
    if (lastSubmit) {
      const today = new Date().toDateString();
      const lastSubmitDate = new Date(lastSubmit).toDateString();
      this.state.hasSubmittedToday = (today === lastSubmitDate);
    }
  }

  /**
   * 標記今日已提交
   */
  private markTodaySubmitted(): void {
    localStorage.setItem(this.SUBMIT_DATE_KEY, new Date().toISOString());
    this.state.hasSubmittedToday = true;
  }

  /**
   * 設定提交狀態
   */
  private setSubmitState(isSubmitting: boolean): void {
    this.state.isSubmitting = isSubmitting;
    
    const submitBtn = document.getElementById('feedbackSubmit') as HTMLButtonElement;
    const btnText = submitBtn?.querySelector('.btn-text') as HTMLElement;
    const btnLoading = submitBtn?.querySelector('.btn-loading') as HTMLElement;
    
    if (submitBtn) {
      submitBtn.disabled = isSubmitting;
      if (isSubmitting) {
        if (btnText) btnText.style.display = 'none';
        if (btnLoading) btnLoading.style.display = 'inline';
      } else {
        if (btnText) btnText.style.display = 'inline';
        if (btnLoading) btnLoading.style.display = 'none';
      }
    }
  }

  /**
   * 顯示成功狀態
   */
  private showSuccessState(): void {
    const form = document.getElementById('feedbackForm');
    const success = document.getElementById('feedbackSuccess');
    
    form!.style.display = 'none';
    success!.style.display = 'block';
  }

  /**
   * 顯示錯誤訊息
   */
  private showError(message: string): void {
    alert(message); // 簡單版本，可以改成更優雅的錯誤提示
  }

  /**
   * 顯示欄位錯誤
   */
  private showFieldError(fieldName: string, message: string): void {
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    }
  }

  /**
   * 清除所有錯誤提示
   */
  private clearErrors(): void {
    const errors = document.querySelectorAll('.feedback-error');
    errors.forEach(error => {
      (error as HTMLElement).style.display = 'none';
    });
  }

  /**
   * 重設Modal狀態
   */
  public resetModal(): void {
    const form = document.getElementById('feedbackForm');
    const success = document.getElementById('feedbackSuccess');
    
    form!.style.display = 'block';
    success!.style.display = 'none';
    this.clearErrors();
    this.setSubmitState(false);
  }
}