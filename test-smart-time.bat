@echo off
echo "=== 智能時間邏輯測試 ==="
echo.

echo "1. 編譯 TypeScript..."
call tsc
if %errorlevel% neq 0 (
    echo "❌ 編譯失敗!"
    pause
    exit /b 1
)
echo "✅ 編譯成功!"
echo.

echo "2. 測試智能時間邏輯..."
echo "📝 測試場景:"
echo "   場景1: 首次載入 → 顯示當前時間預設值"
echo "   場景2: 上傳Excel → Excel時間覆蓋預設值"
echo "   場景3: 手動修改時間 → 保護不被覆蓋"
echo "   場景4: 修改後再上傳Excel → 時間不變"
echo.
echo "🔍 觀察 Console 中的時間處理日誌"
echo.

start http://localhost:3002
call npx http-server . -p 3002 -o index.html
