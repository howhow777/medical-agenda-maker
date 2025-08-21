@echo off
echo "=== 副標題修復測試 ==="
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

echo "2. 啟動測試服務..."
echo "📝 測試步驟:"
echo "   1. 上傳提供的 Excel 檔案"
echo "   2. 檢查副標題是否保持為 '肺癌治療新進展論壇'"
echo "   3. 確認不會被錯誤設定為地點名稱"
echo.

start http://localhost:3001
call npx http-server . -p 3001 -o index.html
