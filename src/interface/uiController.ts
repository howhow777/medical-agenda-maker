/**
 * UI 主控制器 - 協調所有模組的核心控制器
 */

import { AgendaItem, AppState, DragState, Overlay } from '../assets/types.js';
import { CanvasInteractions } from './canvasInteractions.js';
import { FormControls } from './formControls.js';
import { TemplateController } from './templateController.js';
import { templates } from '../logic/templates.js';
import { AgendaData } from '../assets/agendaTypes.js';
import { DataConverter } from '../logic/dataConverter.js';
import { OverlayManager } from '../logic/overlayManager.js';
import { PosterRenderer } from '../logic/posterRenderer.js';
import { DataManager } from '../logic/dataManager.js';
import { CropController } from './cropController-fixed.js';
import { FeedbackController } from './feedbackController.js';

export class UIController {
  // 狀態管理
  private appState: AppState;
  private dragState: DragState;

  // 模組實例
  private canvasInteractions!: CanvasInteractions;
  private formControls!: FormControls;
  private overlayManager!: OverlayManager;
  private posterRenderer!: PosterRenderer;
  private dataManager!: DataManager;
  private templateController!: TemplateController;
  private cropController!: CropController;
  private feedbackController!: FeedbackController;

  // DOM 元素
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;

  constructor() {
    // 初始化狀態
    this.appState = {
      agendaItems: [],
      currentTemplate: 'lung',
      currentColorScheme: 'medical_green',
      currentGradientDirection: 'horizontal',
      overlays: [],
      selectedOverlayIndex: -1,
      customColors: {
        headerC1: '#1B4D3E',
        headerC2: '#2D8659', 
        headerC3: '#4CAF85',
        agendaBg: '#E8F5E8',
        agendaBorder: '#1B4D3E',
        agendaAccent: '#2D8659',
        bgC1: '#ffffff',
        bgC2: '#f8f9fa',
        bgGradientDir: 'none'
      }
    };

    this.dragState = {
      mode: 'none',
      idx: -1,
      start: { x: 0, y: 0 },
      startOv: null,
      handle: null,
      startAngle: 0
    };
  }

  /**
   * 初始化整個應用程式
   */
  public async initialize(): Promise<void> {
    try {
      // 取得 Canvas 元素
      this.canvas = document.getElementById('posterCanvas') as HTMLCanvasElement;
      if (!this.canvas) {
        throw new Error('找不到 posterCanvas 元素');
      }
      
      this.ctx = this.canvas.getContext('2d')!;
      if (!this.ctx) {
        throw new Error('無法取得 Canvas 2D 上下文');
      }

      // 初始化所有模組
      this.initializeModules();
      
      // 綁定事件
      this.bindEvents();
      
      // 初始化下載按鈕動態定位
      this.initializeDownloadButtonPosition();
      
      // 載入初始資料
      this.loadInitialData();
      
      // 首次渲染
      this.updatePoster();
      
      // 註冊到全域以供 posterRenderer 訪問
      (window as any).app = this;
      
      console.log('🎉 醫學會議海報製作器初始化完成');
    } catch (error) {
      console.error('❌ 初始化失敗:', error);
      throw error;
    }
  }

  /**
   * 載入議程資料並產生海報
   */
  public loadAgendaData(agendaData: AgendaData): void {
    try {
      console.log('📋 開始載入議程資料:', agendaData);
      
      // 轉換議程資料為海報系統格式
      const convertedState = DataConverter.convertAgendaDataToAppState(agendaData);
      
      // 驗證轉換結果
      if (!DataConverter.validateConversion(convertedState)) {
        throw new Error('議程資料轉換失敗');
      }
      
      // 更新應用狀態
      Object.assign(this.appState, convertedState);
      
      // 更新表單的基本資訊
      this.updateBasicInfoForm(agendaData.basicInfo);
      
      // 更新表單控制器的議程項目
      this.formControls.setAgendaItems(this.appState.agendaItems);
      
      // 重新渲染海報
      this.updatePoster();
      
      console.log('✅ 議程資料載入完成');
    } catch (error) {
      console.error('❌ 議程資料載入失敗:', error);
      alert(`議程資料載入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  }

  /**
   * 更新基本資訊表單
   */
  private updateBasicInfoForm(basicInfo: any): void {
    const titleInput = document.getElementById('conferenceTitle') as HTMLInputElement;
    const subtitleInput = document.getElementById('conferenceSubtitle') as HTMLInputElement;
    const dateInput = document.getElementById('conferenceDate') as HTMLInputElement;
    const timeInput = document.getElementById('conferenceTime') as HTMLInputElement;
    const locationInput = document.getElementById('conferenceLocation') as HTMLInputElement;
    
    if (titleInput && basicInfo.title) {
      titleInput.value = basicInfo.title;
    }
    
    // 🔧 修復：不再自動設定副標題為地點名稱
    // 保持副標題的預設值或基於會議類型的智能生成
    // if (subtitleInput && basicInfo.venue) {
    //   subtitleInput.value = basicInfo.venue;
    // }
    
    if (dateInput && basicInfo.date) {
      dateInput.value = basicInfo.date;
    }
    
    // 🕐 智能時間更新：Excel 優先，但保護用戶修改
    if (timeInput && basicInfo.time) {
      const userModified = this.formControls.getUserModifiedTime();
      if (!userModified) {
        timeInput.value = basicInfo.time;
        console.log('🕐 Excel 時間已載入（覆蓋預設值）:', basicInfo.time);
      } else {
        console.log('🕐 保護用戶手動修改的時間，不覆蓋:', timeInput.value);
      }
    }

    // 更新集合地點資訊
    const showMeetupCheckbox = document.getElementById('showMeetupPoint') as HTMLInputElement;
    const meetupSameRadio = document.getElementById('meetupSame') as HTMLInputElement;
    const meetupOtherRadio = document.getElementById('meetupOther') as HTMLInputElement;
    const meetupCustomInput = document.getElementById('meetupCustomText') as HTMLInputElement;

    if (showMeetupCheckbox && basicInfo.showMeetupPoint) {
      showMeetupCheckbox.checked = basicInfo.showMeetupPoint;
      const meetupSection = document.getElementById('meetupPointSection');
      if (meetupSection) meetupSection.style.display = 'block';
      
      if (basicInfo.meetupType === 'other') {
        if (meetupOtherRadio) meetupOtherRadio.checked = true;
        if (meetupCustomInput && basicInfo.meetupCustom) {
          meetupCustomInput.value = basicInfo.meetupCustom;
          meetupCustomInput.disabled = false;
        }
      }
    }
    
    if (locationInput && basicInfo.venue) {
      locationInput.value = basicInfo.venue;
    }
    
    console.log('✅ 基本資訊表單已更新（智能時間邏輯）');
  }

  /**
   * 初始化所有模組
   */
  private initializeModules(): void {
    // 初始化核心邏輯模組
    this.overlayManager = new OverlayManager(this.canvas);
    this.posterRenderer = new PosterRenderer(this.canvas);
    this.dataManager = new DataManager();

    // 初始化互動層模組
    this.canvasInteractions = new CanvasInteractions(
      this.canvas,
      this.overlayManager,
      () => this.updatePoster(),
      () => this.syncOverlayControls(),
      () => this.refreshOverlayList()
    );

    this.formControls = new FormControls(() => this.updatePoster());
    this.formControls.setOverlayManager(this.overlayManager);
    
    // 初始化範本控制器
    this.templateController = new TemplateController();
    
    // 設定範本系統的狀態收集器
    this.templateController.setStateCollector(() => {
      return {
        agendaItems: this.appState.agendaItems,
        overlays: this.overlayManager.getOverlays().map(overlay => ({
          id: overlay.id,
          name: overlay.name,
          src: overlay.src,
          x: overlay.x,
          y: overlay.y,
          w: overlay.w,
          h: overlay.h,
          scaleX: overlay.scaleX,
          scaleY: overlay.scaleY,
          rotation: overlay.rotation,
          opacity: overlay.opacity,
          visible: overlay.visible,
          lockAspect: overlay.lockAspect
        })),
        customColors: this.appState.customColors,
        meetupSettings: {
          showMeetupPoint: this.formControls.getShowMeetupPoint(),
          meetupType: this.formControls.getMeetupType(),
          meetupCustomText: this.formControls.getMeetupCustomText()
        },
        footerSettings: {
          showFooterNote: this.formControls.getShowFooterNote(),
          footerContent: this.getFooterText()
        },
        basicInfo: {
          title: (document.getElementById('conferenceTitle') as HTMLInputElement)?.value || '',
          subtitle: (document.getElementById('conferenceSubtitle') as HTMLInputElement)?.value || '',
          date: (document.getElementById('conferenceDate') as HTMLInputElement)?.value || '',
          time: (document.getElementById('conferenceTime') as HTMLInputElement)?.value || '',
          location: (document.getElementById('conferenceLocation') as HTMLInputElement)?.value || ''
        }
      };
    });
    
    // 設定範本系統的狀態套用器
    this.templateController.setStateApplier((customState) => {
      if (customState.agendaItems) {
        this.appState.agendaItems = customState.agendaItems;
        this.formControls.setAgendaItems(customState.agendaItems);
      }
      
      if (customState.overlays) {
        // 清除現有圖層
        this.overlayManager.clearOverlays();
        
        // 載入圖層資料（需要重新載入圖片）
        customState.overlays.forEach(async (overlayData: any) => {
          try {
            const img = new Image();
            img.onload = () => {
              const overlay = this.overlayManager.addOverlay(img, overlayData.name, overlayData.src);
              // 還原圖層屬性
              Object.assign(overlay, overlayData);
              this.refreshOverlayList();
              this.updatePoster();
            };
            img.src = overlayData.src;
          } catch (e) {
            console.warn('無法載入圖層:', overlayData.name, e);
          }
        });
      }
      
      if (customState.customColors) {
        this.appState.customColors = customState.customColors;
        this.formControls.setCustomColors(customState.customColors);
      }
      
      // 🆕 還原集合地點設定
      if (customState.meetupSettings) {
        this.formControls.setMeetupSettings(customState.meetupSettings);
      }
      
      // 🆕 還原頁尾設定
      if (customState.footerSettings) {
        this.formControls.setFooterSettings(customState.footerSettings);
      }
      
      // 🆕 還原基本資訊
      if (customState.basicInfo) {
        this.restoreBasicInfo(customState.basicInfo);
      }
      
      // 更新海報
      this.updatePoster();
    });
    
    // 綁定全域函數供 HTML onclick 使用
    window.editAgenda = (index: number) => this.formControls.editAgenda(index);
    window.deleteAgenda = (index: number) => this.formControls.deleteAgenda(index);
    
    // 初始化裁切控制器 (新增功能，完全獨立)
    this.cropController = new CropController(
      this.canvas,
      this.overlayManager,
      () => this.updatePoster()
    );
    
    // 初始化用戶回饋控制器
    this.feedbackController = new FeedbackController(this.overlayManager);
  }

  /**
   * 綁定所有事件
   */
  private bindEvents(): void {
    // Canvas 互動事件
    this.canvasInteractions.bindEvents();
    
    // 表單控制事件  
    this.formControls.bindEvents();
    
    // 全域事件
    this.bindGlobalEvents();
  }

  /**
   * 綁定全域事件
   */
  private bindGlobalEvents(): void {
    // 視窗大小改變
    window.addEventListener('resize', () => {
      this.updatePoster();
    });

    // 更新和下載按鈕
    const btnUpdate = document.getElementById('btnUpdate');
    const btnDownload = document.getElementById('btnDownload');
    
    if (btnUpdate) {
      btnUpdate.addEventListener('click', () => this.updatePoster());
    }
    
    if (btnDownload) {
      btnDownload.addEventListener('click', async () => {
        console.log('🎯 用戶點擊下載按鈕');
        
        try {
          const shouldDownload = await this.feedbackController.showModal();
          
          if (shouldDownload) {
            console.log('✅ 用戶完成回饋，開始下載');
            this.downloadPoster();
          } else {
            console.log('❌ 用戶取消下載');
          }
        } catch (error) {
          console.error('❌ 回饋流程錯誤:', error);
          // 發生錯誤時直接下載
          this.downloadPoster();
        }
      });
    }
  }

  /**
   * 綁定檔案相關事件
   */
  private bindFileEvents(): void {
    // 檔案相關事件已移除，保留此方法以防未來需要
  }

  /**
   * 載入初始資料
   */
  private loadInitialData(): void {
    // 設定初始日期
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    
    const dateInput = document.getElementById('conferenceDate') as HTMLInputElement;
    const titleInput = document.getElementById('conferenceTitle') as HTMLInputElement;
    const timeInput = document.getElementById('conferenceTime') as HTMLInputElement;
    
    if (dateInput) {
      dateInput.value = `${year}年${month}月${day}日`;
    }
    
    if (titleInput) {
      titleInput.value = `${year}年度癌症醫學會議`;
    }

    // 🕐 固定時間預設值 - 只在空白時設定
    if (timeInput && !timeInput.value.trim()) {
      timeInput.value = '08:30 - 12:00';
      console.log('🕐 設定預設會議時間:', timeInput.value);
    }

    // 載入預設範例議程
    const currentTemplate = templates[this.appState.currentTemplate];
    if (currentTemplate) {
      this.appState.agendaItems = [...currentTemplate.sampleItems];
    }
  }

  /**
   * 更新海報
   */
  public updatePoster(): void {
    try {
      // 從 FormControls 同步最新狀態
      this.appState.agendaItems = this.formControls.getAgendaItems();
      this.appState.currentTemplate = this.formControls.getCurrentTemplate();
      this.appState.currentColorScheme = this.formControls.getCurrentColorScheme();
      this.appState.currentGradientDirection = this.formControls.getCurrentGradientDirection();
      this.appState.customColors = this.formControls.getCustomColors();
      this.appState.overlays = this.overlayManager.getOverlays();
      this.appState.selectedOverlayIndex = this.overlayManager.getSelectedIndex();
      
      // 取得會議資料
      const conferenceData = this.getConferenceData();
      const showFooter = this.formControls.getShowFooterNote();
      const footerText = this.getFooterText();
      
      // 計算所需高度
      const requiredHeight = this.posterRenderer.calculateRequiredHeight(
        this.appState.agendaItems,
        showFooter,
        footerText,
        this.canvas.width
      );
      
      // 調整畫布高度
      if (this.canvas.height !== requiredHeight) {
        this.canvas.height = requiredHeight;
      }
      
      // 確保選取物件仍在畫布內
      if (this.appState.selectedOverlayIndex >= 0) {
        const ov = this.appState.overlays[this.appState.selectedOverlayIndex];
        if (ov) {
          ov.x = Math.max(0, Math.min(this.canvas.width, ov.x));
          ov.y = Math.max(0, Math.min(this.canvas.height, ov.y));
        }
      }
      
      // 取得 table 透明度
      const tableOpacity = this.formControls.getTableOpacity();
      
      // 渲染海報
      this.posterRenderer.drawPoster(
        this.appState.agendaItems,
        this.appState.currentTemplate,
        this.appState.currentColorScheme,
        this.appState.currentGradientDirection,
        this.appState.customColors,
        conferenceData,
        showFooter,
        footerText,
        this.appState.overlays,
        tableOpacity
      );
      
      // 渲染圖層控制框（如果有選中的圖層）
      this.renderOverlayControls();
      
      // 渲染裁切界面（如果處於裁切模式）
      this.cropController.drawCropInterface(this.ctx);
    } catch (error) {
      console.error('❌ 更新海報失敗:', error);
    }
  }
  
  /**
   * 取得會議資料
   */
  public getConferenceData() {
    const titleInput = document.getElementById('conferenceTitle') as HTMLInputElement;
    const subtitleInput = document.getElementById('conferenceSubtitle') as HTMLInputElement;
    const dateInput = document.getElementById('conferenceDate') as HTMLInputElement;
    const timeInput = document.getElementById('conferenceTime') as HTMLInputElement;
    const locationInput = document.getElementById('conferenceLocation') as HTMLInputElement;
    
    // 取得集合地點資訊
    const showMeetupPoint = this.formControls.getShowMeetupPoint();
    const meetupType = this.formControls.getMeetupType();
    const meetupCustomText = this.formControls.getMeetupCustomText();

    return {
      title: titleInput?.value || '醫學會議',
      subtitle: subtitleInput?.value || '',
      date: dateInput?.value || '',
      time: timeInput?.value || '',
      location: locationInput?.value || '',
      showMeetupPoint,
      meetupType,
      meetupCustomText
    };
  }

  /**
   * 取得頁尾註解文字
   */
  private getFooterText(): string {
    const footerContent = document.getElementById('footerNoteContent') as HTMLTextAreaElement;
    return footerContent?.value || "備註：請於會議前30分鐘完成報到手續";
  }

  /**
   * 下載海報
   */
  public async downloadPoster(): Promise<void> {
    try {
      // 先更新海報確保最新內容
      this.updatePoster();
      
      // 使用高解析度渲染（3倍高品質JPEG，檔案更小且適合所有用途）
      const { blob } = await this.posterRenderer.exportHighQuality('jpeg', 0.95, 3);
      
      // 創建下載連結
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `醫學會議海報_${new Date().toISOString().split('T')[0]}.jpg`;
      link.href = url;
      link.click();
      
      // 清理 URL 對象
      URL.revokeObjectURL(url);
      
      console.log('✅ 海報下載成功（高品質3倍解析度JPEG）');
    } catch (error) {
      console.error('❌ 下載海報失敗:', error);
    }
  }

  /**
   * 重新整理圖層列表
   */
  public refreshOverlayList(): void {
    if (this.formControls && this.formControls.refreshOverlayList) {
      this.formControls.refreshOverlayList();
    }
  }

  /**
   * 同步圖層控制項
   */
  public syncOverlayControls(): void {
    if (this.formControls && this.formControls.syncOverlayControls) {
      this.formControls.syncOverlayControls();
    }
  }

  /**
   * 渲染圖層控制框
   */
  private renderOverlayControls(): void {
    if (this.appState.selectedOverlayIndex >= 0) {
      // 🎯 直接從 overlayManager 獲取最新數據，確保同步
      const overlay = this.overlayManager.getSelectedOverlay();
      if (!overlay) return;
      
      // 只渲染控制點，不重複渲染圖層本體
      this.renderOverlayHandles(overlay);
      console.log('🎯 完整控制點已渲染: 縮放把手 + 旋轉把手, 旋轉角度:', overlay.rotation);
    }
  }
  
  /**
   * 只渲染控制點（不渲染圖層本體）
   */
  private renderOverlayHandles(overlay: Overlay): void {
    const size = this.overlayManager.getOverlaySize(overlay);
    
    this.ctx.save();
    this.ctx.translate(overlay.x, overlay.y);
    this.ctx.rotate(overlay.rotation);

    // 邊框
    this.ctx.strokeStyle = 'rgba(0,0,0,.7)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([6, 4]);
    this.ctx.strokeRect(-size.w / 2, -size.h / 2, size.w, size.h);
    this.ctx.setLineDash([]);

    // 八個縮放把手
    const handles = this.overlayManager.getHandlePositions(overlay);
    this.ctx.fillStyle = '#fff';
    this.ctx.strokeStyle = 'rgba(0,0,0,.85)';
    handles.forEach(handle => {
      this.ctx.beginPath();
      this.ctx.rect(handle.x - 6, handle.y - 6, 12, 12);
      this.ctx.fill();
      this.ctx.stroke();
    });

    // 旋轉把手
    const rotHandle = this.overlayManager.getRotateHandle(overlay);
    this.ctx.beginPath();
    this.ctx.moveTo(0, -size.h / 2);
    this.ctx.lineTo(0, rotHandle.y + 12);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.arc(rotHandle.x, rotHandle.y, 8, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.restore();
  }

  /**
   * 取得應用狀態（供外部存取）
   */
  public getAppState(): AppState {
    return this.appState;
  }


  /**
   * 初始化下載按鈕動態定位
   */
  private initializeDownloadButtonPosition(): void {
    // 初始定位
    this.updateDownloadButtonPosition();
    
    // 監聽滾動事件
    window.addEventListener('scroll', () => {
      this.updateDownloadButtonPosition();
    });
    
    // 監聽視窗大小變化
    window.addEventListener('resize', () => {
      this.updateDownloadButtonPosition();
    });
    
    console.log('🎯 下載按鈕動態定位系統已啟動');
  }

  /**
   * 更新下載按鈕位置 - 固定在白色框下緣上方
   */
  private updateDownloadButtonPosition(): void {
    const canvasContainer = document.querySelector('.canvas-container') as HTMLElement;
    const downloadBtn = document.getElementById('btnDownload') as HTMLElement;
    
    if (!canvasContainer || !downloadBtn) {
      console.warn('🔍 找不到 Canvas 容器或下載按鈕');
      return;
    }
    
    try {
      const rect = canvasContainer.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // 計算距離視窗底部的距離，在白色框下緣上方 15px
      const bottomOffset = Math.max(15, windowHeight - rect.bottom + 15);
      
      downloadBtn.style.bottom = `${bottomOffset}px`;
      
      // 除錯用 console（生產環境可移除）
      // console.log('🎯 按鈕位置更新:', { bottom: bottomOffset, rectBottom: rect.bottom, windowHeight });
      
    } catch (error) {
      console.error('❌ 更新下載按鈕位置時發生錯誤:', error);
    }
  }


  /**
   * 還原基本資訊到表單（範本載入時使用）
   */
  private restoreBasicInfo(basicInfo: any): void {
    const titleInput = document.getElementById('conferenceTitle') as HTMLInputElement;
    const subtitleInput = document.getElementById('conferenceSubtitle') as HTMLInputElement;
    const dateInput = document.getElementById('conferenceDate') as HTMLInputElement;
    const timeInput = document.getElementById('conferenceTime') as HTMLInputElement;
    const locationInput = document.getElementById('conferenceLocation') as HTMLInputElement;
    
    if (titleInput && basicInfo.title) titleInput.value = basicInfo.title;
    if (subtitleInput && basicInfo.subtitle) subtitleInput.value = basicInfo.subtitle;
    if (dateInput && basicInfo.date) dateInput.value = basicInfo.date;
    if (timeInput && basicInfo.time) timeInput.value = basicInfo.time;
    if (locationInput && basicInfo.location) locationInput.value = basicInfo.location;
    
    console.log('✅ 基本資訊已從範本還原');
  }
}
