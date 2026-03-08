import {
  LayoutDashboard, PenTool, GitFork, MessageSquare, Activity,
  ShieldCheck, FlaskConical, GitBranch, Brain, BarChart3, CheckSquare,
} from 'lucide-react';
import { Tooltip } from '@airaie/ui';
import { useIDEStore, type IDEView } from '@store/ideStore';
import { cn } from '@airaie/ui';

interface NavItem {
  id: IDEView;
  label: string;
  icon: typeof PenTool;
  shortcut?: string;
}

const topItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'builder', label: 'Builder', icon: PenTool, shortcut: '1' },
  { id: 'graph', label: 'Graph', icon: GitFork, shortcut: '2' },
  { id: 'playground', label: 'Playground', icon: MessageSquare, shortcut: '3' },
  { id: 'runs', label: 'Runs', icon: Activity, shortcut: '4' },
  { id: 'approvals', label: 'Approvals', icon: CheckSquare, shortcut: '5' },
  { id: 'evals', label: 'Evals', icon: FlaskConical, shortcut: '6' },
  { id: 'versions', label: 'Versions', icon: GitBranch, shortcut: '7' },
  { id: 'policy', label: 'Policy', icon: ShieldCheck, shortcut: '8' },
  { id: 'memory', label: 'Memory', icon: Brain, shortcut: '9' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function ActivityBar() {
  const activeView = useIDEStore((s) => s.activeView);
  const setActiveView = useIDEStore((s) => s.setActiveView);

  return (
    <div className="flex flex-col w-12 bg-gray-950 border-r border-gray-800 shrink-0">
      <div className="flex flex-col items-center gap-0.5 pt-2">
        {topItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const tip = item.shortcut ? `${item.label} (Cmd+${item.shortcut})` : item.label;
          return (
            <Tooltip key={item.id} content={tip} side="right">
              <button
                onClick={() => setActiveView(item.id)}
                className={cn(
                  'relative flex items-center justify-center w-12 h-10 transition-colors',
                  'hover:text-white focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500',
                  isActive ? 'text-white' : 'text-gray-500'
                )}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-blue-500 rounded-r" />
                )}
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
