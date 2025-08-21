@echo off
echo "=== 修復集合地點預設狀態 ==="
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

echo "2. 測試集合地點預設狀態..."
echo "📝 預期結果:"
echo "   - 集合地點 checkbox 預設為未勾選"
echo "   - 集合地點區域預設隱藏"
echo "   - 手動勾選後功能正常"
echo.

start http://localhost:3001
call npx http-server . -p 3001 -o index.html
