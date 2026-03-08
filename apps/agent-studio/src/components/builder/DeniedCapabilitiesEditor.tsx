import React, { useState } from 'react';
import { Plus, X, ShieldOff } from 'lucide-react';
import { Badge, Button, Input } from '@airaie/ui';
import { useSpecStore } from '@store/specStore';

export default function DeniedCapabilitiesEditor() {
  const { deniedCapabilities, setDeniedCapabilities } = useSpecStore();
  const [input, setInput] = useState('');

  const add = (cap: string) => {
    const c = cap.trim();
    if (c && !deniedCapabilities.includes(c)) {
      setDeniedCapabilities([...deniedCapabilities, c]);
    }
    setInput('');
  };

  const remove = (cap: string) => {
    setDeniedCapabilities(deniedCapabilities.filter((c) => c !== cap));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-content-primary mb-1">Denied Capabilities</h3>
        <p className="text-xs text-content-secondary">
          Capabilities this agent must never use, regardless of tool availability. Takes precedence over tool permissions.
        </p>
      </div>

      {deniedCapabilities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {deniedCapabilities.map((cap) => (
            <Badge key={cap} variant="danger" badgeStyle="outline" className="gap-1">
              <ShieldOff size={10} />
              {cap}
              <button type="button" onClick={() => remove(cap)} className="hover:text-red-700 transition-colors">
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(input); } }}
          placeholder="e.g. network_access, file_delete..."
          className="flex-1"
        />
        <Button variant="outline" size="sm" icon={Plus} onClick={() => add(input)} disabled={!input.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
