# Phase 7 Implementation Plan: Frontend Development

**Phase**: 7 of 11
**Focus**: React Frontend Implementation
**Duration**: Day 7-9 (3 days)
**Status**: 🔄 Ready to Start
**Previous Phase**: [Phase 6 - Report Generation Enhancement](./docs/PHASE6_COMPLETE.md)

---

## 🎯 Phase 7 Goals

Build a modern, interactive React frontend that provides:
1. **Research Interface** - Intuitive query input and real-time progress tracking
2. **Report Viewer** - Professional Markdown rendering with syntax highlighting
3. **Report Library** - Comprehensive report management and browsing
4. **Custom Hooks** - Reusable logic for API integration and state management

---

## 📋 Task Checklist

### 7.1 Research Interface Components

- [ ] **QueryInput Component** (`apps/web/src/components/research/QueryInput.tsx`)
  - Query text input with validation
  - Budget slider (0.5 - 5.0 USD)
  - Search depth selector (basic/standard/deep)
  - Submit button with loading state
  - Error handling and validation feedback

- [ ] **ResearchProgress Component** (`apps/web/src/components/research/ResearchProgress.tsx`)
  - Stage progress indicator (preparation/research/analysis/writing/review)
  - Source counter and list
  - Real-time message stream display
  - Progress percentage
  - Cancel research button
  - Estimated cost display

- [ ] **ThinkingStream Component** (`apps/web/src/components/research/ThinkingStream.tsx`)
  - Display Agent thinking blocks
  - Collapsible sections for long thoughts
  - Tool use indicators
  - Streaming animation effects
  - Token usage display

- [ ] **ResearchPage Enhancement** (`apps/web/src/pages/Research.tsx`)
  - Integrate all research components
  - SSE stream connection
  - State management
  - Error boundary
  - Auto-scroll to latest message

### 7.2 Report Viewer Components

- [ ] **MarkdownViewer Component** (`apps/web/src/components/report/MarkdownViewer.tsx`)
  - Markdown-to-React rendering (using react-markdown)
  - Syntax highlighting (using highlight.js or prism)
  - Table of contents navigation
  - Anchor link support
  - Custom styling for tables, blockquotes, code blocks
  - Image rendering
  - Link handling (external links open in new tab)

- [ ] **ReportHeader Component** (`apps/web/src/components/report/ReportHeader.tsx`)
  - Report title and metadata
  - Download button (.md, .txt)
  - Share button (copy link)
  - Delete button with confirmation
  - Statistics display (word count, reading time)
  - Back to library button

- [ ] **CitationList Component** (`apps/web/src/components/report/CitationList.tsx`)
  - Display all report citations
  - Click to expand source details
  - Link to original source
  - Citation numbering

### 7.3 Report Library Interface

- [ ] **ReportsList Component** (`apps/web/src/components/library/ReportsList.tsx`)
  - Grid/list view toggle
  - Report cards with preview
  - Metadata display (date, word count, sources)
  - Click to view full report
  - Delete action

- [ ] **ReportsFilter Component** (`apps/web/src/components/library/ReportsFilter.tsx`)
  - Search by title
  - Sort by (date, title, word count)
  - Sort order (asc/desc)
  - Filter by date range
  - Clear filters button

- [ ] **ReportsPage Enhancement** (`apps/web/src/pages/Reports.tsx`)
  - Integrate filter and list components
  - Pagination controls
  - Empty state design
  - Loading states
  - Error handling

### 7.4 Custom Hooks

- [ ] **useResearch Hook** (`apps/web/src/hooks/useResearch.ts`)
  - `startResearch(query, options)` - Start new research
  - `cancelResearch(id)` - Cancel ongoing research
  - `getResearchStatus(id)` - Get status
  - State management for research sessions
  - Error handling
  - Loading states

- [ ] **useSSE Hook** (`apps/web/src/hooks/useSSE.ts`)
  - Connect to SSE endpoint
  - Parse SSE events
  - Handle reconnection
  - Error handling
  - Auto-cleanup on unmount
  - Event type filtering

- [ ] **useReports Hook** (`apps/web/src/hooks/useReports.ts`)
  - Fetch reports list with pagination
  - Get single report
  - Delete report
  - Download report
  - Get report statistics
  - TanStack Query integration

- [ ] **TanStack Query Setup** (`apps/web/src/api/queryClient.ts`)
  - Configure QueryClient
  - Set default options
  - Configure cache settings
  - Setup query keys structure

### 7.5 Styling and UI Polish

- [ ] **Component Styling**
  - Consistent color scheme
  - Responsive design (mobile, tablet, desktop)
  - Dark mode support (optional)
  - Loading skeletons
  - Smooth transitions and animations

- [ ] **Markdown Styles** (`apps/web/src/styles/markdown.css`)
  - Custom styles for rendered Markdown
  - Code block styling
  - Table styling
  - Blockquote styling
  - Heading styles with anchors

- [ ] **Icons and Assets**
  - Add icon library (lucide-react or heroicons)
  - Loading spinners
  - Empty state illustrations
  - Error state illustrations

---

## 🏗️ Component Architecture

```
apps/web/src/
├── components/
│   ├── research/
│   │   ├── QueryInput.tsx          ← Query form with validation
│   │   ├── ResearchProgress.tsx    ← Real-time progress display
│   │   ├── ThinkingStream.tsx      ← Agent thinking visualization
│   │   ├── SourceList.tsx          ← List of collected sources
│   │   └── StageIndicator.tsx      ← Stage progress bar
│   │
│   ├── report/
│   │   ├── MarkdownViewer.tsx      ← Main Markdown renderer
│   │   ├── ReportHeader.tsx        ← Title, actions, metadata
│   │   ├── CitationList.tsx        ← Citations display
│   │   ├── TableOfContents.tsx     ← TOC navigation
│   │   └── ReportStats.tsx         ← Statistics panel
│   │
│   ├── library/
│   │   ├── ReportsList.tsx         ← Report cards grid/list
│   │   ├── ReportCard.tsx          ← Individual report card
│   │   ├── ReportsFilter.tsx       ← Search and filter controls
│   │   └── EmptyState.tsx          ← No reports message
│   │
│   └── common/
│       ├── Button.tsx              ← Reusable button component
│       ├── Input.tsx               ← Reusable input component
│       ├── Card.tsx                ← Reusable card component
│       ├── Modal.tsx               ← Reusable modal component
│       ├── Spinner.tsx             ← Loading spinner
│       └── ErrorBoundary.tsx       ← Error boundary wrapper
│
├── hooks/
│   ├── useResearch.ts              ← Research API integration
│   ├── useSSE.ts                   ← SSE connection management
│   ├── useReports.ts               ← Reports API integration
│   └── useDebounce.ts              ← Debounce utility hook
│
├── api/
│   ├── queryClient.ts              ← TanStack Query client
│   ├── research.ts                 ← Research API functions
│   └── reports.ts                  ← Reports API functions
│
├── pages/
│   ├── Home.tsx                    ← Start new research
│   ├── Research.tsx                ← Active research view
│   └── Reports.tsx                 ← Report library
│
├── types/
│   ├── components.ts               ← Component prop types
│   └── api.ts                      ← API response types
│
└── styles/
    ├── markdown.css                ← Markdown rendering styles
    └── theme.css                   ← Global theme variables
```

---

## 🔌 API Integration Plan

### Research API
```typescript
// apps/web/src/api/research.ts

export const researchApi = {
  // Start new research
  startResearch: async (params: {
    query: string;
    maxBudget: number;
    searchDepth: 'basic' | 'standard' | 'deep';
  }) => {
    const response = await fetch('/api/research/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return response.json();
  },

  // Get research status
  getStatus: async (id: string) => {
    const response = await fetch(`/api/research/${id}/status`);
    return response.json();
  },

  // Cancel research
  cancelResearch: async (id: string) => {
    const response = await fetch(`/api/research/${id}/cancel`, {
      method: 'POST',
    });
    return response.json();
  },

  // Connect to SSE stream
  streamResearch: (id: string, onMessage: (event: any) => void) => {
    const eventSource = new EventSource(`/api/research/${id}/stream`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
    };

    return eventSource;
  },
};
```

### Reports API
```typescript
// apps/web/src/api/reports.ts

export const reportsApi = {
  // List reports with pagination
  listReports: async (params: {
    limit?: number;
    offset?: number;
    sortBy?: string;
    order?: 'asc' | 'desc';
  }) => {
    const searchParams = new URLSearchParams(params as any);
    const response = await fetch(`/api/reports?${searchParams}`);
    return response.json();
  },

  // Get single report
  getReport: async (id: string) => {
    const response = await fetch(`/api/reports/${id}`);
    return response.json();
  },

  // Get report statistics
  getStats: async (id: string) => {
    const response = await fetch(`/api/reports/${id}/stats`);
    return response.json();
  },

  // Download report
  downloadReport: async (id: string, format: 'markdown' | 'txt') => {
    const response = await fetch(`/api/reports/${id}/download?format=${format}`);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report.${format === 'markdown' ? 'md' : 'txt'}`;
    a.click();
  },

  // Delete report
  deleteReport: async (id: string) => {
    const response = await fetch(`/api/reports/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};
```

---

## 📦 Dependencies to Add

```bash
# Markdown rendering
pnpm add react-markdown remark-gfm rehype-highlight

# Code syntax highlighting
pnpm add highlight.js

# Icons
pnpm add lucide-react

# State management (already installed)
# @tanstack/react-query

# Utilities
pnpm add clsx
pnpm add date-fns
```

---

## 🎨 UI/UX Design Guidelines

### Color Scheme (Example)
```css
:root {
  /* Primary colors */
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --color-primary-light: #60a5fa;

  /* Status colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #06b6d4;

  /* Neutral colors */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Component Patterns

**Button Variants:**
- Primary (filled, blue)
- Secondary (outlined)
- Danger (filled, red)
- Ghost (transparent)

**Loading States:**
- Skeleton screens for initial load
- Spinners for actions
- Progress bars for long operations

**Error States:**
- Inline validation errors
- Toast notifications for actions
- Error boundary for crashes

---

## 🧪 Testing Strategy

### Component Tests
- [ ] Test QueryInput validation
- [ ] Test ResearchProgress updates
- [ ] Test MarkdownViewer rendering
- [ ] Test ReportsList filtering and sorting

### Integration Tests
- [ ] Test research flow (start → progress → complete)
- [ ] Test report viewing flow
- [ ] Test report deletion flow

### Manual Testing
- [ ] Test on Chrome, Firefox, Safari
- [ ] Test responsive design (mobile, tablet, desktop)
- [ ] Test SSE reconnection
- [ ] Test long reports performance

---

## 📊 Implementation Priority

### High Priority (Must Have)
1. ✅ QueryInput component
2. ✅ ResearchProgress component
3. ✅ MarkdownViewer component
4. ✅ useResearch hook
5. ✅ useSSE hook
6. ✅ TanStack Query setup

### Medium Priority (Should Have)
1. ThinkingStream component
2. ReportHeader component
3. ReportsList component
4. ReportsFilter component
5. useReports hook

### Low Priority (Nice to Have)
1. TableOfContents component
2. Dark mode toggle
3. Share button
4. Report statistics panel
5. Advanced filtering

---

## 🚀 Implementation Steps

### Step 1: Setup Dependencies (30 minutes)
```bash
cd apps/web
pnpm add react-markdown remark-gfm rehype-highlight highlight.js lucide-react clsx date-fns
```

### Step 2: Setup TanStack Query (30 minutes)
- Create queryClient.ts
- Setup QueryClientProvider in App.tsx
- Define query keys structure

### Step 3: Create API Functions (1 hour)
- Implement research.ts API functions
- Implement reports.ts API functions
- Add type definitions

### Step 4: Build Custom Hooks (2 hours)
- Implement useResearch hook
- Implement useSSE hook
- Implement useReports hook
- Test hook functionality

### Step 5: Build Research Components (3 hours)
- Create QueryInput component
- Create ResearchProgress component
- Create ThinkingStream component
- Integrate into Research page

### Step 6: Build Report Components (3 hours)
- Create MarkdownViewer component
- Create ReportHeader component
- Create CitationList component
- Add Markdown styling

### Step 7: Build Library Components (2 hours)
- Create ReportsList component
- Create ReportsFilter component
- Integrate into Reports page

### Step 8: Polish and Test (2 hours)
- Add loading states
- Add error handling
- Test all flows
- Fix bugs

**Total Estimated Time**: ~14 hours (2 days with buffer)

---

## 🐛 Known Challenges

### Challenge 1: SSE Connection Management
- **Issue**: Browser limits on concurrent SSE connections
- **Solution**: Close previous connections before opening new ones
- **Implementation**: useSSE hook with cleanup

### Challenge 2: Large Report Rendering
- **Issue**: Reports with 10,000+ words may slow down rendering
- **Solution**: Virtual scrolling or pagination
- **Implementation**: Consider react-window for large content

### Challenge 3: Markdown Styling
- **Issue**: Need consistent styling across different Markdown elements
- **Solution**: Custom CSS for all Markdown elements
- **Implementation**: markdown.css with comprehensive rules

### Challenge 4: Real-time Updates
- **Issue**: Keep UI in sync with SSE events
- **Solution**: Use React state with careful updates
- **Implementation**: useReducer for complex state management

---

## ✅ Success Criteria

Phase 7 is complete when:

- [ ] All components render without errors
- [ ] Research flow works end-to-end (start → progress → complete)
- [ ] SSE stream displays real-time progress
- [ ] Reports display correctly with Markdown formatting
- [ ] Reports library shows all reports with pagination
- [ ] Filtering and sorting work correctly
- [ ] Download functionality works
- [ ] Delete functionality works with confirmation
- [ ] All TypeScript checks pass
- [ ] Responsive design works on mobile and desktop
- [ ] Error handling is in place for all API calls

---

## 📚 References

### Documentation
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [TanStack Query](https://tanstack.com/query/latest)
- [Highlight.js](https://highlightjs.org/)
- [Lucide Icons](https://lucide.dev/)

### Internal Docs
- [Phase 6 Complete](./docs/PHASE6_COMPLETE.md)
- [API Documentation](./docs/API.md)
- [Implementation Plan](./IMPLEMENTATION_PLAN.md)

---

**Created**: 2026-01-20
**Status**: 📋 Ready to Start
**Next Step**: Install dependencies and setup TanStack Query

---

## 🔄 Update Log

- **2026-01-20**: Initial Phase 7 plan created
- **To be updated**: Progress will be tracked here as tasks are completed
