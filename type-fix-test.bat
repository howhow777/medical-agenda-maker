@echo off
echo 🔧 修復TypeScript類型錯誤...
echo.
echo ✅ 修復內容：
echo - Overlay類型沒有type屬性，改用src檢查
echo - Element類型轉換為HTMLElement
echo - 新增null安全檢查
echo.
echo 🚀 重新編譯測試...
npm run build

if %errorlevel% equ 0 (
    echo.
    echo ✅ 編譯成功！啟動開發伺服器...
    npm run serve
) else (
    echo.
    echo ❌ 編譯失敗，請檢查錯誤訊息
    pause
)
