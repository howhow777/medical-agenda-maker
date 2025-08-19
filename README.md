# 醫療議程製作器 (Medical Agenda Maker)

🏥 **智慧醫療排程管理工具** - 專為醫療會議與排程設計的互動式海報製作器

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