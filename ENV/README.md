# ENV 目錄

此目錄用於存放環境變數檔案。

## 設定方式

1. 從 `ENV/.env.example` 複製範例檔案：
   ```bash
   cp ENV/.env.example ENV/.env
   ```

2. 編輯 `ENV/.env` 檔案，設定必要的環境變數：
   - **必須設定**：`APP_SECRET_KEY`（用於 JWT 簽章）
   - **可選設定**：SMTP、Google Calendar 等

## 注意事項

- `.env` 檔案包含敏感資訊，不會被 Git 追蹤
- 環境變數檔案應放在專案根目錄的 `ENV/.env`，而不是 `backend/.env`
- Backend 會自動從 `ENV/.env` 讀取環境變數

