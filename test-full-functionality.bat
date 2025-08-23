@echo off
echo "🎯 恢復完整裁切功能"
echo "=================="

echo "Step 1: 編譯完整功能版本..."
call tsc

if %errorlevel% neq 0 (
    echo "❌ 編譯失敗"
    pause
    exit /b 1
)

echo "✅ 編譯成功!"

echo "Step 2: 檢查關鍵檔案..."
if exist "dist\interface\cropController-full.js" (
    echo "✅ cropController-full.js 已生成"
) else (
    echo "❌ cropController-full.js 遺失"
)

echo "Step 3: 啟動測試..."
start cmd /k "cd /d %~dp0 && python -m http.server 3001"
timeout /t 2 /nobreak > nul
start http://localhost:3001

echo ""
echo "📋 完整功能測試清單："
echo "===================="
echo "✅ 基本功能："
echo "  1. 頁面正常載入，Console 顯示 'CropController 完整功能初始化完成'"
echo ""
echo "✅ 裁切按鈕顯示："
echo "  2. 上傳 PNG 檔案"
echo "  3. 點擊 PNG 圖層選中（會有選取框）"
echo "  4. 在 PNG 控制區域看到 '✂️ 裁切' 按鈕出現"
echo "  5. 點擊其他地方取消選取，裁切按鈕消失"
echo ""
echo "✅ 裁切模式："
echo "  6. 選中 PNG 後點擊 '✂️ 裁切' 按鈕"
echo "  7. 按鈕變為 '🚪 退出裁切'"
echo "  8. 出現 '✅ 套用' 和 '❌ 取消' 按鈕"
echo "  9. Canvas 上顯示紅色虛線裁切框"
echo "  10. PNG 上方顯示 '✂️ 裁切模式' 文字"
echo ""
echo "✅ Console 輸出："
echo "  - 詳細的操作日誌，幫助除錯"
echo ""
echo "如果功能正常，我們就成功完成階段1！"
pause
