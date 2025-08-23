/**
 * 觸控除錯控制器
 * 用於監測和顯示觸控事件的詳細資訊
 */

interface TouchDebugInfo {
  eventType: string;
  pointerCount: number;
  coordinates: { x: number; y: number }[];
  hitResult: string;
  dragMode: string;
  timestamp: number;
  deviceInfo: string;
  additionalInfo?: string; // 🆕 新增額外資訊欄位
}

export class TouchDebugController {
  private debugPanel!: HTMLElement; // 告訴 TS 會在 constructor 中初始化
  private eventLog: TouchDebugInfo[] = [];
  private isEnabled: boolean = false;

  constructor() {
    this.createDebugPanel();
    this.bindDebugControls();
  }

  // 建立除錯面板
  private createDebugPanel(): void {
    this.debugPanel = document.createElement('div');
    this.debugPanel.id = 'touch-debug-panel';
    this.debugPanel.className = 'touch-debug-panel';
    this.debugPanel.innerHTML = `
      <div class="debug-header">
        <h4>🔍 觸控除錯</h4>
        <div class="debug-controls">
          <button id="debug-toggle" class="debug-btn">啟動</button>
          <button id="debug-clear" class="debug-btn">清除</button>
          <button id="debug-export" class="debug-btn">匯出</button>
        </div>
      </div>
      <div class="debug-content">
        <div class="debug-status">
          <div>事件類型: <span id="debug-event-type">-</span></div>
          <div>觸控點數: <span id="debug-pointer-count">0</span></div>
          <div>命中測試: <span id="debug-hit-result">none</span></div>
          <div>拖拉模式: <span id="debug-drag-mode">none</span></div>
        </div>
        <div class="debug-log" id="debug-log">
          <div class="log-entry">等待觸控事件...</div>
        </div>
      </div>
    `;

    // 插入到頁面
    document.body.appendChild(this.debugPanel);
  }

  // 綁定除錯控制
  private bindDebugControls(): void {
    const toggleBtn = document.getElementById('debug-toggle');
    const clearBtn = document.getElementById('debug-clear');
    const exportBtn = document.getElementById('debug-export');

    toggleBtn?.addEventListener('click', () => this.toggleDebug());
    clearBtn?.addEventListener('click', () => this.clearLog());
    exportBtn?.addEventListener('click', () => this.exportLog());
  }

  // 切換除錯模式
  private toggleDebug(): void {
    this.isEnabled = !this.isEnabled;
    const toggleBtn = document.getElementById('debug-toggle');
    
    if (toggleBtn) {
      toggleBtn.textContent = this.isEnabled ? '停止' : '啟動';
      toggleBtn.className = this.isEnabled ? 'debug-btn active' : 'debug-btn';
    }

    this.debugPanel.classList.toggle('active', this.isEnabled);
    
    if (this.isEnabled) {
      this.log('🟢 除錯模式啟動');
      this.detectDeviceCapabilities();
    } else {
      this.log('🔴 除錯模式停止');
    }
  }

  // 記錄觸控事件
  public logTouchEvent(info: Partial<TouchDebugInfo>): void {
    if (!this.isEnabled) return;

    const fullInfo: TouchDebugInfo = {
      eventType: info.eventType || 'unknown',
      pointerCount: info.pointerCount || 0,
      coordinates: info.coordinates || [],
      hitResult: info.hitResult || 'none',
      dragMode: info.dragMode || 'none',
      timestamp: Date.now(),
      deviceInfo: this.getDeviceInfo(),
      additionalInfo: info.additionalInfo || '',
      ...info
    };

    this.eventLog.push(fullInfo);
    this.updateDebugDisplay(fullInfo);
    this.logToConsole(fullInfo);

    // 保持日誌大小限制
    if (this.eventLog.length > 100) {
      this.eventLog.shift();
    }
  }

  // 更新除錯顯示
  private updateDebugDisplay(info: TouchDebugInfo): void {
    const eventTypeEl = document.getElementById('debug-event-type');
    const pointerCountEl = document.getElementById('debug-pointer-count');
    const hitResultEl = document.getElementById('debug-hit-result');
    const dragModeEl = document.getElementById('debug-drag-mode');
    const logEl = document.getElementById('debug-log');

    if (eventTypeEl) eventTypeEl.textContent = info.eventType;
    if (pointerCountEl) pointerCountEl.textContent = info.pointerCount.toString();
    if (hitResultEl) hitResultEl.textContent = info.hitResult;
    if (dragModeEl) dragModeEl.textContent = info.dragMode;

    if (logEl) {
      const logEntry = document.createElement('div');
      logEntry.className = 'log-entry';
      logEntry.innerHTML = this.formatLogEntry(info);
      logEl.appendChild(logEntry);
      logEl.scrollTop = logEl.scrollHeight;

      // 限制顯示的日誌條目
      while (logEl.children.length > 20) {
        logEl.removeChild(logEl.firstChild!);
      }
    }
  }

  // 格式化日誌條目
  private formatLogEntry(info: TouchDebugInfo): string {
    const time = new Date(info.timestamp).toLocaleTimeString();
    const coords = info.coordinates.map(c => `(${c.x.toFixed(0)},${c.y.toFixed(0)})`).join(' ');
    
    return `
      <span class="log-time">${time}</span>
      <span class="log-event">${info.eventType}</span>
      <span class="log-coords">${coords}</span>
      <span class="log-hit">${info.hitResult}</span>
      <span class="log-drag">${info.dragMode}</span>
      <span class="log-extra">${info.additionalInfo || ''}</span>
    `;
  }

  // Console 日誌輸出
  private logToConsole(info: TouchDebugInfo): void {
    const style = 'color: #2196F3; font-weight: bold;';
    console.log(
      `%c[TouchDebug] ${info.eventType}`,
      style,
      {
        pointers: info.pointerCount,
        coordinates: info.coordinates,
        hitResult: info.hitResult,
        dragMode: info.dragMode,
        device: info.deviceInfo
      }
    );
  }

  // 偵測裝置能力
  private detectDeviceCapabilities(): void {
    const capabilities = {
      hasPointerEvents: !!window.PointerEvent,
      hasTouchEvents: 'ontouchstart' in window,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      platform: navigator.platform,
      userAgent: navigator.userAgent
    };

    this.log(`📱 裝置能力偵測: ${JSON.stringify(capabilities, null, 2)}`);
  }

  // 取得裝置資訊
  private getDeviceInfo(): string {
    return `${navigator.platform} | ${navigator.maxTouchPoints || 0}pt`;
  }

  // 清除日誌
  private clearLog(): void {
    this.eventLog = [];
    const logEl = document.getElementById('debug-log');
    if (logEl) {
      logEl.innerHTML = '<div class="log-entry">日誌已清除</div>';
    }
    console.clear();
    this.log('🗑️ 日誌已清除');
  }

  // 匯出日誌
  private exportLog(): void {
    const logData = {
      timestamp: new Date().toISOString(),
      deviceInfo: this.getDeviceInfo(),
      userAgent: navigator.userAgent,
      events: this.eventLog
    };

    const blob = new Blob([JSON.stringify(logData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `touch-debug-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.log('💾 日誌已匯出');
  }

  // 簡化的日誌方法
  private log(message: string): void {
    console.log(`%c[TouchDebug] ${message}`, 'color: #4CAF50; font-weight: bold;');
  }

  // 公開方法：啟用/停用除錯
  public setEnabled(enabled: boolean): void {
    if (this.isEnabled !== enabled) {
      this.toggleDebug();
    }
  }

  // 公開方法：檢查是否啟用
  public isDebugEnabled(): boolean {
    return this.isEnabled;
  }
}