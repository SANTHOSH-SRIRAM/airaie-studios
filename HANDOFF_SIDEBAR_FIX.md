# Sidebar Overlap Bug — Handoff

## Problem
Agent Studio UI has overlapping sidebars. The main content area overlaps the left sidebar (builder section nav) and potentially the right sidebar (context inspector). Issue persists across Builder, Evals, Memory pages.

## What Was Tried (NOT WORKING)
1. Removed hardcoded `w-[240px]` from `AgentSectionNav.tsx` — changed to `w-full`
2. Added `h-full w-full` to all `react-resizable-panels` `Group` components
3. Added `min-w-0`, `overflow-hidden` to wrapper divs
4. Added `truncate` to nav labels
5. Wrapped shell Group in extra `div.flex-1.min-w-0.h-full`

**None of these fully fixed the overlap.**

## Files Modified (need review/revert)
- `studios/apps/agent-studio/src/components/ide/AgentIDEShell.tsx`
- `studios/apps/agent-studio/src/components/builder/AgentSectionNav.tsx`
- `studios/apps/agent-studio/src/pages/BuilderPage.tsx`
- `studios/apps/agent-studio/src/pages/EvalsPage.tsx`
- `studios/apps/agent-studio/src/pages/MemoryPage.tsx`
- `studios/apps/agent-studio/src/pages/RunsPage.tsx`
- `studios/apps/agent-studio/src/pages/PlaygroundPage.tsx`

## Root Cause Investigation Needed
The `react-resizable-panels` library may need:
- Check if `autoSaveId` is persisting stale panel sizes in localStorage
- Check if conditional rendering of panels (inspector/bottom) breaks Group layout
- Check browser dev tools: inspect actual computed widths of Panel elements
- Check if `PanelGroup` (not `Group`) is the correct import — library may have renamed
- Check the installed version of `react-resizable-panels` and its API

## Key Layout Structure
```
AgentIDEShell (h-screen w-screen flex-col)
  └── flex row (flex-1 min-h-0)
      ├── ActivityBar (w-12 shrink-0, dark icon bar)
      ├── Group horizontal (main panels)
      │   ├── Panel editor-and-bottom
      │   │   └── Group vertical
      │   │       ├── Panel editor → EditorArea → BuilderPage
      │   │       │   └── Group horizontal (builder-panels)
      │   │       │       ├── Panel builder-nav (18%) → AgentSectionNav
      │   │       │       └── Panel builder-editor (82%) → content
      │   │       └── Panel bottom (conditional)
      │   └── Panel inspector (conditional)
      └── ContextInspector collapsed strip (conditional)
```

## Quick Debug Steps
1. `cd studios/apps/agent-studio && npm run dev`
2. Open localhost:3002
3. Open browser DevTools → inspect Panel elements for computed width
4. Check localStorage for `airaie:agent-studio:layout` — try clearing it
5. Check `react-resizable-panels` version: `grep react-resizable-panels package.json`
