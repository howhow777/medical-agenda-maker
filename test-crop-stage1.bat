@echo off
echo "🔧 階段1測試 - 裁切按鈕UI擴展"
echo "======================================"

echo "Step 1: 編譯TypeScript..."
call tsc
if %errorlevel% neq 0 (
    echo "❌ TypeScript編譯失敗!"
    pause
    exit /b 1
)

echo "✅ TypeScript編譯成功!"
echo ""
echo "Step 2: 啟動測試服務器..."
start cmd /k "cd /d %~dp0 && python -m http.server 3001"

echo "Step 3: 等待3秒後開啟瀏覽器..."
timeout /t 3 /nobreak > nul
start http://localhost:3001

echo ""
echo "📋 測試清單："
echo "1. 頁面正常載入，無JavaScript錯誤"
echo "2. 上傳PNG檔案後，在視覺設計區域看到裁切按鈕"
echo "3. 點擊PNG選中後，裁切按鈕變為可見"
echo "4. 點擊 '✂️ 裁切' 按鈕後，按鈕文字變為 '🚪 退出裁切'"
echo "5. 裁切模式下出現 '✅ 套用' 和 '❌ 取消' 按鈕"
echo "6. Canvas上顯示紅色虛線裁切框和 '✂️ 裁切模式' 文字"
echo "7. 現有的PNG變形功能(移動/縮放/旋轉)完全不受影響"
echo ""
echo "⚠️ 如果發現任何問題，請立即按Ctrl+C中止測試"
pause
