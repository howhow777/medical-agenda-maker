declare global {
    const XLSX: any;
}
import { ExcelParseResult } from '../assets/agendaTypes.js';
export declare class ExcelAgendaParser {
    /**
     * 解析 Excel 檔案為議程資料
     */
    parseExcelFile(file: File): Promise<ExcelParseResult>;
    /**
     * 解析基本資訊
     */
    private parseBasicInfo;
    /**
     * 解析議程項目
     */
    private parseAgendaItems;
    /**
     * 解析單一議程行
     */
    private parseAgendaRow;
    /**
     * 輔助方法：在行中找到值
     */
    private findValueInRow;
    /**
     * 計算總時長
     */
    private calculateTotalDuration;
}
