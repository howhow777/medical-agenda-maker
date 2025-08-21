@echo off
echo "=== 預設值更新測試 ==="
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

echo "2. 測試預設值更新..."
echo "📝 預期結果:"
echo "   - 副標題預設為 '癌症治療醫學研討會'"
echo "   - 模板切換時顯示 '癌症治療醫學研討會'"
echo "   - 時間預設為當前時間+4小時"
echo "   - 用戶修改時間後不會被覆蓋"
echo.
echo "🧪 測試步驟:"
echo "   1. 檢查初始副標題和時間"
echo "   2. 修改時間後重新整理，確認不被覆蓋"
echo "   3. 上傳 Excel 檔案，確認時間不被覆蓋"
echo "   4. 切換模板，確認副標題正確更新"
echo.

start http://localhost:3001
call npx http-server . -p 3001 -o index.html
