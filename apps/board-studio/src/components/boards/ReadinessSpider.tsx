// ============================================================
// ReadinessSpider — Recharts RadarChart for 5-category readiness
// ============================================================

import React from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

export interface ReadinessSpiderProps {
  readiness: {
    design: number;
    validation: number;
    compliance: number;
    manufacturing: number;
    approvals: number;
  };
  className?: string;
}

const ReadinessSpider: React.FC<ReadinessSpiderProps> = ({ readiness, className }) => {
  const data = [
    { category: 'Design', value: readiness.design },
    { category: 'Validation', value: readiness.validation },
    { category: 'Compliance', value: readiness.compliance },
    { category: 'Manufacturing', value: readiness.manufacturing },
    { category: 'Approvals', value: readiness.approvals },
  ];

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={250}>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="category" tick={{ fontSize: 12 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Radar
            name="Readiness"
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

ReadinessSpider.displayName = 'ReadinessSpider';

export default ReadinessSpider;
