@echo off
echo "=== 醫療會議海報製作器 - 集合地點功能除錯 ==="
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

echo "2. 啟動開發服務..."
echo "🌐 服務將在 http://localhost:3001 啟動"
echo "📝 請在瀏覽器中:"
echo "   1. 打開 F12 開發者工具"
echo "   2. 切換到 Console 標籤"
echo "   3. 測試集合地點功能"
echo.

start http://localhost:3001
call npx http-server . -p 3001 -o index.html
