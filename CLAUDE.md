# Deep Research Agent - Claude 上下文文档

> 本文档为 Claude Code 提供项目上下文，帮助快速理解项目状态并继续工作

**最后更新**: 2026-01-17
**当前阶段**: Phase 1 完成 ✅，准备 Phase 2 ⏳
**项目位置**: `/Users/bytedance/repos/claude-agent-sdk-demo/deep-research/`

---

## 🎯 项目概述

**Deep Research Agent** - 基于 Claude Agent SDK 的深度研究助手

### 核心功能
- 🔍 智能网络搜索与信息收集
- 📄 多源数据整合（文档、API、网页）
- 🧠 深度分析与推理（使用 Claude 扩展思维）
- 📝 自动生成 Markdown 格式研究报告
- 🌐 现代化 Web 界面
- ⚡ 实时研究进度展示（SSE）

### 技术栈

**后端**
- Node.js 18+ with TypeScript
- Express.js 4.x
- **Claude Agent SDK 0.2.11** ← 核心
- Prisma 6.1.0 + SQLite
- Tavily API（待集成）

**前端**
- React 18 + TypeScript
- Vite 6.x
- TailwindCSS 3.x
- TanStack Query 5.x

**工具**
- Turborepo（Monorepo）
- pnpm（包管理）

---

## 📊 当前状态

### ✅ Phase 1 已完成（2026-01-17）

**完成的工作**:
1. ✅ Turborepo Monorepo 架构
2. ✅ TypeScript 全局配置
3. ✅ Prisma + SQLite 数据库（5 个模型）
4. ✅ Express API 服务器（健康检查、路由框架）
5. ✅ React + Vite 前端（基础页面、路由）
6. ✅ 共享类型包（@deep-research/shared-types）
7. ✅ 完整测试验证（10 项测试通过）

**测试覆盖**:
- ✅ TypeScript 类型检查
- ✅ 数据库 CRUD 操作（7 种）
- ✅ API 端点响应（8/8）
- ✅ 请求验证和错误处理
- ✅ 前端路由
- ✅ CORS 配置
- ✅ 环境变量加载

**运行状态**:
- 🟢 API Server: http://localhost:3000
- 🟢 Web Frontend: http://localhost:5173
- 🟢 Database: `dev.db` (5 tables)

### ⏳ Phase 2 待开始

**下一步任务** (第 2-3 天):

**2.1 Agent Service 基础**
- [ ] 创建 `AgentService.ts` 核心服务
- [ ] 实现基础 query 函数
- [ ] 测试简单的 Agent 调用

**2.2 自定义 MCP 工具**
- [ ] `webSearch.ts` - 网络搜索工具
- [ ] `documentReader.ts` - 文档读取工具
- [ ] `reportWriter.ts` - 报告生成工具

**2.3 系统提示词**
- [ ] 设计研究 Agent 提示词
- [ ] 定义报告结构

**关键文件位置**:
- `apps/api/src/services/agent/AgentService.ts`
- `apps/api/src/services/agent/tools/`
- `apps/api/src/services/agent/prompts/`

---

## 📁 项目结构

```
deep-research/
├── 📄 CLAUDE.md                    ← 本文档
├── 📄 IMPLEMENTATION_PLAN.md       ← 完整 11 天计划
├── 📄 PROJECT_STATUS.md            ← 详细状态
├── 📄 RECOVERY_GUIDE.md            ← 恢复指南
├── 🚀 start.sh                     ← 一键启动
├── 🔍 check-status.sh              ← 状态检查
├── 🗄️ dev.db                       ← SQLite 数据库
├── ⚙️ .env                         ← 环境变量
│
├── 📦 apps/
│   ├── api/                        ← Express 后端
│   │   ├── src/
│   │   │   ├── index.ts           # 服务器入口
│   │   │   ├── routes/            # API 路由
│   │   │   │   ├── research.ts   # 研究端点 ⭐
│   │   │   │   ├── reports.ts    # 报告端点
│   │   │   │   ├── documents.ts  # 文档端点
│   │   │   │   └── health.ts     # 健康检查
│   │   │   ├── services/          # 业务逻辑
│   │   │   │   └── agent/        # ← Phase 2 在这里创建
│   │   │   ├── middleware/        # 中间件
│   │   │   └── types/             # 类型定义
│   │   └── package.json
│   │
│   └── web/                        ← React 前端
│       ├── src/
│       │   ├── pages/             # 页面组件
│       │   │   ├── Home.tsx       # 新建研究
│       │   │   ├── Research.tsx   # 研究进行中
│       │   │   └── Reports.tsx    # 报告库
│       │   ├── components/        # React 组件
│       │   ├── hooks/             # 自定义 hooks
│       │   └── api/               # API 客户端
│       └── package.json
│
├── 📦 packages/
│   └── shared-types/               ← 共享 TypeScript 类型
│       └── src/
│           ├── api.ts             # API 类型
│           ├── research.ts        # 研究类型
│           └── agent.ts           # Agent 类型
│
├── 🗄️ prisma/
│   └── schema.prisma              # 数据库 schema
│
└── 📦 .claude/
    └── skills/                    # Claude Code Skills
        ├── start.md               # 启动服务
        ├── status.md              # 检查状态
        ├── db.md                  # 数据库操作
        ├── plan.md                # 查看计划
        ├── test.md                # 测试
        └── phase2.md              # Phase 2 开始
```

---

## 🗄️ 数据库设计

**Provider**: SQLite (开发) / PostgreSQL (生产)
**File**: `dev.db`
**ORM**: Prisma 6.1.0

### 模型

**ResearchSession** - 研究会话
```prisma
- id: String @id
- query: String                    # 研究查询
- status: String                   # pending|running|completed|failed|cancelled
- agentSessionId: String?          # Agent 会话 ID
- modelUsed: String                # 使用的模型
- totalCostUsd: Float?             # 成本
- tokensUsed: Int?                 # Token 用量
- sources: Source[]                # 关联的来源
- report: Report?                  # 生成的报告
- messages: ResearchMessage[]      # 消息历史
```

**Source** - 信息来源
```prisma
- id: String @id
- type: String                     # web|document|api
- url: String?
- title: String?
- content: String?
```

**Report** - 研究报告
```prisma
- id: String @id
- title: String
- content: String                  # Markdown 内容
- format: String                   # markdown|html
```

**ResearchMessage** - 消息记录
```prisma
- id: String @id
- type: String                     # assistant|user|tool_use|result
- content: String                  # JSON string
```

**Document** - 上传的文档
```prisma
- id: String @id
- filename: String
- mimeType: String
- extractedText: String?
```

---

## 🔌 API 端点

**Base URL**: `http://localhost:3000`

### 健康检查
```
GET /health
→ { status: "ok", uptime, environment }
```

### 研究相关
```
POST   /api/research/start         # 开始新研究
GET    /api/research/:id/status    # 获取状态
GET    /api/research/:id/stream    # SSE 进度流
POST   /api/research/:id/cancel    # 取消研究
```

### 报告管理
```
GET    /api/reports                # 获取报告列表
GET    /api/reports/:id            # 获取特定报告
DELETE /api/reports/:id            # 删除报告
```

### 文档管理
```
POST   /api/documents/upload       # 上传文档
GET    /api/documents/:id          # 获取文档
```

**当前状态**: 所有端点已创建框架，返回 501（未实现）

---

## 🚀 快速命令

### 启动项目
```bash
./start.sh
# 或
pnpm dev
```

### 检查状态
```bash
./check-status.sh
```

### 数据库操作
```bash
pnpm exec prisma studio      # 可视化管理
pnpm exec prisma db push     # 同步 schema
pnpm exec prisma generate    # 生成 client
```

### 开发命令
```bash
pnpm build                   # 构建所有包
pnpm typecheck               # 类型检查
pnpm lint                    # 代码检查
```

### 单独运行
```bash
pnpm --filter @deep-research/api dev    # 只启动 API
pnpm --filter @deep-research/web dev    # 只启动 Web
```

---

## 📖 重要文档

### 查看完整计划
```bash
cat IMPLEMENTATION_PLAN.md
```
- 完整的 11 天开发计划（725 行）
- 9 个实施阶段
- 所有任务清单

### 查看项目状态
```bash
cat PROJECT_STATUS.md
```
- Phase 1 完成清单
- Phase 2 任务列表
- 已知问题

### 恢复工作指南
```bash
cat RECOVERY_GUIDE.md
```
- 三种恢复场景
- 故障排除
- 常见问题

---

## 🔧 环境变量

**文件**: `.env`

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-xxx        # ← 需要真实 key

# Tavily Search API
TAVILY_API_KEY=tvly-xxx             # ← Phase 2 需要

# Database
DATABASE_URL=file:./dev.db          # SQLite

# API Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Research Configuration
MAX_BUDGET_PER_RESEARCH=3.0
MAX_CONCURRENT_RESEARCH=2
DEFAULT_SEARCH_DEPTH=basic
```

---

## ⚠️ 已知问题

### 1. Zod 版本不匹配
- **问题**: Agent SDK 需要 zod@4.x，项目使用 3.x
- **影响**: 暂不影响基础功能
- **解决**: Phase 2 时升级到 zod@4

### 2. SQLite vs PostgreSQL
- **问题**: SQLite 不支持某些高级特性（如 JSON 类型）
- **当前**: 使用 String 存储 JSON
- **生产**: 建议切换到 PostgreSQL

---

## 🎯 如何继续工作

### 从 Phase 2 开始

**告诉 Claude**:
```
"开始 Phase 2 开发，创建 AgentService 核心服务"
```

或使用 skill:
```bash
/phase2
```

### 具体任务

**任务 1: 创建 AgentService**
```
"创建 apps/api/src/services/agent/AgentService.ts，
实现 Claude Agent SDK 的基础集成"
```

**任务 2: 实现 webSearch 工具**
```
"实现 webSearch MCP 工具，准备集成 Tavily API"
```

**任务 3: 设计系统提示词**
```
"设计研究 Agent 的系统提示词，定义报告格式"
```

---

## 💡 开发提示

### Phase 2 的关键点

1. **AgentService.ts 架构**
   - 使用 `createSdkMcpServer()` 创建 MCP 服务器
   - 使用 `tool()` 定义自定义工具
   - 使用 `query()` 执行 Agent 查询

2. **MCP 工具设计**
   - 使用 Zod 定义参数 schema
   - 返回格式: `{ content: [{ type: 'text', text: '...' }] }`
   - 工具要提供清晰的错误消息

3. **系统提示词**
   - 明确研究目标和流程
   - 定义报告结构（标题、摘要、正文、引用）
   - 指导工具使用策略

4. **测试策略**
   - 先测试简单查询
   - 逐步增加复杂度
   - 监控成本和 token 使用

### 参考代码模式

```typescript
// AgentService.ts 基础结构
import { query, createSdkMcpServer, tool } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';

export class AgentService {
  private mcpServer;

  constructor() {
    this.mcpServer = createSdkMcpServer({
      name: 'deep-research-tools',
      version: '1.0.0',
      tools: [
        this.createWebSearchTool(),
        // ... 其他工具
      ]
    });
  }

  private createWebSearchTool() {
    return tool(
      'web_search',
      'Search the web for information',
      {
        query: z.string(),
        numResults: z.number().default(10)
      },
      async (args) => {
        // 实现搜索逻辑
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(results)
          }]
        };
      }
    );
  }

  async conductResearch(query: string) {
    for await (const message of query({
      prompt: query,
      options: {
        model: 'claude-sonnet-4-5-20250929',
        mcpServers: {
          'research-tools': this.mcpServer
        },
        maxTurns: 50,
        maxBudgetUsd: 3.0
      }
    })) {
      // 处理消息
      yield this.processMessage(message);
    }
  }
}
```

---

## 📞 获取帮助

### Skills 可用
```bash
/start       # 启动服务
/status      # 检查状态
/db          # 数据库操作
/plan        # 查看计划
/test        # 运行测试
/phase2      # 开始 Phase 2
```

### 文档
- `IMPLEMENTATION_PLAN.md` - 完整计划
- `PROJECT_STATUS.md` - 当前状态
- `RECOVERY_GUIDE.md` - 恢复指南
- `CLAUDE.md` - 本文档

### 验证环境
```bash
./check-status.sh
```

---

**创建日期**: 2026-01-17
**Claude 会话**: Plan → Implementation → Testing → Phase 1 Complete
**下一步**: Phase 2 - Claude Agent Integration

---

## 🔄 更新日志

- **2026-01-17**: 初始版本，Phase 1 完成
- **待更新**: Phase 2 进度将在此记录
