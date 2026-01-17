# Deep Research Agent

A powerful deep research agent powered by Claude Agent SDK that can autonomously conduct comprehensive research, integrate multiple data sources, and generate detailed reports.

## Features

- 🔍 **Intelligent Web Search**: Automated web search using Tavily API
- 📄 **Multi-source Integration**: Process documents (PDF, DOCX), APIs, and web content
- 🧠 **Deep Analysis**: Leverage Claude's extended thinking for thorough analysis
- 📝 **Report Generation**: Automatically generate structured Markdown reports
- 🌐 **Modern Web UI**: Real-time progress tracking and report viewing
- ⚡ **Fast & Efficient**: Streaming updates with Server-Sent Events

## Tech Stack

### Backend
- Node.js 18+ with TypeScript
- Express.js
- Claude Agent SDK
- Tavily API
- PostgreSQL + Prisma ORM

### Frontend
- React 18 + TypeScript
- Vite
- TailwindCSS + shadcn/ui
- TanStack Query
- react-markdown

## Prerequisites

- Node.js 18 or higher
- pnpm 8 or higher
- PostgreSQL database
- Anthropic API key
- Tavily API key

## Getting Started

### 1. Clone and Install

```bash
cd deep-research
pnpm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
- `ANTHROPIC_API_KEY`: Get from https://console.anthropic.com
- `TAVILY_API_KEY`: Get from https://tavily.com
- `DATABASE_URL`: Your PostgreSQL connection string

### 3. Set Up Database

```bash
pnpm db:push
```

### 4. Start Development Servers

```bash
pnpm dev
```

This will start:
- API server at http://localhost:3000
- Web UI at http://localhost:5173

## Project Structure

```
deep-research/
├── apps/
│   ├── api/          # Express backend with Agent SDK
│   └── web/          # React frontend
├── packages/
│   └── shared-types/ # Shared TypeScript types
├── prisma/           # Database schema
└── turbo.json        # Turborepo configuration
```

## Usage

1. Open the web interface at http://localhost:5173
2. Enter your research query
3. Watch as the agent:
   - Searches the web for information
   - Analyzes and synthesizes findings
   - Generates a comprehensive report
4. View, download, or manage your research reports

## Development

```bash
# Run development servers
pnpm dev

# Build for production
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint

# Type check
pnpm typecheck

# Open Prisma Studio
pnpm db:studio
```

## Architecture

The system uses Claude Agent SDK with custom MCP tools:

- **web_search**: Search the web using Tavily API
- **document_reader**: Process and extract text from documents
- **report_writer**: Generate structured Markdown reports

The agent follows a multi-phase workflow:
1. Query understanding and planning
2. Information collection (web search, documents)
3. Deep analysis and synthesis
4. Report generation

## Cost Management

- Default budget limit: $3.00 per research session
- Configurable in the UI
- Cost tracking stored in database
- Real-time cost display

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
