import React, { useState } from 'react';
import { cn } from '@airaie/ui';
import {
  ChevronDown,
  ChevronRight,
  GitBranch,
  LayoutGrid,
  Bot,
  User,
  Cpu,
  Play,
  Pause,
  Split,
  Merge,
  IterationCw,
  Clipboard,
  MessageSquare,
  Shield,
  Terminal,
  Database,
  Webhook,
} from 'lucide-react';
import NodePaletteItem, { type NodeTemplate } from './NodePaletteItem';

interface NodeCategory {
  label: string;
  color: string;
  templates: NodeTemplate[];
}

const categories: NodeCategory[] = [
  {
    label: 'Control',
    color: '#f59e0b',
    templates: [
      { type: 'control', label: 'Start', icon: Play, defaultConfig: { kind: 'start' } },
      { type: 'control', label: 'End', icon: Pause, defaultConfig: { kind: 'end' } },
      { type: 'control', label: 'Branch', icon: Split, defaultConfig: { kind: 'branch', conditions: [] } },
      { type: 'control', label: 'Merge', icon: Merge, defaultConfig: { kind: 'merge' } },
      { type: 'control', label: 'Loop', icon: IterationCw, defaultConfig: { kind: 'loop', maxIterations: 10 } },
    ],
  },
  {
    label: 'Board',
    color: '#3b82f6',
    templates: [
      { type: 'board', label: 'Task Board', icon: LayoutGrid, defaultConfig: { boardType: 'task' } },
      { type: 'board', label: 'Sub-Workflow', icon: GitBranch, defaultConfig: { boardType: 'sub_workflow' } },
      { type: 'board', label: 'Clipboard', icon: Clipboard, defaultConfig: { boardType: 'clipboard' } },
    ],
  },
  {
    label: 'Agent',
    color: '#8b5cf6',
    templates: [
      { type: 'agent', label: 'AI Agent', icon: Bot, defaultConfig: { agentRef: '' } },
      { type: 'agent', label: 'Chat Agent', icon: MessageSquare, defaultConfig: { agentRef: '', mode: 'chat' } },
    ],
  },
  {
    label: 'Human',
    color: '#22c55e',
    templates: [
      { type: 'human', label: 'Approval Gate', icon: Shield, defaultConfig: { gateType: 'approval' } },
      { type: 'human', label: 'Human Input', icon: User, defaultConfig: { gateType: 'input' } },
    ],
  },
  {
    label: 'System',
    color: '#06b6d4',
    templates: [
      { type: 'system', label: 'API Call', icon: Webhook, defaultConfig: { endpoint: '', method: 'POST' } },
      { type: 'system', label: 'Script', icon: Terminal, defaultConfig: { runtime: 'python', code: '' } },
      { type: 'system', label: 'Data Store', icon: Database, defaultConfig: { storeRef: '' } },
    ],
  },
];

const NodePalette: React.FC<{ className?: string }> = ({ className }) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div
      className={cn(
        'w-[280px] flex-shrink-0 border-r border-surface-border bg-white overflow-y-auto',
        className
      )}
    >
      <div className="px-4 py-3 border-b border-surface-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
          Node Palette
        </h3>
      </div>

      {categories.map((cat) => {
        const isCollapsed = collapsed[cat.label] ?? false;

        return (
          <div key={cat.label} className="border-b border-surface-border">
            <button
              onClick={() => toggle(cat.label)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-content-primary hover:bg-surface-hover transition-colors"
            >
              {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              <span
                className="w-2.5 h-2.5 flex-shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {cat.label}
              <span className="ml-auto text-xs text-content-muted">{cat.templates.length}</span>
            </button>

            {!isCollapsed && (
              <div className="pb-1">
                {cat.templates.map((tmpl) => (
                  <NodePaletteItem key={tmpl.label} template={tmpl} color={cat.color} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

NodePalette.displayName = 'NodePalette';

export default NodePalette;
