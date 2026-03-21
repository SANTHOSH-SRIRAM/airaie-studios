// ============================================================
// CardDetailLayout — Split-pane layout with collapsible properties panel
// ============================================================

import React, { useCallback, useImperativeHandle } from 'react';
import {
  Panel,
  Group,
  Separator,
  usePanelRef,
} from 'react-resizable-panels';

export interface CardDetailLayoutHandle {
  toggleProperties: () => void;
}

export interface CardDetailLayoutProps {
  canvas: React.ReactNode;
  properties: React.ReactNode;
  onToggleProperties?: () => void;
  layoutRef?: React.RefObject<CardDetailLayoutHandle | null>;
}

const CardDetailLayout: React.FC<CardDetailLayoutProps> = ({
  canvas,
  properties,
  onToggleProperties,
  layoutRef,
}) => {
  const propertiesPanelRef = usePanelRef();

  const toggleProperties = useCallback(() => {
    const panel = propertiesPanelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) {
      panel.expand();
    } else {
      panel.collapse();
    }
    onToggleProperties?.();
  }, [onToggleProperties]);

  // Expose toggleProperties to parent via ref for keyboard shortcut access
  useImperativeHandle(layoutRef, () => ({
    toggleProperties,
  }), [toggleProperties]);

  return (
    <Group orientation="horizontal" id="card-detail-panels">
      {/* Canvas — dominant left panel */}
      <Panel id="canvas" defaultSize="65%" minSize="40%">
        <div className="h-full overflow-hidden">{canvas}</div>
      </Panel>

      <Separator onDoubleClick={toggleProperties} />

      {/* Properties — collapsible right panel */}
      <Panel
        id="properties"
        panelRef={propertiesPanelRef}
        defaultSize="35%"
        minSize="15%"
        maxSize="50%"
        collapsible
      >
        <div className="h-full overflow-auto border-l border-surface-border bg-white">
          {properties}
        </div>
      </Panel>
    </Group>
  );
};

CardDetailLayout.displayName = 'CardDetailLayout';

export default CardDetailLayout;
