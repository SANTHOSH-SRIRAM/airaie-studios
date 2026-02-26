import React, { useMemo } from 'react';
import { cn, Spinner } from '@airaie/ui';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@airaie/ui';
import { useWorkflowVersion } from '@hooks/useWorkflows';
import { useUIStore } from '@store/uiStore';

interface VersionDiffProps {
  versionA: number;
  versionB: number;
  onBack: () => void;
  className?: string;
}

interface DiffLine {
  type: 'same' | 'removed' | 'added';
  text: string;
}

function computeDiff(textA: string, textB: string): { left: DiffLine[]; right: DiffLine[] } {
  const linesA = textA.split('\n');
  const linesB = textB.split('\n');
  const left: DiffLine[] = [];
  const right: DiffLine[] = [];
  const max = Math.max(linesA.length, linesB.length);

  for (let i = 0; i < max; i++) {
    const a = i < linesA.length ? linesA[i] : undefined;
    const b = i < linesB.length ? linesB[i] : undefined;

    if (a === b) {
      left.push({ type: 'same', text: a ?? '' });
      right.push({ type: 'same', text: b ?? '' });
    } else {
      left.push({ type: a !== undefined ? 'removed' : 'same', text: a ?? '' });
      right.push({ type: b !== undefined ? 'added' : 'same', text: b ?? '' });
    }
  }

  return { left, right };
}

const LINE_STYLES: Record<DiffLine['type'], string> = {
  same: '',
  removed: 'bg-red-50 text-red-700',
  added: 'bg-green-50 text-green-700',
};

function VersionDiff({ versionA, versionB, onBack, className }: VersionDiffProps) {
  const workflowId = useUIStore((s) => s.workflowId);
  const { data: dataA, isLoading: loadingA } = useWorkflowVersion(workflowId, versionA);
  const { data: dataB, isLoading: loadingB } = useWorkflowVersion(workflowId, versionB);

  const diff = useMemo(() => {
    if (!dataA || !dataB) return null;
    const textA = JSON.stringify(dataA.dsl, null, 2);
    const textB = JSON.stringify(dataB.dsl, null, 2);
    return computeDiff(textA, textB);
  }, [dataA, dataB]);

  if (loadingA || loadingB) return <Spinner className="mx-auto mt-12" />;

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      <div>
        <Button size="sm" variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to versions
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Version A */}
        <div className="flex flex-col rounded-none border">
          <div className="border-b bg-brand-secondary px-3 py-2 text-sm font-medium">
            Version {versionA}
          </div>
          <pre className="overflow-auto p-3 font-mono text-xs leading-5">
            {diff?.left.map((line, i) => (
              <div key={i} className={cn('whitespace-pre', LINE_STYLES[line.type])}>
                {line.text}
              </div>
            ))}
          </pre>
        </div>

        {/* Version B */}
        <div className="flex flex-col rounded-none border">
          <div className="border-b bg-brand-secondary px-3 py-2 text-sm font-medium">
            Version {versionB}
          </div>
          <pre className="overflow-auto p-3 font-mono text-xs leading-5">
            {diff?.right.map((line, i) => (
              <div key={i} className={cn('whitespace-pre', LINE_STYLES[line.type])}>
                {line.text}
              </div>
            ))}
          </pre>
        </div>
      </div>
    </div>
  );
}

VersionDiff.displayName = 'VersionDiff';
export default VersionDiff;
