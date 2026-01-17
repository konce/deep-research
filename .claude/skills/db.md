# Database Operations

数据库相关操作

## Usage

### Open Database Studio
```bash
/db studio
```
在浏览器中打开 Prisma Studio 可视化管理数据库

### Sync Database Schema
```bash
/db push
```
将 Prisma schema 同步到数据库

### Generate Prisma Client
```bash
/db generate
```
生成 Prisma Client 代码

### Reset Database
```bash
/db reset
```
删除并重建数据库（慎用！）

## Implementation

```bash
# Studio
pnpm exec prisma studio

# Push schema
pnpm exec prisma db push

# Generate client
pnpm exec prisma generate

# Reset (删除 dev.db 并重新 push)
rm dev.db && pnpm exec prisma db push
```

## Database Info

- Type: SQLite
- File: `./dev.db`
- Schema: `./prisma/schema.prisma`
- Models: ResearchSession, Source, Report, ResearchMessage, Document
