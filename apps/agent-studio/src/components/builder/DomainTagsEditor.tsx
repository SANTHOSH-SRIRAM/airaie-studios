import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Badge, Button, Input } from '@airaie/ui';
import { useSpecStore } from '@store/specStore';

const SUGGESTED_TAGS = [
  'engineering', 'science', 'technology', 'mathematics',
  'fea', 'cfd', 'mesh', 'thermal', 'controls', 'materials',
  'nde', 'optimization', 'uncertainty', 'validation',
];

export default function DomainTagsEditor() {
  const { domainTags, setDomainTags } = useSpecStore();
  const [input, setInput] = useState('');

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !domainTags.includes(t)) {
      setDomainTags([...domainTags, t]);
    }
    setInput('');
  };

  const removeTag = (tag: string) => {
    setDomainTags(domainTags.filter((t) => t !== tag));
  };

  const suggestions = SUGGESTED_TAGS.filter((t) => !domainTags.includes(t));

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-content-primary mb-1">Domain Tags</h3>
        <p className="text-xs text-content-secondary">
          Categorize this agent by domain for discovery and filtering.
        </p>
      </div>

      {/* Current tags */}
      {domainTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {domainTags.map((tag) => (
            <Badge key={tag} variant="info" badgeStyle="outline" className="gap-1">
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
                <X size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(input); } }}
          placeholder="Add a tag..."
          className="flex-1"
        />
        <Button variant="outline" size="sm" icon={Plus} onClick={() => addTag(input)} disabled={!input.trim()}>
          Add
        </Button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <p className="text-[10px] text-content-tertiary uppercase tracking-widest font-medium mb-2">Suggestions</p>
          <div className="flex flex-wrap gap-1">
            {suggestions.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                className="px-2 py-0.5 text-xs border border-dashed border-surface-border text-content-muted rounded hover:border-brand-secondary hover:text-brand-secondary transition-colors"
              >
                + {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
