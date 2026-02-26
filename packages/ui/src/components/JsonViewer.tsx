import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

export interface JsonViewerProps {
  data: unknown;
  /** Expand levels initially (0 = collapsed, Infinity = all expanded) */
  defaultExpandDepth?: number;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Leaf value renderer                                                */
/* ------------------------------------------------------------------ */

function JsonValue({ value }: { value: unknown }) {
  if (value === null) return <span className="text-slate-400">null</span>;
  if (value === undefined) return <span className="text-slate-400">undefined</span>;

  switch (typeof value) {
    case 'string':
      return <span className="text-emerald-400">&quot;{value}&quot;</span>;
    case 'number':
      return <span className="text-amber-400">{String(value)}</span>;
    case 'boolean':
      return <span className="text-blue-400">{String(value)}</span>;
    default:
      return <span className="text-slate-300">{String(value)}</span>;
  }
}

/* ------------------------------------------------------------------ */
/*  Recursive node                                                     */
/* ------------------------------------------------------------------ */

interface JsonNodeProps {
  keyName?: string;
  value: unknown;
  depth: number;
  defaultExpandDepth: number;
  isLast?: boolean;
}

function JsonNode({ keyName, value, depth, defaultExpandDepth, isLast = true }: JsonNodeProps) {
  const [expanded, setExpanded] = useState(depth < defaultExpandDepth);

  const toggle = useCallback(() => setExpanded((prev) => !prev), []);

  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);

  // Leaf node
  if (!isObject) {
    return (
      <div className="flex items-start" style={{ paddingLeft: depth * 16 }}>
        {keyName !== undefined && (
          <span className="text-violet-400 mr-1">{keyName}:</span>
        )}
        <JsonValue value={value} />
        {!isLast && <span className="text-slate-500">,</span>}
      </div>
    );
  }

  // Object / Array
  const entries = isArray
    ? (value as unknown[]).map((v, i) => [String(i), v] as const)
    : Object.entries(value as Record<string, unknown>);

  const bracketOpen = isArray ? '[' : '{';
  const bracketClose = isArray ? ']' : '}';
  const isEmpty = entries.length === 0;

  return (
    <div>
      <div
        className="flex items-center cursor-pointer hover:bg-slate-800/50 select-none"
        style={{ paddingLeft: depth * 16 }}
        onClick={toggle}
      >
        {!isEmpty && (
          expanded ? (
            <ChevronDown size={14} className="text-slate-500 mr-1 flex-shrink-0" />
          ) : (
            <ChevronRight size={14} className="text-slate-500 mr-1 flex-shrink-0" />
          )
        )}
        {isEmpty && <span className="w-[14px] mr-1 flex-shrink-0" />}
        {keyName !== undefined && (
          <span className="text-violet-400 mr-1">{keyName}:</span>
        )}
        {isEmpty ? (
          <>
            <span className="text-slate-400">
              {bracketOpen}
              {bracketClose}
            </span>
            {!isLast && <span className="text-slate-500">,</span>}
          </>
        ) : expanded ? (
          <span className="text-slate-400">{bracketOpen}</span>
        ) : (
          <>
            <span className="text-slate-400">
              {bracketOpen}...{bracketClose}
            </span>
            <span className="text-slate-600 ml-2 text-xs">
              {entries.length} {entries.length === 1 ? 'item' : 'items'}
            </span>
            {!isLast && <span className="text-slate-500">,</span>}
          </>
        )}
      </div>

      {expanded && !isEmpty && (
        <>
          {entries.map(([key, val], idx) => (
            <JsonNode
              key={key}
              keyName={isArray ? undefined : key}
              value={val}
              depth={depth + 1}
              defaultExpandDepth={defaultExpandDepth}
              isLast={idx === entries.length - 1}
            />
          ))}
          <div style={{ paddingLeft: depth * 16 }}>
            <span className="text-slate-400">{bracketClose}</span>
            {!isLast && <span className="text-slate-500">,</span>}
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Public component                                                   */
/* ------------------------------------------------------------------ */

const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  defaultExpandDepth = 1,
  className,
}) => {
  return (
    <div
      className={cn(
        'bg-slate-900 text-sm font-mono p-4 overflow-auto border border-surface-border rounded-none',
        'leading-relaxed',
        className
      )}
    >
      <JsonNode value={data} depth={0} defaultExpandDepth={defaultExpandDepth} />
    </div>
  );
};

JsonViewer.displayName = 'JsonViewer';

export default JsonViewer;
