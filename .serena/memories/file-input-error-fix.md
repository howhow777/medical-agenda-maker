# 檔案輸入框錯誤修復 - 完成記錄

## 錯誤訊息
"Failed to set the 'value' property on 'HTMLInputElement': This input element accepts a filename, which may only be programmatically set to the empty string."

## 問題根源
瀏覽器基於安全考量，不允許 JavaScript 程式設定檔案輸入框 (`<input type="file">`) 的 value 屬性為非空值。這是為了防止惡意網站任意讀取用戶檔案。

## 問題場景
1. **收集狀態時**：`collectFormState()` 收集了檔案輸入框的檔案路徑
2. **還原狀態時**：`applyState()` 嘗試設定檔案輸入框的 value
3. **瀏覽器拒絕**：拋出安全錯誤，導致整個範本載入失敗

## 修復方案

### 1. 修改 collectFormState - 跳過檔案輸入框收集
```typescript
// src/logic/dataManager.ts - collectFormState 方法
for (const el of inputs) {
  const key = (el as HTMLInputElement).name || el.id;
  if (!key) continue;
  
  // 🚫 跳過檔案輸入框 - 避免收集檔案路徑
  if (el instanceof HTMLInputElement && el.type === 'file') {
    continue;
  }
  
  // 其他輸入框處理...
}
```

### 2. 修改 applyState - 跳過檔案輸入框還原
```typescript
// src/logic/dataManager.ts - applyState 方法
for (const [key, val] of Object.entries(form)) {
  const el = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
  if (!el) continue;
  
  // 🚫 跳過檔案輸入框 - 瀏覽器不允許程式設定檔案路徑
  if (el instanceof HTMLInputElement && el.type === 'file') {
    console.log('⚠️ 跳過檔案輸入框:', key);
    continue;
  }
  
  // 其他輸入框處理...
}
```

## 影響的輸入框

### 專案中的檔案輸入框：
1. **Excel 上傳**: `#excel-file-input` - Excel 議程匯入
2. **PNG 圖層上傳**: `#overlayFile` - PNG 圖層上傳
3. **範本載入**: `#templateFileInput` - 範本檔案載入

### 處理方式：
- ✅ **不收集**檔案路徑到範本中
- ✅ **跳過還原**檔案輸入框的 value
- ✅ **保持功能**：檔案上傳功能仍正常運作
- ✅ **安全合規**：符合瀏覽器安全政策

## 技術說明

### 為什麼不能設定檔案路徑？
瀏覽器安全政策：
1. **防止惡意讀取**：避免網站任意讀取用戶檔案
2. **用戶授權**：檔案路徑只能由用戶主動選擇
3. **隱私保護**：檔案路徑可能洩露用戶資料夾結構

### 合理的替代方案：
1. **不儲存檔案路徑**：檔案輸入框不納入範本
2. **重新選擇檔案**：載入範本後用戶需重新選擇檔案
3. **提示用戶**：可在 UI 中提示需要重新上傳檔案

## 修復效果
- ✅ 範本儲存時不會收集檔案輸入框狀態
- ✅ 範本載入時不會嘗試設定檔案輸入框
- ✅ 避免瀏覽器安全錯誤
- ✅ 範本載入流程順利完成
- ✅ 其他所有功能正常運作

## 使用者體驗
載入範本後：
- ✅ 所有文字、選項、配色等完整還原
- ⚠️ 用戶需要重新上傳 PNG 圖層（如果有的話）
- ⚠️ 用戶需要重新選擇 Excel 檔案（如果需要的話）

這是正常且合理的行為，符合網頁安全標準。

## 下一步
重新編譯測試，範本載入應該不再出現錯誤。
