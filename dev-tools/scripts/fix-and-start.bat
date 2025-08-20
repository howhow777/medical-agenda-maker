@echo off
echo ===== 修正編譯錯誤並重新編譯 =====
echo.

echo 🔧 清理舊的編譯檔案...
rmdir /s /q dist 2>nul
echo.

echo 🏗️ 編譯 TypeScript...
npx tsc

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ 編譯成功！
    echo.
    echo 🎯 修正內容：
    echo    • 移除重複的 bindCropperEvents 方法
    echo    • PNG 旋轉同步問題已修正
    echo    • 裁切功能已實現完整控制點
    echo.
    echo 🚀 啟動開發伺服器...
    start /B npx http-server . -p 3000 -o public/index.html
    echo.
    echo 📝 測試步驟：
    echo    1. 上傳 PNG 圖片
    echo    2. 測試旋轉是否同步
    echo    3. 點擊「裁切」按鈕測試裁切功能
    echo.
    echo ✅ 伺服器已啟動在 http://localhost:3000
) else (
    echo.
    echo ❌ 編譯失敗，請檢查錯誤訊息
    pause
)
