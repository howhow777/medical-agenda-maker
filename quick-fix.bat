@echo off
echo "🚨 緊急修復 - 清理編譯問題"
echo "=============================="

echo "Step 1: 清理所有編譯輸出和緩存..."
if exist dist rmdir /s /q dist
if exist node_modules\.cache rmdir /s /q node_modules\.cache
echo "清理完成"

echo "Step 2: 使用基本版本進行編譯測試..."
call tsc --noEmit
if %errorlevel% neq 0 (
    echo "❌ 基本版本也有語法錯誤"
    echo "檢查 TypeScript 版本和配置..."
    call tsc --version
    pause
    exit /b 1
)

echo "✅ 語法檢查通過"

echo "Step 3: 完整編譯..."
call tsc
if %errorlevel% neq 0 (
    echo "❌ 完整編譯失敗"
    pause
    exit /b 1
)

echo "✅ 編譯成功！"

echo "Step 4: 檢查關鍵檔案..."
if exist "dist\interface\uiController.js" (
    echo "✅ uiController.js - 存在"
) else (
    echo "❌ uiController.js - 遺失"
)

if exist "dist\interface\cropController-basic.js" (
    echo "✅ cropController-basic.js - 存在"
) else (
    echo "❌ cropController-basic.js - 遺失"
)

echo "Step 5: 啟動測試伺服器..."
echo "正在啟動 http://localhost:3001..."
start cmd /k "cd /d %~dp0 && python -m http.server 3001"

echo "等待伺服器啟動..."
timeout /t 3 /nobreak > nul
start http://localhost:3001

echo ""
echo "📋 快速驗證清單："
echo "=================="
echo "1. ✅ 頁面正常載入（無白屏、無錯誤）"
echo "2. ✅ Console 顯示: 'CropController 基本初始化成功'"
echo "3. ✅ 可以上傳並顯示 PNG 圖層"
echo "4. ✅ 現有的移動/縮放/旋轉功能正常"
echo "5. ✅ 沒有任何 JavaScript 執行錯誤"
echo ""
echo "如果以上都正常，我們就可以進入階段2！"
pause
