#!/bin/bash

# Jiu-Pluck 本地開發環境啟動腳本

set -e

clear

echo "=========================================="
echo "Jiu-Pluck 開發環境啟動"
echo "=========================================="

# 啟動 Backend
echo ""
echo "啟動 Backend..."
cd backend

# 啟動虛擬環境
source venv/bin/activate

    # 建立 ENV 目錄（如果不存在）
    if [ ! -d "ENV" ]; then
        mkdir -p ENV
    fi
    
    # 檢查 .env 檔案
    if [ ! -f "ENV/.env" ]; then
        echo "警告: 未找到 ENV/.env 檔案，從 .env.example 複製..."
        if [ -f ".env.example" ]; then
            cp .env.example ENV/.env
            echo "請編輯 backend/ENV/.env 檔案，至少設定 APP_SECRET_KEY"
        else
            echo "錯誤: 未找到 .env.example 檔案"
            exit 1
        fi
    fi

# 在背景啟動 Backend
echo "啟動 FastAPI 伺服器 (http://localhost:8000)..."
python run.py &
BACKEND_PID=$!
cd ..

# 等待 Backend 啟動
sleep 3

# 啟動 Frontend
echo ""
echo "啟動 Frontend..."
cd frontend

# 檢查 node_modules
if [ ! -d "node_modules" ]; then
    echo "安裝 Node.js 依賴..."
    npm install
fi

# 在背景啟動 Frontend
echo "啟動 Vite 開發伺服器 (http://localhost:5173)..."
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "服務已啟動！"
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "=========================================="
echo ""
echo "按 Ctrl+C 停止所有服務"

# 等待中斷信號
trap "echo ''; echo '正在停止服務...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# 保持腳本運行
wait

