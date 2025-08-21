export interface AgendaBasicInfo {
    title: string;
    venue: string;
    date: string;
    time: string;
    showMeetupPoint?: boolean;
    meetupType?: 'same' | 'other';
    meetupCustom?: string;
    meetupPoint?: string;
}
export interface AgendaItem {
    time: string;
    content: string;
    speaker?: string;
    moderator?: string;
    type: 'presentation' | 'break' | 'discussion' | 'dinner' | 'opening' | 'closing';
}
export interface AgendaData {
    basicInfo: AgendaBasicInfo;
    items: AgendaItem[];
    metadata?: {
        totalDuration: string;
        participantCount?: number;
        createdAt: Date;
    };
}
export interface ExcelParseResult {
    success: boolean;
    data?: AgendaData;
    error?: string;
    warnings?: string[];
}
