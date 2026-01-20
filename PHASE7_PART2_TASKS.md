# Phase 7 Part 2: React UI Components - Task List

**Status**: 🔴 Not Started
**Prerequisite**: Part 1 Complete ✅ (Commit: 8838b87)
**Estimated Time**: 3-4 hours
**Estimated Code**: ~1,200 lines

---

## 📋 Quick Start for New Session

### Context
You are continuing Phase 7 Part 2 of the Deep Research Agent project. Part 1 (infrastructure, API functions, and custom hooks) is complete and committed. Your task is to create React UI components that use these hooks.

### Verify Prerequisites
```bash
# 1. Check you're in the right directory
pwd
# Should be: /Users/bytedance/repos/claude-agent-sdk-demo/deep-research

# 2. Verify Part 1 is committed
git log --oneline -1
# Should show: 8838b87 wip: Phase 7 - Frontend Infrastructure Complete

# 3. Check existing structure
ls -la apps/web/src/api/
ls -la apps/web/src/hooks/
# Should see: queryClient.ts, research.ts, reports.ts in api/
# Should see: useSSE.ts, useResearch.ts, useReports.ts in hooks/

# 4. Verify dependencies installed
grep -A 10 "dependencies" apps/web/package.json | grep -E "(react-markdown|highlight|lucide)"
# Should see: react-markdown, highlight.js, lucide-react

# 5. Verify types pass
pnpm typecheck
# Should see: "Tasks: 3 successful"
```

### Available Resources
- **Hooks**: `apps/web/src/hooks/useResearch.ts`, `useReports.ts`, `useSSE.ts`
- **API**: `apps/web/src/api/research.ts`, `reports.ts`
- **Types**: `packages/shared-types/src/`
- **Icons**: `lucide-react` (Search, FileText, Download, Trash2, ChevronDown, etc.)
- **Styling**: Tailwind CSS (already configured)

---

## 🎯 Task Checklist

### Phase 1: Core Components (Priority 1)
- [ ] **Task 1**: Create `QueryInput` component (~120 lines)
- [ ] **Task 2**: Create `ResearchProgress` component (~150 lines)
- [ ] **Task 3**: Create `MarkdownViewer` component (~100 lines)
- [ ] **Task 4**: Create Markdown CSS styling (~150 lines)

### Phase 2: Report Components (Priority 2)
- [ ] **Task 5**: Create `ReportHeader` component (~100 lines)
- [ ] **Task 6**: Create `ReportsList` component (~150 lines)
- [ ] **Task 7**: Create `ReportsFilter` component (~120 lines)

### Phase 3: Page Integration (Priority 3)
- [ ] **Task 8**: Update Home page with QueryInput (~50 lines)
- [ ] **Task 9**: Update Research page with ResearchProgress (~80 lines)
- [ ] **Task 10**: Update Reports page with list and filter (~100 lines)

### Phase 4: Testing & Documentation (Priority 4)
- [ ] **Task 11**: Manual testing of all flows
- [ ] **Task 12**: Create PHASE7_COMPLETE.md documentation

---

## 📝 Detailed Task Specifications

### Task 1: QueryInput Component ⭐ START HERE

**File**: `apps/web/src/components/research/QueryInput.tsx`

**Purpose**: Form for starting new research sessions

**Hooks to Use**:
```typescript
import { useStartResearch } from '../../hooks/useResearch';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
```

**State Requirements**:
```typescript
const [query, setQuery] = useState('');
const [maxBudget, setMaxBudget] = useState(2.0);
const [searchDepth, setSearchDepth] = useState<'basic' | 'advanced'>('basic');
```

**Component Structure**:
```typescript
export function QueryInput() {
  const navigate = useNavigate();
  const { mutate: startResearch, isPending, error } = useStartResearch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    startResearch(
      { query, maxBudget, searchDepth },
      {
        onSuccess: (session) => {
          navigate(`/research/${session.id}`);
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="...">
      {/* Query input */}
      <div>
        <label>Research Query</label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What would you like to research?"
          rows={4}
        />
      </div>

      {/* Budget slider */}
      <div>
        <label>Max Budget: ${maxBudget.toFixed(2)}</label>
        <input
          type="range"
          min="0.5"
          max="5.0"
          step="0.5"
          value={maxBudget}
          onChange={(e) => setMaxBudget(parseFloat(e.target.value))}
        />
      </div>

      {/* Search depth selector */}
      <div>
        <label>Search Depth</label>
        <select
          value={searchDepth}
          onChange={(e) => setSearchDepth(e.target.value as 'basic' | 'advanced')}
        >
          <option value="basic">Basic</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Error display */}
      {error && (
        <div className="text-red-600">
          {error instanceof Error ? error.message : 'Failed to start research'}
        </div>
      )}

      {/* Submit button */}
      <button type="submit" disabled={isPending || !query.trim()}>
        <Search className="w-4 h-4" />
        {isPending ? 'Starting...' : 'Start Research'}
      </button>
    </form>
  );
}
```

**Styling Guidelines**:
- Use Tailwind utility classes
- Form should be centered, max-width: 600px
- Button should have primary color, disabled state
- Inputs should have border, rounded corners
- Error message should be red, below inputs

**Testing**:
```bash
# After creating component:
# 1. Import in Home page
# 2. Start dev server: pnpm dev
# 3. Visit http://localhost:5173
# 4. Try submitting form
# 5. Should navigate to /research/:id
```

**Success Criteria**:
- [ ] Form renders without errors
- [ ] Can type in query textarea
- [ ] Budget slider works (0.5 - 5.0)
- [ ] Search depth selector works
- [ ] Submit creates research and navigates
- [ ] Error displays if API fails
- [ ] Button disabled when loading or empty query

---

### Task 2: ResearchProgress Component ⭐

**File**: `apps/web/src/components/research/ResearchProgress.tsx`

**Purpose**: Display real-time research progress with SSE updates

**Hooks to Use**:
```typescript
import { useResearchWithStream } from '../../hooks/useResearch';
import { Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
```

**Props**:
```typescript
interface ResearchProgressProps {
  researchId: string;
}
```

**Component Structure**:
```typescript
export function ResearchProgress({ researchId }: ResearchProgressProps) {
  const {
    session,
    status,
    currentStage,
    sourcesCount,
    messages,
    isLoading,
    isRunning,
    isComplete,
    isFailed,
    error,
    cancel,
  } = useResearchWithStream(researchId);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.toString()}</div>;
  }

  return (
    <div className="space-y-4">
      {/* Status header */}
      <div className="flex items-center justify-between">
        <h2>Research Progress</h2>
        <StatusBadge status={status} />
      </div>

      {/* Current stage */}
      {currentStage && (
        <div>
          <label>Current Stage:</label>
          <p>{currentStage}</p>
        </div>
      )}

      {/* Sources counter */}
      <div>
        <label>Sources Collected:</label>
        <p>{sourcesCount}</p>
      </div>

      {/* Progress messages */}
      <div>
        <h3>Activity Log</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {messages.map((msg, idx) => (
            <MessageItem key={idx} message={msg} />
          ))}
        </div>
      </div>

      {/* Cancel button */}
      {isRunning && (
        <button onClick={cancel} className="text-red-600">
          <X className="w-4 h-4" />
          Cancel Research
        </button>
      )}

      {/* Completion message */}
      {isComplete && (
        <div className="text-green-600">
          <CheckCircle className="w-5 h-5" />
          Research completed!
        </div>
      )}
    </div>
  );
}

// Helper components
function StatusBadge({ status }: { status?: string }) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-sm ${colors[status as keyof typeof colors] || ''}`}>
      {status}
    </span>
  );
}

function MessageItem({ message }: { message: any }) {
  return (
    <div className="text-sm border-l-2 border-gray-300 pl-3 py-1">
      <div className="font-medium">{message.type}</div>
      {message.content && (
        <div className="text-gray-600">{JSON.stringify(message.content).slice(0, 100)}...</div>
      )}
    </div>
  );
}
```

**Testing**:
```bash
# 1. Start a research session
# 2. Navigate to /research/:id
# 3. Should see real-time updates
# 4. Cancel button should work
```

**Success Criteria**:
- [ ] Displays research status
- [ ] Shows current stage
- [ ] Updates sources count in real-time
- [ ] Displays message stream
- [ ] Cancel button works
- [ ] Shows completion/error states

---

### Task 3: MarkdownViewer Component ⭐

**File**: `apps/web/src/components/report/MarkdownViewer.tsx`

**Purpose**: Render Markdown content with syntax highlighting

**Dependencies**:
```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; // or another theme
```

**Props**:
```typescript
interface MarkdownViewerProps {
  content: string;
  className?: string;
}
```

**Component Structure**:
```typescript
export function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Custom renderers
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return inline ? (
              <code className={className} {...props}>
                {children}
              </code>
            ) : (
              <div className="relative">
                {match && (
                  <div className="absolute top-2 right-2 text-xs text-gray-500">
                    {match[1]}
                  </div>
                )}
                <pre className={className}>
                  <code {...props}>{children}</code>
                </pre>
              </div>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

**Testing**:
```typescript
// Test with sample Markdown
const sampleMarkdown = `
# Test Report

## Introduction

This is a **test** report with *various* elements.

### Code Example

\`\`\`typescript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

### Table

| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |

> This is a blockquote.

[Link to Google](https://google.com)
`;
```

**Success Criteria**:
- [ ] Renders headings correctly
- [ ] Code blocks have syntax highlighting
- [ ] Tables are properly formatted
- [ ] Links open in new tab
- [ ] Blockquotes are styled
- [ ] Inline code is distinct

---

### Task 4: Markdown CSS Styling ⭐

**File**: `apps/web/src/styles/markdown.css`

**Purpose**: Professional styling for rendered Markdown

**Import in**: `apps/web/src/main.tsx` or `index.css`

**Full CSS Template**:
```css
/* Markdown Content Styling */
.markdown-content {
  /* Base typography */
  font-size: 1rem;
  line-height: 1.7;
  color: #374151;
  max-width: 100%;
}

/* Headings */
.markdown-content h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 1rem;
  line-height: 1.2;
  color: #111827;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.markdown-content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: #1f2937;
}

.markdown-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.5rem;
  color: #374151;
}

.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

/* Paragraphs */
.markdown-content p {
  margin-bottom: 1rem;
}

/* Links */
.markdown-content a {
  color: #3b82f6;
  text-decoration: underline;
  transition: color 0.2s;
}

.markdown-content a:hover {
  color: #2563eb;
}

/* Lists */
.markdown-content ul,
.markdown-content ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.markdown-content li {
  margin-bottom: 0.25rem;
}

/* Code */
.markdown-content code {
  background-color: #f3f4f6;
  color: #dc2626;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: 'Courier New', Courier, monospace;
}

.markdown-content pre {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.markdown-content pre code {
  background-color: transparent;
  color: inherit;
  padding: 0;
  font-size: 0.875rem;
  line-height: 1.5;
}

/* Tables */
.markdown-content table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.markdown-content th,
.markdown-content td {
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  text-align: left;
}

.markdown-content th {
  background-color: #f3f4f6;
  font-weight: 600;
  color: #111827;
}

.markdown-content tr:nth-child(even) {
  background-color: #f9fafb;
}

/* Blockquotes */
.markdown-content blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #6b7280;
  font-style: italic;
}

/* Horizontal Rules */
.markdown-content hr {
  border: none;
  border-top: 2px solid #e5e7eb;
  margin: 2rem 0;
}

/* Images */
.markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

/* Inline elements */
.markdown-content strong {
  font-weight: 600;
  color: #111827;
}

.markdown-content em {
  font-style: italic;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .markdown-content {
    font-size: 0.875rem;
  }

  .markdown-content h1 {
    font-size: 1.5rem;
  }

  .markdown-content h2 {
    font-size: 1.25rem;
  }

  .markdown-content pre {
    padding: 0.75rem;
    font-size: 0.75rem;
  }
}
```

**Import Instructions**:
```typescript
// In apps/web/src/main.tsx or apps/web/src/index.css
import './styles/markdown.css';
```

**Testing**:
- Use MarkdownViewer with various Markdown examples
- Check all elements are styled correctly
- Test responsive design on mobile

**Success Criteria**:
- [ ] All Markdown elements have proper styling
- [ ] Code blocks are readable
- [ ] Tables are well-formatted
- [ ] Responsive on mobile

---

### Task 5: ReportHeader Component

**File**: `apps/web/src/components/report/ReportHeader.tsx`

**Purpose**: Report metadata and action buttons

**Hooks to Use**:
```typescript
import { useDownloadReport, useDeleteReport } from '../../hooks/useReports';
import { Download, Trash2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
```

**Props**:
```typescript
interface ReportHeaderProps {
  report: {
    id: string;
    title: string;
    createdAt: string;
    statistics: {
      wordCount: number;
      estimatedReadingTime: number;
    };
  };
}
```

**Component Structure**:
```typescript
export function ReportHeader({ report }: ReportHeaderProps) {
  const navigate = useNavigate();
  const { mutate: download } = useDownloadReport();
  const { mutate: deleteReport, isPending: isDeleting } = useDeleteReport();

  const handleDownload = (format: 'markdown' | 'txt') => {
    download({ id: report.id, format });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this report?')) {
      deleteReport(report.id, {
        onSuccess: () => {
          navigate('/reports');
        },
      });
    }
  };

  return (
    <div className="border-b pb-4 mb-6">
      {/* Back button */}
      <button onClick={() => navigate('/reports')} className="mb-4">
        <ArrowLeft className="w-4 h-4" />
        Back to Reports
      </button>

      {/* Title and metadata */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">{report.title}</h1>
          <div className="flex gap-4 text-sm text-gray-600">
            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
            <span>{report.statistics.wordCount.toLocaleString()} words</span>
            <span>{report.statistics.estimatedReadingTime} min read</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button onClick={() => handleDownload('markdown')}>
            <Download className="w-4 h-4" />
            Download MD
          </button>
          <button onClick={() => handleDownload('txt')}>
            <Download className="w-4 h-4" />
            Download TXT
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Success Criteria**:
- [ ] Displays report title and metadata
- [ ] Download buttons work (both formats)
- [ ] Delete button shows confirmation
- [ ] Navigates back to reports after delete
- [ ] Back button works

---

### Task 6: ReportsList Component

**File**: `apps/web/src/components/library/ReportsList.tsx`

**Purpose**: Display paginated list of reports

**Hooks to Use**:
```typescript
import { useReportsList } from '../../hooks/useReports';
import { FileText, Calendar, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
```

**Props**:
```typescript
interface ReportsListProps {
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'title';
  order?: 'asc' | 'desc';
}
```

**Component Structure**:
```typescript
export function ReportsList({ limit = 20, offset = 0, sortBy = 'createdAt', order = 'desc' }: ReportsListProps) {
  const navigate = useNavigate();
  const { data, isLoading, error } = useReportsList({ limit, offset, sortBy, order });

  if (isLoading) {
    return <div>Loading reports...</div>;
  }

  if (error) {
    return <div>Error loading reports</div>;
  }

  if (data?.reports.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">No reports yet</p>
        <button onClick={() => navigate('/')} className="mt-4">
          Start Your First Research
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data?.reports.map((report) => (
        <ReportCard
          key={report.id}
          report={report}
          onClick={() => navigate(`/reports/${report.id}`)}
        />
      ))}

      {/* Pagination info */}
      {data?.pagination && (
        <div className="text-sm text-gray-600 text-center">
          Showing {offset + 1} - {Math.min(offset + limit, data.pagination.total)} of {data.pagination.total} reports
        </div>
      )}
    </div>
  );
}

function ReportCard({ report, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">{report.title}</h3>
          <div className="flex gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(report.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              {report.researchSession.sourcesCount} sources
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {report.researchSession.status}
        </div>
      </div>
    </div>
  );
}
```

**Success Criteria**:
- [ ] Displays list of reports
- [ ] Empty state shows when no reports
- [ ] Click on card navigates to report detail
- [ ] Shows pagination info
- [ ] Loading state works
- [ ] Error state works

---

### Task 7: ReportsFilter Component

**File**: `apps/web/src/components/library/ReportsFilter.tsx`

**Purpose**: Search and filter controls

**Props**:
```typescript
interface ReportsFilterProps {
  sortBy: 'createdAt' | 'title';
  order: 'asc' | 'desc';
  onSortChange: (sortBy: 'createdAt' | 'title', order: 'asc' | 'desc') => void;
}
```

**Component Structure**:
```typescript
export function ReportsFilter({ sortBy, order, onSortChange }: ReportsFilterProps) {
  return (
    <div className="flex gap-4 mb-6">
      {/* Sort by selector */}
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Sort By</label>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as any, order)}
          className="border rounded px-3 py-2"
        >
          <option value="createdAt">Date</option>
          <option value="title">Title</option>
        </select>
      </div>

      {/* Sort order selector */}
      <div>
        <label className="text-sm text-gray-600 mb-1 block">Order</label>
        <select
          value={order}
          onChange={(e) => onSortChange(sortBy, e.target.value as any)}
          className="border rounded px-3 py-2"
        >
          <option value="desc">Newest First</option>
          <option value="asc">Oldest First</option>
        </select>
      </div>
    </div>
  );
}
```

**Success Criteria**:
- [ ] Sort by selector works
- [ ] Order selector works
- [ ] Changes trigger parent update
- [ ] UI is clear and intuitive

---

### Task 8-10: Page Integrations

**Task 8: Update Home Page**
**File**: `apps/web/src/pages/Home.tsx`

```typescript
import { QueryInput } from '../components/research/QueryInput';

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Deep Research Agent</h1>
        <p className="text-gray-600 text-lg">
          AI-powered research assistant that collects, analyzes, and synthesizes information
        </p>
      </div>

      <QueryInput />
    </div>
  );
}
```

**Task 9: Update Research Page**
**File**: `apps/web/src/pages/Research.tsx`

```typescript
import { useParams } from 'react-router-dom';
import { ResearchProgress } from '../components/research/ResearchProgress';

export default function Research() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>Invalid research ID</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <ResearchProgress researchId={id} />
    </div>
  );
}
```

**Task 10: Update Reports Page**
**File**: `apps/web/src/pages/Reports.tsx`

```typescript
import { useState } from 'react';
import { ReportsList } from '../components/library/ReportsList';
import { ReportsFilter } from '../components/library/ReportsFilter';

export default function Reports() {
  const [sortBy, setSortBy] = useState<'createdAt' | 'title'>('createdAt');
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');

  const handleSortChange = (newSortBy: 'createdAt' | 'title', newOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setOrder(newOrder);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Research Reports</h1>

      <ReportsFilter
        sortBy={sortBy}
        order={order}
        onSortChange={handleSortChange}
      />

      <ReportsList
        sortBy={sortBy}
        order={order}
      />
    </div>
  );
}
```

**Success Criteria**:
- [ ] Home page shows QueryInput
- [ ] Can start research from home
- [ ] Research page shows progress
- [ ] Reports page shows list and filter
- [ ] All navigation works

---

### Task 11: Testing Checklist

**Manual Testing**:
```bash
# 1. Start services
pnpm dev
# API: http://localhost:3000
# Web: http://localhost:5173

# 2. Test research flow
- Visit home page
- Enter query "What is TypeScript?"
- Set budget to 2.0
- Click "Start Research"
- Should navigate to /research/:id
- Should see progress updates
- Wait for completion

# 3. Test reports flow
- Visit /reports
- Should see list of reports
- Try sorting (date, title)
- Try order (asc, desc)
- Click on a report
- Should see full report with Markdown
- Try download (MD, TXT)
- Try delete (with confirmation)

# 4. Test error cases
- Start research with empty query (should be disabled)
- Cancel research midway
- Delete a report
- Navigate back to reports
```

**TypeScript Check**:
```bash
pnpm typecheck
# Should see: "Tasks: 3 successful"
```

**Build Test**:
```bash
pnpm build
# Should build without errors
```

**Success Criteria**:
- [ ] All pages load without errors
- [ ] Can start research from home
- [ ] Research shows real-time progress
- [ ] Can view reports list
- [ ] Can filter/sort reports
- [ ] Can view report detail
- [ ] Can download reports
- [ ] Can delete reports
- [ ] All TypeScript checks pass
- [ ] Build completes successfully

---

### Task 12: Documentation

**File**: `docs/PHASE7_COMPLETE.md`

**Template**: Use similar structure to `PHASE6_COMPLETE.md`

**Sections to Include**:
1. Phase 7 Overview
2. Architecture diagram
3. Component specifications
4. API integration details
5. Hook usage examples
6. Styling guidelines
7. Testing instructions
8. Known limitations
9. Next steps (Phase 8)

**Content Requirements**:
- Screenshots of key components (optional)
- Code examples for each component
- Integration patterns
- Troubleshooting guide
- API endpoint usage

---

## 🚀 Implementation Strategy

### Recommended Order

**Day 1: Core Components (3-4 hours)**
1. Task 1: QueryInput (30 min)
2. Task 8: Home page integration (15 min)
3. Test research start flow
4. Task 2: ResearchProgress (45 min)
5. Task 9: Research page integration (15 min)
6. Test research flow end-to-end
7. Task 3: MarkdownViewer (30 min)
8. Task 4: Markdown CSS (30 min)
9. Test Markdown rendering

**Day 2: Reports & Testing (2-3 hours)**
1. Task 5: ReportHeader (30 min)
2. Task 6: ReportsList (45 min)
3. Task 7: ReportsFilter (30 min)
4. Task 10: Reports page integration (30 min)
5. Test reports flow end-to-end
6. Task 11: Comprehensive testing (45 min)
7. Task 12: Documentation (45 min)

### Checkpoints

After each phase, verify:
```bash
# 1. TypeScript check
pnpm typecheck

# 2. Visual check
pnpm dev
# Visit pages and test manually

# 3. Git commit
git add -A
git commit -m "feat: Phase 7 Part 2 - [checkpoint name]"
```

---

## 📊 Success Metrics

### Code Quality
- [ ] All TypeScript types are correct
- [ ] No console errors in browser
- [ ] All components have proper error handling
- [ ] Loading states are implemented
- [ ] Responsive design works on mobile

### Functionality
- [ ] Can start research from home page
- [ ] Research shows real-time progress via SSE
- [ ] Can view reports list with pagination
- [ ] Can filter and sort reports
- [ ] Can view full report with Markdown rendering
- [ ] Can download reports (MD, TXT)
- [ ] Can delete reports with confirmation

### User Experience
- [ ] UI is intuitive and clean
- [ ] Error messages are clear
- [ ] Loading states are visible
- [ ] Buttons have proper disabled states
- [ ] Navigation flows smoothly

---

## 🐛 Common Issues & Solutions

### Issue 1: SSE Connection Fails
**Symptom**: Research progress doesn't update
**Solution**: Check API is running, verify SSE endpoint URL

### Issue 2: Markdown Not Rendering
**Symptom**: Raw Markdown text shows
**Solution**: Verify react-markdown imports, check CSS is imported

### Issue 3: TypeScript Errors on Types
**Symptom**: Type errors in components
**Solution**: Check shared-types package, verify imports

### Issue 4: Navigation Not Working
**Symptom**: Clicking buttons doesn't navigate
**Solution**: Verify react-router-dom setup, check useNavigate usage

### Issue 5: Hooks Returning Undefined
**Symptom**: Data is undefined in components
**Solution**: Check QueryClientProvider is set up, verify query keys

---

## 📝 Code Style Guidelines

### Component Structure
```typescript
// 1. Imports (React, third-party, local)
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMyHook } from '../../hooks/useMyHook';

// 2. Types/Interfaces
interface MyComponentProps {
  id: string;
  onAction?: () => void;
}

// 3. Component
export function MyComponent({ id, onAction }: MyComponentProps) {
  // State
  const [value, setValue] = useState('');

  // Hooks
  const navigate = useNavigate();
  const { data } = useMyHook(id);

  // Handlers
  const handleClick = () => {
    // logic
  };

  // Render
  return <div>...</div>;
}

// 4. Sub-components (if any)
function SubComponent() {
  return <div>...</div>;
}
```

### File Organization
```
components/
  research/
    QueryInput.tsx         # Main export
    ResearchProgress.tsx   # Main export
  report/
    MarkdownViewer.tsx     # Main export
    ReportHeader.tsx       # Main export
  library/
    ReportsList.tsx        # Main export
    ReportsFilter.tsx      # Main export
```

### Naming Conventions
- Components: PascalCase (e.g., `QueryInput`)
- Files: PascalCase (e.g., `QueryInput.tsx`)
- Functions: camelCase (e.g., `handleSubmit`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_BUDGET`)

---

## ✅ Final Checklist

Before marking Phase 7 Part 2 complete:

### Code
- [ ] All 7 components created
- [ ] All 3 pages integrated
- [ ] Markdown CSS created and imported
- [ ] All TypeScript checks pass
- [ ] Build completes successfully

### Testing
- [ ] Can start research
- [ ] Can view research progress
- [ ] Can view reports list
- [ ] Can view report detail
- [ ] Can download reports
- [ ] Can delete reports
- [ ] Can sort/filter reports

### Documentation
- [ ] PHASE7_COMPLETE.md created
- [ ] Code comments added where needed
- [ ] README updated (if needed)

### Git
- [ ] All changes committed
- [ ] Pushed to origin/main
- [ ] Commit message follows convention

---

## 🎉 Completion

When all tasks are done:

```bash
# 1. Final type check
pnpm typecheck

# 2. Final build
pnpm build

# 3. Commit
git add -A
git commit -m "feat: Phase 7 Complete - React UI Components

## Phase 7 Overview
[Summary of what was built]

## Components Created
- QueryInput
- ResearchProgress
- MarkdownViewer
- ReportHeader
- ReportsList
- ReportsFilter

## Features
- Real-time research progress via SSE
- Markdown rendering with syntax highlighting
- Report management (view, download, delete)
- Pagination and sorting

Status: Phase 7 Complete ✅
Ready for: Phase 8 - Testing & Optimization

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# 4. Push
git push origin main

# 5. Create completion doc
cat > docs/PHASE7_COMPLETE.md << 'EOF'
[Your completion documentation]
EOF
```

---

**Created**: 2026-01-20
**For**: Phase 7 Part 2 Implementation
**Prerequisites**: Part 1 Complete (Commit: 8838b87)
**Estimated Time**: 3-4 hours
**Estimated Code**: ~1,200 lines

---

## 💬 Quick Reference

**Start Command**: `pnpm dev`
**API URL**: http://localhost:3000
**Web URL**: http://localhost:5173
**Type Check**: `pnpm typecheck`
**Build**: `pnpm build`

**Key Files**:
- Hooks: `apps/web/src/hooks/`
- API: `apps/web/src/api/`
- Components: `apps/web/src/components/` (to be created)
- Pages: `apps/web/src/pages/`

**Documentation**:
- Plan: `PHASE7_PLAN.md`
- Status: `PHASE7_STATUS.md`
- This File: `PHASE7_PART2_TASKS.md`

---

Good luck! 🚀
