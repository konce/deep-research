# Deep Research Agent 实现计划

## 项目概述

构建一个基于 Claude Agent SDK 的深度研究助手，能够自动进行网络搜索、多源数据整合、深度分析推理并生成结构化的研究报告。

### 核心特性
- 🔍 智能网络搜索与信息收集
- 📄 多源数据整合（文档、API、网页）
- 🧠 深度分析与推理（使用 Claude 的扩展思维能力）
- 📝 自动生成 Markdown 格式研究报告
- 🌐 现代化 Web 界面
- ⚡ 实时研究进度展示

### 技术栈选择

**后端**
- Node.js 18+ with TypeScript
- Express.js (API 服务器)
- Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`)
- Tavily API (网络搜索)
- PostgreSQL + Prisma (数据存储)
- pdf-parse, mammoth (文档处理)

**前端**
- React 18 + TypeScript
- Vite (构建工具)
- TailwindCSS + shadcn/ui (UI 组件)
- TanStack Query (数据管理)
- react-markdown (Markdown 渲染)

**开发工具**
- Turborepo (Monorepo 管理)
- pnpm (包管理器)
- ESLint + Prettier (代码质量)

## 项目结构

```
deep-research/
├── apps/
│   ├── api/                          # Express 后端
│   │   ├── src/
│   │   │   ├── index.ts             # 服务器入口
│   │   │   ├── routes/
│   │   │   │   ├── research.ts      # 研究相关接口
│   │   │   │   ├── documents.ts     # 文档上传
│   │   │   │   └── reports.ts       # 报告管理
│   │   │   ├── services/
│   │   │   │   ├── agent/           # Claude Agent 集成
│   │   │   │   │   ├── AgentService.ts        # 核心编排服务
│   │   │   │   │   ├── tools/                 # 自定义 MCP 工具
│   │   │   │   │   │   ├── webSearch.ts      # 网络搜索工具
│   │   │   │   │   │   ├── documentReader.ts # 文档读取工具
│   │   │   │   │   │   └── reportWriter.ts   # 报告生成工具
│   │   │   │   │   ├── prompts/              # 系统提示词
│   │   │   │   │   │   └── researcher.ts     # 研究 Agent 提示词
│   │   │   │   │   └── workflows/            # 研究工作流
│   │   │   │   │       └── DeepResearch.ts   # 主研究流程
│   │   │   │   ├── search/
│   │   │   │   │   └── TavilyClient.ts      # Tavily 搜索客户端
│   │   │   │   ├── document/
│   │   │   │   │   └── TextExtractor.ts     # 文档文本提取
│   │   │   │   └── report/
│   │   │   │       └── MarkdownGenerator.ts # Markdown 生成
│   │   │   └── types/               # TypeScript 类型定义
│   │   └── package.json
│   │
│   └── web/                          # React 前端
│       ├── src/
│       │   ├── main.tsx             # 应用入口
│       │   ├── App.tsx
│       │   ├── pages/
│       │   │   ├── Home.tsx         # 新建研究页面
│       │   │   ├── Research.tsx     # 研究进行中页面
│       │   │   └── Reports.tsx      # 报告库页面
│       │   ├── components/
│       │   │   ├── research/
│       │   │   │   ├── QueryInput.tsx         # 查询输入框
│       │   │   │   ├── ResearchProgress.tsx   # 进度显示
│       │   │   │   ├── SourcesList.tsx        # 来源列表
│       │   │   │   └── ThinkingStream.tsx     # 思考过程展示
│       │   │   └── report/
│       │   │       ├── MarkdownViewer.tsx     # Markdown 查看器
│       │   │       └── CitationList.tsx       # 引用列表
│       │   ├── hooks/
│       │   │   ├── useResearch.ts             # 研究会话管理
│       │   │   └── useSSE.ts                  # SSE 连接管理
│       │   └── api/
│       │       └── client.ts        # API 客户端
│       └── package.json
│
├── packages/
│   └── shared-types/                 # 共享类型定义
│       ├── src/
│       │   ├── api.ts               # API 请求/响应类型
│       │   └── research.ts          # 研究领域类型
│       └── package.json
│
├── prisma/
│   └── schema.prisma                # 数据库模式
│
├── .env.example
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## 核心架构设计

### Agent 工作流程

```
用户输入查询
    ↓
Agent 理解与规划
    ↓
信息收集阶段
  ├─ 网络搜索 (Tavily API)
  ├─ 文档处理
  └─ 数据聚合
    ↓
深度分析阶段
  ├─ 交叉引用来源
  ├─ 识别模式与洞察
  └─ 信息综合
    ↓
报告生成阶段
  ├─ 结构化内容
  ├─ 添加引用
  └─ 格式化为 Markdown
    ↓
返回结果
```

### Claude Agent SDK 集成模式

```typescript
// AgentService.ts 核心实现
export class AgentService {
  private mcpServer;

  constructor(
    private searchService: TavilyClient,
    private documentService: TextExtractor
  ) {
    // 创建自定义 MCP 服务器
    this.mcpServer = createSdkMcpServer({
      name: 'deep-research-tools',
      version: '1.0.0',
      tools: [
        this.createWebSearchTool(),
        this.createDocumentReaderTool(),
        this.createReportWriterTool()
      ]
    });
  }

  async conductResearch(
    query: string,
    options: ResearchOptions
  ): AsyncGenerator<ResearchUpdate> {
    for await (const message of query({
      prompt: `研究以下主题并生成详细报告: ${query}`,
      options: {
        model: 'claude-sonnet-4-5-20250929',
        mcpServers: {
          'research-tools': this.mcpServer
        },
        allowedTools: [
          'mcp__research-tools__web_search',
          'mcp__research-tools__document_reader',
          'mcp__research-tools__report_writer'
        ],
        maxTurns: 50,
        maxBudgetUsd: options.maxBudget || 3.0,
        includePartialMessages: true
      }
    })) {
      yield this.processMessage(message);
    }
  }
}
```

### API 端点设计

```
POST   /api/research/start          # 开始新研究
GET    /api/research/:id/stream     # SSE 进度流
GET    /api/research/:id/status     # 获取状态
POST   /api/research/:id/cancel     # 取消研究
GET    /api/reports                 # 获取报告列表
GET    /api/reports/:id             # 获取特定报告
POST   /api/documents/upload        # 上传文档
```

### SSE 消息格式

```typescript
interface ResearchUpdate {
  type: 'status' | 'thinking' | 'tool_use' | 'result' | 'error';
  timestamp: string;
  data: {
    message?: string;
    toolName?: string;
    progress?: number;
    sources?: Source[];
  };
}
```

## 数据库设计 (Prisma Schema)

```prisma
// 简化的单用户版本，无需用户认证

model ResearchSession {
  id            String   @id @default(cuid())
  query         String
  status        String   // pending, running, completed, failed, cancelled
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  completedAt   DateTime?

  // Agent 会话信息
  agentSessionId String?
  modelUsed     String   @default("claude-sonnet-4-5")
  totalCostUsd  Float?
  tokensUsed    Int?

  sources       Source[]
  report        Report?
  messages      ResearchMessage[]

  @@index([createdAt])
}

model Source {
  id                String   @id @default(cuid())
  researchSessionId String
  researchSession   ResearchSession @relation(fields: [researchSessionId], references: [id], onDelete: Cascade)

  type              String   // web, document, api
  url               String?
  title             String?
  snippet           String?
  content           String?  @db.Text

  createdAt         DateTime @default(now())

  @@index([researchSessionId])
}

model Report {
  id                String   @id @default(cuid())
  researchSessionId String   @unique
  researchSession   ResearchSession @relation(fields: [researchSessionId], references: [id], onDelete: Cascade)

  title             String
  content           String   @db.Text
  format            String   @default("markdown")

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([createdAt])
}

model ResearchMessage {
  id                String   @id @default(cuid())
  researchSessionId String
  researchSession   ResearchSession @relation(fields: [researchSessionId], references: [id], onDelete: Cascade)

  type              String   // assistant, user, tool_use, result
  content           Json
  timestamp         DateTime @default(now())

  @@index([researchSessionId, timestamp])
}

model Document {
  id            String   @id @default(cuid())
  filename      String
  originalName  String
  mimeType      String
  size          Int
  path          String
  extractedText String?  @db.Text
  createdAt     DateTime @default(now())
}
```

## 实施阶段

### Phase 1: 项目初始化（第 1 天）

**1.1 Monorepo 搭建**
- [ ] 初始化 Turborepo 项目
- [ ] 配置 pnpm workspace
- [ ] 设置 TypeScript 配置
- [ ] 配置 ESLint 和 Prettier

**1.2 数据库设置**
- [ ] 安装 PostgreSQL
- [ ] 创建 Prisma schema
- [ ] 运行初始迁移
- [ ] 验证数据库连接

**1.3 基础 API 框架**
- [ ] 创建 Express 应用
- [ ] 配置中间件（CORS, body-parser）
- [ ] 设置环境变量管理
- [ ] 创建健康检查端点

**1.4 基础前端框架**
- [ ] 初始化 Vite + React 项目
- [ ] 配置 TailwindCSS
- [ ] 安装 shadcn/ui
- [ ] 创建基础布局

### Phase 2: Claude Agent 集成（第 2-3 天）

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

### Phase 3: 网络搜索集成（第 3-4 天）

**3.1 Tavily API 集成**
- [ ] 注册 Tavily API 账号
- [ ] 创建 `TavilyClient.ts`
- [ ] 实现搜索方法（basic/advanced）
- [ ] 添加结果格式化

**3.2 搜索结果处理**
- [ ] 实现结果去重逻辑
- [ ] 添加搜索结果缓存（数据库）
- [ ] 测试不同查询类型

**3.3 连接到 Agent**
- [ ] 在 webSearch MCP 工具中集成 TavilyClient
- [ ] 测试 Agent 通过工具搜索
- [ ] 优化搜索参数

**关键文件**:
- `apps/api/src/services/search/TavilyClient.ts`
- `apps/api/src/services/agent/tools/webSearch.ts`

### Phase 4: 文档处理（第 4-5 天）

**4.1 文件上传系统**
- [ ] 创建文档上传 API 端点
- [ ] 实现文件存储（本地文件系统）
- [ ] 添加文件验证和安全检查

**4.2 文档处理器**
- [ ] 实现 PDF 处理器 (pdf-parse)
- [ ] 实现 DOCX 处理器 (mammoth)
- [ ] 实现纯文本处理器
- [ ] 创建统一的 `TextExtractor` 接口

**4.3 文档分析工具**
- [ ] 在 documentReader MCP 工具中集成处理器
- [ ] 测试文档读取功能
- [ ] 添加长文档分块处理

**关键文件**:
- `apps/api/src/services/document/TextExtractor.ts`
- `apps/api/src/services/agent/tools/documentReader.ts`

### Phase 5: 研究工作流（第 5-6 天）

**5.1 工作流引擎**
- [ ] 创建 `DeepResearch.ts` 工作流类
- [ ] 实现多阶段研究流程
- [ ] 添加进度跟踪
- [ ] 实现状态管理

**5.2 实时更新**
- [ ] 创建 SSE 端点用于进度流
- [ ] 实现消息流处理
- [ ] 添加进度百分比计算
- [ ] 测试实时通信

**5.3 研究 API 端点**
- [ ] 实现 `/api/research/start`
- [ ] 实现 `/api/research/:id/stream`
- [ ] 实现 `/api/research/:id/status`
- [ ] 实现取消研究功能

**关键文件**:
- `apps/api/src/services/agent/workflows/DeepResearch.ts`
- `apps/api/src/routes/research.ts`

### Phase 6: 报告生成（第 6-7 天）

**6.1 Markdown 生成**
- [ ] 创建 `MarkdownGenerator.ts`
- [ ] 实现结构化报告格式
- [ ] 添加引用格式化
- [ ] 测试 Markdown 输出质量

**6.2 报告存储**
- [ ] 在数据库中存储报告
- [ ] 实现报告检索 API
- [ ] 添加报告元数据

**6.3 Report Writer 工具**
- [ ] 在 reportWriter MCP 工具中集成生成器
- [ ] 测试 Agent 生成报告
- [ ] 优化报告结构

**关键文件**:
- `apps/api/src/services/report/MarkdownGenerator.ts`
- `apps/api/src/services/agent/tools/reportWriter.ts`

### Phase 7: 前端实现（第 7-9 天）

**7.1 研究界面**
- [ ] 创建 `QueryInput.tsx` 组件
- [ ] 创建 `ResearchProgress.tsx` 组件
- [ ] 实现实时消息流展示
- [ ] 创建 `ThinkingStream.tsx` 显示 Agent 思考

**7.2 报告查看器**
- [ ] 创建 `MarkdownViewer.tsx`
- [ ] 添加代码高亮
- [ ] 实现引用链接
- [ ] 添加下载按钮

**7.3 报告管理**
- [ ] 创建 Reports 库页面
- [ ] 添加搜索和筛选
- [ ] 实现删除功能
- [ ] 显示报告元数据

**7.4 自定义 Hooks**
- [ ] 实现 `useResearch.ts` hook
- [ ] 实现 `useSSE.ts` hook
- [ ] 配置 TanStack Query

**关键文件**:
- `apps/web/src/hooks/useResearch.ts`
- `apps/web/src/components/research/ResearchProgress.tsx`
- `apps/web/src/components/report/MarkdownViewer.tsx`

### Phase 8: 测试与优化（第 9-10 天）

**8.1 测试**
- [ ] 编写核心服务单元测试
- [ ] 创建 API 端点集成测试
- [ ] 测试各种研究查询类型
- [ ] 测试错误处理场景

**8.2 性能优化**
- [ ] 优化数据库查询
- [ ] 添加适当的缓存
- [ ] 优化前端 bundle 大小
- [ ] 性能分析和瓶颈修复

**8.3 错误处理**
- [ ] 改进错误消息
- [ ] 添加优雅降级
- [ ] 实现重试逻辑
- [ ] 添加用户友好的错误 UI

### Phase 9: 文档与完善（第 10-11 天）

**9.1 文档**
- [ ] 编写 README.md
- [ ] 创建 API 文档
- [ ] 添加代码注释
- [ ] 编写使用指南

**9.2 完善**
- [ ] 添加缺失的功能
- [ ] 修复已知问题
- [ ] 用户体验优化
- [ ] 性能最终调整

## 环境变量配置

创建 `.env` 文件：

```bash
# Claude API
ANTHROPIC_API_KEY=sk-ant-xxx

# Tavily Search API
TAVILY_API_KEY=tvly-xxx

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/deepresearch

# Storage
STORAGE_PATH=./storage

# API Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Research Configuration
MAX_BUDGET_PER_RESEARCH=3.0
MAX_CONCURRENT_RESEARCH=2
DEFAULT_SEARCH_DEPTH=basic
```

## 成本管理策略

**预算控制**
- 每次研究默认预算上限: $3.00
- 可在前端自定义预算
- 在数据库中跟踪实际花费

**API 调用优化**
- 积极缓存搜索结果
- 使用 Tavily 的 basic 搜索模式（更便宜）
- 限制并发研究会话数量
- 在前端显示预估成本

**监控和提醒**
- 记录每次研究的 token 使用量
- 在 UI 中显示累计成本
- 当成本接近上限时提醒用户

## 验证测试计划

### 端到端测试场景

**测试 1: 基本研究流程**
1. 启动开发服务器：`pnpm dev`
2. 打开 Web 界面 (http://localhost:5173)
3. 输入研究查询："What are the latest developments in quantum computing in 2026?"
4. 验证：
   - [ ] Agent 开始执行
   - [ ] 实时显示思考过程
   - [ ] 执行 web_search 工具
   - [ ] 显示找到的来源
   - [ ] 生成结构化 Markdown 报告
   - [ ] 报告包含适当的引用

**测试 2: 文档上传与分析**
1. 上传一个 PDF 文件
2. 输入查询："Summarize the key findings in the uploaded document"
3. 验证：
   - [ ] 文档成功上传
   - [ ] Agent 使用 document_reader 工具
   - [ ] 提取并分析文档内容
   - [ ] 生成准确的总结

**测试 3: 复杂多步研究**
1. 输入复杂查询："Compare the approaches to AI safety from different organizations and analyze their effectiveness"
2. 验证：
   - [ ] Agent 执行多次搜索
   - [ ] 整合多个来源
   - [ ] 进行深度分析和比较
   - [ ] 生成全面的报告

**测试 4: 报告管理**
1. 完成多个研究会话
2. 导航到报告库
3. 验证：
   - [ ] 显示所有历史报告
   - [ ] 可以打开和查看报告
   - [ ] 可以下载 Markdown 文件
   - [ ] 可以删除报告

**测试 5: 错误处理**
1. 在没有 API key 的情况下启动
2. 输入非常模糊的查询
3. 在研究过程中取消
4. 验证：
   - [ ] 显示清晰的错误消息
   - [ ] Agent 优雅地处理失败
   - [ ] 可以安全取消研究
   - [ ] 数据库状态保持一致

### 性能验证

- [ ] 研究会话响应时间 < 30s（对于简单查询）
- [ ] SSE 连接稳定，无频繁断开
- [ ] 前端加载时间 < 3s
- [ ] 数据库查询优化（使用 EXPLAIN ANALYZE）
- [ ] 内存使用在合理范围内

### API 测试

使用 curl 或 Postman 测试：

```bash
# 启动研究
curl -X POST http://localhost:3000/api/research/start \
  -H "Content-Type: application/json" \
  -d '{"query": "Test query", "maxBudget": 2.0}'

# 获取研究状态
curl http://localhost:3000/api/research/{id}/status

# 获取报告
curl http://localhost:3000/api/reports/{id}
```

## 关键实现文件优先级

**最关键（先实现）:**
1. `apps/api/src/services/agent/AgentService.ts` - Agent 核心编排
2. `apps/api/src/services/agent/tools/webSearch.ts` - 搜索工具
3. `apps/api/src/services/search/TavilyClient.ts` - Tavily 集成
4. `apps/api/src/routes/research.ts` - 研究 API 端点
5. `apps/web/src/hooks/useResearch.ts` - 前端研究管理

**次关键:**
6. `apps/api/src/services/agent/workflows/DeepResearch.ts` - 研究流程
7. `apps/api/src/services/agent/tools/reportWriter.ts` - 报告生成
8. `apps/web/src/components/research/ResearchProgress.tsx` - 进度显示
9. `apps/web/src/components/report/MarkdownViewer.tsx` - 报告查看器

**可以后续添加:**
10. 文档上传和处理功能
11. 高级搜索策略
12. PDF 导出功能

## 潜在挑战与解决方案

### 1. 长时间运行的研究会话
**挑战**: 研究可能需要数分钟，需要处理连接中断

**解决方案**:
- 使用 SSE 自动重连机制
- 在数据库中持久化会话状态
- 允许恢复中断的会话
- 客户端实现重连逻辑

### 2. Agent 工具调用可靠性
**挑战**: Agent 可能卡住、做错误的工具调用或超出限制

**解决方案**:
- 设置 `maxTurns` 防止无限循环
- 为整个研究会话实现超时
- 监控工具使用模式
- 在工具中提供清晰的错误消息
- 随时允许手动取消

### 3. 搜索结果质量
**挑战**: 搜索结果可能不够相关或不够全面

**解决方案**:
- 实现迭代搜索策略
- 对复杂查询使用 Tavily 的 "advanced" 深度
- 允许 Agent 制定多个搜索查询
- 添加结果排名/过滤
- 允许用户提供额外来源

### 4. 报告质量和结构
**挑战**: 生成的报告可能缺乏结构或遗漏关键信息

**解决方案**:
- 在系统提示词中提供详细的报告结构
- 在 reportWriter 工具中强制执行结构
- 实现后处理以确保存在各个部分
- 提供详细的报告模板示例
- 允许用户提供报告模板（未来）

## 开发工作流

```bash
# 安装依赖
pnpm install

# 设置数据库
pnpm db:push

# 启动开发服务器（API + Web）
pnpm dev

# 运行测试
pnpm test

# 构建生产版本
pnpm build

# 类型检查
pnpm typecheck

# Lint 代码
pnpm lint
```

## 总结

本计划提供了一个清晰、可执行的路线图，用于构建一个功能完整的深度研究 Agent。关键重点是：

1. **渐进式开发**: 从核心功能开始，逐步添加特性
2. **Claude Agent SDK 为中心**: 充分利用 SDK 的能力进行多步推理
3. **用户体验优先**: 实时反馈、清晰的进度指示
4. **成本意识**: 合理的预算控制和使用监控
5. **本地优先**: 简化的单用户版本，专注于核心功能

预计总开发时间: **10-11 天**（全职工作）

关键里程碑:
- Day 3: Agent 基础完成，可以进行简单搜索
- Day 6: 完整的研究工作流可运行
- Day 9: 前端界面完成，端到端可用
- Day 11: 测试完成，可以投入使用
