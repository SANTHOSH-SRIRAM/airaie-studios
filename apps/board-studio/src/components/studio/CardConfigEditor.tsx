// ============================================================
// CardConfigEditor — inline JSON config editor for InspectorPanel
// ============================================================

import React, { useState } from 'react';
import { Pencil, Save, X } from 'lucide-react';
import { Button } from '@airaie/ui';
import { useUpdateCard } from '@hooks/useCards';

interface CardConfigEditorProps {
  cardId: string;
  config: Record<string, unknown>;
}

const CardConfigEditor: React.FC<CardConfigEditorProps> = ({ cardId, config }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const updateCard = useUpdateCard();

  const handleEdit = () => {
    setDraft(JSON.stringify(config, null, 2));
    setParseError(null);
    setEditing(true);
  };

  const handleSave = () => {
    try {
      const parsed = JSON.parse(draft);
      setParseError(null);
      updateCard.mutate(
        { id: cardId, config: parsed },
        {
          onSuccess: () => setEditing(false),
        }
      );
    } catch {
      setParseError('Invalid JSON');
    }
  };

  const handleCancel = () => {
    setEditing(false);
    setParseError(null);
  };

  if (!editing) {
    return (
      <div>
        <pre className="text-[11px] text-content-secondary studio-mono overflow-x-auto whitespace-pre-wrap mb-2">
          {JSON.stringify(config, null, 2)}
        </pre>
        <Button
          variant="ghost"
          size="sm"
          icon={Pencil}
          onClick={handleEdit}
          className="text-[10px]"
        >
          Edit Config
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={8}
        className="w-full px-2 py-1.5 text-[11px] studio-mono border border-surface-border bg-white
          text-content-primary focus:outline-none focus:border-blue-500 resize-y"
      />
      {parseError && (
        <p className="text-[10px] text-red-600">{parseError}</p>
      )}
      <div className="flex items-center gap-1.5">
        <Button
          variant="primary"
          size="sm"
          icon={Save}
          onClick={handleSave}
          loading={updateCard.isPending}
          className="text-[10px]"
        >
          Save
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={X}
          onClick={handleCancel}
          className="text-[10px]"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

CardConfigEditor.displayName = 'CardConfigEditor';

export default CardConfigEditor;
