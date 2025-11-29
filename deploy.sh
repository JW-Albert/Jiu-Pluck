#!/bin/bash

# Jiu-Pluck 生產環境部署腳本

set -e

echo "=========================================="
echo "Jiu-Pluck 生產環境部署"
echo "=========================================="

# 檢查必要命令
if ! command -v python3 &> /dev/null; then
    echo "錯誤: 未找到 python3"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "錯誤: 未找到 node"
    exit 1
fi

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

# 建立虛擬環境（如果不存在）
if [ ! -d "venv" ]; then
    echo "建立 Python 虛擬環境..."
    python3 -m venv venv
fi

# 啟動虛擬環境
source venv/bin/activate

# 升級 pip
echo "升級 pip..."
pip install --upgrade pip

# 安裝依賴
echo "安裝 Python 依賴..."
pip install -r requirements.txt

# 檢查 .env 檔案
if [ ! -f ".env" ]; then
    echo "錯誤: 未找到 .env 檔案，請先建立並設定環境變數"
    exit 1
fi

# 檢查必要的環境變數
if ! grep -q "APP_SECRET_KEY=.*[^=]$" .env 2>/dev/null || grep -q "APP_SECRET_KEY=change_me" .env 2>/dev/null; then
    echo "警告: APP_SECRET_KEY 未設定或使用預設值，請在 .env 中設定安全的密鑰"
fi

# 初始化資料庫（如果需要）
echo "初始化資料庫..."
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

# 3. 產生啟動腳本
echo ""
echo "=========================================="
echo "步驟 3: 產生生產環境啟動腳本"
echo "=========================================="

cat > start_production.sh << 'EOF'
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
EOF

chmod +x start_production.sh

# 4. 產生 systemd service 檔案範例（可選）
echo ""
echo "=========================================="
echo "步驟 4: 產生 systemd service 檔案範例"
echo "=========================================="

cat > jiu-pluck.service.example << EOF
[Unit]
Description=Jiu-Pluck API Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=$(pwd)/backend
Environment="PATH=$(pwd)/backend/venv/bin"
ExecStart=$(pwd)/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "已產生 systemd service 檔案範例: jiu-pluck.service.example"
echo "如需使用，請複製到 /etc/systemd/system/ 並修改設定"

# 5. 產生 Nginx 設定檔範例（可選）
echo ""
echo "=========================================="
echo "步驟 5: 產生 Nginx 設定檔範例"
echo "=========================================="

cat > nginx.conf.example << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (靜態檔案)
    location / {
        root /path/to/Jiu-Pluck/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

echo "已產生 Nginx 設定檔範例: nginx.conf.example"

# 6. 完成
echo ""
echo "=========================================="
echo "部署完成！"
echo "=========================================="
echo ""
echo "下一步："
echo "1. 檢查 backend/.env 檔案設定"
echo "2. 執行 ./start_production.sh 啟動服務"
echo "3. 或使用 systemd service (參考 jiu-pluck.service.example)"
echo "4. 設定 Nginx (參考 nginx.conf.example)"
echo ""
echo "Backend API: http://localhost:8000"
echo "Frontend: 建置在 frontend/dist/ 目錄"
echo ""

