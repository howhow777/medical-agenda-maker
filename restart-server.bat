@echo off
echo "=== 停止佔用 Port 3001 的服務 ==="
echo.

echo "1. 查找佔用 Port 3001 的程序..."
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001"') do (
    echo "發現程序 PID: %%a"
    taskkill /f /pid %%a >nul 2>&1
    if errorlevel 1 (
        echo "  無法停止 PID %%a (可能已關閉)"
    ) else (
        echo "  ✅ 已停止 PID %%a"
    )
)

echo.
echo "2. 等待2秒..."
timeout /t 2 /nobreak >nul

echo.
echo "3. 重新啟動服務..."
call npm start
