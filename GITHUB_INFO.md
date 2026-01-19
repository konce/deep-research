# GitHub 仓库信息

## 📦 仓库地址

**https://github.com/konce/deep-research**

---

## 🔄 Git 操作

### Clone 仓库

**HTTPS**:
```bash
git clone https://github.com/konce/deep-research.git
cd deep-research
```

**SSH** (推荐):
```bash
git clone git@github.com:konce/deep-research.git
cd deep-research
```

### 初始设置

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，添加你的 API keys

# 3. 初始化数据库
pnpm exec prisma generate
pnpm exec prisma db push

# 4. 启动开发服务器
pnpm dev
```

---

## 📤 推送更改

### 日常提交

```bash
# 1. 查看更改
git status

# 2. 添加文件
git add .

# 3. 提交
git commit -m "feat: 添加新功能"

# 4. 推送
git push
```

### 提交信息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
feat: 新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式（不影响功能）
refactor: 重构代码
test: 测试相关
chore: 构建/工具相关
```

**示例**:
```bash
git commit -m "feat: Add Tavily search integration"
git commit -m "fix: Fix database connection error"
git commit -m "docs: Update README with setup instructions"
```

---

## 🔒 安全提醒

### 永远不要提交的文件

以下文件已在 `.gitignore` 中配置，**不会被上传**：

- ✅ `.env` - 包含 API keys
- ✅ `node_modules/` - 依赖包
- ✅ `dev.db` - 本地数据库
- ✅ `.env*.local` - 本地环境配置
- ✅ `dist/`, `build/` - 构建产物

### 如果不小心提交了敏感信息

```bash
# 1. 从历史中删除文件
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# 2. 强制推送
git push origin --force --all

# 3. 立即更换泄露的 API keys！
```

---

## 🌿 分支管理

### 当前分支

- `main` - 主分支，稳定版本

### 创建新分支（用于新功能）

```bash
# 创建并切换到新分支
git checkout -b feature/phase2-agent-service

# 开发完成后推送
git push -u origin feature/phase2-agent-service

# 在 GitHub 创建 Pull Request
```

### 合并分支

```bash
# 切回 main
git checkout main

# 合并功能分支
git merge feature/phase2-agent-service

# 推送
git push
```

---

## 📊 查看仓库信息

### 查看提交历史

```bash
git log --oneline --graph
```

### 查看远程信息

```bash
git remote -v
```

### 查看当前状态

```bash
git status
```

---

## 🤝 协作开发

### 如果有其他人协作

**1. 保持同步**:
```bash
git pull origin main
```

**2. 解决冲突**:
```bash
# 如果有冲突，手动编辑文件解决
git add .
git commit -m "merge: Resolve conflicts"
git push
```

**3. 使用 Pull Request**:
- 在新分支开发
- 推送到 GitHub
- 在网页上创建 PR
- Code Review 后合并

---

## 📋 GitHub 仓库设置建议

### 在 GitHub 网页上

**1. 添加描述**:
```
Deep Research Agent - AI-powered research assistant using Claude Agent SDK
```

**2. 添加 Topics**:
- `typescript`
- `react`
- `claude`
- `ai-agent`
- `research`
- `express`
- `prisma`
- `monorepo`

**3. 设置 About**:
- Website: (如果有演示网站)
- Description: 简短介绍

**4. 添加 LICENSE**:
```bash
# 如果需要，添加 MIT License
echo "MIT License" > LICENSE
git add LICENSE
git commit -m "chore: Add MIT License"
git push
```

---

## 🔧 常见问题

### Q: 推送失败 "Permission denied"

**A**: 检查 SSH 密钥配置
```bash
ssh -T git@github.com
# 应该显示: Hi konce! You've successfully authenticated...
```

### Q: 推送失败 "rejected"

**A**: 先拉取远程更改
```bash
git pull origin main --rebase
git push
```

### Q: 如何撤销最后一次提交

**A**:
```bash
# 撤销提交但保留更改
git reset --soft HEAD^

# 完全撤销（慎用！）
git reset --hard HEAD^
```

### Q: 如何查看某个文件的历史

**A**:
```bash
git log -p apps/api/src/index.ts
```

---

## 📈 发布 Release

### 创建版本标签

```bash
# 创建标签
git tag -a v1.0.0 -m "Phase 1 Complete"

# 推送标签
git push origin v1.0.0
```

### 在 GitHub 创建 Release

1. 访问 https://github.com/konce/deep-research/releases
2. 点击 "Create a new release"
3. 选择标签 v1.0.0
4. 填写 Release notes
5. 发布

---

## 🌐 Clone 后的快速开始

**完整流程**:

```bash
# 1. Clone 仓库
git clone git@github.com:konce/deep-research.git
cd deep-research

# 2. 安装依赖
pnpm install

# 3. 配置环境
cp .env.example .env
# 编辑 .env，添加 API keys

# 4. 初始化数据库
pnpm exec prisma generate
pnpm exec prisma db push

# 5. 启动项目
./start.sh
# 或
pnpm dev

# 6. 访问
open http://localhost:5173
```

---

**仓库**: https://github.com/konce/deep-research
**创建时间**: 2026-01-17
**当前状态**: Phase 1 完成，准备 Phase 2
