# Start Development Servers

启动 Deep Research Agent 开发服务器

## Usage

```bash
/start
```

## What it does

1. 检查依赖是否安装
2. 检查数据库是否初始化
3. 启动 API 服务器 (localhost:3000)
4. 启动 Web 前端 (localhost:5173)

## Implementation

Run: `./start.sh`

Or manually:
```bash
pnpm dev
```

## Output

- API: http://localhost:3000
- Web: http://localhost:5173
- Health check: http://localhost:3000/health
