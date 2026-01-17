# Test Project

测试项目的各个部分

## Usage

### Test All
```bash
/test all
```
运行所有测试（类型检查、构建、端点测试）

### Test TypeScript
```bash
/test types
```
运行 TypeScript 类型检查

### Test API Endpoints
```bash
/test api
```
测试所有 API 端点

### Test Database
```bash
/test db
```
测试数据库 CRUD 操作

### Test Build
```bash
/test build
```
测试构建是否成功

## Implementation

```bash
# TypeScript type check
pnpm typecheck

# Build all packages
pnpm build

# API endpoints (requires server running)
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/research/start \
  -H 'Content-Type: application/json' \
  -d '{"query":"test"}'

# Database test (create test script)
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const session = await prisma.researchSession.create({
    data: { query: 'test', status: 'pending' }
  });
  console.log('✅ Database working:', session.id);
  await prisma.researchSession.delete({ where: { id: session.id } });
  await prisma.\$disconnect();
}
test();
"
```

## Test Coverage

✅ TypeScript 类型检查
✅ 数据库 CRUD 操作 (7 种操作)
✅ API 端点响应 (8/8 端点)
✅ 请求验证 (400 错误)
✅ 错误处理
✅ 前端路由
✅ CORS 配置
