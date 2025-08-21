# 醫療議程製作器 (Medical Agenda Maker)

🏥 **智慧醫療排程管理工具** - 專為醫療會議與排程設計的互動式海報製作器

## 🆕 最新功能 (v1.1.0)

### ✅ Excel 議程整合系統
- **智能 Excel 解析**: 自動識別會議標題、地點、日期、時間
- **議程資料轉換**: Excel 議程項目無縫轉換為海報格式
- **即時海報生成**: 上傳 Excel 後立即產生專業議程海報
- **多格式支持**: 支持 .xlsx, .xls 格式檔案

### ✅ 智能版面優化
- **Speaker/Moderator 跨欄置中**: 單一角色時自動跨欄顯示
- **動態佈局調整**: 根據內容自動優化版面配置
- **專業醫學模板**: 針對醫學會議設計的專用模板

### 🔧 技術架構升級
- **資料轉換器 (DataConverter)**: AgendaData ↔ AppState 智能轉換
- **增強型解析器 (ExcelParser)**: 支持複雜 Excel 格式解析
- **模組化設計**: 議程功能完全模組化，易於維護擴展

## 📋 專案特色

- **視覺化設計介面** - 直觀的拖拽操作，輕鬆製作專業海報
- **模組化架構** - 邏輯層、互動層、資源層清晰分離
- **TypeScript 開發** - 強型別保護，提升開發效率與程式品質
- **即時預覽** - 所見即所得的編輯體驗

## 🏗️ 專案架構

```
src/
├── assets/          # 資源檔案 (類型定義等)
├── interface/       # 互動層 (UI 控制、表單、畫布互動)
├── logic/          # 邏輯層 (資料管理、渲染引擎、樣板系統)
└── main.ts         # 應用程式入口點
```

## 🚀 快速開始

### 安裝依賴
```bash
npm install
```

### 開發模式
```bash
npm run dev        # 啟動 TypeScript 監聽模式
npm run dev:serve  # 同時啟動編譯監聽和本地服務器
```

### 生產建置
```bash
npm run build     # 編譯 TypeScript
npm start         # 清理 + 建置 + 啟動服務器
```

### 本地預覽
```bash
npm run serve     # 在 http://localhost:3000 啟動服務器
```

## 🛠️ 技術棧

- **前端**: TypeScript, HTML5 Canvas, CSS3
- **建置工具**: TypeScript Compiler
- **開發工具**: http-server, ts-node
- **架構模式**: MVC 分層架構

## 📱 主要功能

1. **智慧模板系統** - 預設多種醫療會議海報模板
2. **拖拽式編輯** - 直覺的視覺化編輯介面
3. **即時渲染** - 高效能的 Canvas 渲染引擎
4. **響應式設計** - 適配各種螢幕尺寸
5. **資料管理** - 完整的狀態管理機制

## 🏥 使用指南

### Excel 議程匯入流程
1. **啟動應用**: `npm start`
2. **上傳 Excel**: 在左側控制面板找到「📁 Excel 議程匯入」
3. **拖拽檔案**: 支持 .xlsx/.xls 格式
4. **自動生成**: 系統自動解析並產生議程海報
5. **編輯調整**: 使用右側控制面板調整樣式
6. **匯出保存**: 點擊下載按鈕匯出 PNG 海報

### 支持的 Excel 格式
```
會議基本資訊:
- Topic/主題: 會議標題
- Venue/地點: 會議地點  
- Date/日期: 會議日期
- Time/時間: 會議時間

議程項目表格:
| Time    | Content        | Speaker      | Moderator     |
|---------|----------------|--------------|---------------|
| 09:00   | 主題演講      | 專家醫師    | 學科主任     |
| 10:30   | 茶歇時間      |              |               |
```

### 智能跨欄功能
- **兩者都有**: Speaker | Moderator (各佔 50%)
- **只有 Speaker**: Speaker 跨整個區域置中 (佔 100%)
- **只有 Moderator**: Moderator 跨整個區域置中 (佔 100%)
- **都沒有**: 不顯示內容

## 📝 開發日誌

### v1.1.0 (2025-08-21) - Excel 議程整合版
**新增功能:**
- ✅ Excel 議程自動解析和匯入功能
- ✅ 議程資料智能轉換系統 (DataConverter)
- ✅ Speaker/Moderator 跨欄置中智能佈局
- ✅ 醫學會議專用模板 (medical_agenda_special)
- ✅ 即時議程海報生成功能

**技術改進:**
- ✅ 新增 `src/logic/dataConverter.ts` - 資料轉換核心
- ✅ 增強 `src/logic/excelParser.ts` - 支持複雜 Excel 格式
- ✅ 改進 `src/logic/posterRenderer.ts` - 跨欄渲染邏輯
- ✅ 擴展 `src/interface/uiController.ts` - 議程載入整合
- ✅ 新增 `src/assets/agendaTypes.ts` - 議程類型定義

**修復問題:**
- ✅ 解決 Excel XLSX 瀏覽器相容性問題 (CDN 載入)
- ✅ 修復 TypeScript 類型不匹配編譯錯誤
- ✅ 優化議程表版面配置和顯示效果
- ✅ 完善議程基本資訊自動填入功能

### v1.0.0 - 基礎版本
- ✅ 基本海報製作功能
- ✅ 多種醫療範本 (肺癌、頭頸癌、子宮體癌等)
- ✅ PNG 圖層支持和操作
- ✅ 自訂配色系統
- ✅ Canvas 渲染引擎

## 🛠️ 技術架構詳細

### 新增檔案結構 (v1.1.0)
```
src/
├── assets/
│   ├── agendaTypes.ts       # 議程資料類型定義 🆕
│   └── types.ts             # 基本類型定義
├── interface/
│   ├── fileUploader.ts      # Excel 檔案上傳處理 🆕
│   ├── uiController.ts      # 主控制器 (增強)
│   └── formControls.ts      # 表單控制
├── logic/
│   ├── dataConverter.ts     # 議程資料轉換器 🆕
│   ├── excelParser.ts       # Excel 解析器 🆕
│   ├── posterRenderer.ts    # 海報渲染器 (增強)
│   └── templates.ts         # 範本系統 (增強)
└── main.ts                   # 應用程式入口
```

### 核心技術特色
- **資料流管線**: Excel → AgendaData → AppState → Canvas 渲染
- **智能解析**: 自動識別 Excel 檔案結構和內容
- **響應式佈局**: 根據內容動態調整版面配置
- **組件化設計**: 每個功能模組獨立且可重用

## 🎯 使用場景

- 醫療會議議程海報製作
- 醫院科室排程表設計
- 醫學研討會宣傳素材
- 臨床培訓課程時間表

## 📝 開發規範

- 遵循 TypeScript 嚴格模式
- 採用模組化設計原則
- 單一責任原則 (SRP)
- 清晰的程式碼註解

## 🔧 專案設定

詳細的 TypeScript 編譯設定請參考 `tsconfig.json`
- 目標版本: ES2020
- 輸出目錄: `./dist`
- 啟用嚴格模式和來源映射

## 📄 授權

ISC License

---

**Made with ❤️ for Medical Community**

## 👥 貢獻指南

### Git 工作流程
```bash
# 克隆專案
git clone [repository-url]
cd medical-agenda-maker

# 安裝依賴
npm install

# 開發模式
npm run dev:serve

# 提交更改
git add .
git commit -m "feat: 新增功能描述"
git push
```

### 程式碼貢獻規範
- 使用 TypeScript 嚴格模式
- 遵循單一職責原則 (SRP)
- 加入適當的程式碼註解
- **重要**: 更新 README.md 記錄重要更改 (Git 時有用處)

## 🔮 未來規劃

### v1.2.0 計劃功能
- 🔄 多樣化議程模板選擇
- 🖼️ 講者照片和 Logo 整合
- 📊 高解析度匯出 (2K/4K)
- 🎨 動態主題配色系統
- 🔄 議程範本儲存/載入

### v1.3.0 遠期目標
- 🌐 Web API 整合 (日曆、地圖等)
- 📧 Email 自動傳送功能
- 📱 行動裝置優化
- 👥 多人協作編輯

---

**最後更新**: 2025-08-21 | **版本**: v1.1.0 | **新增**: Excel 議程整合 + 智能跨欄功能