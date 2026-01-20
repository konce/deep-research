#!/bin/bash
echo "🧪 Phase 5 快速测试"
echo "=================="
echo ""

# 1. 启动研究
echo "1️⃣ 启动研究会话..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/research/start \
  -H "Content-Type: application/json" \
  -d '{"query":"What is Python programming language?","maxBudget":0.5,"searchDepth":"basic"}')

SESSION_ID=$(echo $RESPONSE | jq -r '.sessionId')
echo "✅ 会话ID: $SESSION_ID"
echo ""

# 2. 等待几秒
echo "2️⃣ 等待研究开始..."
sleep 5
echo ""

# 3. 查看状态
echo "3️⃣ 查看当前状态:"
curl -s http://localhost:3000/api/research/$SESSION_ID/status | jq '{
  状态: .status,
  已收集来源: .sourcesCount,
  报告生成: .hasReport
}'
echo ""

# 4. 测试SSE流（显示前10个事件）
echo "4️⃣ SSE 流测试（前10个事件）:"
echo "监听地址: http://localhost:3000/api/research/$SESSION_ID/stream"
curl -s -N http://localhost:3000/api/research/$SESSION_ID/stream | head -n 10
echo ""

echo ""
echo "=================="
echo "✅ 快速测试完成！"
echo ""
echo "查看完整状态:"
echo "  curl http://localhost:3000/api/research/$SESSION_ID/status | jq"
echo ""
echo "持续监听进度:"
echo "  curl -N http://localhost:3000/api/research/$SESSION_ID/stream"
echo ""
