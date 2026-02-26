import React from 'react';
import { cn, Badge } from '@airaie/ui';
import { CheckCircle, XCircle } from 'lucide-react';
import type { KernelGateRequirement } from '@airaie/shared';

export interface GateRequirementRowProps {
  requirement: KernelGateRequirement;
  className?: string;
}

const GateRequirementRow: React.FC<GateRequirementRowProps> = ({ requirement, className }) => {
  return (
    <div className={cn('flex items-start gap-3 px-3 py-2 border border-surface-border bg-white', className)}>
      {requirement.satisfied ? (
        <CheckCircle size={16} className="text-status-success flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle size={16} className="text-status-danger flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="neutral" badgeStyle="outline">{requirement.req_type}</Badge>
          <span className="text-sm text-content-primary">{requirement.description}</span>
        </div>
        {requirement.evidence && Object.keys(requirement.evidence).length > 0 && (
          <p className="text-xs text-content-muted mt-1 truncate">{JSON.stringify(requirement.evidence)}</p>
        )}
      </div>
    </div>
  );
};

GateRequirementRow.displayName = 'GateRequirementRow';
export default GateRequirementRow;
