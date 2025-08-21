import { ExcelAgendaParser } from '../logic/excelParser.js';
export class FileUploader {
    constructor() {
        this.parser = new ExcelAgendaParser();
        this.initializeUploader();
    }
    /**
     * 設定資料解析完成的回調
     */
    setOnDataParsed(callback) {
        this.onDataParsed = callback;
    }
    /**
     * 初始化上傳器
     */
    initializeUploader() {
        // 建立上傳區域
        this.createUploadArea();
        this.bindEvents();
    }
    /**
     * 建立上傳區域 HTML
     */
    createUploadArea() {
        const controlPanel = document.querySelector('.control-panel');
        if (!controlPanel)
            return;
        const uploadSection = document.createElement('div');
        uploadSection.className = 'upload-section';
        uploadSection.innerHTML = `
      <h2 class="section-title">📁 Excel 議程匯入</h2>
      <div class="upload-area" id="excel-upload-area">
        <div class="upload-zone" id="upload-zone">
          <div class="upload-icon">📄</div>
          <p>拖拽 Excel 檔案到此處，或點擊選擇檔案</p>
          <p class="upload-hint">支援 .xlsx, .xls 格式</p>
          <input type="file" id="excel-file-input" accept=".xlsx,.xls" style="display: none;">
        </div>
        <div class="upload-status" id="upload-status" style="display: none;"></div>
        <div class="parsed-preview" id="parsed-preview" style="display: none;"></div>
      </div>
    `;
        // 插入到控制面板的開頭
        controlPanel.insertBefore(uploadSection, controlPanel.firstChild);
    }
    /**
     * 綁定事件
     */
    bindEvents() {
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('excel-file-input');
        if (!uploadZone || !fileInput)
            return;
        // 點擊上傳區域
        uploadZone.addEventListener('click', () => {
            fileInput.click();
        });
        // 檔案選擇
        fileInput.addEventListener('change', (event) => {
            const files = event.target.files;
            if (files && files.length > 0) {
                this.handleFile(files[0]);
            }
        });
        // 拖拽處理
        uploadZone.addEventListener('dragover', (event) => {
            event.preventDefault();
            uploadZone.classList.add('drag-over');
        });
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('drag-over');
        });
        uploadZone.addEventListener('drop', (event) => {
            event.preventDefault();
            uploadZone.classList.remove('drag-over');
            const files = event.dataTransfer?.files;
            if (files && files.length > 0) {
                this.handleFile(files[0]);
            }
        });
    }
    /**
     * 處理檔案
     */
    async handleFile(file) {
        const statusEl = document.getElementById('upload-status');
        const previewEl = document.getElementById('parsed-preview');
        if (!statusEl || !previewEl)
            return;
        // 顯示處理狀態
        statusEl.style.display = 'block';
        statusEl.innerHTML = `
      <div class="loading">
        <span class="spinner">⏳</span>
        正在解析 ${file.name}...
      </div>
    `;
        try {
            const result = await this.parser.parseExcelFile(file);
            if (result.success && result.data) {
                this.showSuccess(result.data);
                if (this.onDataParsed) {
                    this.onDataParsed(result.data);
                }
            }
            else {
                this.showError(result.error || '解析失敗');
            }
        }
        catch (error) {
            this.showError(`檔案處理錯誤: ${error}`);
        }
    }
    /**
     * 顯示成功結果
     */
    showSuccess(data) {
        const statusEl = document.getElementById('upload-status');
        const previewEl = document.getElementById('parsed-preview');
        if (!statusEl || !previewEl)
            return;
        statusEl.innerHTML = `
      <div class="success">
        <span class="icon">✅</span>
        Excel 解析成功！
      </div>
    `;
        previewEl.innerHTML = `
      <h3>📋 議程預覽</h3>
      <div class="agenda-preview">
        <div class="basic-info">
          <h4>基本資訊</h4>
          <p><strong>主題:</strong> ${data.basicInfo.title}</p>
          <p><strong>地點:</strong> ${data.basicInfo.venue}</p>
          <p><strong>日期:</strong> ${data.basicInfo.date}</p>
          <p><strong>時間:</strong> ${data.basicInfo.time}</p>
        </div>
        <div class="agenda-items">
          <h4>議程項目 (${data.items.length} 項)</h4>
          <div class="items-list">
            ${data.items.slice(0, 3).map(item => `
              <div class="item-preview">
                <span class="time">${item.time}</span>
                <span class="content">${item.content}</span>
              </div>
            `).join('')}
            ${data.items.length > 3 ? '<div class="more-items">...等更多項目</div>' : ''}
          </div>
        </div>
      </div>
    `;
        previewEl.style.display = 'block';
    }
    /**
     * 顯示錯誤
     */
    showError(error) {
        const statusEl = document.getElementById('upload-status');
        if (!statusEl)
            return;
        statusEl.innerHTML = `
      <div class="error">
        <span class="icon">❌</span>
        ${error}
      </div>
    `;
    }
}
//# sourceMappingURL=fileUploader.js.map