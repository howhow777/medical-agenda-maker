@echo off
echo "=== Excel 跨欄合併解析修復測試 ==="
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

echo "2. 啟動除錯測試..."
echo "📝 測試重點:"
echo "   1. 上傳包含跨欄合併的 Excel 檔案"
echo "   2. 檢查 F12 Console 中的詳細解析日誌"
echo "   3. 確認 Speaker 和 Moderator 都正確解析"
echo "   4. 驗證跨欄內容正確處理"
echo.
echo "🔍 關注 Console 中的："
echo "   - XLSX 原始解析結果"
echo "   - 表格結構檢測"
echo "   - 每行的詳細分析"
echo "   - 跨欄檢測結果"
echo.

start http://localhost:3001
call npx http-server . -p 3001 -o index.html
