# Check Project Status

检查项目状态，包括服务运行情况、数据库、配置等

## Usage

```bash
/status
```

## What it does

1. 检查依赖安装状态
2. 检查数据库文件
3. 检查配置文件
4. 检查运行中的服务 (API/Web)
5. 测试端点响应
6. 显示文档列表

## Implementation

Run: `./check-status.sh`

## Expected Output

```
✅ node_modules 已安装
✅ dev.db 存在
✅ .env 存在
✅ API 服务器运行中
✅ Web 前端运行中
```
