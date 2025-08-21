@echo off
echo "=== 回退到簡單版本測試 ==="
echo.

echo "1. 編譯 TypeScript..."
call tsc
if %errorlevel% neq 0 (
    echo "❌ 編譯失敗! 檢查語法錯誤"
    pause
    exit /b 1
)
echo "✅ 編譯成功!"
echo.

echo "2. 啟動基本功能測試..."
echo "📝 測試目標:"
echo "   1. 確認基本 Excel 解析恢復正常"
echo "   2. 檢查 Speaker/Moderator 是否重新顯示"
echo "   3. 觀察 Console 中的簡化除錯日誌"
echo.
echo "🔍 Console 中應該看到:"
echo "   - 找到表格標題行"
echo "   - 每行的解析過程"
echo "   - Speaker/Moderator 的最終結果"
echo.

start http://localhost:3001
call npx http-server . -p 3001 -o index.html
