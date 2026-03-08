// ============================================================
// StudioLayout — 3-panel resizable IDE-style layout
// ============================================================

import React from 'react';
import {
  Panel,
  Group,
  Separator,
} from 'react-resizable-panels';

export interface StudioLayoutProps {
  commandBar: React.ReactNode;
  statusBar: React.ReactNode;
  outlinePanel: React.ReactNode;
  mainCanvas: React.ReactNode;
  inspectorPanel: React.ReactNode;
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
}

const StudioLayout: React.FC<StudioLayoutProps> = ({
  commandBar,
  statusBar,
  outlinePanel,
  mainCanvas,
  inspectorPanel,
  leftPanelVisible,
  rightPanelVisible,
}) => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-surface-bg">
      {/* Command Bar — fixed top */}
      {commandBar}

      {/* 3-panel resizable area */}
      <div className="flex-1 overflow-hidden">
        <Group orientation="horizontal" id="studio-h-panels">
          {/* Left: Outline Panel */}
          {leftPanelVisible && (
            <>
              <Panel
                id="outline"
                defaultSize="18%"
                minSize="12%"
                maxSize="30%"
                collapsible
              >
                <div className="h-full overflow-hidden border-r border-surface-border bg-white">
                  {outlinePanel}
                </div>
              </Panel>
              <Separator />
            </>
          )}

          {/* Center: Main Canvas */}
          <Panel id="canvas" minSize="40%">
            <div className="h-full overflow-hidden">
              {mainCanvas}
            </div>
          </Panel>

          {/* Right: Inspector Panel */}
          {rightPanelVisible && (
            <>
              <Separator />
              <Panel
                id="inspector"
                defaultSize="24%"
                minSize="18%"
                maxSize="40%"
                collapsible
              >
                <div className="h-full overflow-hidden border-l border-surface-border bg-white">
                  {inspectorPanel}
                </div>
              </Panel>
            </>
          )}
        </Group>
      </div>

      {/* Status Bar — fixed bottom */}
      {statusBar}
    </div>
  );
};

StudioLayout.displayName = 'StudioLayout';

export default StudioLayout;
