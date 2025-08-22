# 動態按鈕定位技術 - 容器下緣固定法

## 問題場景

需要將按鈕定位在特定容器（如白色內容區域）的下緣附近，同時滿足以下需求：
- ✅ 按鈕位於目標容器範圍內
- ✅ 按鈕可以覆蓋容器內容（增加存在感）
- ✅ 按鈕不隨頁面滾動移動（始終在視野內）
- ✅ 按鈕位置會隨容器在視窗中的位置動態調整

## 解決方案概述

**核心思路：動態檢測 + 固定定位**
1. 使用 `position: fixed` 讓按鈕不隨滾動
2. 透過 JavaScript 即時計算目標容器的下緣位置
3. 動態設定按鈕的 `bottom` 值，讓它始終貼在容器下緣上方

## 技術原理

### 關鍵 API
- `getBoundingClientRect()` - 獲取元素相對於視窗的位置
- `window.innerHeight` - 視窗高度
- 動態計算公式：`bottom = 視窗高度 - 容器下緣位置 + 偏移量`

### 定位邏輯
```
視窗頂部 (0)
    ↓
容器上緣
    ↓ (容器內容)
容器下緣 ← rect.bottom
    ↓ 
視窗底部 (window.innerHeight)

按鈕 bottom 值 = window.innerHeight - rect.bottom + offset
```

## 完整實作範例

### HTML 結構
```html
<div class="canvas-container">
  <!-- 目標容器內容 -->
  <canvas id="canvas"></canvas>
</div>

<button id="btnDownload" class="floating-download-center">
  📥 下載
</button>
```

### CSS 樣式
```css
.canvas-container {
  position: relative;
  background: white;
  /* 其他樣式... */
}

.floating-download-center {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  
  /* 基本樣式 */
  padding: 12px 24px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  
  /* bottom 值由 JavaScript 動態設定 */
}
```

### JavaScript 核心邏輯
```javascript
/**
 * 動態更新按鈕位置 - 容器下緣固定法
 * @param {string} containerSelector - 目標容器選擇器
 * @param {string} buttonSelector - 按鈕選擇器  
 * @param {number} offset - 距離容器下緣的偏移量（px）
 */
function updateButtonPosition(containerSelector, buttonSelector, offset = 10) {
  const container = document.querySelector(containerSelector);
  const button = document.querySelector(buttonSelector);
  
  if (!container || !button) return;
  
  const rect = container.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  
  // 計算距離視窗底部的距離
  const bottomOffset = windowHeight - rect.bottom + offset;
  
  // 動態設定按鈕位置
  button.style.bottom = `${Math.max(bottomOffset, offset)}px`;
}

// 初始化並綁定事件
function initDynamicButtonPositioning() {
  const updatePosition = () => updateButtonPosition('.canvas-container', '#btnDownload', 15);
  
  // 頁面載入完成後執行
  updatePosition();
  
  // 監聽滾動和視窗大小變化
  window.addEventListener('scroll', updatePosition);
  window.addEventListener('resize', updatePosition);
}

// 啟動
document.addEventListener('DOMContentLoaded', initDynamicButtonPositioning);
```

## 應用注意事項

### 效能優化
- 可以使用 `throttle` 或 `debounce` 優化滾動事件頻率
- 避免在不必要時重複計算

### 邊界情況處理
- 當容器完全移出視野時的行為
- 容器高度小於視窗高度的情況
- 移動裝置上的適配

### 擴展應用
- **左右定位**：修改 `left` 值實現水平跟隨
- **多按鈕排列**：計算多個按鈕的相對位置
- **不同容器**：同時跟隨多個不同的目標容器
- **動畫效果**：加入 CSS transition 讓位置變化更流暢

## 使用範例

```javascript
// 基本使用
updateButtonPosition('.main-content', '.floating-btn');

// 自訂偏移量
updateButtonPosition('.canvas-area', '.download-btn', 20);

// 多按鈕應用
updateButtonPosition('.editor-container', '.save-btn', 60);  // 上方按鈕
updateButtonPosition('.editor-container', '.export-btn', 10); // 下方按鈕
```

---
*建立日期：2025-08-23*  
*技術標籤：#動態定位 #固定按鈕 #容器跟隨 #JavaScript #CSS*