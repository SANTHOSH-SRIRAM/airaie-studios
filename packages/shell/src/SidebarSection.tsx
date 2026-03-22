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
  label, collapsible = true, defaultOpen = true, children,
}: SidebarSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="mt-3">
      <button
        onClick={() => collapsible && setOpen(!open)}
        aria-expanded={collapsible ? open : undefined}
        className={cn(
          'flex items-center justify-between w-full px-4 py-1.5 text-[11px] font-medium uppercase tracking-wider text-sidebar-section',
          collapsible && 'hover:text-sidebar-text cursor-pointer'
        )}
      >
        <span>{label}</span>
        {collapsible && (open ? <ChevronDown size={12} /> : <ChevronRight size={12} />)}
      </button>
      {open && <div role="group" aria-label={label} className="mt-0.5">{children}</div>}
    </div>
  );
}
