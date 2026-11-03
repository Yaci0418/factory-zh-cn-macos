#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo "需要 Node.js 18 或更高版本：https://nodejs.org/"
  read -r -p "按回车退出… " _
  exit 1
fi
echo "请先完全退出 Factory（⌘Q）。安装会备份程序文件并替换官方代码签名。"
read -r -p "确认 Factory 已退出后按回车继续，或按 Ctrl+C 取消… " _
node dist/patcher.cjs install --lang zh --yes --no-launch
echo "安装结束。请手动打开 Factory，选择「设置 → 偏好设置 → 语言 → 简体中文」。"
read -r -p "按回车退出… " _
