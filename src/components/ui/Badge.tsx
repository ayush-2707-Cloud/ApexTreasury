import React from 'react';
import { cn } from '../../lib/utils';

export type StatusVariant = 'active' | 'navy' | 'warning' | 'danger' | 'neutral';

interface StatusCueProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: StatusVariant;
  showDot?: boolean;
}

export function StatusCue({
  children,
  variant = 'neutral',
  showDot = true,
  className,
  ...props
}: StatusCueProps) {
  const dotColors: Record<StatusVariant, string> = {
    active: 'bg-[#059669]',
    navy: 'bg-[#1E40AF]',
    warning: 'bg-[#D97706]',
    danger: 'bg-[#DC2626]',
    neutral: 'bg-[#94A3B8]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-sans font-medium text-[#64748B] tracking-wider uppercase',
        className
      )}
      {...props}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      <span>{children}</span>
    </span>
  );
}

// Retain Badge export as StatusCue alias
export const Badge = StatusCue;
