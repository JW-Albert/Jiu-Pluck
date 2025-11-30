#!/bin/bash

# 生產環境啟動腳本（同時啟動前端和後端）

# 注意：不使用 set -e，因為我們需要手動處理錯誤

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 確保前端已建置
if [ ! -d "$PROJECT_ROOT/frontend/dist" ]; then
    echo "前端尚未建置，正在建置..."
    cd "$PROJECT_ROOT/frontend"
    npm run build
fi

# 初始化變數
BACKEND_PID=""
FRONTEND_PID=""

# 清理函數：當腳本退出時殺死所有子進程
cleanup() {
    echo "正在停止服務..."
    [ -n "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null || true
    [ -n "$BACKEND_PID" ] && wait $BACKEND_PID 2>/dev/null || true
    [ -n "$FRONTEND_PID" ] && wait $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# 註冊清理函數
trap cleanup SIGTERM SIGINT EXIT

# 啟動後端（背景執行）
cd "$PROJECT_ROOT/backend"
source venv/bin/activate
echo "啟動後端服務..."
uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --log-level info &
BACKEND_PID=$!

# 等待一下確保後端啟動
sleep 2

# 檢查後端是否成功啟動
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "錯誤: 後端啟動失敗"
    exit 1
fi
echo "後端服務已啟動 (PID: $BACKEND_PID)"

# 啟動前端（背景執行）
cd "$PROJECT_ROOT/frontend"
echo "啟動前端服務..."
npm run preview -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

# 等待一下確保前端啟動
sleep 2

# 檢查前端是否成功啟動
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "錯誤: 前端啟動失敗"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi
echo "前端服務已啟動 (PID: $FRONTEND_PID)"
echo "所有服務已啟動完成"

# 等待所有子進程（循環檢查，直到任一進程退出）
while true; do
    # 檢查進程是否還在運行
    if ! kill -0 $BACKEND_PID 2>/dev/null; then
        echo "後端進程已退出"
        kill $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "前端進程已退出"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done

