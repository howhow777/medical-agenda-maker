@echo off
echo 🌐 啟動區網測試服務...
echo.
echo 📱 手機訪問步驟：
echo 1. 確保手機與電腦在同一WiFi網路
echo 2. 查看下方顯示的IP地址
echo 3. 手機瀏覽器輸入：http://[IP地址]:3001
echo 4. 開啟F12除錯（手機Chrome：三點選單→更多工具→開發者工具）
echo.

:: 獲取本機IP地址
for /f "tokens=2 delims=:" %%i in ('ipconfig ^| findstr /C:"IPv4 地址" ^| findstr /C:"192.168"') do (
    set IP=%%i
    set IP=!IP: =!
)

if defined IP (
    echo 🎯 電腦IP地址：%IP%
    echo 📱 手機訪問網址：http://%IP%:3001
    echo ⚡ 電腦本地網址：http://127.0.0.1:3001
) else (
    echo ⚠️ 未找到區網IP，請手動查看ipconfig結果
    ipconfig | findstr "IPv4"
)

echo.
echo 🚀 正在啟動服務...

npm start
