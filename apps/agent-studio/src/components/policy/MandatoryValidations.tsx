import React from 'react';
import { cn } from '@airaie/ui';
import { Shield } from 'lucide-react';

export interface MandatoryValidationsProps {
  operations: string[];
  className?: string;
}

const MandatoryValidations: React.FC<MandatoryValidationsProps> = ({ operations, className }) => {
  if (operations.length === 0) {
    return (
      <p className={cn('text-sm text-content-muted py-2', className)}>
        No mandatory approvals configured.
      </p>
    );
  }

  return (
    <ul className={cn('space-y-1.5', className)}>
      {operations.map((op) => (
        <li key={op} className="flex items-center gap-2 text-sm text-content-primary">
          <Shield className="h-3.5 w-3.5 text-content-secondary shrink-0" />
          <span className="capitalize">{op}</span>
        </li>
      ))}
    </ul>
  );
};

MandatoryValidations.displayName = 'MandatoryValidations';

export default MandatoryValidations;
