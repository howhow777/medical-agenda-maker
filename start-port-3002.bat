@echo off
echo "=== 使用 Port 3002 啟動服務 ==="
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

echo "2. 啟動服務在 Port 3002..."
echo "🌐 服務將在 http://localhost:3002 啟動"
echo.

start http://localhost:3002
call npx http-server . -p 3002 -o index.html
