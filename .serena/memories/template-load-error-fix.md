# 範本載入錯誤修復 - 完成記錄

## 錯誤現象
- 不做任何更動：匯出→匯入範本 ✅ 正常
- 做了更動後：匯出→匯入範本 ❌ 出現「解析範本檔案失敗」錯誤

## 問題分析

### 1. 載入時缺少新欄位
範本載入時 `customState` 只包含舊的三個欄位：
```typescript
customState: {
  agendaItems: template.data.agendaItems,
  overlays: template.data.overlays,
  customColors: template.data.customColors
  // ❌ 缺少 meetupSettings, footerSettings, basicInfo
}
```

### 2. 可能的序列化問題
- 圖層資料的 base64 可能包含特殊字符
- 某些物件可能存在循環引用
- JSON.stringify 過程中可能失敗

## 修復內容

### 1. 修復載入時的資料完整性
```typescript
// src/logic/templateManager.ts - loadTemplateFromFile 方法
customState: {
  agendaItems: template.data.agendaItems,
  overlays: template.data.overlays,
  customColors: template.data.customColors,
  meetupSettings: template.data.meetupSettings,    // 🆕 新增
  footerSettings: template.data.footerSettings,    // 🆕 新增
  basicInfo: template.data.basicInfo               // 🆕 新增
}
```

### 2. 強化序列化錯誤處理
```typescript
// 儲存時檢查 JSON 序列化
let jsonString;
try {
  jsonString = JSON.stringify(template, null, 2);
} catch (stringifyError) {
  console.error('JSON 序列化失敗:', stringifyError);
  throw new Error(`範本資料序列化失敗: ${stringifyError.message}`);
}
```

### 3. 安全處理圖層資料
```typescript
// 檢查圖層資料是否可序列化
let safeOverlays = [];
try {
  safeOverlays = customState?.overlays || [];
  JSON.stringify(safeOverlays);
  console.log('✅ 圖層資料序列化測試通過');
} catch (e) {
  console.warn('⚠️ 圖層資料序列化失敗，使用空陣列:', e);
  safeOverlays = [];
}
```

### 4. 詳細錯誤日誌
```typescript
// 載入時提供詳細錯誤資訊
try {
  console.log('🔍 開始解析範本檔案...');
  const template: FileTemplate = JSON.parse(e.target?.result as string);
  console.log('✅ JSON 解析成功:', template.name);
} catch (e) {
  console.error('❌ 範本載入失敗:', e);
  reject(new Error(`解析範本檔案失敗: ${e.message}`));
}
```

## 可能的問題原因

### 1. 圖層資料過大
- PNG 圖片的 base64 資料可能非常大
- 瀏覽器對 JSON 字串長度有限制
- 建議：考慮壓縮或分離圖片資料

### 2. 狀態不一致
- 更動後新增的狀態沒有正確收集
- 某些欄位可能為 undefined 導致序列化問題

### 3. 循環引用
- 某些物件可能包含循環引用
- JSON.stringify 無法處理循環引用

## 除錯建議

### 1. 檢查瀏覽器控制台
```
F12 → Console → 查看詳細錯誤日誌
- "🔍 開始解析範本檔案..."
- "✅ JSON 解析成功" 或錯誤資訊
- "✅ 圖層資料序列化測試通過" 或警告
```

### 2. 測試步驟
1. 先測試不包含圖層的範本（只修改議程或基本資訊）
2. 再測試包含圖層的範本
3. 查看具體是哪個環節出錯

### 3. 臨時解決方案
如果圖層資料有問題，可以暫時：
- 不上傳 PNG 圖層進行測試
- 或在儲存前移除圖層

## 下一步
1. 重新編譯測試修復效果
2. 根據控制台日誌判斷具體問題位置
3. 如果仍有問題，可能需要進一步調整圖層資料處理
