import { AgendaItem, ColorScheme, CancerTemplate, GradientDirection, CustomColors, Overlay } from '../assets/types.js';
import { colorSchemes, gradientDirections } from './colorSchemes.js';
import { templates } from './templates.js';
import { OverlayProcessor } from './overlay-processor.js';
import { CanvasUtils } from './canvas-utils.js';

export class PosterRenderer {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected useHighQualityOverlays: boolean = false;
  protected processedOverlayCache: Map<number, HTMLCanvasElement> = new Map();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  // 創建梯度效果
  createGradient(w: number, h: number, colors: string[], direction: string): CanvasGradient {
    if (direction === 'radial') {
      const centerX = w / 2;
      const centerY = h / 2;
      const radius = Math.max(w, h) / 2;
      const g = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
      return g;
    } else {
      const d = gradientDirections[direction];
      if (d) {
        const g = this.ctx.createLinearGradient(d.x1 * w, d.y1 * h, d.x2 * w, d.y2 * h);
        colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
        return g;
      } else {
        // 預設為水平漸層
        const g = this.ctx.createLinearGradient(0, 0, w, 0);
        colors.forEach((c, i) => g.addColorStop(i / (colors.length - 1), c));
        return g;
      }
    }
  }

  // 計算文字行數（支援手動換行）
  calculateTextLinesWithBreaks(text: string, maxWidth: number): number {
    if (!text) return 1;
    const manualLines = text.split('\n');
    let totalLines = 0;

    manualLines.forEach(line => {
      if (!line.trim()) {
        totalLines += 1;
        return;
      }

      // 使用相同的改進邏輯
      const words: string[] = [];
      let currentWord = '';
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const isCJK = /[\u4e00-\u9fff]/.test(char);
        
        if (char === ' ') {
          if (currentWord) {
            words.push(currentWord);
            currentWord = '';
          }
          words.push(' ');
        } else if (isCJK) {
          if (currentWord) {
            words.push(currentWord);
            currentWord = '';
          }
          words.push(char);
        } else {
          currentWord += char;
        }
      }
      if (currentWord) {
        words.push(currentWord);
      }

      let currentLine = '';
      let lineCount = 0;

      for (let i = 0; i < words.length; i++) {
        const test = currentLine + words[i];
        if (this.ctx.measureText(test).width > maxWidth && currentLine !== '') {
          lineCount++;
          currentLine = words[i];
        } else {
          currentLine = test;
        }
      }
      if (currentLine.trim() !== '') lineCount++;
      totalLines += Math.max(1, lineCount);
    });

    return totalLines;
  }

  // 文字自動換行並繪製（支援對齊）
  wrapTextWithBreaks(text: string, x: number, y: number, maxWidth: number, lineHeight: number, align: string = 'left'): number {
    if (!text) return 0;
    const manualLines = text.split('\n');
    let currentY = y;

    manualLines.forEach(line => {
      if (!line.trim()) {
        currentY += lineHeight;
        return;
      }

      // 改進的中英文混合處理：保留空格，智能分割
      const words: string[] = [];
      let currentWord = '';
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const isCJK = /[\u4e00-\u9fff]/.test(char);
        
        if (char === ' ') {
          // 遇到空格，結束當前單詞
          if (currentWord) {
            words.push(currentWord);
            currentWord = '';
          }
          words.push(' '); // 保留空格作為獨立元素
        } else if (isCJK) {
          // 中文字符，結束當前單詞並將中文字符單獨處理
          if (currentWord) {
            words.push(currentWord);
            currentWord = '';
          }
          words.push(char);
        } else {
          // 英文字符，累積到當前單詞
          currentWord += char;
        }
      }
      // 處理最後的單詞
      if (currentWord) {
        words.push(currentWord);
      }

      let currentLine = '';
      let linesToDraw: string[] = [];

      for (let i = 0; i < words.length; i++) {
        const test = currentLine + words[i];
        if (this.ctx.measureText(test).width > maxWidth && currentLine !== '') {
          linesToDraw.push(currentLine.trim());
          currentLine = words[i];
        } else {
          currentLine = test;
        }
      }
      if (currentLine.trim() !== '') linesToDraw.push(currentLine.trim());

      linesToDraw.forEach(lineText => {
        let drawX = x;
        if (align === 'center') {
          const textWidth = this.ctx.measureText(lineText).width;
          drawX = x + (maxWidth / 2) - (textWidth / 2);
        } else if (align === 'right') {
          const textWidth = this.ctx.measureText(lineText).width;
          drawX = x + maxWidth - textWidth;
        }
        this.ctx.fillText(lineText, drawX, currentY);
        currentY += lineHeight;
      });
    });

    return currentY - y;
  }

  // 垂直置中繪製文字
  drawCenteredTextWithBreaks(text: string, x: number, y: number, maxWidth: number, lineHeight: number, cellHeight: number, align: string = 'center'): number {
    if (!text) return 0;

    const totalLines = this.calculateTextLinesWithBreaks(text, maxWidth);
    const textHeight = totalLines * lineHeight;
    const startY = y + (cellHeight - textHeight) / 2 + lineHeight * 0.8;

    return this.wrapTextWithBreaks(text, x, startY, maxWidth, lineHeight, align);
  }

  // 繪製癌症裝飾圖案
  drawCancerDecorations(template: CancerTemplate, scheme: ColorScheme, W: number, H: number): void {
    try {
      this.ctx.globalAlpha = 0.15;
      this.ctx.fillStyle = scheme.agenda.accent;
      this.ctx.strokeStyle = scheme.agenda.accent;

      switch (template.title) {
        case '肺癌':
          this.ctx.beginPath();
          this.ctx.arc(W - 100, 300, 40, 0, Math.PI * 2);
          this.ctx.stroke();
          this.ctx.beginPath();
          this.ctx.arc(W - 60, 300, 35, 0, Math.PI * 2);
          this.ctx.stroke();
          break;
        case '頭頸癌':
          this.ctx.beginPath();
          this.ctx.arc(W - 100, 280, 30, 0, Math.PI);
          this.ctx.stroke();
          this.ctx.fillRect(W - 110, 310, 20, 40);
          break;
        case '子宮體癌':
          for (let i = 0; i < 5; i++) {
            this.ctx.beginPath();
            this.ctx.arc(W - 150 + i * 20, 300, 8, 0, Math.PI * 2);
            this.ctx.fill();
          }
          break;
        case '泌尿道癌':
          this.ctx.beginPath();
          this.ctx.ellipse(W - 100, 300, 25, 40, 0, 0, Math.PI * 2);
          this.ctx.stroke();
          break;
        case '大腸直腸癌':
          this.ctx.lineWidth = 4;
          this.ctx.beginPath();
          this.ctx.moveTo(W - 150, 250);
          this.ctx.quadraticCurveTo(W - 100, 300, W - 50, 350);
          this.ctx.stroke();
          break;
        case '乳癌':
          this.ctx.lineWidth = 8;
          this.ctx.beginPath();
          this.ctx.moveTo(W - 120, 280);
          this.ctx.quadraticCurveTo(W - 80, 250, W - 60, 300);
          this.ctx.quadraticCurveTo(W - 80, 350, W - 120, 320);
          this.ctx.stroke();
          break;
      }
      this.ctx.globalAlpha = 1;
    } catch (e) {
      this.ctx.globalAlpha = 1;
    }
  }

  // 計算所需的海報高度
  calculateRequiredHeight(
    agendaItems: AgendaItem[],
    showFooter: boolean,
    footerText: string,
    W: number
  ): number {
    let total = 275;

    if (agendaItems.length > 0) {
      this.ctx.font = '16px Microsoft JhengHei';

      let agendaH = 75 + 35 + 45; // 標題區 + 間隔 + 欄位標題

      // 計算表格幾何
      const tableOuterLeft = 40;
      const tableOuterRight = W - 40;
      const innerPad = 20;
      const innerLeft = tableOuterLeft + innerPad;
      const innerRight = tableOuterRight - innerPad;
      const innerWidth = innerRight - innerLeft;

      const wTime = Math.round(innerWidth * 0.1765);
      const wTopic = Math.round(innerWidth * 0.4412);
      const wSpeaker = Math.round(innerWidth * 0.2059);
      const wModerator = innerWidth - wTime - wTopic - wSpeaker;

      const pad = 10;

      agendaItems.forEach(item => {
        const topicLines = this.calculateTextLinesWithBreaks(item.topic, Math.max(10, wTopic - pad));
        const speakerLines = item.speaker ? this.calculateTextLinesWithBreaks(item.speaker, Math.max(10, wSpeaker - pad)) : 1;
        const moderatorLines = item.moderator ? this.calculateTextLinesWithBreaks(item.moderator, Math.max(10, wModerator - pad)) : 1;
        const timeLines = this.calculateTextLinesWithBreaks(item.time, Math.max(10, wTime - pad));

        const maxLines = Math.max(topicLines, speakerLines, moderatorLines, timeLines);
        const rowH = Math.max(50, maxLines * 22 + 16);
        agendaH += rowH;
      });

      total += agendaH + 40;
    }

    // 頁尾註解高度
    if (showFooter && footerText.trim()) {
      this.ctx.font = '11px Microsoft JhengHei';
      const noteW = W - 80;
      const noteLines = this.calculateTextLinesWithBreaks(footerText, noteW);
      const noteH = 5 + (noteLines * 15);
      total += noteH;
    }

    total += 10; // 底部間距
    return total;
  }

  // 主要海報繪製方法
  drawPoster(
    agendaItems: AgendaItem[],
    currentTemplate: string,
    currentColorScheme: string,
    currentGradientDirection: string,
    customColors: CustomColors,
    conferenceData: {
      title: string;
      subtitle: string;
      date: string;
      time: string;
      location: string;
      showMeetupPoint?: boolean;
      meetupType?: 'same' | 'other';
      meetupCustomText?: string;
    },
    showFooter: boolean,
    footerText: string,
    overlays: Overlay[] = []
  ): void {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const scheme = this.getActiveColorScheme(currentColorScheme, customColors);
    const template = templates[currentTemplate];

    // 背景
    if (currentColorScheme === 'custom' && customColors.bgGradientDir !== 'none') {
      this.ctx.fillStyle = this.createGradient(W, H, [customColors.bgC1, customColors.bgC2], customColors.bgGradientDir);
    } else {
      this.ctx.fillStyle = currentColorScheme === 'custom' ? customColors.bgC1 : '#fff';
    }
    this.ctx.fillRect(0, 0, W, H);

    // 標題波浪區域
    const headerHeight = 120;
    this.ctx.fillStyle = this.createGradient(W, headerHeight, scheme.header.colors, currentGradientDirection);
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(W, 0);
    this.ctx.lineTo(W, 100);
    this.ctx.quadraticCurveTo(W * 0.75, 130, W * 0.5, 110);
    this.ctx.quadraticCurveTo(W * 0.25, 90, 0, 120);
    this.ctx.closePath();
    this.ctx.fill();

    // 癌症圖標
    // this.ctx.font = '50px Arial';
    // this.ctx.fillStyle = scheme.header.text;
    // this.ctx.textAlign = 'left';
    // this.ctx.fillText(template.icon, 40, 65);

    // 主標題
    const title = conferenceData.title || `${template.title}醫學會議`;
    this.ctx.fillStyle = scheme.header.text;
    this.ctx.font = 'bold 36px Microsoft JhengHei';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(title, W / 2, 50);

    // 副標題
    if (conferenceData.subtitle) {
      this.ctx.font = '20px Microsoft JhengHei';
      this.ctx.fillText(conferenceData.subtitle, W / 2, 85);
    }

    // 日期地點資訊
    const infoCardY = 140;
    this.ctx.fillStyle = '#333';
    this.ctx.font = '18px Microsoft JhengHei';
    this.ctx.textAlign = 'left';
    if (conferenceData.date) this.ctx.fillText('📅 ' + conferenceData.date, 60, infoCardY + 30);
    if (conferenceData.time) this.ctx.fillText('🕐 ' + conferenceData.time, 60, infoCardY + 60);
    if (conferenceData.location) this.ctx.fillText('🏢 ' + conferenceData.location, 60, infoCardY + 90);

    // 集合地點資訊
    let nextY = infoCardY + 120;
    if (conferenceData.showMeetupPoint) {
      const meetupText = this.generateMeetupText(conferenceData);
      this.ctx.fillText('📍 ' + meetupText, 60, nextY);
      nextY += 30;
    }

    // 繪製背景 PNG 圖層（zIndex = 0，在 Table 下方）
    const backgroundOverlays = overlays.filter(o => o.zIndex === 0);
    this.drawOverlays(backgroundOverlays);

    // 議程表
    let afterAgendaY = nextY + 40;
    if (agendaItems.length > 0) {
      afterAgendaY = this.drawAgendaTable(agendaItems, scheme, W, afterAgendaY);
    }

    // 頁尾註解
    if (showFooter && footerText.trim()) {
      afterAgendaY = this.drawFooterNote(footerText, W, afterAgendaY);
    }

    // 底部裝飾條 (已移除)
    // this.ctx.fillStyle = scheme.agenda.background;
    // this.ctx.fillRect(0, H - 60, W, 60);

    // 主題裝飾圖案
    this.drawCancerDecorations(template, scheme, W, H);

    // 渲染前景 PNG 圖層（zIndex = 1，在 Table 上方）
    const foregroundOverlays = overlays.filter(o => o.zIndex === 1 || o.zIndex === undefined);
    this.drawOverlays(foregroundOverlays);
  }

  /**
   * 生成集合地點顯示文字
   */
  private generateMeetupText(conferenceData: any): string {
    const sameChecked = conferenceData.meetupType === 'same' ? '[■]' : '[  ]';
    const otherChecked = conferenceData.meetupType === 'other' ? '[■]' : '[  ]';
    
    if (conferenceData.meetupType === 'other' && conferenceData.meetupCustomText) {
      return `Meetup point: ${sameChecked}同會議地點  ${otherChecked}其他：${conferenceData.meetupCustomText}`;
    } else {
      return `Meetup point: ${sameChecked}同會議地點  ${otherChecked}其他：`;
    }
  }

  // 繪製議程表
  private drawAgendaTable(agendaItems: AgendaItem[], scheme: ColorScheme, W: number, startY: number): number {
    const agendaStartY = startY;

    // 移除獨立的 Agenda 標題，讓表格自成一體

    // 表格幾何計算
    const tableOuterLeft = 40;
    const tableOuterRight = W - 40;
    const innerPad = 20;
    const innerLeft = tableOuterLeft + innerPad;
    const innerRight = tableOuterRight - innerPad;
    const innerWidth = innerRight - innerLeft;

    const wTime = Math.round(innerWidth * 0.1765);
    const wTopic = Math.round(innerWidth * 0.4412);
    const wSpeaker = Math.round(innerWidth * 0.2059);
    const wModerator = innerWidth - wTime - wTopic - wSpeaker;

    const xTime = innerLeft;
    const xTopic = xTime + wTime;
    const xSpeaker = xTopic + wTopic;
    const xModerator = xSpeaker + wSpeaker;

    const cTime = xTime + wTime / 2;
    const cTopic = xTopic + wTopic / 2;
    const cSpeaker = xSpeaker + wSpeaker / 2;
    const cModerator = xModerator + wModerator / 2;

    // 欄位標題行（直接從議程開始位置繪製）
    let yPos = agendaStartY;
    this.ctx.fillStyle = scheme.agenda.border;
    this.ctx.fillRect(tableOuterLeft, yPos - 8, W - 80, 35);

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 16px Microsoft JhengHei';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Time', cTime, yPos + 15);
    this.ctx.fillText('Content', cTopic, yPos + 15);
    this.ctx.fillText('Speaker', cSpeaker, yPos + 15);
    this.ctx.fillText('Moderator', cModerator, yPos + 15);

    yPos += 45;

    // 資料行
    const pad = 10;
    agendaItems.forEach((item, idx) => {
      this.ctx.font = '16px Microsoft JhengHei';

      // 計算行高
      const timeLines = this.calculateTextLinesWithBreaks(item.time, wTime - pad);
      const topicLines = this.calculateTextLinesWithBreaks(item.topic, wTopic - pad);
      const speakerLines = item.speaker ? this.calculateTextLinesWithBreaks(item.speaker, wSpeaker - pad) : 1;
      const moderatorLines = item.moderator ? this.calculateTextLinesWithBreaks(item.moderator, wModerator - pad) : 1;
      const maxLines = Math.max(timeLines, topicLines, speakerLines, moderatorLines);
      const itemH = Math.max(45, maxLines * 22 + 15);

      // 斑馬紋背景
      if (idx % 2 === 0) {
        this.ctx.fillStyle = scheme.agenda.background;
        this.ctx.fillRect(tableOuterLeft, yPos - 18, W - 80, itemH);
      }

      this.ctx.textAlign = 'left';

      // 時間
      this.ctx.fillStyle = scheme.agenda.accent;
      this.ctx.font = 'bold 16px Microsoft JhengHei';
      this.drawCenteredTextWithBreaks(item.time || '', xTime + pad / 2, yPos - 18, wTime - pad, 22, itemH, 'center');

      // 主題
      this.ctx.fillStyle = scheme.agenda.accent;
      this.ctx.font = '16px Microsoft JhengHei';
      this.drawCenteredTextWithBreaks(item.topic || '', xTopic + pad / 2, yPos - 18, wTopic - pad, 22, itemH, 'center');

      // 講者和主持人 - 智能跨欄顯示
      const hasSpeaker = item.speaker && item.speaker.trim();
      const hasModerator = item.moderator && item.moderator.trim();
      
      if (hasSpeaker && hasModerator) {
        // 兩者都有：正常分欄顯示
        this.ctx.fillStyle = scheme.agenda.accent;
        this.ctx.font = '14px Microsoft JhengHei';
        this.drawCenteredTextWithBreaks(item.speaker, xSpeaker + pad / 2, yPos - 18, wSpeaker - pad, 20, itemH, 'center');
        
        this.ctx.fillStyle = scheme.agenda.accent;
        this.ctx.font = '14px Microsoft JhengHei';
        this.drawCenteredTextWithBreaks(item.moderator, xModerator + pad / 2, yPos - 18, wModerator - pad, 20, itemH, 'center');
      } else if (hasSpeaker && !hasModerator) {
        // 只有講者：跨欄置中顯示
        this.ctx.fillStyle = scheme.agenda.accent;
        this.ctx.font = '14px Microsoft JhengHei';
        const spanWidth = wSpeaker + wModerator; // 跨兩欄的寬度
        this.drawCenteredTextWithBreaks(item.speaker, xSpeaker + pad / 2, yPos - 18, spanWidth - pad, 20, itemH, 'center');
      } else if (!hasSpeaker && hasModerator) {
        // 只有主持人：跨欄置中顯示
        this.ctx.fillStyle = scheme.agenda.accent;
        this.ctx.font = '14px Microsoft JhengHei';
        const spanWidth = wSpeaker + wModerator; // 跨兩欄的寬度
        this.drawCenteredTextWithBreaks(item.moderator, xSpeaker + pad / 2, yPos - 18, spanWidth - pad, 20, itemH, 'center');
      }
      // 如果都沒有就不顯示任何內容

      yPos += itemH + 5;
    });

    return yPos + 10;
  }

  // 繪製頁尾註解
  private drawFooterNote(noteText: string, W: number, startY: number): number {
    const noteX = 40;
    const noteW = W - 80;
    const noteY = startY + 20;
    this.ctx.fillStyle = '#333';
    this.ctx.font = '11px Microsoft JhengHei';
    this.ctx.textAlign = 'left';
    const lines = this.calculateTextLinesWithBreaks(noteText, noteW);
    const contentH = lines * 15;
    this.wrapTextWithBreaks(noteText, noteX, noteY, noteW, 15);
    return noteY + contentH;
  }

  // 取得當前配色方案
  private getActiveColorScheme(currentColorScheme: string, customColors: CustomColors): ColorScheme {
    if (currentColorScheme === 'custom') {
      return {
        name: '自訂配色',
        header: {
          colors: [customColors.headerC1, customColors.headerC2, customColors.headerC3],
          text: '#FFFFFF'
        },
        agenda: {
          background: customColors.agendaBg,
          border: customColors.agendaBorder,
          accent: customColors.agendaAccent
        }
      };
    }
    return colorSchemes[currentColorScheme];
  }

  // 渲染PNG圖層（增強版，支持高品質處理）
  protected drawOverlays(overlays: Overlay[]): void {
    overlays.forEach(overlay => {
      if (!overlay.visible || !overlay.img) return;

      this.ctx.save();
      
      // 設定透明度
      this.ctx.globalAlpha = overlay.opacity;
      
      // 檢查是否有高品質處理的版本
      const processedCanvas = this.processedOverlayCache.get(overlay.id);
      
      if (this.useHighQualityOverlays && processedCanvas) {
        // 使用高品質預處理版本
        this.ctx.translate(overlay.x, overlay.y);
        this.ctx.drawImage(
          processedCanvas,
          -processedCanvas.width / 2,
          -processedCanvas.height / 2
        );
      } else {
        // 使用原始的標準處理
        // overlay.x, overlay.y 就是中心點
        this.ctx.translate(overlay.x, overlay.y);
        this.ctx.rotate(overlay.rotation);
        
        // 繪製圖層（相對於中心點）
        const drawX = (-overlay.w / 2) * overlay.scaleX;
        const drawY = (-overlay.h / 2) * overlay.scaleY;
        const drawW = overlay.w * overlay.scaleX;
        const drawH = overlay.h * overlay.scaleY;
        
        this.ctx.drawImage(overlay.img, drawX, drawY, drawW, drawH);
      }
      
      this.ctx.restore();
    });
  }

  // === 新增：高品質圖片處理支持 ===

  /**
   * 啟用/停用高品質圖層處理
   * @param enabled - 是否啟用高品質模式
   */
  enableHighQualityOverlays(enabled: boolean): void {
    this.useHighQualityOverlays = enabled;
    if (!enabled) {
      // 停用時清除快取
      this.processedOverlayCache.clear();
    }
  }

  /**
   * 預處理圖層（高品質處理）
   * @param overlays - 要處理的圖層陣列
   * @param onProgress - 進度回調
   */
  async preprocessOverlays(
    overlays: Overlay[],
    onProgress?: (processed: number, total: number, currentLayer?: string) => void
  ): Promise<void> {
    if (!this.useHighQualityOverlays) {
      return;
    }

    // 清除舊的快取
    this.processedOverlayCache.clear();

    // 過濾需要處理的圖層
    const layersToProcess = overlays.filter(overlay => 
      overlay.visible && OverlayProcessor.needsHighQualityProcessing(overlay)
    );

    let processed = 0;

    for (const overlay of layersToProcess) {
      if (onProgress) {
        onProgress(processed, layersToProcess.length, overlay.name);
      }

      try {
        const result = await OverlayProcessor.processOverlay(overlay, {
          outputFormat: 'png',
          quality: 0.95,
          smoothing: true,
          maxSize: 2048
        });

        // 快取處理結果
        this.processedOverlayCache.set(overlay.id, result.canvas);

      } catch (error) {
        console.error(`預處理圖層 ${overlay.name} 失敗:`, error);
      }

      processed++;
    }

    if (onProgress) {
      onProgress(processed, layersToProcess.length, '完成');
    }
  }

  /**
   * 導出高品質海報
   * @param format - 輸出格式
   * @param quality - 品質（0-1）
   * @param scaleFactor - 解析度倍數（預設 2 倍）
   */
  async exportHighQuality(
    format: 'png' | 'jpeg' | 'webp' = 'png',
    quality: number = 0.95,
    scaleFactor: number = 2
  ): Promise<{
    blob: Blob;
    dataURL: string;
    originalSize: { width: number; height: number };
    highQualitySize: { width: number; height: number };
  }> {
    const originalWidth = this.canvas.width;
    const originalHeight = this.canvas.height;
    const highQualityWidth = originalWidth * scaleFactor;
    const highQualityHeight = originalHeight * scaleFactor;
    
    // 創建高解析度 Canvas
    const hqCanvas = document.createElement('canvas');
    hqCanvas.width = highQualityWidth;
    hqCanvas.height = highQualityHeight;
    const hqCtx = hqCanvas.getContext('2d')!;
    
    // 設定高品質渲染
    hqCtx.imageSmoothingEnabled = true;
    hqCtx.imageSmoothingQuality = 'high';
    // 設定文字渲染品質（如果支援）
    if ('textRenderingOptimization' in hqCtx) {
      (hqCtx as any).textRenderingOptimization = 'optimizeQuality';
    }
    
    // 縮放座標系到高解析度
    hqCtx.scale(scaleFactor, scaleFactor);
    
    // 重新渲染整個海報到高解析度 Canvas
    await this.renderHighQualityPoster(hqCtx, originalWidth, originalHeight);
    
    // 導出高品質版本
    const blob = await CanvasUtils.canvasToBlob(hqCanvas, format, quality);
    const dataURL = CanvasUtils.canvasToDataURL(hqCanvas, format, quality);
    
    return { 
      blob, 
      dataURL,
      originalSize: { width: originalWidth, height: originalHeight },
      highQualitySize: { width: highQualityWidth, height: highQualityHeight }
    };
  }

  /**
   * 取得處理統計資訊
   * @param overlays - 圖層陣列
   */
  getProcessingStats(overlays: Overlay[]): {
    total: number;
    needsProcessing: number;
    processed: number;
    simple: number;
    complex: number;
  } {
    const stats = OverlayProcessor.getProcessingStats(overlays);
    const processed = overlays.filter(overlay => 
      this.processedOverlayCache.has(overlay.id)
    ).length;

    return {
      ...stats,
      processed
    };
  }

  /**
   * 清除處理快取
   */
  clearProcessingCache(): void {
    this.processedOverlayCache.clear();
  }

  /**
   * 取得快取狀態
   */
  getCacheInfo(): {
    size: number;
    overlayIds: number[];
    memoryUsage: string;
  } {
    let totalPixels = 0;
    const overlayIds = Array.from(this.processedOverlayCache.keys());

    this.processedOverlayCache.forEach(canvas => {
      totalPixels += canvas.width * canvas.height;
    });

    // 估算記憶體使用量（RGBA = 4 bytes per pixel）
    const memoryBytes = totalPixels * 4;
    const memoryMB = (memoryBytes / (1024 * 1024)).toFixed(2);

    return {
      size: this.processedOverlayCache.size,
      overlayIds,
      memoryUsage: `${memoryMB} MB`
    };
  }

  /**
   * 創建圖層預覽
   * @param overlay - 要預覽的圖層
   * @param size - 預覽尺寸
   */
  createOverlayPreview(overlay: Overlay, size: number = 150): HTMLCanvasElement {
    return OverlayProcessor.createPreview(overlay, size);
  }

  /**
   * 渲染高品質海報
   * 需要重新取得海報數據並渲染
   */
  private async renderHighQualityPoster(ctx: CanvasRenderingContext2D, width: number, height: number): Promise<void> {
    // 暫存原始 Canvas 和 Context
    const originalCanvas = this.canvas;
    const originalCtx = this.ctx;
    
    // 臨時切換到高解析度 Canvas
    this.ctx = ctx;
    
    try {
      // 取得當前海報的所有數據（從 DOM 或全域狀態）
      const posterData = this.getCurrentPosterData();
      
      // 重新繪製整個海報
      this.drawPoster(
        posterData.agendaItems,
        posterData.currentTemplate,
        posterData.currentColorScheme,
        posterData.currentGradientDirection,
        posterData.customColors,
        posterData.conferenceData,
        posterData.showFooter,
        posterData.footerText,
        posterData.overlays
      );
      
    } finally {
      // 恢復原始 Canvas 和 Context
      this.ctx = originalCtx;
    }
  }

  /**
   * 從 DOM 或全域狀態取得當前海報數據
   */
  private getCurrentPosterData(): any {
    // 從全域 app 物件取得數據（如果存在）
    const app = (window as any).app;
    if (app && app.getAppState) {
      const state = app.getAppState();
      return {
        agendaItems: state.agendaItems || [],
        currentTemplate: state.currentTemplate || 'lung',
        currentColorScheme: state.currentColorScheme || 'medical_green',
        currentGradientDirection: state.currentGradientDirection || 'horizontal',
        customColors: state.customColors || {},
        conferenceData: {
        title: this.getInputValue('conferenceTitle') || '',
        subtitle: this.getInputValue('conferenceSubtitle') || '',
        date: this.getInputValue('conferenceDate') || '',
        time: this.getInputValue('conferenceTime') || '',
          location: this.getInputValue('conferenceLocation') || ''
      },
        showFooter: this.getCheckboxValue('showFooterNote'),
        footerText: this.getInputValue('footerNoteContent') || '',
        overlays: state.overlays || []
      };
    }
    
    // 如果沒有全域狀態，從 DOM 直接讀取
    return this.getPosterDataFromDOM();
  }

  /**
   * 從 DOM 元素讀取當前海報數據
   */
  private getPosterDataFromDOM(): any {
    // 從全域 formControls 取得議程數據（如果可用）
    const app = (window as any).app;
    let agendaItems = [];
    let overlays = [];
    
    if (app && app.formControls && app.formControls.getAgendaItems) {
      agendaItems = app.formControls.getAgendaItems();
    }
    
    if (app && app.overlayManager && app.overlayManager.getOverlays) {
      overlays = app.overlayManager.getOverlays();
    }
    
    return {
      agendaItems,
      currentTemplate: 'lung',
      currentColorScheme: 'medical_green',
      currentGradientDirection: 'horizontal',
      customColors: {
        headerC1: '#1B4D3E',
        headerC2: '#2D8659',
        headerC3: '#4CAF85',
        agendaBg: '#E8F5E8',
        agendaBorder: '#1B4D3E',
        agendaAccent: '#2D8659',
        bgC1: '#ffffff',
        bgC2: '#f8f9fa',
        bgGradientDir: 'none'
      },
      conferenceData: {
        title: this.getInputValue('conferenceTitle') || '醫學會議',
        subtitle: this.getInputValue('conferenceSubtitle') || '',
        date: this.getInputValue('conferenceDate') || '',
        time: this.getInputValue('conferenceTime') || '',
        location: this.getInputValue('conferenceLocation') || '',
        showMeetupPoint: false,
        meetupType: 'same',
        meetupCustomText: ''
      },
      showFooter: this.getCheckboxValue('showFooterNote'),
      footerText: this.getInputValue('footerNoteContent') || '',
      overlays
    };
  }

  /**
   * 輔助方法：從 DOM 取得輸入值
   */
  private getInputValue(id: string): string {
    const element = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement;
    return element ? element.value : '';
  }

  /**
   * 輔助方法：從 DOM 取得 checkbox 值
   */
  private getCheckboxValue(id: string): boolean {
    const element = document.getElementById(id) as HTMLInputElement;
    return element ? element.checked : false;
  }
}
