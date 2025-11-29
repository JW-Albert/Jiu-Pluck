#!/bin/bash

# 生產環境啟動腳本

set -e

cd backend
source venv/bin/activate

# 使用 uvicorn 啟動（生產模式）
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --log-level info

