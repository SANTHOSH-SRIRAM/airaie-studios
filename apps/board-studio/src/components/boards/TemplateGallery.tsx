// ============================================================
// TemplateGallery — stub (replaced in Task 3)
// ============================================================

import React from 'react';
import { Modal } from '@airaie/ui';

export interface TemplateGalleryProps {
  open: boolean;
  onClose: () => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ open, onClose }) => {
  return (
    <Modal open={open} onClose={onClose} title="Template Gallery" width="max-w-4xl">
      <p className="text-sm text-content-secondary">Loading templates...</p>
    </Modal>
  );
};

export default TemplateGallery;
