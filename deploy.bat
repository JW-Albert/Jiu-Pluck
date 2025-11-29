@echo off
REM Jiu-Pluck 生產環境部署腳本 (Windows)

echo ==========================================
echo Jiu-Pluck 生產環境部署
echo ==========================================

REM 檢查必要命令
python --version >nul 2>&1
if errorlevel 1 (
    echo 錯誤: 未找到 Python
    exit /b 1
)

node --version >nul 2>&1
if errorlevel 1 (
    echo 錯誤: 未找到 Node.js
    exit /b 1
)

set BACKEND_DIR=backend
set FRONTEND_DIR=frontend
set BUILD_DIR=dist

REM 1. 部署 Backend
echo.
echo ==========================================
echo 步驟 1: 部署 Backend
echo ==========================================

cd %BACKEND_DIR%

REM 建立虛擬環境（如果不存在）
if not exist "venv" (
    echo 建立 Python 虛擬環境...
    python -m venv venv
)

REM 啟動虛擬環境
call venv\Scripts\activate.bat

REM 升級 pip
echo 升級 pip...
python -m pip install --upgrade pip

REM 安裝依賴
echo 安裝 Python 依賴...
pip install -r requirements.txt

REM 檢查 .env 檔案
if not exist ".env" (
    echo 錯誤: 未找到 .env 檔案，請先建立並設定環境變數
    exit /b 1
)

REM 檢查必要的環境變數（簡單檢查）
findstr /C:"APP_SECRET_KEY=change_me" .env >nul 2>&1
if not errorlevel 1 (
    echo 警告: APP_SECRET_KEY 使用預設值，請在 .env 中設定安全的密鑰
)

cd ..

REM 2. 建置 Frontend
echo.
echo ==========================================
echo 步驟 2: 建置 Frontend
echo ==========================================

cd %FRONTEND_DIR%

REM 安裝依賴
if not exist "node_modules" (
    echo 安裝 Node.js 依賴...
    call npm install
)

REM 建置生產版本
echo 建置 Frontend 生產版本...
call npm run build

REM 檢查建置結果
if not exist "%BUILD_DIR%" (
    echo 錯誤: Frontend 建置失敗
    exit /b 1
)

echo Frontend 建置完成: %BUILD_DIR%\
cd ..

REM 3. 產生啟動腳本
echo.
echo ==========================================
echo 步驟 3: 產生生產環境啟動腳本
echo ==========================================

(
echo @echo off
echo REM 生產環境啟動腳本
echo.
echo cd backend
echo call venv\Scripts\activate.bat
echo.
echo REM 使用 uvicorn 啟動（生產模式）
echo uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 --log-level info
) > start_production.bat

echo 已產生生產環境啟動腳本: start_production.bat

REM 4. 完成
echo.
echo ==========================================
echo 部署完成！
echo ==========================================
echo.
echo 下一步：
echo 1. 檢查 backend\.env 檔案設定
echo 2. 執行 start_production.bat 啟動服務
echo.
echo Backend API: http://localhost:8000
echo Frontend: 建置在 frontend\dist\ 目錄
echo.
pause

