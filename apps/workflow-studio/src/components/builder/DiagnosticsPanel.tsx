import React, { useState } from 'react';
import { cn, Badge } from '@airaie/ui';
import { ChevronDown, ChevronUp, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';

export interface Diagnostic {
  level: 'error' | 'warning' | 'info';
  message: string;
  nodeId?: string;
}

export interface DiagnosticsPanelProps {
  diagnostics: Diagnostic[];
  className?: string;
}

const levelIcons = {
  error: XCircle,
  warning: AlertTriangle,
  info: CheckCircle,
};

const levelColors = {
  error: 'text-status-danger',
  warning: 'text-status-warning',
  info: 'text-status-info',
};

const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({ diagnostics, className }) => {
  const [collapsed, setCollapsed] = useState(true);

  const errors = diagnostics.filter((d) => d.level === 'error').length;
  const warnings = diagnostics.filter((d) => d.level === 'warning').length;

  return (
    <div className={cn('border-t border-surface-border bg-white', className)}>
      {/* Toggle bar */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-surface-hover transition-colors"
      >
        {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <span className="font-medium text-content-primary">Diagnostics</span>
        {errors > 0 && (
          <Badge variant="danger" badgeStyle="filled">
            {errors} error{errors !== 1 ? 's' : ''}
          </Badge>
        )}
        {warnings > 0 && (
          <Badge variant="warning" badgeStyle="filled">
            {warnings} warning{warnings !== 1 ? 's' : ''}
          </Badge>
        )}
        {diagnostics.length === 0 && (
          <span className="text-xs text-content-muted">No issues</span>
        )}
      </button>

      {/* Diagnostic list */}
      {!collapsed && (
        <div className="max-h-[200px] overflow-y-auto border-t border-surface-border">
          {diagnostics.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-content-muted">
              Run validation to check for issues.
            </div>
          ) : (
            <div className="divide-y divide-surface-border">
              {diagnostics.map((d, i) => {
                const Icon = levelIcons[d.level];
                return (
                  <div key={i} className="flex items-start gap-2.5 px-4 py-2">
                    <Icon size={14} className={cn('mt-0.5 flex-shrink-0', levelColors[d.level])} />
                    <span className="text-sm text-content-primary">{d.message}</span>
                    {d.nodeId && (
                      <code className="text-xs text-content-muted font-mono ml-auto flex-shrink-0">
                        {d.nodeId}
                      </code>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

DiagnosticsPanel.displayName = 'DiagnosticsPanel';

export default DiagnosticsPanel;
