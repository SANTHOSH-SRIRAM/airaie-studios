// ============================================================
// CardDetailLayout — Split-pane layout with collapsible properties panel
// ============================================================

import React, { useCallback } from 'react';
import {
  Panel,
  Group,
  Separator,
  usePanelRef,
  type PanelImperativeHandle,
} from 'react-resizable-panels';

export interface CardDetailLayoutProps {
  canvas: React.ReactNode;
  properties: React.ReactNode;
  onToggleProperties?: () => void;
}

const CardDetailLayout: React.FC<CardDetailLayoutProps> = ({
  canvas,
  properties,
  onToggleProperties,
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

  return (
    <div className="h-full overflow-hidden">
      <Group orientation="horizontal" id="card-detail-panels">
        {/* Canvas — dominant left panel */}
        <Panel id="canvas" minSize={50} defaultSize={65}>
          <div className="h-full overflow-hidden">{canvas}</div>
        </Panel>

        <Separator onDoubleClick={toggleProperties} />

        {/* Properties — collapsible right panel */}
        <Panel
          id="properties"
          panelRef={propertiesPanelRef}
          defaultSize={35}
          minSize={20}
          maxSize={50}
          collapsible
          collapsedSize={0}
        >
          <div className="h-full overflow-hidden">{properties}</div>
        </Panel>
      </Group>
    </div>
  );
};

CardDetailLayout.displayName = 'CardDetailLayout';

export default CardDetailLayout;
