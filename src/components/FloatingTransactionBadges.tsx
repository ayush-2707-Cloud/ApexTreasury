import React from 'react';
import { motion } from 'motion/react';

interface BadgeProps {
  className?: string;
  delay?: number;
  duration?: number;
  yOffset?: number;
  children: React.ReactNode;
}

function FloatingBadge({
  className = '',
  delay = 0,
  duration = 4,
  yOffset = 8,
  children,
}: BadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 12 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: [-yOffset, yOffset, -yOffset],
      }}
      transition={{
        opacity: { duration: 0.6, delay },
        scale: { duration: 0.6, delay },
        y: {
          duration,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',
          delay,
        },
      }}
      whileHover={{ scale: 1.04, transition: { duration: 0.2 } }}
      className={`absolute z-20 pointer-events-auto bg-[#FFFFFF]/95 backdrop-blur-md border border-[#E2E8F0]/90 rounded-2xl px-4 py-3 shadow-[0_12px_32px_rgba(15,23,42,0.08)] flex items-center gap-3.5 select-none ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function HeroVisualStage({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-5xl mx-auto flex items-center justify-center my-2 sm:my-4">
      {/* 3D Particle Canvas */}
      {children}

      {/* Chip 1: Top-Left (USD Foreign Proceeds Inflow) */}
      <FloatingBadge
        className="top-6 sm:top-10 left-2 sm:left-8 lg:left-14"
        delay={0.2}
        duration={5.2}
        yOffset={9}
      >
        <div className="w-9 h-9 rounded-xl bg-[#D1FAE5] border border-[#A7F3D0] flex items-center justify-center text-[#059669] font-bold text-base">
          $
        </div>
        <div className="text-left font-sans">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#0F172A] tracking-tight">+$1,495.00 USD</span>
            <span className="text-[10px] font-mono font-medium text-[#059669] bg-[#D1FAE5] border border-[#A7F3D0] px-1.5 py-0.2 rounded-full">
              Received
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] font-medium block">EEFC Reserve • Stripe Payout</span>
        </div>
      </FloatingBadge>

      {/* Chip 2: Mid-Right (Instant Domestic Settlement) */}
      <FloatingBadge
        className="top-1/3 right-2 sm:right-8 lg:right-12"
        delay={0.5}
        duration={4.6}
        yOffset={7}
      >
        <div className="w-9 h-9 rounded-xl bg-[#0F172A] flex items-center justify-center text-white font-bold text-sm">
          ₹
        </div>
        <div className="text-left font-sans">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#0F172A] tracking-tight">₹1,41,856 Settled</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
          </div>
          <span className="text-[11px] text-[#64748B] font-mono block">Zero Bank Spread Friction</span>
        </div>
      </FloatingBadge>

      {/* Chip 3: Bottom-Left (Alpha Yield Saved vs Bank Markup) */}
      <FloatingBadge
        className="bottom-8 sm:bottom-12 left-4 sm:left-12 lg:left-20"
        delay={0.8}
        duration={5.8}
        yOffset={10}
      >
        <div className="w-9 h-9 rounded-xl bg-[#DBEAFE] border border-[#BFDBFE] flex items-center justify-center text-[#1E40AF] font-bold text-sm">
          ⚡
        </div>
        <div className="text-left font-sans">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[#059669] font-mono tracking-tight">+₹3,240 Retained</span>
          </div>
          <span className="text-[11px] text-[#64748B] font-medium block">vs 3.8% Traditional Bank Fee</span>
        </div>
      </FloatingBadge>
    </div>
  );
}
