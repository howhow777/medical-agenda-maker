// 高品質圖片處理測試控制器
// 添加到現有應用中用於測試新功能

import { PosterRenderer } from '../logic/posterRenderer.js';
import { OverlayManager } from '../logic/overlayManager.js';
import { CanvasUtils } from '../logic/canvas-utils.js';

/**
 * 高品質功能測試控制器
 */
export class HighQualityTestController {
  private posterRenderer: PosterRenderer;
  private overlayManager: OverlayManager;
  private isHighQualityMode: boolean = false;
  private statusElement: HTMLElement | null = null;

  constructor(posterRenderer: PosterRenderer, overlayManager: OverlayManager) {
    this.posterRenderer = posterRenderer;
    this.overlayManager = overlayManager;
    this.initializeUI();
    this.bindEvents();
  }

  /**
   * 初始化測試 UI
   */
  private initializeUI(): void {
    // 創建狀態顯示元素
    this.createStatusDisplay();
    
    // 讓按鈕在全域可存取，方便 Console 測試
    (window as any).hqTest = {
      toggle: () => this.toggleHighQualityMode(),
      download: () => this.downloadHighQuality(),
      stats: () => this.showStats(),
      preprocess: () => this.preprocessLayers(),
      clear: () => this.clearCache()
    };

    console.log('🎯 高品質測試控制器已初始化');
    console.log('💡 在 Console 中輸入 hqTest 查看可用命令');
  }

  /**
   * 創建狀態顯示
   */
  private createStatusDisplay(): void {
    const container = document.querySelector('.canvas-container');
    if (!container) return;

    const statusDiv = document.createElement('div');
    statusDiv.id = 'hq-status';
    statusDiv.style.cssText = `
      margin-top: 10px;
      padding: 8px 12px;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 6px;
      font-size: 12px;
      text-align: center;
    `;
    statusDiv.innerHTML = '🎯 高品質模式: 關閉';
    
    container.appendChild(statusDiv);
    this.statusElement = statusDiv;
  }

  /**
   * 綁定按鈕事件
   */
  private bindEvents(): void {
    // 高品質下載按鈕
    const btnHQ = document.getElementById('btnHighQuality');
    if (btnHQ) {
      btnHQ.addEventListener('click', () => this.downloadHighQuality());
    }

    // 切換模式按鈕
    const btnToggle = document.getElementById('btnToggleMode');
    if (btnToggle) {
      btnToggle.addEventListener('click', () => this.toggleHighQualityMode());
    }

    // 確保原有的下載按鈕正常工作
    const btnDownload = document.getElementById('btnDownload');
    if (btnDownload && !btnDownload.onclick) {
      btnDownload.addEventListener('click', () => this.downloadStandard());
    }
  }

  /**
   * 切換高品質模式
   */
  async toggleHighQualityMode(): Promise<void> {
    this.isHighQualityMode = !this.isHighQualityMode;
    
    this.posterRenderer.enableHighQualityOverlays(this.isHighQualityMode);
    
    this.updateStatus(
      this.isHighQualityMode ? 
      '🎯 高品質模式: 開啟 ✨' : 
      '🎯 高品質模式: 關閉'
    );

    if (this.isHighQualityMode) {
      // 自動預處理圖層
      const overlays = this.overlayManager.getOverlays();
      if (overlays.length > 0) {
        this.updateStatus('🔄 預處理圖層中...');
        try {
          await this.posterRenderer.preprocessOverlays(overlays, (processed, total, layer) => {
            this.updateStatus(`🔄 處理中: ${processed}/${total} - ${layer || '未知圖層'}`);
          });
          this.updateStatus('✅ 高品質模式: 開啟 ✨ (已預處理)');
        } catch (error) {
          this.updateStatus('❌ 預處理失敗');
          console.error('預處理失敗:', error);
        }
      }
    }

    console.log(`🎯 高品質模式已${this.isHighQualityMode ? '開啟' : '關閉'}`);
  }

  /**
   * 下載高品質版本
   */
  async downloadHighQuality(): Promise<void> {
    try {
      this.updateStatus('🔄 產生高品質圖片中...');
      
      // 確保啟用高品質模式
      const wasHighQuality = this.isHighQualityMode;
      if (!wasHighQuality) {
        await this.toggleHighQualityMode();
      }

      // 更新海報渲染
      this.triggerPosterUpdate();
      
      // 等待一點時間讓渲染完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 導出高品質版本
      const { blob, dataURL, originalSize, highQualitySize } = await this.posterRenderer.exportHighQuality('png', 0.95);
      
      console.log(`📊 解析度提升: ${originalSize.width}x${originalSize.height} → ${highQualitySize.width}x${highQualitySize.height}`);
      
      // 下載
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `high-quality-poster-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.updateStatus('✅ 高品質海報已下載！');
      console.log('🎉 高品質海報下載完成');
      
      // 恢復原始模式
      if (!wasHighQuality) {
        setTimeout(() => this.toggleHighQualityMode(), 1000);
      }
      
    } catch (error) {
      this.updateStatus('❌ 下載失敗');
      console.error('高品質下載失敗:', error);
    }
  }

  /**
   * 下載標準版本
   */
  async downloadStandard(): Promise<void> {
    try {
      this.updateStatus('🔄 下載標準版本...');
      
      const canvas = document.getElementById('posterCanvas') as HTMLCanvasElement;
      if (!canvas) {
        throw new Error('找不到 Canvas 元素');
      }
      
      const blob = await CanvasUtils.canvasToBlob(canvas, 'png', 0.9);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poster-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      
      this.updateStatus('✅ 標準海報已下載');
      
    } catch (error) {
      this.updateStatus('❌ 下載失敗');
      console.error('標準下載失敗:', error);
    }
  }

  /**
   * 顯示處理統計
   */
  showStats(): void {
    const overlays = this.overlayManager.getOverlays();
    const stats = this.posterRenderer.getProcessingStats(overlays);
    const cacheInfo = this.posterRenderer.getCacheInfo();
    
    console.log('📊 處理統計:', {
      總圖層: stats.total,
      需要處理: stats.needsProcessing,
      已處理: stats.processed,
      簡單處理: stats.simple,
      複雜處理: stats.complex,
      快取大小: cacheInfo.size,
      記憶體使用: cacheInfo.memoryUsage
    });
    
    this.updateStatus(`📊 統計: ${stats.total}層 | 需處理${stats.needsProcessing} | 已快取${stats.processed}`);
  }

  /**
   * 預處理圖層
   */
  async preprocessLayers(): Promise<void> {
    const overlays = this.overlayManager.getOverlays();
    if (overlays.length === 0) {
      this.updateStatus('⚠️ 沒有圖層需要處理');
      return;
    }

    try {
      this.updateStatus('🔄 開始預處理圖層...');
      
      await this.posterRenderer.preprocessOverlays(overlays, (processed, total, layer) => {
        this.updateStatus(`🔄 處理中: ${processed}/${total} - ${layer || '處理中'}`);
      });
      
      this.updateStatus('✅ 圖層預處理完成');
      console.log('✅ 圖層預處理完成');
      
    } catch (error) {
      this.updateStatus('❌ 預處理失敗');
      console.error('預處理失敗:', error);
    }
  }

  /**
   * 清除快取
   */
  clearCache(): void {
    this.posterRenderer.clearProcessingCache();
    this.updateStatus('🗑️ 快取已清除');
    console.log('🗑️ 處理快取已清除');
  }

  /**
   * 更新狀態顯示
   */
  private updateStatus(message: string): void {
    if (this.statusElement) {
      this.statusElement.innerHTML = message;
    }
  }

  /**
   * 觸發海報更新
   */
  private triggerPosterUpdate(): void {
    const updateBtn = document.getElementById('btnUpdate');
    if (updateBtn) {
      updateBtn.click();
    }
  }

  /**
   * 取得當前模式
   */
  getHighQualityMode(): boolean {
    return this.isHighQualityMode;
  }
}
