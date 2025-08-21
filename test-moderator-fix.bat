@echo off
echo "=== 修復 Moderator 欄位索引 ==="
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

echo "2. 測試 Moderator 修復..."
echo "📝 預期結果:"
echo "   - Speaker 正常顯示 (row[2])"
echo "   - Moderator 重新出現 (row[4])"
echo "   - 海報顯示完整的 Speaker/Moderator 資訊"
echo.
echo "🔍 Console 中應該看到:"
echo "   [4] Moderator: 正確的主持人名稱"
echo "   最終結果: Moderator=有內容而非undefined"
echo.

start http://localhost:3001
call npx http-server . -p 3001 -o index.html
