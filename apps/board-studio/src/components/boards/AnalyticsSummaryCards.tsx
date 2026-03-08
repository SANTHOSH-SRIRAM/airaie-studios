// ============================================================
// AnalyticsSummaryCards — Dashboard analytics strip
// ============================================================

import React from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheck,
  LayoutDashboard,
} from 'lucide-react';
import { Card } from '@airaie/ui';
import { useAnalyticsSummary } from '@hooks/useAnalytics';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <Card className="px-4 py-3 min-w-[140px]">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded ${color}`}>
          <Icon size={16} className="text-white" />
        </div>
        <div>
          <div className="text-lg font-bold text-content-primary">{value}</div>
          <div className="text-[10px] uppercase tracking-wider text-content-muted">
            {label}
          </div>
        </div>
      </div>
    </Card>
  );
}

const AnalyticsSummaryCards: React.FC = () => {
  const { data, isLoading } = useAnalyticsSummary();

  if (isLoading || !data) {
    return (
      <div className="flex gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="px-4 py-3 min-w-[140px] animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded" />
              <div className="space-y-1.5">
                <div className="h-5 w-8 bg-slate-200 rounded" />
                <div className="h-3 w-16 bg-slate-200 rounded" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto">
      <StatCard
        label="Total Runs"
        value={data.total_runs}
        icon={Activity}
        color="bg-blue-500"
      />
      <StatCard
        label="Completed"
        value={data.completed_runs}
        icon={CheckCircle2}
        color="bg-green-500"
      />
      <StatCard
        label="Failed"
        value={data.failed_runs}
        icon={XCircle}
        color="bg-red-500"
      />
      <StatCard
        label="Running"
        value={data.running_runs}
        icon={Loader2}
        color="bg-amber-500"
      />
      <StatCard
        label="Pending Approvals"
        value={data.pending_approvals}
        icon={ShieldCheck}
        color="bg-purple-500"
      />
      <StatCard
        label="Boards"
        value={data.total_boards}
        icon={LayoutDashboard}
        color="bg-slate-600"
      />
    </div>
  );
};

AnalyticsSummaryCards.displayName = 'AnalyticsSummaryCards';

export default AnalyticsSummaryCards;
