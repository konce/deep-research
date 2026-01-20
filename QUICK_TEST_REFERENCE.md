# Phase 5 快速测试参考

## 🚀 常用命令

### 1. 启动新研究
```bash
curl -X POST http://localhost:3000/api/research/start \
  -H "Content-Type: application/json" \
  -d '{"query":"你的问题","maxBudget":0.5}'
```

### 2. 监控研究进度
```bash
./monitor-research.sh <SESSION_ID>
```

### 3. 查看研究状态
```bash
curl http://localhost:3000/api/research/<SESSION_ID>/status | jq
```

### 4. SSE 实时流
```bash
curl -N http://localhost:3000/api/research/<SESSION_ID>/stream
```

### 5. 取消研究
```bash
curl -X POST http://localhost:3000/api/research/<SESSION_ID>/cancel
```

---

## 🧪 测试脚本

| 脚本 | 用途 | 耗时 |
|------|------|------|
| `./test-phase5-simple.sh` | 快速验证测试 | 1分钟 |
| `./monitor-research.sh` | 实时监控进度 | 持续 |
| `npx tsx test-workflow.ts` | 完整测试套件 | 15分钟 |

---

## 📊 状态字段说明

```json
{
  "status": "running",        // pending|running|completed|failed|cancelled
  "query": "研究问题",
  "sourcesCount": 116,        // 已收集的来源数量
  "hasReport": false,         // 是否已生成报告
  "createdAt": "...",         // 创建时间
  "completedAt": null         // 完成时间
}
```

---

## 🎯 测试检查清单

- [ ] 创建研究会话成功
- [ ] SSE 流连接正常
- [ ] 收到实时进度更新
- [ ] 来源数量持续增加
- [ ] 研究成功完成
- [ ] 报告已生成

---

## 📚 详细文档

- `TEST_PHASE5.md` - 完整测试指南
- `docs/PHASE5_COMPLETE.md` - 技术文档
