import React from 'react';
import { cn } from '@airaie/ui';
import {
  Target,
  Wrench,
  FileInput,
  BarChart3,
  ShieldCheck,
  ScrollText,
  Eye,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type AgentSection =
  | 'goal'
  | 'tools'
  | 'context'
  | 'scoring'
  | 'constraints'
  | 'policy'
  | 'preview';

interface SectionItem {
  id: AgentSection;
  label: string;
  icon: LucideIcon;
}

const sections: SectionItem[] = [
  { id: 'goal', label: 'Goal', icon: Target },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'context', label: 'Context Schema', icon: FileInput },
  { id: 'scoring', label: 'Scoring', icon: BarChart3 },
  { id: 'constraints', label: 'Constraints', icon: ShieldCheck },
  { id: 'policy', label: 'Policy', icon: ScrollText },
  { id: 'preview', label: 'Preview', icon: Eye },
];

export interface AgentSectionNavProps {
  activeSection: AgentSection;
  onSectionChange: (section: AgentSection) => void;
  className?: string;
}

const AgentSectionNav: React.FC<AgentSectionNavProps> = ({
  activeSection,
  onSectionChange,
  className,
}) => {
  return (
    <div
      className={cn(
        'w-[240px] flex-shrink-0 border-r border-surface-border bg-white overflow-y-auto',
        className
      )}
    >
      <div className="px-4 py-3 border-b border-surface-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
          Spec Sections
        </h3>
      </div>

      <nav className="py-1">
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          const Icon = section.icon;

          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                'border-l-2',
                isActive
                  ? 'border-l-[#3b5fa8] bg-blue-50/50 text-[#3b5fa8] font-medium'
                  : 'border-l-transparent text-content-secondary hover:bg-surface-hover hover:text-content-primary'
              )}
            >
              <Icon size={16} />
              {section.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

AgentSectionNav.displayName = 'AgentSectionNav';

export default AgentSectionNav;
