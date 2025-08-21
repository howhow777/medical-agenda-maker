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
        // 現在使用 HTML 中既有的上傳區域，不再動態創建
        const existingUploadZone = document.getElementById('upload-zone');
        if (!existingUploadZone) {
            console.warn('⚠️ 找不到上傳區域，請確認 HTML 結構正確');
            return;
        }
        console.log('✅ 找到既有的上傳區域，準備綁定事件');
    }
    /**
     * 綁定事件
     */
    bindEvents() {
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('excel-file-input');
        if (!uploadZone || !fileInput) {
            console.error('❌ 找不到必要的 DOM 元素:', {
                uploadZone: !!uploadZone,
                fileInput: !!fileInput
            });
            return;
        }
        console.log('✅ 開始綁定上傳事件');
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
        if (!statusEl)
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
        if (!statusEl)
            return;
        statusEl.innerHTML = `
      <div class="success">
        <span class="icon">✅</span>
        Excel 解析成功！議程已載入到右側海報中。
      </div>
    `;
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