import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'subtle';
  isHighlighted?: boolean;
}

export function Card({
  children,
  className,
  variant = 'default',
  isHighlighted = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-[#E2E8F0] transition-colors duration-150 relative shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]',
        variant === 'default' && 'bg-[#FFFFFF]',
        variant === 'elevated' && 'bg-[#F8FAFC]',
        variant === 'subtle' && 'bg-[#F1F5F9]',
        isHighlighted && 'border-[#94A3B8]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
