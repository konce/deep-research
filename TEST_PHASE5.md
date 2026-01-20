# Phase 5 测试指南

本指南提供了测试 Phase 5 研究工作流的多种方法。

---

## 🎯 测试前准备

### 1. 确保 API 服务器运行
```bash
# 检查服务器状态
curl http://localhost:3000/health

# 如果没运行，启动服务器
pnpm dev
```

### 2. 确认环境变量
```bash
# 检查 .env 文件
cat .env | grep -E "ANTHROPIC_API_KEY|TAVILY_API_KEY"
```

---

## 🧪 测试方法

### 方法 1: 快速验证测试（1分钟）⚡

**已为你准备好的脚本**：
```bash
./test-phase5-simple.sh
```

这个脚本会：
1. ✅ 创建一个研究会话
2. ✅ 显示会话ID
3. ✅ 查看初始状态
4. ✅ 测试SSE流（显示前10个事件）

---

### 方法 2: 手动 API 测试（推荐）🔧

#### 步骤 1: 启动研究
```bash
curl -X POST http://localhost:3000/api/research/start \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is Python programming language?",
    "maxBudget": 0.5,
    "searchDepth": "basic"
  }'
```

**预期输出**：
```json
{
  "sessionId": "cmkmd...",
  "query": "What is Python programming language?",
  "status": "pending",
  "createdAt": "2026-01-20T..."
}
```

**保存 sessionId**：
```bash
SESSION_ID="你的会话ID"
```

#### 步骤 2: 实时监听 SSE 流（测试进度追踪）
```bash
curl -N http://localhost:3000/api/research/$SESSION_ID/stream
```

**预期看到的事件**：
```
data: {"type":"status","data":{"message":"Connected to research stream",...}}

data: {"type":"agent-update","data":{"progress":4}}

data: {"type":"agent-update","data":{"progress":8}}

data: {"type":"agent-update","data":{"progress":12}}
...
```

**按 Ctrl+C 停止监听**

#### 步骤 3: 查看研究状态
```bash
# 查看完整状态
curl http://localhost:3000/api/research/$SESSION_ID/status | jq

# 只看关键信息
curl -s http://localhost:3000/api/research/$SESSION_ID/status | jq '{
  status: .status,
  sourcesCount: .sourcesCount,
  hasReport: .hasReport,
  createdAt: .createdAt
}'
```

#### 步骤 4: 等待完成
```bash
# 每5秒检查一次状态
while true; do
  STATUS=$(curl -s http://localhost:3000/api/research/$SESSION_ID/status | jq -r '.status')
  SOURCES=$(curl -s http://localhost:3000/api/research/$SESSION_ID/status | jq -r '.sourcesCount')
  echo "$(date +%H:%M:%S) - 状态: $STATUS, 来源: $SOURCES"

  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi

  sleep 5
done
```

#### 步骤 5: 查看最终结果
```bash
curl -s http://localhost:3000/api/research/$SESSION_ID/status | jq '{
  status: .status,
  sourcesCount: .sourcesCount,
  hasReport: .hasReport,
  totalCostUsd: .totalCostUsd,
  completedAt: .completedAt
}'
```

---

### 方法 3: 测试研究取消功能 🛑

#### 启动一个研究
```bash
RESPONSE=$(curl -s -X POST http://localhost:3000/api/research/start \
  -H "Content-Type: application/json" \
  -d '{"query":"Deep analysis of quantum computing","maxBudget":2,"searchDepth":"advanced"}')

SESSION_ID=$(echo $RESPONSE | jq -r '.sessionId')
echo "会话 ID: $SESSION_ID"
```

#### 等待几秒让研究开始
```bash
sleep 5
```

#### 取消研究
```bash
curl -X POST http://localhost:3000/api/research/$SESSION_ID/cancel
```

**预期输出**：
```json
{
  "success": true,
  "sessionId": "cmkmd...",
  "message": "Research session cancellation requested"
}
```

#### 验证取消状态
```bash
curl -s http://localhost:3000/api/research/$SESSION_ID/status | jq '{
  status: .status,
  completedAt: .completedAt
}'
```

**预期**: `status` 应该是 `"cancelled"`

---

### 方法 4: 测试混合研究模式（网页 + 文档）📄

#### 步骤 1: 上传测试文档
```bash
# 创建测试文档
cat > test-python.txt <<'EOF'
Python Programming Language Overview

Python is a high-level, interpreted programming language created by Guido van Rossum.
It emphasizes code readability with significant indentation.

Key Features:
- Dynamic typing
- Automatic memory management
- Comprehensive standard library
- Multiple programming paradigms
EOF

# 上传文档
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:3000/api/documents/upload \
  -F "file=@test-python.txt")

DOC_ID=$(echo $UPLOAD_RESPONSE | jq -r '.documentId')
echo "文档 ID: $DOC_ID"
```

#### 步骤 2: 启动混合研究
```bash
RESPONSE=$(curl -s -X POST http://localhost:3000/api/research/start \
  -H "Content-Type: application/json" \
  -d "{
    \"query\": \"What is Python? Combine information from the document and web sources\",
    \"maxBudget\": 1,
    \"searchDepth\": \"basic\",
    \"documentIds\": [\"$DOC_ID\"]
  }")

SESSION_ID=$(echo $RESPONSE | jq -r '.sessionId')
echo "研究会话 ID: $SESSION_ID"
```

#### 步骤 3: 监听进度
```bash
curl -N http://localhost:3000/api/research/$SESSION_ID/stream
```

**预期**: 应该看到 Agent 同时使用 `web_search` 和 `document_reader` 工具

---

### 方法 5: 完整测试套件（综合测试）🎯

运行我们准备的完整测试套件：

```bash
# 安装依赖（如果还没安装）
pnpm install

# 运行完整测试
npx tsx test-workflow.ts
```

这个测试套件包含：
1. ✅ 基础网页研究测试
2. ✅ SSE 流和进度追踪测试
3. ✅ 混合研究模式测试
4. ✅ 研究取消测试

**测试会生成报告**: `PHASE5_TEST_RESULTS.md`

---

## 📊 验证清单

测试完成后，验证以下功能：

### ✅ 核心功能
- [ ] 研究会话成功创建
- [ ] 返回有效的 sessionId
- [ ] 状态从 `pending` → `running` → `completed`

### ✅ 进度追踪
- [ ] SSE 连接成功建立
- [ ] 收到 `status` 类型事件
- [ ] 收到 `agent-update` 类型进度事件
- [ ] 进度值递增（4% → 8% → 12% ...）

### ✅ 数据收集
- [ ] `sourcesCount` 持续增加
- [ ] Web 搜索工具被调用
- [ ] 来源保存到数据库

### ✅ 报告生成
- [ ] 研究完成后 `hasReport` 为 `true`
- [ ] 报告内容非空
- [ ] 报告格式为 Markdown

### ✅ 取消功能
- [ ] 取消请求返回成功
- [ ] 状态更新为 `cancelled`
- [ ] 数据库记录正确

### ✅ 混合研究
- [ ] 文档上传成功
- [ ] Agent 使用 `document_reader` 工具
- [ ] Agent 使用 `web_search` 工具
- [ ] 报告综合了两种来源

---

## 🐛 常见问题

### 问题 1: API 服务器未响应
```bash
# 解决方案：启动服务器
pnpm dev
```

### 问题 2: SSE 流立即断开
**可能原因**：研究已完成
```bash
# 检查状态
curl http://localhost:3000/api/research/$SESSION_ID/status | jq '.status'
```

### 问题 3: 没有收到进度事件
**可能原因**：WorkflowManager 未启用

**检查日志**：
```bash
# 查看服务器日志中是否有：
# [WorkflowManager] Manager initialized
# [DeepResearchWorkflow] Starting research
```

### 问题 4: 研究一直处于 running 状态
**可能原因**：
1. Agent 正在工作（正常）
2. API 密钥无效
3. 达到预算限制

**检查**：
```bash
# 查看来源数量是否增加
curl -s http://localhost:3000/api/research/$SESSION_ID/status | jq '.sourcesCount'

# 稍后再查一次
sleep 10
curl -s http://localhost:3000/api/research/$SESSION_ID/status | jq '.sourcesCount'
```

---

## 📈 性能基准

**正常表现**：
- 研究启动时间: < 1秒
- SSE 连接建立: < 100ms
- 进度更新延迟: < 500ms
- 基础研究完成: 2-5分钟
- 来源收集: 50-100个（取决于查询）

---

## 🎯 推荐测试流程

### 第一次测试（5分钟）
1. 运行 `./test-phase5-simple.sh`
2. 观察 SSE 流输出
3. 等待研究完成
4. 查看最终状态

### 深度测试（15分钟）
1. 手动测试基础研究（方法2）
2. 测试取消功能（方法3）
3. 测试混合研究（方法4）

### 完整验证（30分钟）
1. 运行完整测试套件（方法5）
2. 检查生成的测试报告
3. 验证所有功能清单

---

## 📝 测试报告模板

```markdown
# Phase 5 测试报告

**测试日期**: 2026-01-20
**测试人员**: [你的名字]

## 测试结果

### 基础功能测试
- [ ] 会话创建: ✅/❌
- [ ] SSE 流: ✅/❌
- [ ] 进度追踪: ✅/❌
- [ ] 报告生成: ✅/❌

### 高级功能测试
- [ ] 研究取消: ✅/❌
- [ ] 混合研究: ✅/❌

### 性能指标
- 研究完成时间: ___ 分钟
- 来源收集数量: ___ 个
- SSE 延迟: ___ ms

### 问题记录
1. [描述发现的问题]
2. [描述发现的问题]

### 总体评价
✅ 通过 / ❌ 未通过

### 备注
[其他观察和建议]
```

---

## 🚀 快速命令参考

```bash
# 启动研究
curl -X POST http://localhost:3000/api/research/start \
  -H "Content-Type: application/json" \
  -d '{"query":"测试查询","maxBudget":0.5}'

# 查看状态
curl http://localhost:3000/api/research/{SESSION_ID}/status | jq

# SSE 流
curl -N http://localhost:3000/api/research/{SESSION_ID}/stream

# 取消研究
curl -X POST http://localhost:3000/api/research/{SESSION_ID}/cancel

# 健康检查
curl http://localhost:3000/health
```

---

**祝测试顺利！** 🎉

如有问题，请查看：
- `docs/PHASE5_COMPLETE.md` - 完整实现文档
- 服务器日志输出
- `dev.db` 数据库（使用 `pnpm exec prisma studio`）
