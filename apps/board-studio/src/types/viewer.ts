import type React from 'react';

export interface ViewerProps {
  url: string;
  filename?: string;
  contentType?: string;
  sizeBytes?: number;
  artifactId?: string;
  onDownload?: () => void;
}

export type LazyViewer = React.LazyExoticComponent<React.ComponentType<ViewerProps>>;
