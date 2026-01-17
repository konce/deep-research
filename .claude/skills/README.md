# Deep Research Agent - Skills

Custom skills for Claude Code to manage this project.

## Available Skills

### 🚀 /start
启动开发服务器（API + Web）
- Checks dependencies
- Initializes database if needed
- Starts both servers
- **Usage**: `/start`

### 🔍 /status
检查项目状态
- Dependencies installed?
- Database exists?
- Servers running?
- Endpoints responding?
- **Usage**: `/status`

### 🗄️ /db
数据库操作
- `/db studio` - Open Prisma Studio
- `/db push` - Sync schema to database
- `/db generate` - Generate Prisma Client
- `/db reset` - Reset database
- **Usage**: `/db [command]`

### 📋 /plan
查看实施计划
- `/plan` - View full implementation plan
- `/plan status` - View current status
- `/plan phase2` - View Phase 2 tasks
- **Usage**: `/plan [option]`

### 🧪 /test
运行测试
- `/test all` - Run all tests
- `/test types` - TypeScript type check
- `/test api` - Test API endpoints
- `/test db` - Test database operations
- `/test build` - Test build
- **Usage**: `/test [target]`

### 🎯 /phase2
开始 Phase 2 开发
- Shows Phase 2 overview
- Lists tasks and files to create
- Provides next steps
- **Usage**: `/phase2`

## Quick Reference

```bash
# Start working
/start

# Check everything is ok
/status

# View what to do next
/plan status

# Start Phase 2
/phase2

# Test your changes
/test all
```

## Implementation Notes

Skills are markdown files in `.claude/skills/` directory.
Each skill describes:
- Usage
- What it does
- Implementation commands
- Expected output

## Add New Skills

Create a new `.md` file in this directory with:
```markdown
# Skill Name

Description

## Usage
\`\`\`bash
/skillname
\`\`\`

## What it does
...

## Implementation
\`\`\`bash
command to run
\`\`\`
```

## Related Files

- `CLAUDE.md` - Main context document for Claude
- `IMPLEMENTATION_PLAN.md` - Full 11-day plan
- `PROJECT_STATUS.md` - Current status
- `RECOVERY_GUIDE.md` - How to recover/restart
