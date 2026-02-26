import React, { useMemo } from 'react';
import { cn, Button, Spinner } from '@airaie/ui';
import { ArrowLeft } from 'lucide-react';
import { useUIStore } from '@store/uiStore';
import { useAgentVersion } from '@hooks/useAgents';

export interface PromptDiffProps {
  versionA: number;
  versionB: number;
  onBack: () => void;
  className?: string;
}

const PromptDiff: React.FC<PromptDiffProps> = ({ versionA, versionB, onBack, className }) => {
  const agentId = useUIStore((s) => s.agentId);
  const { data: a, isLoading: loadingA } = useAgentVersion(agentId, versionA);
  const { data: b, isLoading: loadingB } = useAgentVersion(agentId, versionB);

  const linesA = useMemo(() => (a ? JSON.stringify(a.spec, null, 2).split('\n') : []), [a]);
  const linesB = useMemo(() => (b ? JSON.stringify(b.spec, null, 2).split('\n') : []), [b]);

  const maxLines = Math.max(linesA.length, linesB.length);

  if (loadingA || loadingB) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-white">
        <button onClick={onBack} className="text-content-muted hover:text-content-primary"><ArrowLeft size={16} /></button>
        <h3 className="text-sm font-semibold text-content-primary">Diff: v{versionA} ↔ v{versionB}</h3>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 min-w-0">
          <div className="border-r border-surface-border">
            <div className="px-3 py-2 text-xs font-medium bg-brand-secondary text-white">v{versionA}</div>
            <pre className="p-3 text-xs font-mono leading-5 whitespace-pre-wrap">
              {Array.from({ length: maxLines }).map((_, i) => {
                const lineA = linesA[i] ?? '';
                const lineB = linesB[i] ?? '';
                const removed = lineA !== lineB && lineA !== '';
                return (
                  <div key={i} className={cn(removed && 'bg-red-50 text-red-700')}>
                    {lineA || '\u00A0'}
                  </div>
                );
              })}
            </pre>
          </div>
          <div>
            <div className="px-3 py-2 text-xs font-medium bg-brand-secondary text-white">v{versionB}</div>
            <pre className="p-3 text-xs font-mono leading-5 whitespace-pre-wrap">
              {Array.from({ length: maxLines }).map((_, i) => {
                const lineA = linesA[i] ?? '';
                const lineB = linesB[i] ?? '';
                const added = lineA !== lineB && lineB !== '';
                return (
                  <div key={i} className={cn(added && 'bg-green-50 text-green-700')}>
                    {lineB || '\u00A0'}
                  </div>
                );
              })}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

PromptDiff.displayName = 'PromptDiff';
export default PromptDiff;
