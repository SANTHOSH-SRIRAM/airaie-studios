import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { cn } from '@airaie/ui';
import {
  Database, Brain, BarChart2, ListChecks, ShieldCheck,
  Send, Cpu, FileOutput, BookOpen, RotateCcw, Layers, CheckCircle2
} from 'lucide-react';

interface BaseNodeData {
  label: string;
  status?: 'idle' | 'running' | 'completed' | 'failed';
  detail?: string;
}

const statusColors = {
  idle: 'border-gray-300 bg-white',
  running: 'border-blue-400 bg-blue-50 ring-2 ring-blue-200 animate-pulse',
  completed: 'border-green-400 bg-green-50',
  failed: 'border-red-400 bg-red-50',
};

const statusDot = {
  idle: 'bg-gray-300',
  running: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
};

function BaseNode({
  label,
  status = 'idle',
  detail,
  icon: Icon,
  color,
}: BaseNodeData & { icon: typeof Database; color: string }) {
  return (
    <div className={cn(
      'px-3 py-2 rounded-lg border-2 shadow-sm min-w-[140px] transition-all',
      statusColors[status]
    )}>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-gray-400" />
      <div className="flex items-center gap-2">
        <div className={cn('p-1 rounded', color)}>
          <Icon size={14} className="text-white" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
            {label}
            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusDot[status])} />
          </div>
          {detail && <div className="text-[10px] text-gray-500 truncate">{detail}</div>}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-gray-400" />
    </div>
  );
}

export const ContextNode = memo(({ data }: NodeProps) => (
  <BaseNode {...(data as unknown as BaseNodeData)} icon={Database} color="bg-blue-500" />
));
ContextNode.displayName = 'ContextNode';

export const MemoryNode = memo(({ data }: NodeProps) => (
  <BaseNode {...(data as unknown as BaseNodeData)} icon={Brain} color="bg-purple-500" />
));
MemoryNode.displayName = 'MemoryNode';

export const ScoringNode = memo(({ data }: NodeProps) => (
  <BaseNode {...(data as unknown as BaseNodeData)} icon={BarChart2} color="bg-amber-500" />
));
ScoringNode.displayName = 'ScoringNode';

export const ProposalNode = memo(({ data }: NodeProps) => (
  <BaseNode {...(data as unknown as BaseNodeData)} icon={ListChecks} color="bg-blue-600" />
));
ProposalNode.displayName = 'ProposalNode';

export const PolicyNode = memo(({ data }: NodeProps) => (
  <BaseNode {...(data as unknown as BaseNodeData)} icon={ShieldCheck} color="bg-orange-500" />
));
PolicyNode.displayName = 'PolicyNode';

export const ApprovalNode = memo(({ data }: NodeProps) => (
  <BaseNode {...(data as unknown as BaseNodeData)} icon={CheckCircle2} color="bg-teal-500" />
));
ApprovalNode.displayName = 'ApprovalNode';

export const DispatchNode = memo(({ data }: NodeProps) => (
  <BaseNode {...(data as unknown as BaseNodeData)} icon={Send} color="bg-indigo-500" />
));
DispatchNode.displayName = 'DispatchNode';

export const ExecutionNode = memo(({ data }: NodeProps) => (
  <BaseNode {...(data as unknown as BaseNodeData)} icon={Cpu} color="bg-green-500" />
));
ExecutionNode.displayName = 'ExecutionNode';

export const ResultNode = memo(({ data }: NodeProps) => (
  <BaseNode {...(data as unknown as BaseNodeData)} icon={FileOutput} color="bg-emerald-500" />
));
ResultNode.displayName = 'ResultNode';

export const LearnNode = memo(({ data }: NodeProps) => (
  <BaseNode {...(data as unknown as BaseNodeData)} icon={BookOpen} color="bg-violet-500" />
));
LearnNode.displayName = 'LearnNode';

export const ReplanNode = memo(({ data }: NodeProps) => (
  <BaseNode {...(data as unknown as BaseNodeData)} icon={RotateCcw} color="bg-amber-600" />
));
ReplanNode.displayName = 'ReplanNode';

export const DecomposeNode = memo(({ data }: NodeProps) => (
  <BaseNode {...(data as unknown as BaseNodeData)} icon={Layers} color="bg-cyan-500" />
));
DecomposeNode.displayName = 'DecomposeNode';

export const nodeTypes = {
  context: ContextNode,
  memory: MemoryNode,
  scoring: ScoringNode,
  proposal: ProposalNode,
  policy: PolicyNode,
  approval: ApprovalNode,
  dispatch: DispatchNode,
  execution: ExecutionNode,
  result: ResultNode,
  learn: LearnNode,
  replan: ReplanNode,
  decompose: DecomposeNode,
};
