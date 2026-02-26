import React from 'react';
import { cn, Button } from '@airaie/ui';
import { Plus } from 'lucide-react';
import type { ToolPermission } from '@airaie/shared';
import { useSpecStore } from '@store/specStore';
import ToolPermissionRow from './ToolPermissionRow';

const emptyTool: ToolPermission = {
  tool_ref: '',
  permissions: { read: true, write: false, execute: false },
  max_invocations: 10,
  required_capabilities: [],
};

const ToolAllowlist: React.FC<{ className?: string }> = ({ className }) => {
  const tools = useSpecStore((s) => s.tools);
  const setTools = useSpecStore((s) => s.setTools);

  const handleAdd = () => {
    setTools([...tools, { ...emptyTool }]);
  };

  const handleChange = (index: number, updated: ToolPermission) => {
    const next = [...tools];
    next[index] = updated;
    setTools(next);
  };

  const handleRemove = (index: number) => {
    setTools(tools.filter((_, i) => i !== index));
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-content-primary">Tool Allowlist</label>
        <Button variant="ghost" size="sm" icon={Plus} onClick={handleAdd}>
          Add Tool
        </Button>
      </div>

      {tools.length === 0 ? (
        <p className="text-sm text-content-muted py-4 text-center border border-dashed border-surface-border">
          No tools configured. Click &quot;Add Tool&quot; to add a tool permission.
        </p>
      ) : (
        <div className="border border-surface-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-hover">
                <th className="px-3 py-2 text-left text-xs font-medium text-content-tertiary uppercase">
                  Tool Ref
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-content-tertiary uppercase w-16">
                  Read
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-content-tertiary uppercase w-16">
                  Write
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-content-tertiary uppercase w-16">
                  Exec
                </th>
                <th className="px-3 py-2 text-center text-xs font-medium text-content-tertiary uppercase w-20">
                  Max Inv.
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-content-tertiary uppercase">
                  Capabilities
                </th>
                <th className="px-3 py-2 w-10" />
              </tr>
            </thead>
            <tbody>
              {tools.map((tool, i) => (
                <ToolPermissionRow
                  key={i}
                  tool={tool}
                  onChange={(updated) => handleChange(i, updated)}
                  onRemove={() => handleRemove(i)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

ToolAllowlist.displayName = 'ToolAllowlist';

export default ToolAllowlist;
