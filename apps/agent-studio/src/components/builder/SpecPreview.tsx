import React, { useMemo, useCallback } from 'react';
import { cn, JsonViewer, Button, Badge } from '@airaie/ui';
import { Copy, Check } from 'lucide-react';
import { useSpecStore } from '@store/specStore';

const SpecPreview: React.FC<{ className?: string }> = ({ className }) => {
  const buildSpec = useSpecStore((s) => s.buildSpec);
  const agentName = useSpecStore((s) => s.agentName);
  const goal = useSpecStore((s) => s.goal);
  const tools = useSpecStore((s) => s.tools);
  const contextSchema = useSpecStore((s) => s.contextSchema);
  const scoring = useSpecStore((s) => s.scoring);
  const constraints = useSpecStore((s) => s.constraints);
  const policy = useSpecStore((s) => s.policy);

  const spec = useMemo(
    () => buildSpec('0.1.0', 'current-user'),
    [buildSpec, agentName, goal, tools, contextSchema, scoring, constraints, policy]
  );

  const [copied, setCopied] = React.useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(spec, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [spec]);

  const hasGoal = goal.trim().length > 0;
  const hasTools = tools.length > 0;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-content-primary">Spec Preview</label>
        <Button
          variant="ghost"
          size="sm"
          icon={copied ? Check : Copy}
          onClick={handleCopy}
        >
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      {/* Validation badges */}
      <div className="flex gap-2 flex-wrap">
        <Badge variant={hasGoal ? 'success' : 'warning'} badgeStyle="outline">
          {hasGoal ? 'Goal set' : 'Goal missing'}
        </Badge>
        <Badge variant={hasTools ? 'success' : 'neutral'} badgeStyle="outline">
          {tools.length} tool{tools.length !== 1 ? 's' : ''}
        </Badge>
        <Badge variant="info" badgeStyle="outline">
          {scoring.strategy}
        </Badge>
      </div>

      {/* JSON tree */}
      <JsonViewer data={spec} defaultExpandDepth={2} />
    </div>
  );
};

SpecPreview.displayName = 'SpecPreview';

export default SpecPreview;
