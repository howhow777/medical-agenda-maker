@echo off
echo "🚀 階段2：拖拉裁切功能測試"
echo "============================"

echo "Step 1: 編譯階段2版本..."
call tsc

if %errorlevel% neq 0 (
    echo "❌ 編譯失敗"
    pause
    exit /b 1
)

echo "✅ 編譯成功!"

echo "Step 2: 啟動測試服務..."
start cmd /k "cd /d %~dp0 && python -m http.server 3001"
timeout /t 2 /nobreak > nul
start http://localhost:3001

echo ""
echo "🎯 階段2完整功能測試清單："
echo "==========================="
echo ""
echo "✅ 基本功能（從階段1繼承）："
echo "  1. PNG選中時出現裁切按鈕"
echo "  2. 點擊裁切按鈕進入裁切模式" 
echo "  3. 顯示紅色虛線框和半透明遮罩"
echo ""
echo "🆕 階段2新功能 - 拖拉裁切："
echo "  4. 看到4個白色圓點推桿（上下左右邊界中點）"
echo "  5. 滑鼠懸停推桿時游標變為調整大小樣式"
echo "     - 上/下推桿：↕ (n-resize/s-resize)"
echo "     - 左/右推桿：↔ (w-resize/e-resize)"
echo "  6. 拖拉推桿可調整裁切區域"
echo "  7. 裁切區域即時更新，推桿跟著移動"
echo "  8. 裁切區域被限制在圖片邊界內"
echo "  9. 最小裁切尺寸：10x10 像素"
echo ""
echo "🔍 Console 除錯資訊："
echo "  - '🎯 裁切推桿被點擊: top/right/bottom/left'"
echo "  - '📐 裁切區域更新: {x, y, w, h}'"
echo "  - '✅ 裁切拖拉結束'"
echo ""
echo "📱 觸控支援："
echo "  - 手機上也可以拖拉推桿調整裁切區域"
echo ""
echo "⚠️ 重要測試項目："
echo "  - 確認現有PNG變形功能不受影響"
echo "  - 裁切模式和變形模式不會互相干擾"
echo "  - 拖拉裁切推桿時，不會觸發PNG移動/縮放"
echo ""
echo "如果以上功能都正常，階段2就成功完成了！"
echo "接下來階段3會實作真正的圖片裁切和套用功能。"
pause
