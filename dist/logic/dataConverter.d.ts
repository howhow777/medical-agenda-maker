/**
 * 資料轉換器 - 將議程資料轉換為海報系統格式
 */
import { AgendaData } from '../assets/agendaTypes.js';
import { AppState } from '../assets/types.js';
export declare class DataConverter {
    /**
     * 將 Excel 議程資料轉換為海報系統的 AppState
     */
    static convertAgendaDataToAppState(agendaData: AgendaData): Partial<AppState>;
    /**
     * 將議程類型對應到海報系統的分類
     */
    private static mapAgendaType;
    /**
     * 智能提取會議關鍵資訊作為副標題
     */
    static generateSmartSubtitle(agendaData: AgendaData): string;
    /**
     * 驗證轉換結果
     */
    static validateConversion(appState: Partial<AppState>): boolean;
}
