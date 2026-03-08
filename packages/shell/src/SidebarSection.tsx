import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@airaie/ui';

interface SidebarSectionProps {
  label: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function SidebarSection({
  label,
  collapsible = true,
  defaultOpen = true,
  children,
}: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mb-1">
      <button
        onClick={() => collapsible && setOpen(!open)}
        aria-expanded={collapsible ? open : undefined}
        className={cn(
          'flex items-center justify-between w-full px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-content-muted',
          collapsible && 'hover:text-content-secondary cursor-pointer'
        )}
      >
        <span>{label}</span>
        {collapsible &&
          (open ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
      </button>
      {open && <div role="group" aria-label={label} className="px-2">{children}</div>}
    </div>
  );
}
