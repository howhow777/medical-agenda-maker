/**
 * UI 主控制器 - 協調所有模組的核心控制器
 */

import { AgendaItem, AppState, DragState, Overlay } from '../assets/types.js';
import { CanvasInteractions } from './canvasInteractions.js';
import { FormControls } from './formControls.js';
import { HighQualityTestController } from './high-quality-test.js';
import { TemplateController } from './templateController.js';
import { templates } from '../logic/templates.js';
import { AgendaData } from '../assets/agendaTypes.js';
import { DataConverter } from '../logic/dataConverter.js';
import { OverlayManager } from '../logic/overlayManager.js';
import { PosterRenderer } from '../logic/posterRenderer.js';
import { DataManager } from '../logic/dataManager.js';

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
  private highQualityTest!: HighQualityTestController;
  private templateController!: TemplateController;

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
    
    // 初始化高品質測試控制器
    this.highQualityTest = new HighQualityTestController(this.posterRenderer, this.overlayManager);
    
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
        customColors: this.appState.customColors
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
      
      // 更新海報
      this.updatePoster();
    });
    
    // 綁定全域函數供 HTML onclick 使用
    window.editAgenda = (index: number) => this.formControls.editAgenda(index);
    window.deleteAgenda = (index: number) => this.formControls.deleteAgenda(index);
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
      btnDownload.addEventListener('click', () => this.downloadPoster());
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
    
    if (dateInput) {
      dateInput.value = `${year}年${month}月${day}日`;
    }
    
    if (titleInput) {
      titleInput.value = `${year}年度癌症醫學會議`;
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
        this.appState.overlays
      );
      
      // 渲染圖層控制框（如果有選中的圖層）
      this.renderOverlayControls();
    } catch (error) {
      console.error('❌ 更新海報失敗:', error);
    }
  }
  
  /**
   * 取得會議資料
   */
  private getConferenceData() {
    const titleInput = document.getElementById('conferenceTitle') as HTMLInputElement;
    const subtitleInput = document.getElementById('conferenceSubtitle') as HTMLInputElement;
    const dateInput = document.getElementById('conferenceDate') as HTMLInputElement;
    const locationInput = document.getElementById('conferenceLocation') as HTMLInputElement;
    
    return {
      title: titleInput?.value || '醫學會議',
      subtitle: subtitleInput?.value || '',
      date: dateInput?.value || '',
      location: locationInput?.value || ''
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
  public downloadPoster(): void {
    try {
      // 先更新海報確保最新內容
      this.updatePoster();
      
      // 創建下載連結
      const link = document.createElement('a');
      link.download = `醫學會議海報_${new Date().toISOString().split('T')[0]}.png`;
      link.href = this.canvas.toDataURL('image/png');
      link.click();
      
      console.log('✅ 海報下載成功');
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
}
