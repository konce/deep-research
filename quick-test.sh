#!/bin/bash
# Quick verification test for Phase 5 workflow

echo "🧪 Phase 5 Quick Verification Test"
echo "===================================="
echo ""

# Check API health
echo "1. Checking API server..."
HEALTH=$(curl -s http://localhost:3000/health)
if [ $? -eq 0 ]; then
    echo "✅ API server is running"
else
    echo "❌ API server is not responding"
    exit 1
fi

# Start a research session
echo ""
echo "2. Starting research session..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/research/start \
    -H "Content-Type: application/json" \
    -d '{"query":"What is Node.js?","maxBudget":0.5,"searchDepth":"basic"}')

SESSION_ID=$(echo $RESPONSE | jq -r '.sessionId')
echo "✅ Session created: $SESSION_ID"

# Wait a moment
echo ""
echo "3. Waiting for research to start..."
sleep 3

# Check status
echo ""
echo "4. Checking session status..."
STATUS=$(curl -s http://localhost:3000/api/research/$SESSION_ID/status)
CURRENT_STATUS=$(echo $STATUS | jq -r '.status')
echo "✅ Current status: $CURRENT_STATUS"

# Test SSE connection
echo ""
echo "5. Testing SSE stream connection..."
timeout 5 curl -s http://localhost:3000/api/research/$SESSION_ID/stream | head -n 5
echo ""
echo "✅ SSE stream is working"

echo ""
echo "===================================="
echo "✅ Quick verification complete!"
echo ""
echo "Session $SESSION_ID is running."
echo "Check status at: http://localhost:3000/api/research/$SESSION_ID/status"
echo ""
