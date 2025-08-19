# 圖片處理核心算法模組

從 PNG Cropper 抽取的核心變形+裁切算法，提供純函數式的圖片處理能力。

## 核心特色

- ✨ **純函數設計** - 不依賴 DOM，可在 Web Worker 中使用
- 🎯 **高品質輸出** - Canvas 高品質渲染，支援透明背景
- 🔧 **分離關注點** - UI 邏輯與圖片處理完全分開
- 📐 **精確座標轉換** - 顯示座標與圖片像素座標無縫轉換
- 🎨 **完整變形支援** - 旋轉、縮放、位移的組合處理

## 快速開始

### 基本使用

```typescript
import { imageProcessor } from './src/logic/image-processor';

// 最簡單的方式：快速處理
const result = await imageProcessor.quickProcess(file, {
  transform: { scale: 1.2, rot: 0.5 },
  outputFormat: 'png'
});

// result.blob 可以直接下載或顯示
```

### 進階使用

```typescript
import { 
  TransformCropEngine, 
  CoordinateUtils, 
  CropCalculator 
} from './src/logic/image-processor';

// 1. 載入圖片
const image = await TransformCropEngine.loadImageFromFile(file);
const naturalSize = TransformCropEngine.getImageNaturalSize(image);

// 2. 計算顯示佈局
const containerSize = { w: 800, h: 600 };
const layout = CoordinateUtils.calculateDisplayLayout(naturalSize, containerSize);

// 3. 設定變形和裁切參數
const params = {
  transform: { tx: 0, ty: 0, scale: 1.2, rot: 0.5 },
  cropRect: { x: 100, y: 100, w: 300, h: 200 },
  naturalSize,
  displaySize: layout.size,
  displayOffset: layout.offset
};

// 4. 處理圖片
const result = await TransformCropEngine.process(image, params, {
  outputFormat: 'png',
  quality: 0.95
});
```

## 核心 API

### TransformCropEngine

主要的圖片處理引擎：

```typescript
// 處理圖片
static async process(
  image: HTMLImageElement | ImageBitmap,
  params: TransformCropParams,
  options?: ProcessOptions
): Promise<ProcessResult>

// 載入圖片
static async loadImageFromFile(file: File): Promise<HTMLImageElement>
static async loadImageFromUrl(url: string): Promise<HTMLImageElement>

// 批次處理
static async processMultiple(
  images: (HTMLImageElement | File)[],
  paramsList: TransformCropParams[],
  options?: ProcessOptions
): Promise<ProcessResult[]>
```

### CoordinateUtils

座標系統轉換工具：

```typescript
// 顯示座標 ↔ 圖片像素座標
static displayToNatural(displayRect, naturalSize, displaySize, displayOffset): Rectangle
static naturalToDisplay(naturalRect, naturalSize, displaySize, displayOffset): Rectangle

// 計算圖片在容器中的最佳佈局
static calculateDisplayLayout(naturalSize, containerSize, margin?): { size, offset }
```

### CropCalculator

裁切區域計算：

```typescript
// 約束裁切矩形（邊界限制、比例鎖定）
static constrainRect(rect, bounds, options?): Rectangle

// 處理拖拽操作
static applyDrag(startRect, dragType, deltaX, deltaY, bounds, options?): Rectangle

// 獲取預設裁切區域
static getDefaultCropRect(imageBounds, padding?): Rectangle
```

## 類型定義

```typescript
interface Transform {
  tx: number;    // X軸位移
  ty: number;    // Y軸位移
  scale: number; // 縮放比例
  rot: number;   // 旋轉角度 (radians)
}

interface Rectangle {
  x: number; y: number; w: number; h: number;
}

interface ProcessResult {
  blob: Blob;                    // 處理後的圖片
  dataURL: string;               // Base64 數據
  dimensions: Size;              // 輸出尺寸
  actualCropRect: Rectangle;     // 實際裁切區域
}
```

## 使用場景

### 1. 圖片編輯器
```typescript
// 建立裁切工具
const helper = imageProcessor.createCropHelper(naturalSize, containerSize);
const defaultCrop = helper.getDefaultCrop();

// 處理使用者拖拽
const newCrop = helper.handleDrag(startRect, 'se', deltaX, deltaY, {
  aspectRatio: 16/9,
  keepAspect: true
});
```

### 2. 批次處理
```typescript
const files = [file1, file2, file3];
const params = files.map(() => ({
  transform: { scale: 0.8, rot: 0 },
  cropRect: { x: 0, y: 0, w: 300, h: 300 },
  // ... 其他參數
}));

const results = await TransformCropEngine.processMultiple(files, params);
```

### 3. 整合到現有專案
```typescript
// 在你的 posterRenderer.ts 中
import { TransformCropEngine } from './image-processor';

async function processUserImage(file, transforms) {
  const result = await TransformCropEngine.process(
    await TransformCropEngine.loadImageFromFile(file),
    transforms
  );
  
  // 整合到你的海報渲染流程
  return result.blob;
}
```

## 核心算法說明

### 變形+裁切處理順序

1. **縮放座標系** - 將輸出座標縮放到顯示像素空間
2. **對齊裁切區域** - 將裁切區域移動到原點
3. **套用變形** - 在圖片中心套用位移、旋轉、縮放
4. **繪製圖片** - 以變形後的狀態繪製到 Canvas
5. **輸出結果** - 生成高品質的 Blob 和 DataURL

### 座標系統

- **自然座標** - 圖片的實際像素座標
- **顯示座標** - UI 中顯示的座標（考慮縮放和居中）
- **裁切座標** - 裁切框在顯示座標系中的位置

## 測試

開啟 `demo-usage.html` 來測試核心算法：

```bash
# 在瀏覽器中開啟
open src/logic/image-processor/demo-usage.html
```

## 整合建議

1. **替換現有圖片處理** - 將 `TransformCropEngine` 整合到 `posterRenderer.ts`
2. **建立 UI 組件** - 使用 `CropCalculator` 處理拖拽邏輯
3. **批次功能** - 利用 `processMultiple` 處理多張圖片
4. **Web Worker** - 在背景執行緒中處理大量圖片

這個模組提供了從原始 PNG Cropper 抽取的所有核心算法，讓你可以在不依賴完整 Web Component 的情況下，獲得相同的圖片處理能力。
