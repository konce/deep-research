# Phase 2: Claude Agent Integration

开始 Phase 2 开发：Claude Agent SDK 集成

## Usage

```bash
/phase2
```

## What it does

启动 Phase 2 的开发工作，实现 Claude Agent SDK 集成

## Phase 2 Overview

**目标**: 集成 Claude Agent SDK，实现核心研究功能

**预计时间**: 2-3 天

**关键任务**:

### 2.1 Agent Service 基础
- [ ] 安装 Claude Agent SDK
- [ ] 创建 `apps/api/src/services/agent/AgentService.ts`
- [ ] 实现基础 query 函数
- [ ] 测试简单的 Agent 调用

### 2.2 自定义 MCP 工具
- [ ] 创建 `webSearch.ts` 工具
- [ ] 创建 `documentReader.ts` 工具
- [ ] 创建 `reportWriter.ts` 工具
- [ ] 使用 Zod 定义参数 schema

### 2.3 系统提示词设计
- [ ] 编写研究 Agent 系统提示词
- [ ] 定义报告结构和格式
- [ ] 测试提示词效果

## Key Files to Create

1. `apps/api/src/services/agent/AgentService.ts` - 核心服务
2. `apps/api/src/services/agent/tools/webSearch.ts` - 搜索工具
3. `apps/api/src/services/agent/tools/documentReader.ts` - 文档工具
4. `apps/api/src/services/agent/tools/reportWriter.ts` - 报告工具
5. `apps/api/src/services/agent/prompts/researcher.ts` - 提示词

## Dependencies Needed

```json
{
  "@anthropic-ai/claude-agent-sdk": "^0.2.11", // ✅ 已安装
  "zod": "^3.24.1" // ✅ 已安装 (需要升级到 v4)
}
```

## Start Phase 2

Tell Claude:
```
"开始实施 Phase 2，创建 AgentService 核心服务"
```

Or:
```
"实现 webSearch MCP 工具，集成 Tavily API"
```

## Reference

查看完整计划:
```bash
cat IMPLEMENTATION_PLAN.md | sed -n '/### Phase 2/,/### Phase 3/p'
```
