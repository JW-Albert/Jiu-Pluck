@echo off
REM Jiu-Pluck 本地開發環境啟動腳本 (Windows)

echo ==========================================
echo Jiu-Pluck 開發環境啟動
echo ==========================================

REM 檢查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo 錯誤: 未找到 Python，請先安裝 Python 3.11+
    exit /b 1
)

REM 檢查 Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo 錯誤: 未找到 Node.js，請先安裝 Node.js
    exit /b 1
)

REM 啟動 Backend
echo.
echo 啟動 Backend...
cd backend

REM 檢查虛擬環境
if not exist "venv" (
    echo 建立 Python 虛擬環境...
    python -m venv venv
)

REM 啟動虛擬環境
call venv\Scripts\activate.bat

REM 安裝依賴
if not exist ".deps_installed" (
    echo 安裝 Python 依賴...
    pip install -r requirements.txt
    echo. > .deps_installed
)

REM 檢查 .env 檔案
if not exist ".env" (
    echo 警告: 未找到 .env 檔案，從 .env.example 複製...
    if exist ".env.example" (
        copy .env.example .env
        echo 請編輯 backend\.env 檔案，至少設定 APP_SECRET_KEY
    ) else (
        echo 錯誤: 未找到 .env.example 檔案
        exit /b 1
    )
)

REM 在背景啟動 Backend
echo 啟動 FastAPI 伺服器 (http://localhost:8000)...
start "Jiu-Pluck Backend" cmd /k "python run.py"
cd ..

REM 等待 Backend 啟動
timeout /t 3 /nobreak >nul

REM 啟動 Frontend
echo.
echo 啟動 Frontend...
cd frontend

REM 檢查 node_modules
if not exist "node_modules" (
    echo 安裝 Node.js 依賴...
    call npm install
)

REM 在背景啟動 Frontend
echo 啟動 Vite 開發伺服器 (http://localhost:5173)...
start "Jiu-Pluck Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ==========================================
echo 服務已啟動！
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo ==========================================
echo.
echo 按任意鍵關閉此視窗（服務將繼續運行）
pause >nul

