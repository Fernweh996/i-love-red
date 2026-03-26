#!/bin/bash
# 部署脚本: 在服务器上运行此脚本

set -e

echo "📦 安装依赖..."
npm install --production -w server

echo "🚀 启动服务..."
# 使用 PORT 环境变量，默认 3001
export PORT=${PORT:-3001}

# 如果已有进程在跑，先停掉
pkill -f "node server/dist/index.js" 2>/dev/null || true

# 后台启动，日志写到 fund-manager.log
nohup node server/dist/index.js > fund-manager.log 2>&1 &

echo "✅ 服务已启动: http://localhost:$PORT"
echo "📋 日志: tail -f fund-manager.log"
