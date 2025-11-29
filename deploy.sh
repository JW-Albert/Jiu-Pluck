#!/bin/bash

# Jiu-Pluck 生產環境部署腳本

set -e

echo "=========================================="
echo "Jiu-Pluck 生產環境部署"
echo "=========================================="

# 安裝 Python3 (包含 pip 和 venv)
echo "安裝 Python3 (包含 pip 和 venv)..."
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv

# 安裝 Node.js
echo "安裝 Node.js..."
sudo apt-get update
sudo apt-get install -y nodejs npm

# 設定變數
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BUILD_DIR="dist"

# 1. 部署 Backend
echo ""
echo "=========================================="
echo "步驟 1: 部署 Backend"
echo "=========================================="

cd $BACKEND_DIR

# 建立虛擬環境的函數
echo "安裝 Python 和 python3-venv..."
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-venv

# 清理舊的虛擬環境（如果存在）
rm -rf venv

echo "建立 Python 虛擬環境..."
python3 -m venv venv

# 驗證是否成功
if [ ! -f "venv/bin/activate" ]; then
    echo "錯誤: 虛擬環境建立失敗"
    return 1
fi

echo "虛擬環境建立成功"
return 0

# 啟動虛擬環境
source venv/bin/activate

# 升級 pip
echo "升級 pip..."
pip install --upgrade pip

# 安裝依賴
echo "安裝 Python 依賴..."
pip install -r requirements.txt

cd ..

# 檢查 ENV/.env 檔案（在專案根目錄）
if [ ! -f "ENV/.env" ]; then
    echo "錯誤: 未找到 ENV/.env 檔案，請先建立並設定環境變數"
    echo "可以從 ENV/.env.example 複製: cp ENV/.env.example ENV/.env"
    exit 1
fi

# 檢查必要的環境變數
if ! grep -q "APP_SECRET_KEY=.*[^=]$" ENV/.env 2>/dev/null || grep -q "APP_SECRET_KEY=change_me" ENV/.env 2>/dev/null; then
    echo "警告: APP_SECRET_KEY 未設定或使用預設值，請在 ENV/.env 中設定安全的密鑰"
fi

cd $BACKEND_DIR

# 初始化資料庫（如果需要）
echo "初始化資料庫..."

rm -f app.db

python -c "
from app.core.database import engine, Base
import asyncio

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

asyncio.run(init_db())
" || echo "警告: 資料庫初始化失敗，請檢查資料庫連線設定"

cd ..

# 2. 建置 Frontend
echo ""
echo "=========================================="
echo "步驟 2: 建置 Frontend"
echo "=========================================="

cd $FRONTEND_DIR

# 安裝依賴
if [ ! -d "node_modules" ]; then
    echo "安裝 Node.js 依賴..."
    npm install
fi

# 建置生產版本
echo "建置 Frontend 生產版本..."
npm run build

# 檢查建置結果
if [ ! -d "$BUILD_DIR" ]; then
    echo "錯誤: Frontend 建置失敗"
    exit 1
fi

echo "Frontend 建置完成: $BUILD_DIR/"

cd ..

# 3. 完成
echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "下一步："
echo "1. 檢查 ENV/.env 檔案設定（在專案根目錄）"
echo "2. 執行 ./boot/start_production.sh 啟動服務（手動啟動）"
echo "3. 或執行 sudo ./boot/setup_service.sh 設定開機自動啟動（需要 boot/jiu-pluck.service 檔案）"
echo ""
echo "Backend API: http://localhost:8000"
echo "Frontend: 建置在 frontend/dist/ 目錄"
echo ""

