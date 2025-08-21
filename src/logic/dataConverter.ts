/**
 * 資料轉換器 - 將議程資料轉換為海報系統格式
 */

import { AgendaData, AgendaItem as ExcelAgendaItem } from '../assets/agendaTypes.js';
import { AgendaItem, AppState } from '../assets/types.js';

export class DataConverter {
  /**
   * 將 Excel 議程資料轉換為海報系統的 AppState
   */
  static convertAgendaDataToAppState(agendaData: AgendaData): Partial<AppState> {
    const convertedItems: AgendaItem[] = agendaData.items.map((item, index) => ({
      time: item.time,
      topic: item.content,  // 將 content 對應到 topic
      speaker: item.speaker || '',
      moderator: item.moderator || ''  // 新增 moderator 欄位
    }));

    return {
      agendaItems: convertedItems,
      currentTemplate: 'medical_agenda'  // 設定使用議程模板
    };
  }

  /**
   * 將議程類型對應到海報系統的分類
   */
  private static mapAgendaType(type: ExcelAgendaItem['type']): string {
    const typeMapping = {
      'presentation': '演講',
      'break': '休息',
      'discussion': '討論',
      'dinner': '用餐',
      'opening': '開場',
      'closing': '閉幕'
    };
    return typeMapping[type] || '其他';
  }

  /**
   * 智能提取會議關鍵資訊作為副標題
   */
  static generateSmartSubtitle(agendaData: AgendaData): string {
    const { basicInfo, items } = agendaData;
    const presentationCount = items.filter(item => item.type === 'presentation').length;
    
    let subtitle = `${basicInfo.date}`;
    if (basicInfo.time) {
      subtitle += ` | ${basicInfo.time}`;
    }
    if (presentationCount > 0) {
      subtitle += ` | ${presentationCount} 場演講`;
    }
    
    return subtitle;
  }

  /**
   * 驗證轉換結果
   */
  static validateConversion(appState: Partial<AppState>): boolean {
    return !!(
      appState.agendaItems &&
      appState.agendaItems.length > 0
    );
  }
}
