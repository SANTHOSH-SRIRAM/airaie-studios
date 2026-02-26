import React from 'react';
import { cn } from '../utils/cn';

export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
};

// Deterministic colour palette from name hash
const palette = [
  'bg-blue-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-indigo-600',
  'bg-teal-600',
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className }) => {
  const initials = getInitials(name);
  const colorClass = palette[hashName(name) % palette.length];

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full text-white font-medium select-none',
        sizeStyles[size],
        colorClass,
        className
      )}
      title={name}
      aria-label={name}
    >
      {initials}
    </div>
  );
};

Avatar.displayName = 'Avatar';

export default Avatar;
