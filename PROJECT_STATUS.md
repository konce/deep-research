# Deep Research Agent - 项目状态

**最后更新**: 2026-01-17
**当前阶段**: Phase 1 完成，准备进入 Phase 2

## 📁 重要文件位置

### 1. 实施计划（最重要）
```
/Users/bytedance/.claude/plans/resilient-imagining-lemon.md
```
- 这是完整的 11 天实施计划
- 包含技术栈、架构设计、分阶段任务
- **建议备份到项目目录**：
  ```bash
  cp /Users/bytedance/.claude/plans/resilient-imagining-lemon.md ./IMPLEMENTATION_PLAN.md
  ```

### 2. 项目根目录
```
/Users/bytedance/repos/claude-agent-sdk-demo/deep-research/
```

### 3. 关键配置文件
- `.env` - 环境变量（API keys，数据库配置）
- `package.json` - 项目依赖和脚本
- `pnpm-workspace.yaml` - Monorepo 配置
- `turbo.json` - 构建配置
- `prisma/schema.prisma` - 数据库 schema

### 4. 数据库文件
```
./dev.db - SQLite 数据库（开发环境）
```

## ✅ Phase 1 完成状态

### 已完成的工作

**1. 项目基础架构** ✅
- [x] Turborepo + pnpm workspace 配置
- [x] TypeScript 全局配置
- [x] ESLint + Prettier
- [x] .env 环境配置

**2. 数据库层** ✅
- [x] Prisma schema（5 个模型）
  - ResearchSession
  - Source
  - Report
  - ResearchMessage
  - Document
- [x] SQLite 数据库创建
- [x] Prisma Client 生成
- [x] 完整 CRUD 操作测试通过

**3. 后端 API (Express)** ✅
- [x] 服务器基础架构
- [x] 中间件（CORS、日志、错误处理）
- [x] 路由框架
  - `/health` - 健康检查
  - `/api/research/*` - 研究相关
  - `/api/reports/*` - 报告管理
  - `/api/documents/*` - 文档上传
- [x] 请求验证
- [x] 错误处理测试通过

**4. 前端应用 (React + Vite)** ✅
- [x] Vite + React 18 + TypeScript
- [x] TailwindCSS 配置
- [x] React Router 路由
- [x] TanStack Query 准备
- [x] 基础页面（Home、Research、Reports）
- [x] API 代理配置

**5. 共享类型包** ✅
- [x] API 类型
- [x] 研究领域类型
- [x] Agent 类型

### 验证测试结果

所有 10 项核心功能测试通过：
- ✅ TypeScript 类型检查
- ✅ 数据库 CRUD 操作（7 种操作）
- ✅ 环境变量加载
- ✅ API 端点响应（8/8）
- ✅ 请求验证（400 错误）
- ✅ 错误处理中间件
- ✅ 前端路由（3 个路由）
- ✅ CORS 配置
- ✅ 共享类型包
- ✅ Monorepo 依赖

## 🚀 如何恢复工作

### 快速启动（最常用）

```bash
# 1. 进入项目目录
cd /Users/bytedance/repos/claude-agent-sdk-demo/deep-research

# 2. 启动开发服务器（同时启动 API 和 Web）
pnpm dev

# 访问：
# - Web: http://localhost:5173
# - API: http://localhost:3000
```

### 完整恢复步骤

如果重新 clone 项目或重启电脑：

```bash
# 1. 进入项目目录
cd /Users/bytedance/repos/claude-agent-sdk-demo/deep-research

# 2. 安装依赖（第一次或更新后）
pnpm install

# 3. 生成 Prisma Client（第一次或 schema 更改后）
pnpm exec prisma generate

# 4. 同步数据库（第一次或 schema 更改后）
pnpm exec prisma db push

# 5. 启动开发服务器
pnpm dev

# 或单独启动：
pnpm --filter @deep-research/api dev     # 只启动 API
pnpm --filter @deep-research/web dev     # 只启动 Web
```

### 查看实施计划

```bash
# 方法 1: 查看 Claude 计划文件
cat /Users/bytedance/.claude/plans/resilient-imagining-lemon.md

# 方法 2: 备份到项目（推荐）
cp /Users/bytedance/.claude/plans/resilient-imagining-lemon.md ./IMPLEMENTATION_PLAN.md

# 方法 3: 查看项目 README
cat README.md
```

### 检查项目状态

```bash
# 查看运行中的服务
ps aux | grep -E "(tsx watch|vite)" | grep -v grep

# 测试 API 健康
curl http://localhost:3000/health

# 测试 Web 前端
curl http://localhost:5173

# 查看数据库
pnpm exec prisma studio  # 在浏览器中打开
```

## 📋 下一步工作 (Phase 2)

根据实施计划，接下来要做：

### Phase 2: Claude Agent 集成 (第 2-3 天)

**2.1 Agent Service 基础**
- [ ] 安装 Claude Agent SDK
- [ ] 创建 `AgentService.ts`
- [ ] 实现基础 query 函数
- [ ] 测试简单的 Agent 调用

**2.2 自定义 MCP 工具**
- [ ] 创建 `webSearch.ts` 工具框架
- [ ] 创建 `documentReader.ts` 工具框架
- [ ] 创建 `reportWriter.ts` 工具框架
- [ ] 使用 Zod 定义工具参数 schema

**2.3 系统提示词设计**
- [ ] 编写研究 Agent 系统提示词
- [ ] 定义报告结构和格式要求
- [ ] 测试提示词效果

**关键文件**:
- `apps/api/src/services/agent/AgentService.ts`
- `apps/api/src/services/agent/tools/webSearch.ts`

## 🔧 常用命令

```bash
# 开发
pnpm dev                 # 启动所有开发服务器
pnpm build              # 构建所有包
pnpm typecheck          # 类型检查
pnpm lint               # 代码检查

# 数据库
pnpm exec prisma generate    # 生成 Prisma Client
pnpm exec prisma db push     # 同步数据库 schema
pnpm exec prisma studio      # 打开数据库管理界面

# 单独运行
pnpm --filter @deep-research/api dev
pnpm --filter @deep-research/web dev
pnpm --filter @deep-research/shared-types build

# 测试
curl http://localhost:3000/health
curl http://localhost:5173
```

## 📊 技术栈总结

**后端**
- Node.js 18+ with TypeScript
- Express.js 4.x
- Claude Agent SDK 0.2.11
- Prisma 6.1.0 + SQLite
- Tavily API（待集成）

**前端**
- React 18 + TypeScript
- Vite 6.x
- TailwindCSS 3.x
- TanStack Query 5.x
- React Router 7.x

**工具**
- Turborepo（Monorepo）
- pnpm（包管理）
- ESLint + Prettier

## ⚠️ 已知问题

1. **Zod 版本警告**
   - Agent SDK 需要 zod@4.x，项目使用 3.x
   - 暂不影响基础功能
   - Phase 2 可能需要升级

2. **SQLite 限制**
   - 生产环境建议使用 PostgreSQL
   - 需修改 `prisma/schema.prisma` 中的 provider
   - JSON 类型在 SQLite 中存为字符串

## 💡 提示

1. **Git 版本控制**
   ```bash
   git init
   git add .
   git commit -m "Phase 1 complete: Project foundation"
   ```

2. **备份计划文件**
   ```bash
   cp /Users/bytedance/.claude/plans/resilient-imagining-lemon.md ./IMPLEMENTATION_PLAN.md
   ```

3. **环境变量**
   - 永远不要提交 `.env` 到 git
   - 使用 `.env.example` 作为模板
   - 记得保存你的 API keys

4. **数据库备份**
   ```bash
   cp dev.db dev.db.backup
   ```

## 📞 获取帮助

如果需要恢复工作或继续开发：

1. **查看完整计划**: `cat /Users/bytedance/.claude/plans/resilient-imagining-lemon.md`
2. **查看本文档**: `cat PROJECT_STATUS.md`
3. **查看 README**: `cat README.md`
4. **参考实施计划**了解下一步做什么

---

**项目创建日期**: 2026-01-17
**Claude 会话**: Plan mode → Implementation → Testing complete

---

## 📦 最新更新（2026-01-17）

### 新增文件

**Claude 集成**:
- ✅ `CLAUDE.md` - Claude 的主要上下文文档（12K）
- ✅ `.claude/skills/` - 自定义 Skills 目录
  - `start.md` - 启动服务
  - `status.md` - 检查状态
  - `db.md` - 数据库操作
  - `plan.md` - 查看计划
  - `test.md` - 运行测试
  - `phase2.md` - Phase 2 开发

**使用方法**:
```bash
# Claude 会自动读取 CLAUDE.md
# 在 Claude Code 中使用 skills:
/start
/status
/phase2
```

**好处**:
- 🚀 快速恢复工作（Claude 能立即了解项目状态）
- ⚡ 便捷命令（常用操作一键执行）
- 📖 完整上下文（无需重复解释项目）
