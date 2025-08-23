/**
 * 觸控除錯控制器
 * 用於監測和顯示觸控事件的詳細資訊
 */
interface TouchDebugInfo {
    eventType: string;
    pointerCount: number;
    coordinates: {
        x: number;
        y: number;
    }[];
    hitResult: string;
    dragMode: string;
    timestamp: number;
    deviceInfo: string;
    additionalInfo?: string;
}
export declare class TouchDebugController {
    private debugPanel;
    private eventLog;
    private isEnabled;
    constructor();
    private createDebugPanel;
    private bindDebugControls;
    private toggleDebug;
    logTouchEvent(info: Partial<TouchDebugInfo>): void;
    private updateDebugDisplay;
    private formatLogEntry;
    private logToConsole;
    private detectDeviceCapabilities;
    private getDeviceInfo;
    private clearLog;
    private exportLog;
    private log;
    setEnabled(enabled: boolean): void;
    isDebugEnabled(): boolean;
}
export {};
