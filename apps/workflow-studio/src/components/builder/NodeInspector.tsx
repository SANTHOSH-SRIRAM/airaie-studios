import React, { useMemo } from 'react';
import { cn, Input, CodeEditor, Badge } from '@airaie/ui';
import { X } from 'lucide-react';
import { useCanvasStore } from '@store/canvasStore';
import InputBindingRow from './InputBindingRow';
import OutputBindingRow from './OutputBindingRow';

const NodeInspector: React.FC<{ className?: string }> = ({ className }) => {
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const updateNode = useCanvasStore((s) => s.updateNode);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const removeNode = useCanvasStore((s) => s.removeNode);

  const node = selectedNodeId ? nodes.get(selectedNodeId) : undefined;

  const otherNodes = useMemo(
    () => Array.from(nodes.values()).filter((n) => n.id !== selectedNodeId),
    [nodes, selectedNodeId]
  );

  const incomingEdges = useMemo(
    () =>
      Array.from(edges.values()).filter((e) => e.targetNodeId === selectedNodeId),
    [edges, selectedNodeId]
  );

  const outgoingEdges = useMemo(
    () =>
      Array.from(edges.values()).filter((e) => e.sourceNodeId === selectedNodeId),
    [edges, selectedNodeId]
  );

  if (!node) return null;

  const configJson = JSON.stringify(node.config, null, 2);

  return (
    <div
      className={cn(
        'w-[320px] flex-shrink-0 border-l border-surface-border bg-white overflow-y-auto',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <h3 className="text-sm font-semibold text-content-primary">Node Inspector</h3>
        <button
          onClick={() => selectNode(null)}
          className="p-1 text-content-muted hover:text-content-primary transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-5">
        {/* Identity Section */}
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
            Identity
          </h4>
          <Input
            label="Label"
            value={node.label}
            onChange={(e) => updateNode(node.id, { label: e.target.value })}
          />
          <div className="flex items-center gap-2">
            <span className="text-sm text-content-secondary">Type:</span>
            <Badge variant="info" badgeStyle="outline">
              {node.type}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-content-secondary">ID:</span>
            <code className="text-xs text-content-muted font-mono">{node.id}</code>
          </div>
        </section>

        {/* Configuration Section */}
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
            Configuration
          </h4>
          <CodeEditor
            value={configJson}
            language="json"
            onChange={(val) => {
              try {
                const parsed = JSON.parse(val);
                updateNode(node.id, { config: parsed });
              } catch {
                // Invalid JSON — don't update until valid
              }
            }}
            minLines={6}
          />
        </section>

        {/* Input Bindings */}
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
            Input Bindings
          </h4>
          {incomingEdges.length === 0 ? (
            <p className="text-sm text-content-muted">No incoming connections.</p>
          ) : (
            <div className="space-y-2">
              {incomingEdges.map((edge) => {
                const sourceNode = nodes.get(edge.sourceNodeId);
                return (
                  <InputBindingRow
                    key={edge.id}
                    inputName={edge.targetPort}
                    sourceNodeId={edge.sourceNodeId}
                    availableNodes={otherNodes}
                    onChange={() => {}}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Output Bindings */}
        <section className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
            Output Bindings
          </h4>
          {outgoingEdges.length === 0 ? (
            <p className="text-sm text-content-muted">No outgoing connections.</p>
          ) : (
            <div className="space-y-2">
              {outgoingEdges.map((edge) => {
                const targetNode = nodes.get(edge.targetNodeId);
                return (
                  <OutputBindingRow
                    key={edge.id}
                    outputName={edge.sourcePort}
                    connectedTo={targetNode ? `${targetNode.label} (${targetNode.type})` : ''}
                  />
                );
              })}
            </div>
          )}
        </section>

        {/* Delete Node */}
        <section className="pt-2 border-t border-surface-border">
          <button
            onClick={() => {
              removeNode(node.id);
              selectNode(null);
            }}
            className="text-sm text-status-danger hover:underline"
          >
            Delete Node
          </button>
        </section>
      </div>
    </div>
  );
};

NodeInspector.displayName = 'NodeInspector';

export default NodeInspector;
