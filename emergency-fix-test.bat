@echo off
echo "🔧 緊急修復測試"
echo "==============="

echo "Step 1: 清理編譯輸出..."
if exist dist\interface\cropController.* del dist\interface\cropController.*
if exist dist\interface\uiController.* del dist\interface\uiController.*

echo "Step 2: 重新編譯..."
call tsc

if %errorlevel% neq 0 (
    echo "❌ 編譯仍然失敗，需要進一步檢查..."
    pause
    exit /b 1
)

echo "✅ 編譯成功!"
echo "Step 3: 檢查輸出檔案..."

if exist dist\interface\cropController.js (
    echo "✅ cropController.js - OK"
) else (
    echo "❌ cropController.js - Missing"
)

if exist dist\interface\uiController.js (
    echo "✅ uiController.js - OK"
) else (
    echo "❌ uiController.js - Missing"
)

echo "Step 4: 啟動測試..."
start cmd /k "cd /d %~dp0 && python -m http.server 3001"
timeout /t 2 /nobreak > nul
start http://localhost:3001

echo ""
echo "快速測試清單:"
echo "1. 頁面載入無錯誤"
echo "2. 上傳PNG檔案"  
echo "3. 選中PNG後看到裁切按鈕"
echo "4. 現有功能正常運作"
pause
