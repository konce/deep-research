# 🚀 Quick Start Guide

快速开始使用 Deep Research Agent 项目

---

## 📍 你在这里

```
/Users/bytedance/repos/claude-agent-sdk-demo/deep-research/
```

---

## ⚡ 最快启动方式

```bash
./start.sh
```

然后访问：
- **Web 界面**: http://localhost:5173
- **API 服务**: http://localhost:3000

---

## 📚 重要文档速查

| 文档 | 用途 | 查看方式 |
|------|------|----------|
| **CLAUDE.md** ⭐ | Claude 的完整项目上下文 | `cat CLAUDE.md` |
| **IMPLEMENTATION_PLAN.md** | 完整 11 天实施计划 | `cat IMPLEMENTATION_PLAN.md` |
| **PROJECT_STATUS.md** | 当前进度和下一步 | `cat PROJECT_STATUS.md` |
| **RECOVERY_GUIDE.md** | 如何恢复工作 | `cat RECOVERY_GUIDE.md` |
| **FILES_LOCATION.md** | 文件位置速查 | `cat FILES_LOCATION.md` |

---

## 🎯 Claude Code Skills

在 Claude Code 中输入以下命令：

```bash
/start       # 启动开发服务器
/status      # 检查项目状态
/db studio   # 打开数据库管理界面
/plan        # 查看实施计划
/plan status # 查看当前状态
/test all    # 运行所有测试
/phase2      # 开始 Phase 2 开发
```

---

## 📊 当前状态

### ✅ Phase 1 完成
- Monorepo 架构
- 数据库设计
- API 框架
- Web 前端
- 完整测试验证

### ⏳ Phase 2 待开始
- Claude Agent SDK 集成
- MCP 工具实现
- Tavily 搜索集成

---

## 🔧 常用命令

### 启动和停止
```bash
pnpm dev                # 启动开发服务器
# Ctrl+C                # 停止服务器
```

### 检查状态
```bash
./check-status.sh       # 完整状态检查
curl http://localhost:3000/health  # API 健康检查
```

### 数据库
```bash
pnpm exec prisma studio          # 可视化管理
pnpm exec prisma db push         # 同步 schema
pnpm exec prisma generate        # 生成 client
```

### 开发
```bash
pnpm build              # 构建所有包
pnpm typecheck          # 类型检查
pnpm lint               # 代码检查
```

---

## 🆘 遇到问题？

### 服务启动失败
```bash
./check-status.sh       # 先检查状态
pnpm install            # 重新安装依赖
```

### 数据库错误
```bash
rm dev.db               # 删除数据库
pnpm exec prisma db push  # 重新创建
```

### 端口被占用
```bash
lsof -i :3000          # 查看占用 3000 端口的进程
lsof -i :5173          # 查看占用 5173 端口的进程
kill -9 <PID>          # 杀死进程
```

---

## 🎓 下一步

### 继续开发
告诉 Claude:
```
"开始 Phase 2 开发，创建 AgentService"
```

或在 Claude Code 中:
```bash
/phase2
```

### 了解更多
```bash
cat CLAUDE.md                   # 完整项目上下文
cat IMPLEMENTATION_PLAN.md      # 详细实施计划
```

---

## 📝 备忘录

### API Keys 需要配置
编辑 `.env` 文件：
```bash
ANTHROPIC_API_KEY=sk-ant-xxx    # Claude API
TAVILY_API_KEY=tvly-xxx         # Tavily 搜索（Phase 2 需要）
```

### 服务 URL
- Web: http://localhost:5173
- API: http://localhost:3000
- Health: http://localhost:3000/health
- DB Studio: http://localhost:5555 (运行 `prisma studio` 后)

---

**快速参考**: 遇到任何问题，运行 `./check-status.sh` 或查看 `CLAUDE.md`

**最后更新**: 2026-01-17
