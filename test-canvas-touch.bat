@echo off
echo ========================================
echo   Canvas 觸控除錯測試
echo ========================================

echo 🔄 編譯 TypeScript...
call tsc
if errorlevel 1 (
    echo ❌ 編譯失敗！
    pause
    exit /b 1
)

echo ✅ 編譯成功！

echo 🚀 啟動測試服務器...
echo.
echo 📱 測試步驟：
echo 1. 在手機瀏覽器開啟 http://localhost:3001
echo 2. 點擊除錯面板的「啟動」按鈕
echo 3. 測試 Canvas 區域的觸控操作
echo 4. 觀察除錯資訊和 Console 日誌
echo.

start http://localhost:3001
npx http-server -p 3001
