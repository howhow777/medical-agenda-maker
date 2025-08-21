# Excel 智能欄位檢測修復 - 完成記錄

## 問題描述
Excel 檔案的 Moderator 欄位位置不固定，出現在不同位置：
- **例子1 (5欄結構)**: Moderator 在第3位置
- **例子2 (11欄結構)**: Moderator 在第4或第7位置

導致解析時 Moderator 經常顯示為 `undefined`。

## 分析的欄位結構

### 短欄結構 (5欄)
```
[0] Time | [1] Content | [2] Speaker | [3] Moderator | [4] Extra
```
- Moderator 通常在位置3或4

### 長欄結構 (11欄)  
```
[0] Time | [1] Content | [2] Speaker | [3] Empty | [4] Moderator | ... | [7] Extra Moderator
```
- Moderator 可能在位置4、7或其他位置

## 實作的智能檢測算法

### 核心邏輯 `smartFieldDetection(row)`

```typescript
/**
 * 🎯 智能欄位檢測：處理不同的 Excel 欄位結構
 */
private smartFieldDetection(row: any[]): { speaker: string | undefined; moderator: string | undefined } {
  const rowLength = row.length;
  let speaker: string | undefined;
  let moderator: string | undefined;

  // 1. Speaker 檢測（固定在第2位置）
  const speakerCandidate = String(row[2] || '').trim();
  if (speakerCandidate && speakerCandidate !== '') {
    speaker = speakerCandidate;
  }

  // 2. Moderator 智能檢測
  if (rowLength <= 5) {
    // === 短欄結構處理 ===
    // 檢查位置3和4，智能判斷哪個是 Moderator
  } else {
    // === 長欄結構處理 ===
    // 先檢查位置4，如果空則搜尋位置5-9
  }

  // 3. 資料清理
  // - 如果 Speaker 和 Moderator 相同，清空 Moderator
  // - 過濾 "All" 等通用值

  return { speaker, moderator };
}
```

### 詳細演算法

#### 短欄結構 (≤5欄)
```typescript
const pos3 = String(row[3] || '').trim();
const pos4 = String(row[4] || '').trim();

// 情況1: 第3位置有內容且第2位置空或很短 → 第3位置可能是 Speaker
if (pos3 && (!speaker || speaker.length < 3)) {
  if (!speaker) speaker = pos3;
  moderator = pos4 || undefined;
} 
// 情況2: 第3位置是 Moderator
else if (pos3 && speaker) {
  moderator = pos3;
} 
// 情況3: 第4位置是 Moderator
else if (pos4) {
  moderator = pos4;
}
```

#### 長欄結構 (>5欄)
```typescript
// 先檢查標準位置4
const pos4 = String(row[4] || '').trim();
if (pos4) {
  moderator = pos4;
} else {
  // 搜尋位置5-9，尋找包含職稱關鍵字的內容
  for (let i = 5; i < Math.min(rowLength, 10); i++) {
    const candidate = String(row[i] || '').trim();
    if (candidate && candidate.length > 3) {
      if (candidate.includes('醫師') || candidate.includes('教授') || 
          candidate.includes('主任') || candidate.includes('院長')) {
        moderator = candidate;
        break;
      }
    }
  }
}
```

### 資料清理邏輯

```typescript
// 1. 去重：Speaker 和 Moderator 相同時清空 Moderator
if (speaker && moderator && speaker === moderator) {
  moderator = undefined;
}

// 2. 過濾通用值：如 "All"
if (moderator === 'All' || moderator === 'all') {
  moderator = undefined;
}
```

## 修復效果

### 修復前
```
最終結果: Speaker="台中榮總醫院\n黃彥翔 醫師", Moderator="undefined"  ❌
```

### 修復後  
```
智能檢測結果: Speaker="台中榮總醫院\n黃彥翔 醫師", Moderator="台中榮總醫院\n楊宗穎 醫師"  ✅
```

## 技術特點

### 1. 自適應檢測
- 根據欄位數量自動選擇檢測策略
- 短欄和長欄使用不同演算法

### 2. 智能搜尋
- 關鍵字匹配：醫師、教授、主任、院長
- 長度過濾：避免空值或過短字串

### 3. 資料品質控制
- 去除重複值
- 過濾不合理的通用值
- 保持資料一致性

### 4. 詳細除錯日誌
```typescript
console.log(`智能檢測詳細: 欄位數=${rowLength}, Speaker位置=2, Moderator搜尋範圍=${範圍}`);
console.log(`候選值: pos3="${row[3]}", pos4="${row[4]}", pos7="${row[7]}"`);
```

## 支援的 Excel 格式

### ✅ 已測試格式
1. **5欄格式**: Time | Content | Speaker | Moderator | Extra
2. **11欄格式**: Time | Content | Speaker | Empty | Moderator | ... | Extra

### 🔄 理論支援格式
- 任何包含 Time, Content, Speaker, Moderator 的欄位結構
- Moderator 位置從第3欄到第9欄的各種變化

## 使用效果

### 用戶體驗提升
- ✅ 不同 Excel 模板都能正確解析
- ✅ Speaker 和 Moderator 都能正確識別
- ✅ 減少手動修正的需要

### 系統穩定性
- ✅ 向後相容原有格式
- ✅ 容錯性強，不會因欄位變化而崩潰
- ✅ 提供詳細除錯資訊便於問題排查

## 下一步
建議測試更多不同格式的 Excel 檔案，持續優化演算法的準確性。
