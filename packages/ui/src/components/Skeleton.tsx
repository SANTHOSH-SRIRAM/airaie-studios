import React from 'react';
import { cn } from '../utils/cn';

// --- Base Skeleton ---

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
  <div className={cn('animate-pulse bg-slate-200 rounded-none', className)} />
);

Skeleton.displayName = 'Skeleton';

// --- Card Skeleton ---

export interface CardSkeletonProps {
  /** Number of text lines in the card body */
  lines?: number;
  className?: string;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({ lines = 3, className }) => (
  <div className={cn('border border-surface-border p-4 space-y-3', className)}>
    {/* Title */}
    <Skeleton className="h-5 w-2/3" />
    {/* Subtitle */}
    <Skeleton className="h-3 w-1/3" />
    {/* Body lines */}
    <div className="space-y-2 pt-1">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3', i === lines - 1 ? 'w-4/5' : 'w-full')}
        />
      ))}
    </div>
  </div>
);

CardSkeleton.displayName = 'CardSkeleton';

// --- List Skeleton ---

export interface ListSkeletonProps {
  /** Number of rows */
  rows?: number;
  className?: string;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({ rows = 5, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 px-3 py-2.5 border border-surface-border">
        <Skeleton className="h-8 w-8 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-1/2" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
        <Skeleton className="h-5 w-16 shrink-0" />
      </div>
    ))}
  </div>
);

ListSkeleton.displayName = 'ListSkeleton';

// --- Form Skeleton ---

export interface FormSkeletonProps {
  /** Number of fields */
  fields?: number;
  className?: string;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({ fields = 4, className }) => (
  <div className={cn('space-y-5', className)}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-1.5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-full" />
      </div>
    ))}
    {/* Submit button */}
    <Skeleton className="h-9 w-28 mt-2" />
  </div>
);

FormSkeleton.displayName = 'FormSkeleton';

export default Skeleton;
