// ============================================================
// ExecutionAnimations — shared framer-motion animation presets
// ============================================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Reduced motion check ───────────────────────────────────

const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

function dur(ms: number) {
  return prefersReducedMotion ? 0 : ms / 1000;
}

// ─── Status color morph (for accent bars) ───────────────────

export function AnimatedColorBar({
  color,
  className,
  style,
}: {
  color: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      animate={{ backgroundColor: color }}
      transition={{ duration: dur(300), ease: 'easeOut' }}
    />
  );
}

// ─── Slide-in row for evidence tables ───────────────────────

export function SlideInRow({
  children,
  className,
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.tr
      className={className}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: dur(200), delay: index * 0.05 }}
    >
      {children}
    </motion.tr>
  );
}

// ─── Scale pulse for badges/dots ────────────────────────────

export function PulseDot({
  className,
  title,
}: {
  className: string;
  title?: string;
}) {
  return (
    <motion.span
      className={className}
      title={title}
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: dur(200) }}
    />
  );
}

// ─── Staggered checkmark list ───────────────────────────────

export function StaggerContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: prefersReducedMotion ? 0 : 0.1 } },
        hidden: {},
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        visible: { opacity: 1, x: 0 },
        hidden: { opacity: 0, x: -10 },
      }}
      transition={{ duration: dur(150) }}
    >
      {children}
    </motion.div>
  );
}

// ─── Section expand/collapse ────────────────────────────────

export function CollapsibleSection({
  isOpen,
  children,
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: dur(200), ease: 'easeInOut' }}
          style={{ overflow: 'hidden' }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Badge spring animation ─────────────────────────────────

export function SpringBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.span
      className={className}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 15 }}
    >
      {children}
    </motion.span>
  );
}

// ─── Shimmer overlay for progress bars ──────────────────────

export function ShimmerBar({ className }: { className?: string }) {
  if (prefersReducedMotion) return null;
  return (
    <motion.div
      className={`absolute inset-0 ${className ?? ''}`}
      style={{
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
      }}
      animate={{ x: ['-100%', '100%'] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// ─── Counter animation for readiness % ──────────────────────

export function AnimatedCounter({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const [display, setDisplay] = React.useState(value);
  const prevRef = React.useRef(value);

  React.useEffect(() => {
    if (prefersReducedMotion || prevRef.current === value) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }
    const start = prevRef.current;
    const diff = value - start;
    const steps = 20;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= steps) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(Math.round(start + (diff * step) / steps));
      }
    }, 15);
    prevRef.current = value;
    return () => clearInterval(interval);
  }, [value]);

  return <span className={className}>{display}</span>;
}
