import { StripeLogo, DeviceMobile, Storefront, Check } from '@phosphor-icons/react';
import { Card } from '../ui/Card';
import { StatusCue } from '../ui/Badge';

export function GatewayMatrix() {
  const gateways = [
    {
      name: 'Stripe Global Payments',
      currency: 'USD',
      payoutPeriod: 'Daily Rolling (T+2)',
      retentionStatus: 'Auto-Routing to EEFC',
      retentionRate: '100% Retained',
      connected: true,
      lastPayout: '$3,420.00',
      icon: StripeLogo,
    },
    {
      name: 'Lemon Squeezy MoR',
      currency: 'EUR & USD',
      payoutPeriod: 'Bi-Weekly Fiscal',
      retentionStatus: 'Auto-Routing to EEFC',
      retentionRate: '100% Retained',
      connected: true,
      lastPayout: '$1,250.00',
      icon: Storefront,
    },
    {
      name: 'Apple App Store Connect',
      currency: 'Multi-Currency Tier',
      payoutPeriod: 'Monthly Settlement',
      retentionStatus: 'FEMA Exporter Conduit',
      retentionRate: '100% Retained',
      connected: true,
      lastPayout: '$890.00',
      icon: DeviceMobile,
    },
  ];

  return (
    <Card className="p-5 sm:p-6 bg-[#FFFFFF] border border-[#E2E8F0] shadow-[0_1px_3px_0_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-sans font-bold text-sm sm:text-base text-[#0F172A] tracking-tight">
            Revenue Conduit & Multi-Currency Gateway Routing
          </h3>
          <p className="text-xs font-sans text-[#64748B]">
            Inflows route directly into your virtual EEFC buffer without triggering premature foreign exchange conversion.
          </p>
        </div>
        <StatusCue variant="active">
          3 Active Conduits
        </StatusCue>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {gateways.map((gw) => {
          const Icon = gw.icon;
          return (
            <div
              key={gw.name}
              className="p-4 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-colors flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded bg-[#FFFFFF] text-[#0F172A] border border-[#E2E8F0] shadow-2xs">
                    <Icon size={16} />
                  </div>
                  <span className="flex items-center gap-1.5 text-[11px] font-sans font-medium text-[#059669]">
                    <Check size={11} weight="bold" />
                    Active Conduit
                  </span>
                </div>

                <div className="font-sans font-bold text-xs sm:text-sm text-[#0F172A] mb-0.5">{gw.name}</div>
                <div className="text-[11px] font-sans text-[#64748B] mb-3">{gw.payoutPeriod}</div>
              </div>

              <div className="pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#64748B] block text-[9px] uppercase font-sans font-semibold tracking-wider">Last Inflow</span>
                  <span className="font-mono text-[#0F172A] text-[11px] font-semibold">{gw.lastPayout}</span>
                </div>
                <div className="text-right">
                  <span className="text-[#64748B] block text-[9px] uppercase font-sans font-semibold tracking-wider">Retention</span>
                  <span className="font-mono text-[#059669] text-[11px] font-bold">{gw.retentionRate}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
