import { AgendaItem, CustomColors } from '../assets/types.js';
import { templates } from '../logic/templates.js';
import { OverlayManager } from '../logic/overlayManager.js';

export class FormControls {
  private agendaItems: AgendaItem[] = [];
  private currentTemplate: string = 'lung';
  private currentColorScheme: string = 'medical_green';
  private currentGradientDirection: string = 'horizontal';
  private customColors: CustomColors = {
    headerC1: '#1B4D3E',
    headerC2: '#2D8659', 
    headerC3: '#4CAF85',
    agendaBg: '#E8F5E8',
    agendaBorder: '#1B4D3E',
    agendaAccent: '#2D8659',
    bgC1: '#ffffff',
    bgC2: '#f8f9fa',
    bgGradientDir: 'none'
  };
  private showFooterNote: boolean = true;
  private isCropMode: boolean = false;
  private overlayManager?: OverlayManager;

  constructor(private updateCallback: () => void) {
    this.initializeForm();
  }

  // 設定 OverlayManager
  setOverlayManager(overlayManager: OverlayManager): void {
    this.overlayManager = overlayManager;
  }

  // 初始化表單
  private initializeForm(): void {
    // 載入初始範例議程
    const template = templates[this.currentTemplate];
    if (template) {
      this.agendaItems = [...template.sampleItems];
    }
  }

  // 綁定表單事件
  bindEvents(): void {
    this.bindTemplateEvents();
    this.bindColorSchemeEvents();
    this.bindAgendaEvents();
    this.bindOverlayEvents();
    this.bindFooterEvents();
  }

  // 綁定模板事件
  private bindTemplateEvents(): void {
    const templateBtns = document.querySelectorAll('.template-btn');
    templateBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const template = (e.currentTarget as HTMLElement).dataset.template;
        if (template) {
          this.currentTemplate = template;
          this.updateTemplateUI();
          this.loadSampleAgenda();
          this.updateCallback();
        }
      });
    });
  }

  // 綁定配色事件
  private bindColorSchemeEvents(): void {
    const colorSchemeSelect = document.getElementById('colorScheme') as HTMLSelectElement;
    if (colorSchemeSelect) {
      colorSchemeSelect.addEventListener('change', (e) => {
        this.currentColorScheme = (e.target as HTMLSelectElement).value;
        this.updateColorSchemeUI();
        this.updateCallback();
      });
    }

    const gradientDirSelect = document.getElementById('gradientDir') as HTMLSelectElement;
    if (gradientDirSelect) {
      gradientDirSelect.addEventListener('change', (e) => {
        this.currentGradientDirection = (e.target as HTMLSelectElement).value;
        this.updateCallback();
      });
    }

    // 自訂配色按鈕
    const applyColorsBtn = document.getElementById('applyCustomColors');
    if (applyColorsBtn) {
      applyColorsBtn.addEventListener('click', () => {
        this.updateCustomColors();
        this.updateCallback();
      });
    }
  }

  // 綁定議程事件
  private bindAgendaEvents(): void {
    const addBtn = document.getElementById('agendaAdd');
    const sampleBtn = document.getElementById('agendaSample');
    const clearBtn = document.getElementById('agendaClear');

    if (addBtn) {
      addBtn.addEventListener('click', () => this.addAgendaItem());
    }

    if (sampleBtn) {
      sampleBtn.addEventListener('click', () => this.loadSampleAgenda());
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAgenda());
    }
  }

  // 綁定圖層事件
  private bindOverlayEvents(): void {
    // PNG 檔案上傳
    const overlayFile = document.getElementById('overlayFile') as HTMLInputElement;
    if (overlayFile) {
      overlayFile.addEventListener('change', (e) => this.handleFileUpload(e));
    }

    // 圖層控制按鈕
    const bringFront = document.getElementById('bringFront');
    const bringForward = document.getElementById('bringForward');
    const sendBackward = document.getElementById('sendBackward');
    const sendBack = document.getElementById('sendBack');
    const centerOverlay = document.getElementById('centerOverlay');
    const resetOverlay = document.getElementById('resetOverlay');
    const removeOverlay = document.getElementById('removeOverlay');

    if (bringFront) bringFront.addEventListener('click', () => this.bringToFront());
    if (bringForward) bringForward.addEventListener('click', () => this.bringForward());
    if (sendBackward) sendBackward.addEventListener('click', () => this.sendBackward());
    if (sendBack) sendBack.addEventListener('click', () => this.sendToBack());
    if (centerOverlay) centerOverlay.addEventListener('click', () => this.centerSelectedOverlay());
    if (resetOverlay) resetOverlay.addEventListener('click', () => this.resetSelectedOverlay());
    if (removeOverlay) removeOverlay.addEventListener('click', () => this.removeSelectedOverlay());

    // 屬性控制
    const opacityRange = document.getElementById('overlayOpacity') as HTMLInputElement;
    const visibleCheck = document.getElementById('overlayVisible') as HTMLInputElement;
    const lockAspectCheck = document.getElementById('overlayLockAspect') as HTMLInputElement;

    if (opacityRange) {
      opacityRange.addEventListener('input', (e) => {
        const value = parseFloat((e.target as HTMLInputElement).value);
        this.updateSelectedOverlayProperty('opacity', value);
      });
    }

    if (visibleCheck) {
      visibleCheck.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        this.updateSelectedOverlayProperty('visible', checked);
      });
    }

    if (lockAspectCheck) {
      lockAspectCheck.addEventListener('change', (e) => {
        const checked = (e.target as HTMLInputElement).checked;
        this.updateSelectedOverlayProperty('lockAspect', checked);
      });
    }
  }

  // 綁定頁尾事件
  private bindFooterEvents(): void {
    const showFooterCheck = document.getElementById('showFooterNote') as HTMLInputElement;
    if (showFooterCheck) {
      showFooterCheck.addEventListener('change', (e) => {
        this.showFooterNote = (e.target as HTMLInputElement).checked;
        this.updateCallback();
      });
    }
  }

  // 更新模板 UI
  private updateTemplateUI(): void {
    const templateBtns = document.querySelectorAll('.template-btn');
    templateBtns.forEach(btn => {
      btn.classList.remove('active');
      if ((btn as HTMLElement).dataset.template === this.currentTemplate) {
        btn.classList.add('active');
      }
    });
  }

  // 更新配色方案 UI
  private updateColorSchemeUI(): void {
    const customSection = document.getElementById('customColorsSection');
    if (customSection) {
      if (this.currentColorScheme === 'custom') {
        customSection.classList.add('show');
      } else {
        customSection.classList.remove('show');
      }
    }
  }

  // 更新自訂配色
  private updateCustomColors(): void {
    const getColorValue = (id: string) => {
      const input = document.getElementById(id) as HTMLInputElement;
      return input ? input.value : '#000000';
    };

    this.customColors = {
      headerC1: getColorValue('headerC1'),
      headerC2: getColorValue('headerC2'),
      headerC3: getColorValue('headerC3'),
      agendaBg: getColorValue('agendaBg'),
      agendaBorder: getColorValue('agendaBorder'),
      agendaAccent: getColorValue('agendaAccent'),
      bgC1: getColorValue('bgC1'),
      bgC2: getColorValue('bgC2'),
      bgGradientDir: (document.getElementById('bgGradientDir') as HTMLSelectElement)?.value || 'none'
    };
  }

  // 新增議程項目
  private addAgendaItem(): void {
    const timeInput = document.getElementById('agendaTime') as HTMLInputElement;
    const topicInput = document.getElementById('agendaTopic') as HTMLTextAreaElement;
    const speakerInput = document.getElementById('agendaSpeaker') as HTMLTextAreaElement;
    const moderatorInput = document.getElementById('agendaModerator') as HTMLTextAreaElement;

    if (!timeInput?.value || !topicInput?.value) {
      alert('請填入時間和主題');
      return;
    }

    const newItem: AgendaItem = {
      time: timeInput.value,
      topic: topicInput.value,
      speaker: speakerInput?.value || '',
      moderator: moderatorInput?.value || ''
    };

    this.agendaItems.push(newItem);
    this.clearAgendaInputs();
    this.refreshAgendaList();
    this.updateCallback();
  }

  // 清空議程輸入欄
  private clearAgendaInputs(): void {
    const inputs = ['agendaTime', 'agendaTopic', 'agendaSpeaker', 'agendaModerator'];
    inputs.forEach(id => {
      const input = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
      if (input) input.value = '';
    });
  }

  // 載入範例議程
  private loadSampleAgenda(): void {
    const template = templates[this.currentTemplate];
    if (template) {
      this.agendaItems = [...template.sampleItems];
      this.refreshAgendaList();
      this.updateCallback();
    }
  }

  // 清空議程
  private clearAgenda(): void {
    this.agendaItems = [];
    this.refreshAgendaList();
    this.updateCallback();
  }

  // 刷新議程列表
  private refreshAgendaList(): void {
    const listContainer = document.getElementById('agendaList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    
    this.agendaItems.forEach((item, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'agenda-item';
      itemDiv.innerHTML = `
        <div><strong>${item.time}</strong></div>
        <div>${item.topic}</div>
        <div style="font-size: 12px; color: #666;">
          ${item.speaker ? `講者: ${item.speaker}` : ''}
          ${item.speaker && item.moderator ? ' | ' : ''}
          ${item.moderator ? `主持: ${item.moderator}` : ''}
        </div>
        <div class="controls">
          <button onclick="editAgenda(${index})" class="btn btn-ghost" style="padding: 4px 8px; font-size: 12px;">編輯</button>
          <button onclick="deleteAgenda(${index})" class="btn btn-danger" style="padding: 4px 8px; font-size: 12px;">刪除</button>
        </div>
      `;
      listContainer.appendChild(itemDiv);
    });
  }

  // 編輯議程項目
  editAgenda(index: number): void {
    if (index >= 0 && index < this.agendaItems.length) {
      const item = this.agendaItems[index];
      
      const timeInput = document.getElementById('agendaTime') as HTMLInputElement;
      const topicInput = document.getElementById('agendaTopic') as HTMLTextAreaElement;
      const speakerInput = document.getElementById('agendaSpeaker') as HTMLTextAreaElement;
      const moderatorInput = document.getElementById('agendaModerator') as HTMLTextAreaElement;

      if (timeInput) timeInput.value = item.time;
      if (topicInput) topicInput.value = item.topic;
      if (speakerInput) speakerInput.value = item.speaker;
      if (moderatorInput) moderatorInput.value = item.moderator;

      this.deleteAgenda(index);
    }
  }

  // 刪除議程項目
  deleteAgenda(index: number): void {
    if (index >= 0 && index < this.agendaItems.length) {
      this.agendaItems.splice(index, 1);
      this.refreshAgendaList();
      this.updateCallback();
    }
  }

  // 處理檔案上傳
  private async handleFileUpload(e: Event): Promise<void> {
    const files = (e.target as HTMLInputElement).files;
    if (!files || files.length === 0 || !this.overlayManager) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        await this.createOverlayFromFile(file);
      }
    }
    
    this.refreshOverlayList();
    this.updateCallback();
    
    (e.target as HTMLInputElement).value = '';
  }

  // 從檔案建立圖層
  private createOverlayFromFile(file: File): Promise<void> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (this.overlayManager) {
            this.overlayManager.addOverlay(img, file.name, e.target?.result as string);
          }
          resolve();
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }

  // 刷新圖層列表
  refreshOverlayList(): void {
    if (!this.overlayManager) return;
    
    const listContainer = document.getElementById('overlayList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    const overlays = this.overlayManager.getOverlays();
    const selectedIndex = this.overlayManager.getSelectedIndex();

    overlays.forEach((overlay, index) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = `overlay-item ${index === selectedIndex ? 'active' : ''}`;
      itemDiv.innerHTML = `
        <div class="overlay-thumb" style="background-image: url(${overlay.src})"></div>
        <div class="overlay-name">${overlay.name}</div>
      `;
      
      itemDiv.addEventListener('click', () => {
        this.overlayManager!.setSelectedIndex(index);
        this.syncOverlayControls();
        this.refreshOverlayList();
        this.updateCallback();
      });
      
      listContainer.appendChild(itemDiv);
    });
  }

  // 同步圖層控制項
  syncOverlayControls(): void {
    if (!this.overlayManager) return;
    
    const selectedOverlay = this.overlayManager.getSelectedOverlay();
    
    const opacityRange = document.getElementById('overlayOpacity') as HTMLInputElement;
    const visibleCheck = document.getElementById('overlayVisible') as HTMLInputElement;
    const lockAspectCheck = document.getElementById('overlayLockAspect') as HTMLInputElement;
    
    if (selectedOverlay) {
      if (opacityRange) opacityRange.value = selectedOverlay.opacity.toString();
      if (visibleCheck) visibleCheck.checked = selectedOverlay.visible;
      if (lockAspectCheck) lockAspectCheck.checked = selectedOverlay.lockAspect;
    }
  }

  // 更新選中圖層屬性
  private updateSelectedOverlayProperty(property: string, value: any): void {
    if (!this.overlayManager) return;
    
    const selectedIndex = this.overlayManager.getSelectedIndex();
    if (selectedIndex >= 0) {
      this.overlayManager.updateOverlayProperty(selectedIndex, property as any, value);
      this.updateCallback();
    }
  }

  // 圖層控制方法
  private bringToFront(): void {
    if (!this.overlayManager) return;
    const index = this.overlayManager.getSelectedIndex();
    if (index >= 0) {
      this.overlayManager.bringToFront(index);
      this.refreshOverlayList();
      this.updateCallback();
    }
  }

  private bringForward(): void {
    if (!this.overlayManager) return;
    const index = this.overlayManager.getSelectedIndex();
    if (index >= 0) {
      this.overlayManager.bringForward(index);
      this.refreshOverlayList();
      this.updateCallback();
    }
  }

  private sendBackward(): void {
    if (!this.overlayManager) return;
    const index = this.overlayManager.getSelectedIndex();
    if (index >= 0) {
      this.overlayManager.sendBackward(index);
      this.refreshOverlayList();
      this.updateCallback();
    }
  }

  private sendToBack(): void {
    if (!this.overlayManager) return;
    const index = this.overlayManager.getSelectedIndex();
    if (index >= 0) {
      this.overlayManager.sendToBack(index);
      this.refreshOverlayList();
      this.updateCallback();
    }
  }

  private centerSelectedOverlay(): void {
    if (!this.overlayManager) return;
    const index = this.overlayManager.getSelectedIndex();
    if (index >= 0) {
      this.overlayManager.centerOverlay(index);
      this.updateCallback();
    }
  }

  private resetSelectedOverlay(): void {
    if (!this.overlayManager) return;
    const index = this.overlayManager.getSelectedIndex();
    if (index >= 0) {
      this.overlayManager.resetOverlay(index);
      this.updateCallback();
    }
  }

  private removeSelectedOverlay(): void {
    if (!this.overlayManager) return;
    this.overlayManager.removeSelectedOverlay();
    this.refreshOverlayList();
    this.updateCallback();
  }

  // Getter 方法
  getAgendaItems(): AgendaItem[] { return this.agendaItems; }
  getCurrentTemplate(): string { return this.currentTemplate; }
  getCurrentColorScheme(): string { return this.currentColorScheme; }
  getCurrentGradientDirection(): string { return this.currentGradientDirection; }
  getCustomColors(): CustomColors { return this.customColors; }
  getShowFooterNote(): boolean { return this.showFooterNote; }
  getCropMode(): boolean { return this.isCropMode; }
}