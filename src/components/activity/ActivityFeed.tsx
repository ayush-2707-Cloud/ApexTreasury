import { ArrowDownLeft, ArrowUpRight, LockKey, ClockCounterClockwise } from '@phosphor-icons/react';
import { Card } from '../ui/Card';
import { StatusCue } from '../ui/Badge';
import type { ActivityItem } from '../../types/treasury';

interface ActivityFeedProps {
  items: ActivityItem[];
  isLoading: boolean;
}

export function ActivityFeed({ items, isLoading }: ActivityFeedProps) {
  if (isLoading && !items.length) {
    return (
      <Card className="p-4 bg-[#FFFFFF] border border-[#E2E8F0]">
        <div className="h-4 bg-[#F1F5F9] rounded w-28 mb-3 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-[#F1F5F9]/70 rounded animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  const getStatusVariant = (type: ActivityItem['type']) => {
    switch (type) {
      case 'SETTLED':
        return 'active';
      case 'RING_FENCED':
        return 'warning';
      case 'RECEIVED':
        return 'navy';
    }
  };

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'SETTLED':
        return <ArrowUpRight size={14} className="text-[#059669]" />;
      case 'RING_FENCED':
        return <LockKey size={14} className="text-[#D97706]" />;
      case 'RECEIVED':
        return <ArrowDownLeft size={14} className="text-[#1E40AF]" />;
    }
  };

  return (
    <Card className="p-5 sm:p-6 bg-[#FFFFFF] border border-[#E2E8F0] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ClockCounterClockwise size={16} className="text-[#64748B]" />
          <h3 className="font-sans font-bold text-sm sm:text-base text-[#0F172A] tracking-tight">
            Treasury Ledger & Compliance Audit Trail
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[#64748B]">
          {items.length} Recorded Ledger Events
        </span>
      </div>

      <div className="divide-y divide-[#E2E8F0]">
        {items.map((item) => (
          <div
            key={item.id}
            className="py-3 flex items-center justify-between gap-4 hover:bg-[#F8FAFC] px-2 rounded transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded bg-[#F8FAFC] border border-[#E2E8F0]">
                {getIcon(item.type)}
              </div>
              <div>
                <div className="font-sans font-semibold text-xs sm:text-sm text-[#0F172A]">{item.title}</div>
                <div className="text-[10px] text-[#64748B] font-sans">{item.subtitle}</div>
              </div>
            </div>

            <div className="text-right flex flex-col items-end gap-1">
              <div
                className={`font-mono text-xs sm:text-sm font-semibold ${
                  item.type === 'SETTLED'
                    ? 'text-[#059669]'
                    : item.type === 'RECEIVED'
                    ? 'text-[#0F172A]'
                    : 'text-[#D97706]'
                }`}
              >
                {item.amount_formatted}
              </div>
              <StatusCue variant={getStatusVariant(item.type)}>
                {item.status}
              </StatusCue>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
