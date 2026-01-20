#!/bin/bash
# 实时监控研究进度

if [ -z "$1" ]; then
    echo "用法: ./monitor-research.sh <SESSION_ID>"
    echo ""
    echo "示例:"
    echo "  ./monitor-research.sh cmkmdbbw9006zlrqfitsz518s"
    exit 1
fi

SESSION_ID=$1

echo "🔍 监控研究会话: $SESSION_ID"
echo "================================"
echo ""
echo "按 Ctrl+C 停止监控"
echo ""

while true; do
    RESPONSE=$(curl -s http://localhost:3000/api/research/$SESSION_ID/status)
    STATUS=$(echo $RESPONSE | jq -r '.status')
    SOURCES=$(echo $RESPONSE | jq -r '.sourcesCount')
    HAS_REPORT=$(echo $RESPONSE | jq -r '.hasReport')
    
    TIMESTAMP=$(date +"%H:%M:%S")
    
    if [ "$HAS_REPORT" = "true" ]; then
        REPORT_ICON="📄"
    else
        REPORT_ICON="⏳"
    fi
    
    printf "\r[%s] 状态: %-12s | 来源: %-4s | 报告: %s " "$TIMESTAMP" "$STATUS" "$SOURCES" "$REPORT_ICON"
    
    if [ "$STATUS" = "completed" ]; then
        echo ""
        echo ""
        echo "================================"
        echo "✅ 研究已完成！"
        echo ""
        echo "最终统计:"
        curl -s http://localhost:3000/api/research/$SESSION_ID/status | jq '{
          query: .query,
          sourcesCount: .sourcesCount,
          hasReport: .hasReport,
          completedAt: .completedAt
        }'
        break
    elif [ "$STATUS" = "failed" ]; then
        echo ""
        echo ""
        echo "❌ 研究失败"
        break
    elif [ "$STATUS" = "cancelled" ]; then
        echo ""
        echo ""
        echo "🛑 研究已取消"
        break
    fi
    
    sleep 2
done
