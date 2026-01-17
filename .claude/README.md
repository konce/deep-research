# .claude Directory

This directory contains Claude Code specific configurations and skills for the Deep Research Agent project.

## Structure

```
.claude/
├── README.md              # This file
└── skills/                # Custom skills for Claude Code
    ├── README.md          # Skills documentation
    ├── start.md           # Start development servers
    ├── status.md          # Check project status
    ├── db.md              # Database operations
    ├── plan.md            # View implementation plan
    ├── test.md            # Run tests
    └── phase2.md          # Start Phase 2 development
```

## What are Skills?

Skills are custom commands that help Claude Code understand and work with this specific project. They provide shortcuts for common tasks.

## How to Use Skills

In Claude Code, type `/` followed by the skill name:

```bash
/start       # Start the development servers
/status      # Check if everything is running
/plan        # View the implementation plan
/phase2      # Start working on Phase 2
```

## Main Context Document

See `../CLAUDE.md` at the project root - this is the main context document that Claude reads to understand the project.

## Adding New Skills

1. Create a new `.md` file in `skills/`
2. Follow the format of existing skills
3. Document it in `skills/README.md`

## Related Documentation

- `../CLAUDE.md` - Main context for Claude (most important!)
- `../IMPLEMENTATION_PLAN.md` - Full 11-day implementation plan
- `../PROJECT_STATUS.md` - Current project status
- `../RECOVERY_GUIDE.md` - How to recover/restart work

---

**Purpose**: Make it easy for Claude to help you work on this project efficiently.
