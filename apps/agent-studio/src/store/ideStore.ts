import { create } from 'zustand';

export type IDEView = 'dashboard' | 'builder' | 'graph' | 'playground' | 'runs' | 'approvals' | 'evals' | 'versions' | 'memory' | 'analytics' | 'policy';

interface IDELayout {
  sidebarCollapsed: boolean;
  bottomCollapsed: boolean;
  inspectorCollapsed: boolean;
  bottomTab: 'execution' | 'logs' | 'problems' | 'artifacts' | 'cost' | 'terminal';
}

interface IDEState extends IDELayout {
  activeView: IDEView;
  commandPaletteOpen: boolean;

  setActiveView: (view: IDEView) => void;
  toggleSidebar: () => void;
  toggleBottom: () => void;
  toggleInspector: () => void;
  setBottomTab: (tab: IDELayout['bottomTab']) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

const LAYOUT_KEY = 'airaie:agent-studio:layout';

function loadLayout(): Partial<IDELayout> {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return {};
}

function saveLayout(state: IDELayout) {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify({
      sidebarCollapsed: state.sidebarCollapsed,
      bottomCollapsed: state.bottomCollapsed,
      inspectorCollapsed: state.inspectorCollapsed,
      bottomTab: state.bottomTab,
    }));
  } catch { /* ignore */ }
}

const saved = loadLayout();

export const useIDEStore = create<IDEState>((set, get) => ({
  activeView: 'builder',
  sidebarCollapsed: saved.sidebarCollapsed ?? false,
  bottomCollapsed: saved.bottomCollapsed ?? true,
  inspectorCollapsed: saved.inspectorCollapsed ?? true,
  bottomTab: saved.bottomTab ?? 'execution',
  commandPaletteOpen: false,

  setActiveView: (view) => set({ activeView: view }),
  toggleSidebar: () => set((s) => {
    const next = { sidebarCollapsed: !s.sidebarCollapsed };
    saveLayout({ ...s, ...next });
    return next;
  }),
  toggleBottom: () => set((s) => {
    const next = { bottomCollapsed: !s.bottomCollapsed };
    saveLayout({ ...s, ...next });
    return next;
  }),
  toggleInspector: () => set((s) => {
    const next = { inspectorCollapsed: !s.inspectorCollapsed };
    saveLayout({ ...s, ...next });
    return next;
  }),
  setBottomTab: (tab) => set((s) => {
    const next = { bottomTab: tab, bottomCollapsed: false };
    saveLayout({ ...s, ...next });
    return next;
  }),
  openCommandPalette: () => set({ commandPaletteOpen: true }),
  closeCommandPalette: () => set({ commandPaletteOpen: false }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
}));
