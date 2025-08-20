import { templates } from '../logic/templates.js';
export class FormControls {
    constructor(updateCallback, overlayManager) {
        this.updateCallback = updateCallback;
        this.overlayManager = overlayManager;
        this.agendaItems = [];
        this.currentTemplate = 'lung';
        this.currentColorScheme = 'medical_green';
        this.currentGradientDirection = 'horizontal';
        this.customColors = {
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
        this.showFooterNote = true;
        this.eventsAlreadyBound = false;
        this.isCropMode = false;
        this.cropBackup = null;
        this.initializeForm();
        this.bindEvents();
    }
    // 設定 OverlayManager（從 UIController 注入）
    setOverlayManager(overlayManager) {
        this.overlayManager = overlayManager;
    }
    // 綁定 PNG 控制
    bindPngControls() {
        const overlayFile = document.getElementById('overlayFile');
        if (overlayFile) {
            // 移除舊的事件監聽器避免重複綁定
            if (this.fileUploadHandler) {
                overlayFile.removeEventListener('change', this.fileUploadHandler);
            }
            // 創建新的事件處理器
            this.fileUploadHandler = (e) => this.handleFileUpload(e);
            overlayFile.addEventListener('change', this.fileUploadHandler);
            console.log('PNG控制事件綁定完成');
        }
        // 🎯 綁定圖層控制按鈕
        this.bindOverlayControls();
    }
    // 處理檔案上傳
    async handleFileUpload(e) {
        const files = e.target.files;
        if (!files || files.length === 0 || !this.overlayManager)
            return;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith('image/')) {
                await this.createOverlayFromFile(file);
            }
        }
        this.refreshOverlayList();
        this.updateCallback();
        // 清空檔案選擇避免同一檔案無法重複選擇
        e.target.value = '';
        console.log('檔案上傳處理完成，共加載', files.length, '個檔案');
    }
    // 從檔案創建圖層
    createOverlayFromFile(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    if (this.overlayManager) {
                        this.overlayManager.addOverlay(img, file.name, e.target?.result);
                    }
                    resolve();
                };
                img.src = e.target?.result;
            };
            reader.readAsDataURL(file);
        });
    }
    // 綁定圖層控制按鈕
    bindOverlayControls() {
        console.log('🎯 開始綁定圖層控制按鈕...');
        // 層級控制按鈕
        const bringFront = document.getElementById('bringFront');
        const bringForward = document.getElementById('bringForward');
        const sendBackward = document.getElementById('sendBackward');
        const sendBack = document.getElementById('sendBack');
        if (bringFront)
            bringFront.addEventListener('click', () => this.bringToFront());
        if (bringForward)
            bringForward.addEventListener('click', () => this.bringForward());
        if (sendBackward)
            sendBackward.addEventListener('click', () => this.sendBackward());
        if (sendBack)
            sendBack.addEventListener('click', () => this.sendToBack());
        // 圖層操作按鈕
        const centerOverlay = document.getElementById('centerOverlay');
        const resetOverlay = document.getElementById('resetOverlay');
        const removeOverlay = document.getElementById('removeOverlay');
        if (centerOverlay)
            centerOverlay.addEventListener('click', () => this.centerOverlay());
        if (resetOverlay)
            resetOverlay.addEventListener('click', () => this.resetOverlay());
        if (removeOverlay)
            removeOverlay.addEventListener('click', () => this.removeOverlay());
        // 圖層屬性控制項
        const opacitySlider = document.getElementById('overlayOpacity');
        const visibleCheckbox = document.getElementById('overlayVisible');
        const lockAspectCheckbox = document.getElementById('overlayLockAspect');
        if (opacitySlider) {
            opacitySlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.setOverlayOpacity(value);
            });
        }
        if (visibleCheckbox) {
            visibleCheckbox.addEventListener('change', (e) => {
                const checked = e.target.checked;
                this.setOverlayVisible(checked);
            });
        }
        if (lockAspectCheckbox) {
            lockAspectCheckbox.addEventListener('change', (e) => {
                const checked = e.target.checked;
                this.setOverlayLockAspect(checked);
            });
        }
        // 裁切按鈕
        const openCropper = document.getElementById('openCropper');
        const resetCrop = document.getElementById('resetCrop');
        const applyCrop = document.getElementById('applyCrop');
        const cancelCrop = document.getElementById('cancelCrop');
        if (openCropper) {
            openCropper.addEventListener('click', () => {
                this.openCropper();
            });
        }
        if (resetCrop) {
            resetCrop.addEventListener('click', () => {
                this.resetCrop();
            });
        }
        if (applyCrop) {
            applyCrop.addEventListener('click', () => {
                this.applyCrop();
            });
        }
        if (cancelCrop) {
            cancelCrop.addEventListener('click', () => {
                this.cancelCrop();
            });
        }
        console.log('✅ 圖層控制按鈕綁定完成');
    }
    // 初始化表單
    initializeForm() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const dateInput = document.getElementById('conferenceDate');
        const titleInput = document.getElementById('conferenceTitle');
        if (dateInput)
            dateInput.value = `${year}年${month}月${day}日`;
        if (titleInput)
            titleInput.value = `${year}年度癌症醫學會議`;
        // 載入預設議程
        this.agendaItems = [...templates[this.currentTemplate].sampleItems];
        this.refreshAgendaList();
    }
    // 綁定事件
    bindEvents() {
        // 防止重複綁定
        if (this.eventsAlreadyBound) {
            console.log('⚠️ 事件已綁定，跳過重複綁定');
            return;
        }
        this.bindTemplateButtons();
        this.bindColorSchemeControls();
        this.bindAgendaControls();
        this.bindCustomColorControls();
        this.bindBasicInputs();
        this.bindPngControls();
        this.eventsAlreadyBound = true;
        console.log('✅ 所有事件綁定完成');
    }
    // 切換裁切模式
    toggleCropMode() {
        this.isCropMode = !this.isCropMode;
        console.log('🎯 切換裁切模式:', this.isCropMode ? '開啟' : '關閉');
        const btn = document.getElementById('openCropper');
        if (btn) {
            btn.textContent = this.isCropMode ? '✅ 完成裁切' : '✂️ 裁切';
            btn.className = this.isCropMode ? 'btn btn-success' : 'btn btn-primary';
        }
        // 設置裁切模式到 overlayManager
        if (this.overlayManager) {
            this.overlayManager.setCropMode(this.isCropMode);
        }
        this.updateCallback();
    }
    // 設置初始裁切區域
    setInitialCropArea() {
        // 暫時移除自動設置，讓用戶先看到控制點
        // 保持原始圖片的完整裁切區域
        console.log('🎯 裁切模式啟動，保持原始裁切區域');
    }
    // 綁定範本按鈕
    bindTemplateButtons() {
        document.querySelectorAll('.template-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.template-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                const template = e.target.dataset.template;
                if (template && template !== this.currentTemplate) {
                    this.currentTemplate = template;
                    const subtitleInput = document.getElementById('conferenceSubtitle');
                    if (subtitleInput) {
                        subtitleInput.value = `${templates[this.currentTemplate].title}治療新進展論壇`;
                    }
                    this.agendaItems = [...templates[this.currentTemplate].sampleItems];
                    this.refreshAgendaList();
                    this.updateCallback();
                }
            });
        });
    }
    // 綁定配色控制
    bindColorSchemeControls() {
        const colorSchemeSelect = document.getElementById('colorScheme');
        const gradientDirSelect = document.getElementById('gradientDir');
        if (colorSchemeSelect) {
            colorSchemeSelect.addEventListener('change', (e) => {
                this.currentColorScheme = e.target.value;
                this.toggleCustomSection(this.currentColorScheme === 'custom');
                this.updateCallback();
            });
        }
        if (gradientDirSelect) {
            gradientDirSelect.addEventListener('change', (e) => {
                this.currentGradientDirection = e.target.value;
                this.updateCallback();
            });
        }
    }
    // 綁定議程控制
    bindAgendaControls() {
        const addBtn = document.getElementById('agendaAdd');
        const sampleBtn = document.getElementById('agendaSample');
        const clearBtn = document.getElementById('agendaClear');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.addOrUpdateAgenda());
        }
        if (sampleBtn) {
            sampleBtn.addEventListener('click', () => {
                this.agendaItems = [...templates[this.currentTemplate].sampleItems];
                this.refreshAgendaList();
                this.updateCallback();
            });
        }
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.agendaItems = [];
                this.refreshAgendaList();
                this.updateCallback();
            });
        }
    }
    // 綁定自訂配色控制
    bindCustomColorControls() {
        const applyBtn = document.getElementById('applyCustomColors');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => this.applyCustomColors());
        }
    }
    // 綁定基本輸入欄位
    bindBasicInputs() {
        const inputs = ['conferenceTitle', 'conferenceSubtitle', 'conferenceDate', 'conferenceLocation'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => this.updateCallback());
            }
        });
        // 頁尾註解
        const footerNote = document.getElementById('showFooterNote');
        const footerContent = document.getElementById('footerNoteContent');
        if (footerNote) {
            footerNote.addEventListener('change', () => {
                this.showFooterNote = footerNote.checked;
                this.updateCallback();
            });
        }
        if (footerContent) {
            let timeout;
            footerContent.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => this.updateCallback(), 250);
            });
        }
    }
    // 新增或更新議程
    addOrUpdateAgenda() {
        const timeInput = document.getElementById('agendaTime');
        const topicInput = document.getElementById('agendaTopic');
        const speakerInput = document.getElementById('agendaSpeaker');
        const moderatorInput = document.getElementById('agendaModerator');
        const addBtn = document.getElementById('agendaAdd');
        const time = timeInput?.value.trim() || '';
        const topic = topicInput?.value.trim() || '';
        const speaker = speakerInput?.value.trim() || '';
        const moderator = moderatorInput?.value.trim() || '';
        if (!time || !topic) {
            [timeInput, topicInput].forEach(input => {
                if (input && !input.value) {
                    input.style.borderColor = '#dc3545';
                    setTimeout(() => input.style.borderColor = '#e0e0e0', 1200);
                }
            });
            return;
        }
        const isEditing = addBtn.dataset.edit;
        if (isEditing) {
            const index = parseInt(isEditing);
            this.agendaItems[index] = { time, topic, speaker, moderator };
            addBtn.textContent = '➕ 新增';
            delete addBtn.dataset.edit;
        }
        else {
            this.agendaItems.push({ time, topic, speaker, moderator });
        }
        // 清空表單
        if (timeInput)
            timeInput.value = '';
        if (topicInput)
            topicInput.value = '';
        if (speakerInput)
            speakerInput.value = '';
        if (moderatorInput)
            moderatorInput.value = '';
        this.refreshAgendaList();
        this.updateCallback();
    }
    // 刷新議程列表
    refreshAgendaList() {
        const list = document.getElementById('agendaList');
        if (!list)
            return;
        list.innerHTML = '';
        this.agendaItems.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'agenda-item';
            div.innerHTML = `
        <div class="controls">
          <button class="btn btn-ghost" onclick="window.editAgenda(${idx})">✏️</button>
          <button class="btn btn-danger" onclick="window.deleteAgenda(${idx})">✕</button>
        </div>
        <div style='font-weight:700;color:#667eea;'>${item.time}</div>
        <div><strong>${item.topic.replace(/\n/g, '<br>')}</strong></div>
        ${item.speaker ? `<div>講者：${item.speaker.replace(/\n/g, '<br>')}</div>` : ''}
        ${item.moderator ? `<div>主持人：${item.moderator.replace(/\n/g, '<br>')}</div>` : ''}
      `;
            list.appendChild(div);
        });
    }
    // 編輯議程
    editAgenda(index) {
        const item = this.agendaItems[index];
        if (!item)
            return;
        const timeInput = document.getElementById('agendaTime');
        const topicInput = document.getElementById('agendaTopic');
        const speakerInput = document.getElementById('agendaSpeaker');
        const moderatorInput = document.getElementById('agendaModerator');
        const addBtn = document.getElementById('agendaAdd');
        if (timeInput)
            timeInput.value = item.time;
        if (topicInput)
            topicInput.value = item.topic;
        if (speakerInput)
            speakerInput.value = item.speaker || '';
        if (moderatorInput)
            moderatorInput.value = item.moderator || '';
        if (addBtn) {
            addBtn.textContent = '💾 更新';
            addBtn.dataset.edit = index.toString();
        }
    }
    // 刪除議程
    deleteAgenda(index) {
        if (confirm('確定刪除這個議程項目？')) {
            this.agendaItems.splice(index, 1);
            this.refreshAgendaList();
            this.updateCallback();
        }
    }
    // 套用自訂配色
    applyCustomColors() {
        this.customColors.headerC1 = document.getElementById('headerC1')?.value || this.customColors.headerC1;
        this.customColors.headerC2 = document.getElementById('headerC2')?.value || this.customColors.headerC2;
        this.customColors.headerC3 = document.getElementById('headerC3')?.value || this.customColors.headerC3;
        this.customColors.agendaBg = document.getElementById('agendaBg')?.value || this.customColors.agendaBg;
        this.customColors.agendaBorder = document.getElementById('agendaBorder')?.value || this.customColors.agendaBorder;
        this.customColors.agendaAccent = document.getElementById('agendaAccent')?.value || this.customColors.agendaAccent;
        this.customColors.bgC1 = document.getElementById('bgC1')?.value || this.customColors.bgC1;
        this.customColors.bgC2 = document.getElementById('bgC2')?.value || this.customColors.bgC2;
        this.customColors.bgGradientDir = document.getElementById('bgGradientDir')?.value || this.customColors.bgGradientDir;
        if (this.currentColorScheme === 'custom') {
            this.updateCallback();
        }
    }
    // 切換自訂配色區域
    toggleCustomSection(show) {
        const section = document.getElementById('customColorsSection');
        if (!section)
            return;
        if (show) {
            section.classList.add('show');
            this.syncCustomColors();
        }
        else {
            section.classList.remove('show');
        }
    }
    // 同步自訂配色到表單
    syncCustomColors() {
        const inputs = [
            { id: 'headerC1', value: this.customColors.headerC1 },
            { id: 'headerC2', value: this.customColors.headerC2 },
            { id: 'headerC3', value: this.customColors.headerC3 },
            { id: 'agendaBg', value: this.customColors.agendaBg },
            { id: 'agendaBorder', value: this.customColors.agendaBorder },
            { id: 'agendaAccent', value: this.customColors.agendaAccent },
            { id: 'bgC1', value: this.customColors.bgC1 },
            { id: 'bgC2', value: this.customColors.bgC2 }
        ];
        inputs.forEach(({ id, value }) => {
            const input = document.getElementById(id);
            if (input)
                input.value = value;
        });
        const bgGradientDirSelect = document.getElementById('bgGradientDir');
        if (bgGradientDirSelect)
            bgGradientDirSelect.value = this.customColors.bgGradientDir;
    }
    // Getter 方法
    getAgendaItems() { return this.agendaItems; }
    getCurrentTemplate() { return this.currentTemplate; }
    getCurrentColorScheme() { return this.currentColorScheme; }
    getCurrentGradientDirection() { return this.currentGradientDirection; }
    getCustomColors() { return this.customColors; }
    // Setter 方法
    setAgendaItems(items) {
        this.agendaItems = items;
        this.refreshAgendaList();
    }
    setCurrentTemplate(template) {
        this.currentTemplate = template;
    }
    setCustomColors(colors) {
        this.customColors = colors;
        this.updateCustomColorInputs();
    }
    // 取得頁尾註解狀態
    getShowFooterNote() {
        return this.showFooterNote;
    }
    bringToFront() {
        if (this.overlayManager) {
            const index = this.overlayManager.getSelectedIndex();
            if (index >= 0) {
                this.overlayManager.bringToFront(index);
                this.refreshOverlayList();
            }
            this.updateCallback();
        }
    }
    bringForward() {
        if (this.overlayManager) {
            const index = this.overlayManager.getSelectedIndex();
            if (index >= 0) {
                this.overlayManager.bringForward(index);
                this.refreshOverlayList();
            }
            this.updateCallback();
        }
    }
    sendBackward() {
        if (this.overlayManager) {
            const index = this.overlayManager.getSelectedIndex();
            if (index >= 0) {
                this.overlayManager.sendBackward(index);
                this.refreshOverlayList();
            }
            this.updateCallback();
        }
    }
    sendToBack() {
        if (this.overlayManager) {
            const index = this.overlayManager.getSelectedIndex();
            if (index >= 0) {
                this.overlayManager.sendToBack(index);
                this.refreshOverlayList();
            }
            this.updateCallback();
        }
    }
    centerOverlay() {
        if (this.overlayManager) {
            this.overlayManager.centerSelectedOverlay();
            this.updateCallback();
        }
    }
    resetOverlay() {
        if (this.overlayManager) {
            this.overlayManager.resetSelectedOverlay();
            this.updateCallback();
        }
    }
    removeOverlay() {
        if (this.overlayManager && confirm('確定要移除這個圖層嗎？')) {
            this.overlayManager.removeSelectedOverlay();
            this.refreshOverlayList();
            this.updateCallback();
        }
    }
    setOverlayOpacity(opacity) {
        if (this.overlayManager) {
            const overlay = this.overlayManager.getSelectedOverlay();
            if (overlay) {
                overlay.opacity = opacity;
            }
            this.updateCallback();
        }
    }
    setOverlayVisible(visible) {
        if (this.overlayManager) {
            const overlay = this.overlayManager.getSelectedOverlay();
            if (overlay) {
                overlay.visible = visible;
            }
            this.updateCallback();
        }
    }
    setOverlayLockAspect(lockAspect) {
        if (this.overlayManager) {
            const overlay = this.overlayManager.getSelectedOverlay();
            if (overlay) {
                overlay.lockAspect = lockAspect;
            }
        }
    }
    // 刷新圖層列表UI
    refreshOverlayList() {
        const list = document.getElementById('overlayList');
        if (!list || !this.overlayManager)
            return;
        const overlays = this.overlayManager.getOverlays();
        const selectedIndex = this.overlayManager.getSelectedIndex();
        list.innerHTML = '';
        overlays.forEach((overlay, index) => {
            const div = document.createElement('div');
            div.className = `overlay-item ${index === selectedIndex ? 'selected' : ''}`;
            div.innerHTML = `
        <div class="overlay-info">
          <span class="overlay-name">${overlay.name}</span>
          <span class="overlay-size">${overlay.w}×${overlay.h}</span>
        </div>
      `;
            div.addEventListener('click', () => {
                this.overlayManager.setSelectedIndex(index);
                this.refreshOverlayList();
                this.syncOverlayControls();
                this.updateCallback();
            });
            list.appendChild(div);
        });
    }
    // 同步圖層控制項
    syncOverlayControls() {
        if (this.overlayManager) {
            const overlay = this.overlayManager.getSelectedOverlay();
            if (overlay) {
                const opacitySlider = document.getElementById('overlayOpacity');
                const visibleCheckbox = document.getElementById('overlayVisible');
                const lockAspectCheckbox = document.getElementById('overlayLockAspect');
                if (opacitySlider)
                    opacitySlider.value = overlay.opacity.toString();
                if (visibleCheckbox)
                    visibleCheckbox.checked = overlay.visible;
                if (lockAspectCheckbox)
                    lockAspectCheckbox.checked = overlay.lockAspect;
            }
        }
    }
    // Getter 方法圖層相關
    getOverlays() {
        return this.overlayManager ? this.overlayManager.getOverlays() : [];
    }
    getSelectedOverlayIndex() {
        return this.overlayManager ? this.overlayManager.getSelectedIndex() : -1;
    }
    // 取得裁切模式狀態
    getCropMode() {
        return this.isCropMode;
    }
    // 開始裁切模式
    openCropper() {
        if (this.overlayManager) {
            const overlay = this.overlayManager.getSelectedOverlay();
            if (overlay) {
                this.isCropMode = true;
                this.cropBackup = JSON.parse(JSON.stringify(overlay.crop || {}));
                this.showCropControls(true);
                console.log('✂️ 開始裁切模式');
            }
        }
    }
    // 確認裁切
    applyCrop() {
        this.isCropMode = false;
        this.cropBackup = null;
        this.showCropControls(false);
        this.updateCallback();
        console.log('✅ 裁切已套用');
    }
    // 取消裁切
    cancelCrop() {
        if (this.overlayManager && this.cropBackup) {
            const overlay = this.overlayManager.getSelectedOverlay();
            if (overlay) {
                overlay.crop = this.cropBackup;
            }
        }
        this.isCropMode = false;
        this.cropBackup = null;
        this.showCropControls(false);
        this.updateCallback();
        console.log('❌ 裁切已取消');
    }
    // 重設裁切
    resetCrop() {
        if (this.overlayManager) {
            const index = this.overlayManager.getSelectedIndex();
            if (index >= 0) {
                this.overlayManager.resetCrop(index);
                this.updateCallback();
            }
        }
    }
    // 更新議程列表顯示
    updateAgendaList() {
        this.refreshAgendaList();
    }
    // 更新自訂配色輸入框
    updateCustomColorInputs() {
        // 更新所有配色輸入框的值
        const colorIds = ['headerC1', 'headerC2', 'headerC3', 'agendaBg', 'agendaBorder', 'agendaAccent', 'bgC1', 'bgC2'];
        colorIds.forEach(id => {
            const input = document.getElementById(id);
            if (input && this.customColors[id]) {
                input.value = this.customColors[id];
            }
        });
        // 更新漸層方向
        const bgGradientDir = document.getElementById('bgGradientDir');
        if (bgGradientDir) {
            bgGradientDir.value = this.customColors.bgGradientDir;
        }
    }
    // 顯示/隱藏裁切控制按鈕
    showCropControls(show) {
        const cropControls = document.getElementById('cropControls');
        if (cropControls) {
            cropControls.style.display = show ? 'flex' : 'none';
        }
    }
}
//# sourceMappingURL=formControls.js.map