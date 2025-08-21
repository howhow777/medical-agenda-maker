// 議程基本資訊
export interface AgendaBasicInfo {
  title: string;          // 會議主題
  venue: string;          // 會議地點
  date: string;           // 會議日期
  time: string;           // 會議時間
  showMeetupPoint?: boolean;    // 是否顯示集合地點
  meetupType?: 'same' | 'other'; // 集合地點類型：same=同會議地點, other=其他
  meetupCustom?: string;        // 自訂集合地點內容
  meetupPoint?: string;   // 集合地點
}

// 議程項目
export interface AgendaItem {
  time: string;           // 時間段
  content: string;        // 內容
  speaker?: string;       // 主講者
  moderator?: string;     // 主持人
  type: 'presentation' | 'break' | 'discussion' | 'dinner' | 'opening' | 'closing';
}

// 完整議程資料
export interface AgendaData {
  basicInfo: AgendaBasicInfo;
  items: AgendaItem[];
  metadata?: {
    totalDuration: string;
    participantCount?: number;
    createdAt: Date;
  };
}

// Excel 解析結果
export interface ExcelParseResult {
  success: boolean;
  data?: AgendaData;
  error?: string;
  warnings?: string[];
}
