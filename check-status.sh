#!/bin/bash

# Deep Research Agent - 状态检查脚本

echo "🔍 Deep Research Agent - 状态检查"
echo ""
echo "============================================"
echo ""

# 1. 检查项目目录
echo "📁 项目目录:"
pwd
echo ""

# 2. 检查依赖
echo "📦 依赖状态:"
if [ -d "node_modules" ]; then
    echo "   ✅ node_modules 已安装"
else
    echo "   ❌ node_modules 未安装 (运行: pnpm install)"
fi
echo ""

# 3. 检查数据库
echo "🗄️  数据库状态:"
if [ -f "dev.db" ]; then
    SIZE=$(ls -lh dev.db | awk '{print $5}')
    echo "   ✅ dev.db 存在 (大小: $SIZE)"
else
    echo "   ❌ dev.db 不存在 (运行: pnpm exec prisma db push)"
fi
echo ""

# 4. 检查关键配置文件
echo "⚙️  配置文件:"
if [ -f ".env" ]; then
    echo "   ✅ .env 存在"
else
    echo "   ❌ .env 不存在 (复制: cp .env.example .env)"
fi

if [ -f "package.json" ]; then
    echo "   ✅ package.json 存在"
fi

if [ -f "prisma/schema.prisma" ]; then
    echo "   ✅ prisma/schema.prisma 存在"
fi
echo ""

# 5. 检查运行中的服务
echo "🚀 运行中的服务:"
API_RUNNING=$(ps aux | grep "tsx watch" | grep -v grep | wc -l)
WEB_RUNNING=$(ps aux | grep "vite" | grep -v grep | wc -l)

if [ $API_RUNNING -gt 0 ]; then
    echo "   ✅ API 服务器运行中"
else
    echo "   ⚪ API 服务器未运行"
fi

if [ $WEB_RUNNING -gt 0 ]; then
    echo "   ✅ Web 前端运行中"
else
    echo "   ⚪ Web 前端未运行"
fi
echo ""

# 6. 测试端点（如果服务在运行）
if [ $API_RUNNING -gt 0 ]; then
    echo "🌐 API 端点测试:"
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        STATUS=$(curl -s http://localhost:3000/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        echo "   ✅ http://localhost:3000/health - Status: $STATUS"
    else
        echo "   ❌ http://localhost:3000/health - 无响应"
    fi
    echo ""
fi

if [ $WEB_RUNNING -gt 0 ]; then
    echo "🌐 Web 前端测试:"
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo "   ✅ http://localhost:5173 - 正常"
    else
        echo "   ❌ http://localhost:5173 - 无响应"
    fi
    echo ""
fi

# 7. 检查文档
echo "📚 项目文档:"
if [ -f "PROJECT_STATUS.md" ]; then
    echo "   ✅ PROJECT_STATUS.md - 项目状态"
fi
if [ -f "IMPLEMENTATION_PLAN.md" ]; then
    echo "   ✅ IMPLEMENTATION_PLAN.md - 实施计划"
fi
if [ -f "README.md" ]; then
    echo "   ✅ README.md - 项目说明"
fi
echo ""

# 8. 快速命令提示
echo "💡 快速命令:"
echo "   启动: ./start.sh 或 pnpm dev"
echo "   构建: pnpm build"
echo "   测试: pnpm typecheck"
echo "   数据库: pnpm exec prisma studio"
echo ""

echo "============================================"
echo "✅ 状态检查完成"
