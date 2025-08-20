# 🛠️ 醫療議程製作器 - 開發工具

此資料夾包含專案開發過程中使用的各種工具、腳本和臨時檔案。

## 📂 資料夾結構

### 🚀 scripts/
包含開發過程中使用的批次檔腳本：

- `compile-fix.bat` - 編譯修復腳本
- `compile-test.bat` - 編譯測試腳本  
- `fix-and-start.bat` - 修復並啟動腳本

**使用方式**：
```bash
# Windows 環境下直接執行
cd dev-tools/scripts
./compile-fix.bat
```

### 📦 temp-files/
包含開發過程中的臨時檔案和備份：

- `compile-test-template.ts` - 編譯測試模板
- `formControls_temp_backup.ts` - formControls 備份檔案
- `test-compile.ts` - 編譯測試檔案
- `type-check-test.ts` - 型別檢查測試
- `temp_delete_marker.txt` - 臨時刪除標記檔案

## ⚠️ 注意事項

### 🗑️ 臨時檔案清理
`temp-files/` 資料夾中的檔案為開發過程中的臨時產物，可以定期清理：

```bash
# 清理臨時檔案（保留資料夾結構）
rm -rf dev-tools/temp-files/*
```

### 🚫 Git 忽略設定
這些檔案通常不需要追蹤到版本控制中，建議在 `.gitignore` 中添加：

```gitignore
# 開發工具臨時檔案
dev-tools/temp-files/
dev-tools/scripts/*.log
```

### 🔧 腳本執行權限
在 Linux/Mac 環境下，可能需要給腳本執行權限：

```bash
chmod +x dev-tools/scripts/*.bat
```

## 🎯 工具用途

這些工具主要用於：
- 🔨 **快速編譯** - 一鍵編譯和錯誤修復
- 🧪 **開發測試** - 快速驗證程式碼變更
- 💾 **檔案備份** - 重要修改前的安全備份
- 🐛 **問題除錯** - 隔離問題和測試解決方案

## 🚀 常用指令

### 開發環境啟動
```bash
# 返回專案根目錄
cd ../..

# 標準啟動方式
npm start

# 開發模式（自動重編譯）
npm run dev:serve
```

### 編譯相關
```bash
# 手動編譯
npm run build

# 清理並重建
npm run clean && npm run build
```

---

**建立時間**: 2025年8月20日  
**維護者**: howhow777  
**專案**: Medical Agenda Maker v1.0  
**用途**: 開發工具和臨時檔案管理
