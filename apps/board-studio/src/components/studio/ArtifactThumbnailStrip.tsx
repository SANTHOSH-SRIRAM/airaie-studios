// ============================================================
// ArtifactThumbnailStrip — clickable thumbnail strip below hero artifact
// ============================================================

import React from 'react';
import { Image, Box, FileText, Table2, Code, Download } from 'lucide-react';
import type { ArtifactPreviewType } from '@/types/vertical-registry';

export interface ThumbnailItem {
  key: string;
  label: string;
  preview: ArtifactPreviewType;
}

interface ArtifactThumbnailStripProps {
  artifacts: ThumbnailItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

const iconMap: Record<ArtifactPreviewType, React.ComponentType<{ size?: number; className?: string }>> = {
  image: Image,
  '3d': Box,
  document: FileText,
  table: Table2,
  code: Code,
  download: Download,
};

function ArtifactThumbnailStrip({ artifacts, activeKey, onSelect }: ArtifactThumbnailStripProps) {
  if (artifacts.length === 0) return null;

  return (
    <div className="flex gap-2 p-2 border-t border-surface-border overflow-x-auto">
      {artifacts.map((item) => {
        const Icon = iconMap[item.preview] ?? Download;
        const isActive = item.key === activeKey;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`flex flex-col items-center justify-center gap-1 w-12 h-14 rounded flex-shrink-0 transition-all
              ${isActive
                ? 'ring-2 ring-brand-secondary bg-blue-50'
                : 'bg-slate-50 hover:bg-slate-100 border border-surface-border'
              }`}
            title={item.label}
            aria-label={`View ${item.label}`}
            aria-pressed={isActive}
          >
            <Icon size={18} className={isActive ? 'text-brand-secondary' : 'text-content-muted'} />
            <span className={`text-[10px] leading-tight truncate w-full text-center px-0.5
              ${isActive ? 'text-brand-secondary font-medium' : 'text-content-tertiary'}`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default React.memo(ArtifactThumbnailStrip);
