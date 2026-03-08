import { Command } from 'cmdk';
import { useEffect } from 'react';
import {
  PenTool, GitFork, MessageSquare, Activity, FlaskConical,
  Brain, BarChart3, Play, Upload, GitCompare, Search
} from 'lucide-react';
import { useIDEStore, type IDEView } from '@store/ideStore';

interface PaletteItem {
  id: string;
  type: 'view' | 'command';
  label: string;
  description?: string;
  icon: typeof PenTool;
  shortcut?: string;
  action: () => void;
}

export default function CommandPalette() {
  const open = useIDEStore((s) => s.commandPaletteOpen);
  const close = useIDEStore((s) => s.closeCommandPalette);
  const toggle = useIDEStore((s) => s.toggleCommandPalette);
  const setActiveView = useIDEStore((s) => s.setActiveView);

  // Cmd+K global shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  const viewItems: PaletteItem[] = [
    { id: 'v-builder', type: 'view', label: 'Builder', description: 'Edit agent spec', icon: PenTool, shortcut: 'Cmd+1', action: () => nav('builder') },
    { id: 'v-graph', type: 'view', label: 'Graph', description: 'Visual reasoning editor', icon: GitFork, shortcut: 'Cmd+2', action: () => nav('graph') },
    { id: 'v-playground', type: 'view', label: 'Playground', description: 'Test & execute agents', icon: MessageSquare, shortcut: 'Cmd+3', action: () => nav('playground') },
    { id: 'v-runs', type: 'view', label: 'Runs', description: 'Execution history & debug', icon: Activity, shortcut: 'Cmd+4', action: () => nav('runs') },
    { id: 'v-approvals', type: 'view', label: 'Approvals', description: 'Human-in-the-loop queue', icon: Activity, shortcut: 'Cmd+5', action: () => nav('approvals') },
    { id: 'v-evals', type: 'view', label: 'Evals', description: 'Benchmarks & test suites', icon: FlaskConical, shortcut: 'Cmd+6', action: () => nav('evals') },
    { id: 'v-versions', type: 'view', label: 'Versions', description: 'Version history & A/B tests', icon: GitCompare, shortcut: 'Cmd+7', action: () => nav('versions') },
    { id: 'v-policy', type: 'view', label: 'Policy', description: 'Guardrails & trust settings', icon: Activity, shortcut: 'Cmd+8', action: () => nav('policy') },
    { id: 'v-memory', type: 'view', label: 'Memory', description: 'Agent knowledge base', icon: Brain, shortcut: 'Cmd+9', action: () => nav('memory') },
    { id: 'v-analytics', type: 'view', label: 'Analytics', description: 'Metrics & insights', icon: BarChart3, action: () => nav('analytics') },
    { id: 'v-dashboard', type: 'view', label: 'Dashboard', description: 'Agent overview', icon: Activity, action: () => nav('dashboard') },
  ];

  const commandItems: PaletteItem[] = [
    { id: 'c-run', type: 'command', label: 'Run Agent', description: 'Start new execution', icon: Play, shortcut: 'Cmd+Enter', action: () => { nav('playground'); } },
    { id: 'c-publish', type: 'command', label: 'Publish Version', description: 'Publish current agent spec', icon: Upload, action: () => { nav('builder'); } },
    { id: 'c-diff', type: 'command', label: 'Diff Versions', description: 'Compare agent versions', icon: GitCompare, action: () => { nav('builder'); } },
    { id: 'c-eval', type: 'command', label: 'Run All Evals', description: 'Execute evaluation suite', icon: FlaskConical, action: () => { nav('evals'); } },
  ];

  function nav(view: IDEView) {
    setActiveView(view);
    close();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={close} />

      {/* Palette */}
      <Command
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden"
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Escape') close();
        }}
      >
        <div className="flex items-center gap-2 px-4 border-b border-gray-100">
          <Search size={16} className="text-gray-400 shrink-0" />
          <Command.Input
            placeholder="Search views, commands, agents..."
            className="w-full py-3 text-sm bg-transparent outline-none placeholder:text-gray-400"
            autoFocus
          />
        </div>

        <Command.List className="max-h-80 overflow-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-gray-500">
            No results found.
          </Command.Empty>

          <Command.Group heading="Views" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
            {viewItems.map((item) => (
              <PaletteItemRow key={item.id} item={item} />
            ))}
          </Command.Group>

          <Command.Separator className="h-px bg-gray-100 my-1" />

          <Command.Group heading="Commands" className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-gray-400 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5">
            {commandItems.map((item) => (
              <PaletteItemRow key={item.id} item={item} />
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

function PaletteItemRow({ item }: { item: PaletteItem }) {
  const Icon = item.icon;
  return (
    <Command.Item
      value={`${item.label} ${item.description ?? ''}`}
      onSelect={item.action}
      className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer text-sm data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700"
    >
      <Icon size={16} className="shrink-0 text-gray-400" />
      <div className="flex-1 min-w-0">
        <span className="font-medium">{item.label}</span>
        {item.description && (
          <span className="ml-2 text-gray-400">{item.description}</span>
        )}
      </div>
      {item.shortcut && (
        <kbd className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded font-mono">
          {item.shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}
