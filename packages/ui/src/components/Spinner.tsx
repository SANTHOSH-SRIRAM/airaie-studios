import React from 'react';
import { cn } from '../utils/cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
}

const sizeMap: Record<SpinnerSize, number> = {
  sm: 16,
  md: 24,
  lg: 36,
};

const strokeMap: Record<SpinnerSize, number> = {
  sm: 2.5,
  md: 2.5,
  lg: 3,
};

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  const px = sizeMap[size];
  const stroke = strokeMap[size];
  const radius = (px - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      fill="none"
      className={cn('animate-spin text-brand-primary', className)}
      role="status"
      aria-label="Loading"
    >
      {/* Track */}
      <circle
        cx={px / 2}
        cy={px / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        opacity={0.2}
      />
      {/* Arc */}
      <circle
        cx={px / 2}
        cy={px / 2}
        r={radius}
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * 0.7}
      />
    </svg>
  );
};

Spinner.displayName = 'Spinner';

export default Spinner;
