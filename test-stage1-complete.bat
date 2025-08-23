@echo off
echo "🔧 階段1完整測試"
echo "=================="

echo "Step 1: 清理之前的編譯輸出..."
if exist "dist\interface\cropController.*" (
    del "dist\interface\cropController.*"
    echo "清理完成"
)

echo "Step 2: 編譯 TypeScript..."
call tsc

if %errorlevel% neq 0 (
    echo "❌ 編譯失敗! 檢查語法錯誤..."
    pause
    exit /b 1
)

echo "Step 3: 檢查編譯輸出..."
if exist "dist\interface\cropController.js" (
    echo "✅ cropController.js 編譯成功!"
) else (
    echo "❌ cropController.js 未找到!"
    pause
    exit /b 1
)

if exist "dist\interface\uiController.js" (
    echo "✅ uiController.js 編譯成功!"
) else (
    echo "❌ uiController.js 未找到!"
    pause
    exit /b 1
)

echo "Step 4: 啟動測試服務器..."
echo "正在啟動 http://localhost:3001..."
start cmd /k "cd /d %~dp0 && python -m http.server 3001"

echo "Step 5: 等待並開啟瀏覽器..."
timeout /t 3 /nobreak > nul
start http://localhost:3001

echo ""
echo "📋 階段1測試檢查清單："
echo "====================   "
echo "✅ 基本功能："
echo "  1. 頁面正常載入，無 Console 錯誤"
echo "  2. 可以正常上傳並顯示 PNG 圖層"
echo ""
echo "✅ 裁切UI："
echo "  3. 點擊 PNG 圖層選中後，在PNG控制區域看到 '✂️ 裁切' 按鈕"
echo "  4. 按鈕只在有PNG選中時顯示，無選中時隱藏"
echo ""
echo "✅ 模式切換："
echo "  5. 點擊 '✂️ 裁切' 後按鈕變為 '🚪 退出裁切'"
echo "  6. 裁切模式時出現 '✅ 套用' 和 '❌ 取消' 按鈕"
echo "  7. Canvas 顯示紅色虛線裁切框和 '✂️ 裁切模式' 文字"
echo ""
echo "✅ 現有功能完整性："
echo "  8. PNG 移動功能正常（拖拉圖層中心）"
echo "  9. PNG 縮放功能正常（拖拉圖層角落）" 
echo "  10. PNG 旋轉功能正常（拖拉圖層上方圓點）"
echo "  11. 圖層透明度、顯示/隱藏、層級調整等功能正常"
echo ""
echo "⚠️ 如果任何一項失敗，請立即報告！"
echo ""
pause
