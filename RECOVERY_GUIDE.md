# 🔄 恢复指南 - Deep Research Agent

## 快速回答你的问题

### Q: 计划都存到哪里了？

**主计划文件（Claude 存储）：**
```
/Users/bytedance/.claude/plans/resilient-imagining-lemon.md
```

**项目备份（推荐使用）：**
```
/Users/bytedance/repos/claude-agent-sdk-demo/deep-research/IMPLEMENTATION_PLAN.md
```

这两个文件内容相同，建议使用项目备份版本，因为它会随项目一起保存。

### Q: 下次如何恢复？

**方式 1: 一键启动（最简单）**
```bash
cd /Users/bytedance/repos/claude-agent-sdk-demo/deep-research
./start.sh
```

**方式 2: 手动启动**
```bash
cd /Users/bytedance/repos/claude-agent-sdk-demo/deep-research
pnpm dev
```

**方式 3: 从头恢复（重启电脑后）**
```bash
cd /Users/bytedance/repos/claude-agent-sdk-demo/deep-research
pnpm install          # 安装依赖
pnpm exec prisma generate  # 生成 Prisma Client
pnpm exec prisma db push   # 同步数据库
pnpm dev              # 启动服务
```

---

## 📂 完整文件清单

### 计划和文档（最重要！）

| 文件 | 位置 | 说明 |
|------|------|------|
| **主实施计划** | `/Users/bytedance/.claude/plans/resilient-imagining-lemon.md` | Claude 生成的完整 11 天计划 |
| **计划备份** | `./IMPLEMENTATION_PLAN.md` | 项目内备份，推荐使用 |
| **项目状态** | `./PROJECT_STATUS.md` | 当前进度、完成情况、下一步 |
| **恢复指南** | `./RECOVERY_GUIDE.md` | 本文档 |
| **README** | `./README.md` | 项目说明 |

### 代码和配置

| 类型 | 位置 | 说明 |
|------|------|------|
| **项目根目录** | `/Users/bytedance/repos/claude-agent-sdk-demo/deep-research/` | 整个项目 |
| **环境变量** | `./.env` | API keys、数据库配置（不要提交到 git）|
| **数据库** | `./dev.db` | SQLite 数据库文件 |
| **API 源码** | `./apps/api/src/` | Express 后端代码 |
| **Web 源码** | `./apps/web/src/` | React 前端代码 |
| **共享类型** | `./packages/shared-types/src/` | TypeScript 类型定义 |

### 脚本工具

| 脚本 | 用途 | 使用方式 |
|------|------|----------|
| `start.sh` | 一键启动 | `./start.sh` |
| `check-status.sh` | 检查项目状态 | `./check-status.sh` |

---

## 🚀 三种恢复场景

### 场景 1: 关闭终端后重新打开（最常见）

服务器已停止，但代码和数据库都在：

```bash
cd /Users/bytedance/repos/claude-agent-sdk-demo/deep-research
./start.sh
```

或：
```bash
pnpm dev
```

**访问：**
- Web: http://localhost:5173
- API: http://localhost:3000

---

### 场景 2: 重启电脑后

所有服务停止，可能需要重新生成一些文件：

```bash
# 1. 进入项目
cd /Users/bytedance/repos/claude-agent-sdk-demo/deep-research

# 2. 检查状态
./check-status.sh

# 3. 如果提示缺少什么，按提示修复，然后启动
./start.sh
```

---

### 场景 3: 重新 clone 项目或在新电脑上

从零开始恢复：

```bash
# 1. Clone 项目（如果需要）
cd /Users/bytedance/repos/claude-agent-sdk-demo/
# git clone ... (如果你有 git repo)

# 2. 进入项目
cd deep-research

# 3. 复制环境变量
cp .env.example .env
# 编辑 .env，填入你的 API keys

# 4. 安装依赖
pnpm install

# 5. 生成 Prisma Client
pnpm exec prisma generate

# 6. 创建数据库
pnpm exec prisma db push

# 7. 启动服务
pnpm dev
```

---

## 📖 如何查看和继续工作

### 1. 查看完整实施计划

```bash
# 方式 1: 查看项目备份
cat IMPLEMENTATION_PLAN.md

# 方式 2: 查看原始文件
cat /Users/bytedance/.claude/plans/resilient-imagining-lemon.md

# 方式 3: 在编辑器中打开
code IMPLEMENTATION_PLAN.md  # VSCode
open IMPLEMENTATION_PLAN.md  # 默认编辑器
```

### 2. 查看当前进度

```bash
# 查看项目状态文档
cat PROJECT_STATUS.md

# 或运行状态检查
./check-status.sh
```

### 3. 继续开发

**Phase 1 已完成 ✅**
**现在应该开始 Phase 2: Claude Agent 集成**

查看 `IMPLEMENTATION_PLAN.md` 的 "Phase 2" 部分，或查看 `PROJECT_STATUS.md` 的 "下一步工作" 部分。

---

## 🎯 Phase 2 快速开始

当你准备继续时，告诉 Claude：

```
"我想继续 Phase 2 的开发，开始实现 Claude Agent SDK 集成"
```

或具体说明：

```
"实现 AgentService.ts 核心服务"
"创建 webSearch MCP 工具"
"集成 Tavily 搜索 API"
```

---

## 💾 重要提示：备份

### 建议定期备份

```bash
# 1. 初始化 git（如果还没有）
git init
git add .
git commit -m "Phase 1 complete"

# 2. 备份计划文件（每次更新后）
cp /Users/bytedance/.claude/plans/resilient-imagining-lemon.md ./IMPLEMENTATION_PLAN.md

# 3. 备份数据库（测试数据重要时）
cp dev.db dev.db.backup

# 4. 备份环境变量（注意安全！）
# 不要提交到 git，只保存到安全的地方
cp .env .env.backup.local
```

### 什么会丢失？

**不会丢失：**
- ✅ 所有代码文件
- ✅ 配置文件
- ✅ 数据库文件（`dev.db`）
- ✅ 文档（如果在项目目录）
- ✅ 依赖（`node_modules` 可重新安装）

**可能丢失（如果没备份）：**
- ⚠️ 原始计划文件（在 `/Users/bytedance/.claude/plans/`）
  - **解决方案**：已备份到 `IMPLEMENTATION_PLAN.md`
- ⚠️ 环境变量中的 API keys（如果删除 `.env`）
  - **解决方案**：记录在安全的地方
- ⚠️ 数据库数据（如果删除 `dev.db`）
  - **解决方案**：开发阶段不重要，可重新生成

---

## 🔍 验证恢复成功

运行以下命令确认一切正常：

```bash
# 1. 检查项目状态
./check-status.sh

# 2. 测试 API
curl http://localhost:3000/health

# 3. 测试 Web
curl http://localhost:5173

# 4. 在浏览器中访问
open http://localhost:5173
```

**预期结果：**
- ✅ 状态检查显示所有服务运行中
- ✅ API 返回健康状态
- ✅ Web 正常加载
- ✅ 浏览器显示 "Deep Research Agent" 界面

---

## 📞 遇到问题？

### 常见问题

**1. `pnpm: command not found`**
```bash
npm install -g pnpm@8.15.0
```

**2. `prisma: command not found`**
```bash
pnpm install
```

**3. 端口被占用**
```bash
# 查看占用端口的进程
lsof -i :3000
lsof -i :5173

# 杀死进程
kill -9 <PID>
```

**4. 数据库错误**
```bash
# 删除数据库重新创建
rm dev.db
pnpm exec prisma db push
```

**5. 类型错误**
```bash
# 重新生成 Prisma Client
pnpm exec prisma generate

# 重新构建共享类型
pnpm --filter @deep-research/shared-types build
```

---

## 📝 项目关键信息快速查询

```bash
# 项目位置
/Users/bytedance/repos/claude-agent-sdk-demo/deep-research/

# 查看文档
cat PROJECT_STATUS.md      # 项目状态
cat IMPLEMENTATION_PLAN.md  # 完整计划
cat README.md               # 项目说明
cat RECOVERY_GUIDE.md       # 本文档

# 启动服务
./start.sh                  # 一键启动
pnpm dev                    # 手动启动

# 检查状态
./check-status.sh           # 状态检查

# 数据库
pnpm exec prisma studio     # 可视化管理
pnpm exec prisma db push    # 同步 schema

# 开发命令
pnpm build                  # 构建
pnpm typecheck              # 类型检查
pnpm lint                   # 代码检查
```

---

## ✅ 恢复清单

每次恢复工作时，按此清单操作：

- [ ] 1. 进入项目目录：`cd /Users/bytedance/repos/claude-agent-sdk-demo/deep-research/`
- [ ] 2. 检查状态：`./check-status.sh`
- [ ] 3. 查看计划：`cat IMPLEMENTATION_PLAN.md` 或 `cat PROJECT_STATUS.md`
- [ ] 4. 启动服务：`./start.sh` 或 `pnpm dev`
- [ ] 5. 验证运行：访问 http://localhost:5173 和 http://localhost:3000/health
- [ ] 6. 开始工作：参考 Phase 2 任务列表

---

**最后更新**: 2026-01-17
**当前阶段**: Phase 1 完成，准备 Phase 2
**下一步**: 实现 Claude Agent SDK 集成
