// ============================================================
// BoardSettingsDialog — edit board name, description, status
// ============================================================

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Save } from 'lucide-react';
import { Button, Input } from '@airaie/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateBoard } from '@api/boards';
import { boardKeys } from '@hooks/useBoards';
import type { Board } from '@/types/board';

export interface BoardSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  board: Board;
}

const BoardSettingsDialog: React.FC<BoardSettingsDialogProps> = ({
  open,
  onClose,
  board,
}) => {
  const [name, setName] = useState(board.name);
  const [description, setDescription] = useState(board.description ?? '');

  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (payload: { name?: string; description?: string }) =>
      updateBoard(board.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: boardKeys.detail(board.id) });
      qc.invalidateQueries({ queryKey: boardKeys.lists() });
      onClose();
    },
  });

  // Reset form when board changes
  useEffect(() => {
    setName(board.name);
    setDescription(board.description ?? '');
  }, [board.id, board.name, board.description]);

  const hasChanges = name !== board.name || description !== (board.description ?? '');

  const handleSave = () => {
    const payload: { name?: string; description?: string } = {};
    if (name !== board.name) payload.name = name.trim();
    if (description !== (board.description ?? '')) payload.description = description.trim();
    mutation.mutate(payload);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/20"
            style={{ backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -8 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-full max-w-[480px]"
          >
            <div className="bg-white border border-surface-border shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border">
                <h2 className="text-sm font-semibold text-content-primary">Board Settings</h2>
                <button
                  onClick={onClose}
                  className="p-1 text-content-muted hover:text-content-primary transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Form */}
              <div className="px-5 py-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1">
                    Board Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-surface-border bg-white
                      outline-none focus:border-brand-secondary transition-colors"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-content-secondary mb-1">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-surface-border bg-white
                      outline-none focus:border-brand-secondary transition-colors resize-none"
                  />
                </div>

                <div className="text-xs text-content-muted space-y-1">
                  <div className="flex justify-between">
                    <span>Mode:</span>
                    <span className="font-medium text-content-primary capitalize">{board.mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="font-medium text-content-primary capitalize">{board.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Board ID:</span>
                    <span className="font-mono text-content-tertiary">{board.id.slice(0, 12)}...</span>
                  </div>
                </div>

                {mutation.isError && (
                  <p className="text-xs text-status-danger">
                    Failed to update board. Please try again.
                  </p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-surface-border bg-surface-bg">
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Save}
                  onClick={handleSave}
                  loading={mutation.isPending}
                  disabled={!hasChanges || !name.trim()}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

BoardSettingsDialog.displayName = 'BoardSettingsDialog';

export default BoardSettingsDialog;
