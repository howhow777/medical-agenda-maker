import { AgendaData } from '../assets/agendaTypes.js';
export declare class FileUploader {
    private parser;
    private onDataParsed?;
    constructor();
    /**
     * 設定資料解析完成的回調
     */
    setOnDataParsed(callback: (data: AgendaData) => void): void;
    /**
     * 初始化上傳器
     */
    private initializeUploader;
    /**
     * 建立上傳區域 HTML
     */
    private createUploadArea;
    /**
     * 綁定事件
     */
    private bindEvents;
    /**
     * 處理檔案
     */
    private handleFile;
    /**
     * 顯示成功結果
     */
    private showSuccess;
    /**
     * 顯示錯誤
     */
    private showError;
}
