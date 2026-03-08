import React, { useMemo, useState } from 'react';
import { cn, Button, Spinner } from '@airaie/ui';
import { ArrowLeft, Columns, AlignJustify } from 'lucide-react';
import { useUIStore } from '@store/uiStore';
import { useAgentVersion } from '@hooks/useAgents';

export interface PromptDiffProps {
  versionA: number;
  versionB: number;
  onBack: () => void;
  className?: string;
}

// ── Word-level diff (Myers-like greedy LCS) ──────────────────────────

type DiffOp = 'equal' | 'add' | 'remove';
interface DiffToken { text: string; op: DiffOp }

function tokenise(text: string): string[] {
  // Split on word boundaries but keep whitespace tokens so indentation is visible
  return text.match(/\S+|\s+/g) ?? [];
}

function computeWordDiff(oldText: string, newText: string): DiffToken[] {
  const a = tokenise(oldText);
  const b = tokenise(newText);
  const n = a.length;
  const m = b.length;

  // LCS via DP (fine for spec-sized texts, typically < 2k tokens)
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  // Backtrack to build diff
  const result: DiffToken[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      result.push({ text: a[i - 1], op: 'equal' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.push({ text: b[j - 1], op: 'add' });
      j--;
    } else {
      result.push({ text: a[i - 1], op: 'remove' });
      i--;
    }
  }
  return result.reverse();
}

// ── Line-level grouping for split view ───────────────────────────────

interface DiffLine { tokens: DiffToken[]; lineNum: number }
interface SplitPair { left: DiffLine | null; right: DiffLine | null }

function groupIntoLines(tokens: DiffToken[]): SplitPair[] {
  const leftLines: DiffLine[] = [];
  const rightLines: DiffLine[] = [];

  let leftBuf: DiffToken[] = [];
  let rightBuf: DiffToken[] = [];
  let leftNum = 1, rightNum = 1;

  const flushLeft = () => { if (leftBuf.length) { leftLines.push({ tokens: leftBuf, lineNum: leftNum++ }); leftBuf = []; } };
  const flushRight = () => { if (rightBuf.length) { rightLines.push({ tokens: rightBuf, lineNum: rightNum++ }); rightBuf = []; } };

  for (const t of tokens) {
    const hasNewline = t.text.includes('\n');
    if (t.op === 'equal' || t.op === 'remove') leftBuf.push(t);
    if (t.op === 'equal' || t.op === 'add') rightBuf.push(t);
    if (hasNewline) {
      if (t.op === 'equal' || t.op === 'remove') flushLeft();
      if (t.op === 'equal' || t.op === 'add') flushRight();
    }
  }
  flushLeft();
  flushRight();

  // Pair up: match equal lines, orphan adds/removes
  const pairs: SplitPair[] = [];
  let li = 0, ri = 0;
  while (li < leftLines.length || ri < rightLines.length) {
    const l = leftLines[li] ?? null;
    const r = rightLines[ri] ?? null;
    pairs.push({ left: l, right: r });
    if (l) li++;
    if (r) ri++;
  }
  return pairs;
}

// ── Rendering helpers ────────────────────────────────────────────────

const OP_CLASSES: Record<DiffOp, string> = {
  equal: '',
  add: 'bg-green-100 text-green-800',
  remove: 'bg-red-100 text-red-800 line-through',
};

function TokenSpan({ token }: { token: DiffToken }) {
  if (token.op === 'equal') return <span>{token.text}</span>;
  return <span className={cn('rounded-sm px-[1px]', OP_CLASSES[token.op])}>{token.text}</span>;
}

function DiffLineView({ tokens }: { tokens: DiffToken[] }) {
  return (
    <div className="min-h-[1.25rem]">
      {tokens.map((t, i) => <TokenSpan key={i} token={t} />)}
      {tokens.length === 0 && '\u00A0'}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────

const PromptDiff: React.FC<PromptDiffProps> = ({ versionA, versionB, onBack, className }) => {
  const agentId = useUIStore((s) => s.agentId);
  const { data: a, isLoading: loadingA } = useAgentVersion(agentId, versionA);
  const { data: b, isLoading: loadingB } = useAgentVersion(agentId, versionB);
  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split');

  const textA = useMemo(() => (a ? JSON.stringify(a.spec, null, 2) : ''), [a]);
  const textB = useMemo(() => (b ? JSON.stringify(b.spec, null, 2) : ''), [b]);

  const diff = useMemo(() => computeWordDiff(textA, textB), [textA, textB]);

  const stats = useMemo(() => {
    let adds = 0, removes = 0;
    for (const t of diff) {
      if (t.op === 'add') adds++;
      if (t.op === 'remove') removes++;
    }
    return { adds, removes };
  }, [diff]);

  const splitPairs = useMemo(() => (viewMode === 'split' ? groupIntoLines(diff) : []), [diff, viewMode]);

  if (loadingA || loadingB) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border bg-white">
        <button onClick={onBack} className="text-content-muted hover:text-content-primary"><ArrowLeft size={16} /></button>
        <h3 className="text-sm font-semibold text-content-primary">Diff: v{versionA} ↔ v{versionB}</h3>

        {/* Stats */}
        <div className="flex items-center gap-2 ml-2 text-xs">
          <span className="text-green-600 font-mono">+{stats.adds}</span>
          <span className="text-red-600 font-mono">-{stats.removes}</span>
        </div>

        {/* View toggle */}
        <div className="ml-auto flex items-center border border-surface-border rounded overflow-hidden">
          <button
            onClick={() => setViewMode('split')}
            className={cn('p-1.5 transition-colors', viewMode === 'split' ? 'bg-brand-secondary text-white' : 'bg-white text-content-muted hover:text-content-primary')}
            title="Split view"
          >
            <Columns size={14} />
          </button>
          <button
            onClick={() => setViewMode('unified')}
            className={cn('p-1.5 transition-colors', viewMode === 'unified' ? 'bg-brand-secondary text-white' : 'bg-white text-content-muted hover:text-content-primary')}
            title="Unified view"
          >
            <AlignJustify size={14} />
          </button>
        </div>
      </div>

      {/* Diff body */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'unified' ? (
          <pre className="p-4 text-xs font-mono leading-5 whitespace-pre-wrap">
            {diff.map((t, i) => <TokenSpan key={i} token={t} />)}
          </pre>
        ) : (
          <div className="grid grid-cols-2 min-w-0">
            {/* Left: version A */}
            <div className="border-r border-surface-border">
              <div className="px-3 py-2 text-xs font-medium bg-red-50 text-red-700 border-b border-surface-border">
                v{versionA} <span className="text-red-400 ml-1">(-{stats.removes})</span>
              </div>
              <pre className="p-3 text-xs font-mono leading-5 whitespace-pre-wrap">
                {splitPairs.map((pair, i) => (
                  <div key={i} className={cn(pair.left?.tokens.some(t => t.op === 'remove') && 'bg-red-50/50')}>
                    <span className="inline-block w-8 text-right text-content-muted mr-2 select-none">
                      {pair.left?.lineNum ?? ''}
                    </span>
                    {pair.left ? <DiffLineView tokens={pair.left.tokens.filter(t => t.op !== 'add')} /> : '\u00A0'}
                  </div>
                ))}
              </pre>
            </div>
            {/* Right: version B */}
            <div>
              <div className="px-3 py-2 text-xs font-medium bg-green-50 text-green-700 border-b border-surface-border">
                v{versionB} <span className="text-green-400 ml-1">(+{stats.adds})</span>
              </div>
              <pre className="p-3 text-xs font-mono leading-5 whitespace-pre-wrap">
                {splitPairs.map((pair, i) => (
                  <div key={i} className={cn(pair.right?.tokens.some(t => t.op === 'add') && 'bg-green-50/50')}>
                    <span className="inline-block w-8 text-right text-content-muted mr-2 select-none">
                      {pair.right?.lineNum ?? ''}
                    </span>
                    {pair.right ? <DiffLineView tokens={pair.right.tokens.filter(t => t.op !== 'remove')} /> : '\u00A0'}
                  </div>
                ))}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

PromptDiff.displayName = 'PromptDiff';
export default PromptDiff;
