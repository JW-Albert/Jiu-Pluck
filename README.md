# Jiu-Pluck - 大學生揪出門平台

**版本**: 1.0.1  
**授權**: MIT

一個支援私人揪團和公開活動的大學生社交平台，整合課表、行事曆和 Discord 通知功能。

## 功能特色

- **使用者認證**：JWT 認證、Email 驗證
- **私人房間**：建立房間，邀請朋友一起揪團
- **公開活動**：瀏覽和報名公開活動
- **課表管理**：管理個人課表，自動計算空堂時間
- **行事曆同步**：支援 Google Calendar 和 Apple Calendar (CalDAV)
- **Discord 通知**：房間活動自動推送到 Discord

## 技術棧

### Backend
- Python 3.11+
- FastAPI
- SQLite + SQLAlchemy + Alembic
- JWT 認證
- Pydantic 資料驗證

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Query
- React Router

## 快速開始

### 使用啟動腳本（推薦）

**Linux/Mac:**
```bash
./run.sh
```

腳本會自動：
- 建立並啟動 Python 虛擬環境
- 安裝所有依賴
- 啟動 Backend (http://localhost:8000)
- 啟動 Frontend (http://localhost:5173)

### 手動啟動

#### Backend

1. 進入 backend 目錄：
```bash
cd backend
```

2. 建立虛擬環境：
```bash
python -m venv venv
source venv/bin/activate
```

3. 安裝依賴：
```bash
pip install -r requirements.txt
```

4. 複製環境變數範例檔案：
```bash
cp ENV/.env.example ENV/.env
```

5. 編輯 `ENV/.env` 檔案（在專案根目錄），設定必要的環境變數（至少設定 `APP_SECRET_KEY`）

6. 啟動伺服器：
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

或使用提供的腳本：
```bash
python run.py
```

#### Frontend

1. 進入 frontend 目錄：
```bash
cd frontend
```

2. 安裝依賴：
```bash
npm install
```

3. 啟動開發伺服器：
```bash
npm run dev
```

前端將在 http://localhost:5173 運行，並自動代理 API 請求到後端。

### 生產環境部署

**Linux/Mac:**
```bash
./deploy.sh
```

部署腳本會：
- 安裝所有依賴
- 建置 Frontend 生產版本

## 專案結構

```
.
├── ENV/
│   ├── .env              # 環境變數檔案（在專案根目錄）
│   └── .env.example      # 環境變數範例檔案
├── boot/
│   ├── start_production.sh      # 生產環境啟動腳本
│   ├── setup_service.sh         # 開機自動啟動設定腳本
│   └── jiu-pluck.service        # systemd service 檔案
├── backend/
│   ├── app/
│   │   ├── api/          # API 路由
│   │   ├── core/         # 核心設定（config, security, database）
│   │   ├── models/       # SQLAlchemy 模型
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # 業務邏輯
│   │   └── main.py       # FastAPI 應用入口
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── api/          # API clients
    │   ├── components/   # React 元件
    │   ├── pages/        # 頁面元件
    │   ├── hooks/        # Custom hooks
    │   └── styles/       # 樣式檔案
    ├── package.json
    └── vite.config.ts
```

## 環境變數說明

### Backend (ENV/.env)

- `APP_SECRET_KEY`: JWT 簽章金鑰（必須）
- `DATABASE_URL`: 資料庫連線字串
- `ADMIN_EMAIL`: Admin 帳號 Email（建議設定，系統啟動時會自動建立，登入使用 OTP）
- `SMTP_*`: Email 發送設定（必須，用於發送登入 OTP 和驗證碼）
- `GOOGLE_*`: Google Calendar OAuth 設定（可選）

詳細說明請參考 `ENV/.env.example`

**注意**: 環境變數檔案應放在專案根目錄的 `ENV/.env`，範例檔案在 `ENV/.env.example`

## 開發注意事項

1. **資料庫 Migration**：目前使用 SQLAlchemy 自動建立表，後續可使用 Alembic 進行 migration 管理。

2. **Google/Apple Calendar 整合**：目前為 stub 實作，需要後續補完：
   - Google Calendar: 需要安裝 `google-auth`, `google-api-python-client` 等套件
   - Apple Calendar: 需要安裝 `caldav` 套件

3. **Email 驗證**：開發環境下，驗證碼會直接印在 console，生產環境需要設定 SMTP。

4. **Discord Webhook**：需要在 Discord 伺服器建立 Webhook，並將 URL 設定到房間中。

5. **開機自動啟動**：執行 `sudo ./boot/setup_service.sh` 設定 systemd 服務，服務將在開機時自動啟動。

## TODO

- [ ] 實作 Google Calendar OAuth 流程
- [ ] 實作 Apple Calendar CalDAV 連線
- [ ] 完善課表模板資料
- [ ] 實作房間邀請機制
- [ ] 優化前端 UI/UX
- [ ] 加入單元測試
- [ ] 實作 Alembic migration
- [ ] 加入 Docker 支援

## License

本專案採用 MIT 授權。詳見根目錄的 LICENSE 檔案。
