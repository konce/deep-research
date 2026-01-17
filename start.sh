#!/bin/bash

# Deep Research Agent - 快速启动脚本

echo "🚀 Deep Research Agent - 启动中..."
echo ""

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "❌ 错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，安装依赖..."
    pnpm install
    echo ""
fi

# 检查 Prisma Client 是否生成
if [ ! -d "node_modules/.pnpm/@prisma+client@6.1.0_prisma@6.1.0/node_modules/.prisma" ]; then
    echo "🗄️  生成 Prisma Client..."
    pnpm exec prisma generate
    echo ""
fi

# 检查数据库是否存在
if [ ! -f "dev.db" ]; then
    echo "🗄️  初始化数据库..."
    pnpm exec prisma db push
    echo ""
fi

echo "✅ 准备完成！"
echo ""
echo "📍 启动开发服务器..."
echo "   - API: http://localhost:3000"
echo "   - Web: http://localhost:5173"
echo ""
echo "💡 按 Ctrl+C 停止服务器"
echo ""

# 启动开发服务器
pnpm dev
