import React from 'react';
import { cn, Input } from '@airaie/ui';
import { Trash2 } from 'lucide-react';
import type { ToolPermission } from '@airaie/shared';

export interface ToolPermissionRowProps {
  tool: ToolPermission;
  onChange: (updated: ToolPermission) => void;
  onRemove: () => void;
}

const ToolPermissionRow: React.FC<ToolPermissionRowProps> = ({ tool, onChange, onRemove }) => {
  const togglePerm = (key: keyof ToolPermission['permissions']) => {
    onChange({
      ...tool,
      permissions: { ...tool.permissions, [key]: !tool.permissions[key] },
    });
  };

  return (
    <tr className="border-b border-surface-border hover:bg-surface-hover transition-colors">
      <td className="px-3 py-2">
        <input
          type="text"
          value={tool.tool_ref}
          onChange={(e) => onChange({ ...tool, tool_ref: e.target.value })}
          placeholder="tool.namespace/name"
          className={cn(
            'w-full h-8 px-2 text-sm bg-transparent border border-surface-border rounded-none',
            'focus:outline-none focus:ring-1 focus:ring-brand-secondary',
            'text-content-primary placeholder:text-content-muted'
          )}
        />
      </td>
      {(['read', 'write', 'execute'] as const).map((perm) => (
        <td key={perm} className="px-3 py-2 text-center">
          <input
            type="checkbox"
            checked={tool.permissions[perm]}
            onChange={() => togglePerm(perm)}
            className="w-4 h-4 accent-[#3b5fa8] cursor-pointer"
          />
        </td>
      ))}
      <td className="px-3 py-2">
        <input
          type="number"
          value={tool.max_invocations}
          onChange={(e) => onChange({ ...tool, max_invocations: parseInt(e.target.value) || 0 })}
          min={0}
          className={cn(
            'w-16 h-8 px-2 text-sm text-center bg-transparent border border-surface-border rounded-none',
            'focus:outline-none focus:ring-1 focus:ring-brand-secondary',
            'text-content-primary'
          )}
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="text"
          value={tool.required_capabilities.join(', ')}
          onChange={(e) =>
            onChange({
              ...tool,
              required_capabilities: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="cap1, cap2"
          className={cn(
            'w-full h-8 px-2 text-sm bg-transparent border border-surface-border rounded-none',
            'focus:outline-none focus:ring-1 focus:ring-brand-secondary',
            'text-content-primary placeholder:text-content-muted'
          )}
        />
      </td>
      <td className="px-3 py-2 text-center">
        <button
          onClick={onRemove}
          className="p-1 text-content-muted hover:text-status-danger transition-colors"
          title="Remove tool"
        >
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
};

ToolPermissionRow.displayName = 'ToolPermissionRow';

export default ToolPermissionRow;
