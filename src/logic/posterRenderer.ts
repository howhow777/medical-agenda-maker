import { AgendaItem, Overlay, CustomColors } from '../assets/types.js';
import { colorSchemes, gradientDirections } from './colorSchemes.js';
import { templates } from './templates.js';

export class PosterRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  // 計算所需高度
  calculateRequiredHeight(
    agendaItems: AgendaItem[], 
    showFooter: boolean, 
    footerText: string, 
    canvasWidth: number
  ): number {
    let height = 200; // 標題區域
    height += Math.max(agendaItems.length * 80, 400); // 議程區域
    if (showFooter) {
      height += 120; // 頁尾區域
    }
    return Math.max(600, height);
  }

  // 繪製海報
  drawPoster(
    agendaItems: AgendaItem[],
    currentTemplate: string,
    currentColorScheme: string,
    currentGradientDirection: string,
    customColors: CustomColors,
    conferenceData: any,
    showFooter: boolean,
    footerText: string,
    overlays: Overlay[]
  ): void {
    // 清空畫布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 繪製背景
    this.drawBackground(customColors);
    
    // 繪製標題區域
    this.drawHeader(conferenceData, currentTemplate, currentColorScheme, customColors, currentGradientDirection);
    
    // 繪製議程內容
    this.drawAgenda(agendaItems, currentColorScheme, customColors);
    
    // 繪製圖層
    this.drawOverlays(overlays);
    
    // 繪製頁尾
    if (showFooter) {
      this.drawFooter(footerText, customColors);
    }
  }

  // 繪製背景
  private drawBackground(customColors: CustomColors): void {
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, customColors.bgC1);
    gradient.addColorStop(1, customColors.bgC2);
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  // 繪製標題區域
  private drawHeader(
    conferenceData: any, 
    currentTemplate: string, 
    currentColorScheme: string, 
    customColors: CustomColors,
    gradientDirection: string
  ): void {
    const template = templates[currentTemplate];
    const scheme = colorSchemes[currentColorScheme];
    
    // 建立標題背景漸層
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, 150);
    if (currentColorScheme === 'custom') {
      gradient.addColorStop(0, customColors.headerC1);
      gradient.addColorStop(0.5, customColors.headerC2);
      gradient.addColorStop(1, customColors.headerC3);
    } else {
      const colors = scheme.header.colors;
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(0.5, colors[1]);
      gradient.addColorStop(1, colors[2]);
    }
    
    // 繪製標題背景
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, 150);
    
    // 繪製標題文字
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 32px Microsoft JhengHei';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(conferenceData.title || '醫學會議', this.canvas.width / 2, 50);
    
    // 繪製副標題
    if (conferenceData.subtitle) {
      this.ctx.font = '20px Microsoft JhengHei';
      this.ctx.fillText(conferenceData.subtitle, this.canvas.width / 2, 80);
    }
    
    // 繪製日期和地點
    this.ctx.font = '16px Microsoft JhengHei';
    const dateLocation = `${conferenceData.date} | ${conferenceData.location}`;
    this.ctx.fillText(dateLocation, this.canvas.width / 2, 110);
    
    // 繪製專科圖示
    this.ctx.font = '40px Arial';
    this.ctx.fillText(template?.icon || '🏥', this.canvas.width / 2, 140);
  }

  // 繪製議程內容
  private drawAgenda(agendaItems: AgendaItem[], currentColorScheme: string, customColors: CustomColors): void {
    const startY = 180;
    const itemHeight = 70;
    const padding = 20;
    
    agendaItems.forEach((item, index) => {
      const y = startY + index * itemHeight;
      
      // 議程項目背景
      this.ctx.fillStyle = currentColorScheme === 'custom' ? customColors.agendaBg : '#F8F9FA';
      this.ctx.fillRect(padding, y, this.canvas.width - padding * 2, itemHeight - 10);
      
      // 議程項目邊框
      this.ctx.strokeStyle = currentColorScheme === 'custom' ? customColors.agendaBorder : '#DEE2E6';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(padding, y, this.canvas.width - padding * 2, itemHeight - 10);
      
      // 時間
      this.ctx.fillStyle = currentColorScheme === 'custom' ? customColors.agendaAccent : '#495057';
      this.ctx.font = 'bold 16px Microsoft JhengHei';
      this.ctx.textAlign = 'left';
      this.ctx.fillText(item.time, padding + 10, y + 25);
      
      // 主題
      this.ctx.fillStyle = '#212529';
      this.ctx.font = '18px Microsoft JhengHei';
      this.ctx.fillText(item.topic, padding + 10, y + 45);
      
      // 講者和主持人
      if (item.speaker || item.moderator) {
        this.ctx.fillStyle = '#6C757D';
        this.ctx.font = '14px Microsoft JhengHei';
        const speakerText = item.speaker ? `講者：${item.speaker}` : '';
        const moderatorText = item.moderator ? `主持：${item.moderator}` : '';
        const combinedText = [speakerText, moderatorText].filter(Boolean).join(' | ');
        this.ctx.fillText(combinedText, padding + 10, y + 60);
      }
    });
  }

  // 繪製圖層
  private drawOverlays(overlays: Overlay[]): void {
    overlays.forEach(overlay => {
      if (!overlay.visible) return;
      
      this.ctx.save();
      this.ctx.globalAlpha = overlay.opacity;
      this.ctx.translate(overlay.x, overlay.y);
      this.ctx.rotate(overlay.rotation);
      
      const renderWidth = overlay.w * overlay.scaleX;
      const renderHeight = overlay.h * overlay.scaleY;
      
      this.ctx.drawImage(
        overlay.img,
        overlay.crop.x, overlay.crop.y, overlay.crop.w, overlay.crop.h,
        -renderWidth / 2, -renderHeight / 2, renderWidth, renderHeight
      );
      
      this.ctx.restore();
    });
  }

  // 繪製頁尾
  private drawFooter(footerText: string, customColors: CustomColors): void {
    const footerY = this.canvas.height - 100;
    
    // 頁尾背景
    this.ctx.fillStyle = 'rgba(248, 249, 250, 0.9)';
    this.ctx.fillRect(0, footerY, this.canvas.width, 100);
    
    // 頁尾文字
    this.ctx.fillStyle = '#495057';
    this.ctx.font = '12px Microsoft JhengHei';
    this.ctx.textAlign = 'center';
    
    // 分行顯示
    const lines = footerText.split('\n');
    lines.forEach((line, index) => {
      this.ctx.fillText(line, this.canvas.width / 2, footerY + 20 + index * 16);
    });
  }
}