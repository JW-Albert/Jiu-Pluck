#!/bin/bash

# Jiu-Pluck systemd 服務設定腳本
# 用於設定開機自動啟動

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVICE_NAME="jiu-pluck"
SERVICE_FILE="$PROJECT_ROOT/boot/$SERVICE_NAME.service"
SYSTEMD_PATH="/etc/systemd/system/$SERVICE_NAME.service"

echo "=========================================="
echo "Jiu-Pluck systemd 服務設定"
echo "=========================================="

# 檢查是否為 root
if [ "$EUID" -ne 0 ]; then
    echo "錯誤: 此腳本需要 root 權限執行"
    echo "請使用: sudo ./boot/setup_service.sh"
    exit 1
fi

# 檢查 service 檔案是否存在
if [ ! -f "$SERVICE_FILE" ]; then
    echo "錯誤: 找不到服務檔案: $SERVICE_FILE"
    exit 1
fi

# 讀取專案路徑並替換檔案中的變數
echo "產生 systemd service 檔案..."
sed "s|PROJECT_ROOT|$PROJECT_ROOT|g" "$SERVICE_FILE" > "$SYSTEMD_PATH"

# 設定正確的權限
chmod 644 "$SYSTEMD_PATH"

echo "已建立服務檔案: $SYSTEMD_PATH"

# 重新載入 systemd
echo "重新載入 systemd daemon..."
systemctl daemon-reload

# 啟用服務（開機自動啟動）
echo "啟用服務（開機自動啟動）..."
systemctl enable $SERVICE_NAME

# 詢問是否立即啟動服務
read -p "是否立即啟動服務？(y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "啟動服務..."
    systemctl start $SERVICE_NAME
    echo "服務已啟動"
    
    # 顯示服務狀態
    echo ""
    echo "服務狀態："
    systemctl status $SERVICE_NAME --no-pager -l
else
    echo "服務已設定但未啟動"
    echo "使用以下命令啟動服務："
    echo "  sudo systemctl start $SERVICE_NAME"
fi

echo ""
echo "=========================================="
echo "設定完成！"
echo "=========================================="
echo ""
echo "常用命令："
echo "  啟動服務:   sudo systemctl start $SERVICE_NAME"
echo "  停止服務:   sudo systemctl stop $SERVICE_NAME"
echo "  重啟服務:   sudo systemctl restart $SERVICE_NAME"
echo "  查看狀態:   sudo systemctl status $SERVICE_NAME"
echo "  查看日誌:   sudo journalctl -u $SERVICE_NAME -f"
echo "  停用開機啟動: sudo systemctl disable $SERVICE_NAME"
echo ""

