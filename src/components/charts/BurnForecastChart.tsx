import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChartLineUp } from '@phosphor-icons/react';
import { StatusCue } from '../ui/Badge';
import type { BurnForecast } from '../../types/treasury';
import { formatUSD } from '../../lib/utils';

interface BurnForecastChartProps {
  forecast: BurnForecast | null;
}

// Cubic Bezier Spline Generator for smooth continuous curves
function getCubicSplinePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return d;
}

export function BurnForecastChart({ forecast }: BurnForecastChartProps) {
  const [activeTab, setActiveTab] = useState<'chart' | 'bills'>('chart');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const { timeline = [], upcoming_bills = [] } = forecast || {};
  const totalBurn = upcoming_bills.reduce((sum, b) => sum + b.amount, 0);

  // Layout parameters for SVG spline stage
  const viewBoxWidth = 840;
  const viewBoxHeight = 240;
  const padding = { top: 25, right: 30, bottom: 40, left: 60 };
  const graphWidth = viewBoxWidth - padding.left - padding.right;
  const graphHeight = viewBoxHeight - padding.top - padding.bottom;

  // Compute coordinate points
  const { burnPoints, reservePoints, maxY, burnSplinePath, burnAreaPath, reservePath } = useMemo(() => {
    if (!timeline.length) {
      return {
        burnPoints: [],
        reservePoints: [],
        maxY: 3000,
        burnSplinePath: '',
        burnAreaPath: '',
        reservePath: '',
      };
    }

    const maxVal = Math.max(
      ...timeline.map((d) => Math.max(d.projected_burn, d.ring_fenced_reserve)),
      2400
    );
    const ceilingY = Math.ceil(maxVal / 500) * 500;

    const bPts = timeline.map((d, i) => {
      const x = padding.left + (i / (timeline.length - 1)) * graphWidth;
      const y = padding.top + graphHeight - (d.projected_burn / ceilingY) * graphHeight;
      return { x, y };
    });

    const rPts = timeline.map((d, i) => {
      const x = padding.left + (i / (timeline.length - 1)) * graphWidth;
      const y = padding.top + graphHeight - (d.ring_fenced_reserve / ceilingY) * graphHeight;
      return { x, y };
    });

    const spline = getCubicSplinePath(bPts);
    const firstX = bPts[0]?.x || padding.left;
    const lastX = bPts[bPts.length - 1]?.x || viewBoxWidth - padding.right;
    const baselineY = padding.top + graphHeight;
    const area = `${spline} L ${lastX.toFixed(2)} ${baselineY.toFixed(2)} L ${firstX.toFixed(2)} ${baselineY.toFixed(2)} Z`;

    const rSpline = getCubicSplinePath(rPts);

    return {
      burnPoints: bPts,
      reservePoints: rPts,
      maxY: ceilingY,
      burnSplinePath: spline,
      burnAreaPath: area,
      reservePath: rSpline,
    };
  }, [timeline, graphWidth, graphHeight, padding.left, padding.top, padding.right]);

  // Handle pointer hover across the interactive SVG surface
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !timeline.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, (clientX - padding.left) / graphWidth));
    const index = Math.round(ratio * (timeline.length - 1));
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const activePointData = hoveredIndex !== null && timeline[hoveredIndex] ? timeline[hoveredIndex] : null;
  const activeBurnPoint = hoveredIndex !== null && burnPoints[hoveredIndex] ? burnPoints[hoveredIndex] : null;
  const activeReservePoint = hoveredIndex !== null && reservePoints[hoveredIndex] ? reservePoints[hoveredIndex] : null;

  if (!forecast || !timeline.length) {
    return (
      <div className="w-full h-80 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl flex items-center justify-center p-6">
        <div className="text-xs font-sans text-[#64748B] animate-pulse">
          Computing automated 30-day burn curve projection...
        </div>
      </div>
    );
  }

  // Y-axis grid step labels
  const yAxisTicks = [0, maxY * 0.33, maxY * 0.66, maxY];

  return (
    <div className="w-full bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl shadow-[0_1px_3px_0_rgba(0,0,0,0.03)] p-6 sm:p-7">
      {/* Header with Title and Segmented Tab Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <ChartLineUp size={18} className="text-[#059669]" />
            <h3 className="font-sans font-bold text-base text-[#0F172A] tracking-tight">
              30-Day Automated Burn Curve vs Ring-Fenced Reserve
            </h3>
            <StatusCue variant="active">Automated Lock</StatusCue>
          </div>
          <p className="font-sans text-xs text-[#64748B] max-w-[65ch]">
            Interactive SVG predictive spline curve. ApexTreasury locks <span className="font-mono font-semibold text-[#0F172A]">${totalBurn.toFixed(2)} USD</span> in EEFC foreign currency to eliminate recurring FX transaction spreads.
          </p>
        </div>

        {/* Clean Segmented Tab Switch with Framer Motion layoutId Sliding Indicator */}
        <div className="relative flex items-center bg-[#F1F5F9] p-1 rounded-md border border-[#E2E8F0] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('chart')}
            className={`relative z-10 px-3.5 py-1.5 rounded text-xs font-sans font-semibold transition-colors ${
              activeTab === 'chart'
                ? 'text-[#0F172A]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {activeTab === 'chart' && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-[#FFFFFF] rounded shadow-xs border border-[#E2E8F0] -z-10"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            Cumulative Spline Curve
          </button>

          <button
            onClick={() => setActiveTab('bills')}
            className={`relative z-10 px-3.5 py-1.5 rounded text-xs font-sans font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === 'bills'
                ? 'text-[#0F172A]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {activeTab === 'bills' && (
              <motion.div
                layoutId="activeTabIndicator"
                className="absolute inset-0 bg-[#FFFFFF] rounded shadow-xs border border-[#E2E8F0] -z-10"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              />
            )}
            Scheduled Bills ({upcoming_bills.length})
          </button>
        </div>
      </div>

      {activeTab === 'chart' ? (
        <div className="relative w-full">
          {/* Interactive SVG Spline Stage */}
          <div className="w-full overflow-hidden">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
              className="w-full h-auto cursor-crosshair select-none"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <defs>
                {/* Burn Gradient Fill */}
                <linearGradient id="splineBurnGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D97706" stopOpacity={0.16} />
                  <stop offset="90%" stopColor="#D97706" stopOpacity={0.0} />
                </linearGradient>

                {/* Reserve Gradient Fill */}
                <linearGradient id="splineReserveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#059669" stopOpacity={0.12} />
                  <stop offset="90%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              {/* Background Horizontal Hairline Grid */}
              {yAxisTicks.map((val, idx) => {
                const y = padding.top + graphHeight - (val / maxY) * graphHeight;
                return (
                  <g key={idx}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={viewBoxWidth - padding.right}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeWidth={1}
                      strokeDasharray={idx === 0 ? undefined : '2 2'}
                    />
                    <text
                      x={padding.left - 10}
                      y={y + 3}
                      textAnchor="end"
                      fill="#64748B"
                      fontSize={10}
                      fontFamily="JetBrains Mono"
                      className="tabular-nums"
                    >
                      ${Math.round(val)}
                    </text>
                  </g>
                );
              })}

              {/* X-Axis Ticks */}
              {timeline.map((d, i) => {
                if (i % 6 !== 0 && i !== timeline.length - 1) return null;
                const x = padding.left + (i / (timeline.length - 1)) * graphWidth;
                return (
                  <text
                    key={i}
                    x={x}
                    y={viewBoxHeight - 12}
                    textAnchor="middle"
                    fill="#64748B"
                    fontSize={10}
                    fontFamily="JetBrains Mono"
                    className="tabular-nums"
                  >
                    {d.date}
                  </text>
                );
              })}

              {/* Area Under Spline Curve */}
              {burnAreaPath && (
                <path d={burnAreaPath} fill="url(#splineBurnGradient)" />
              )}

              {/* 1. Ring-Fenced Reserve Baseline Curve (Emerald) with Animated Stroke */}
              {reservePath && (
                <motion.path
                  d={reservePath}
                  fill="none"
                  stroke="#059669"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                />
              )}

              {/* 2. Cumulative Burn SVG Spline Curve (Amber) with Animated Stroke Draw-In */}
              {burnSplinePath && (
                <motion.path
                  d={burnSplinePath}
                  fill="none"
                  stroke="#D97706"
                  strokeWidth={2.5}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                />
              )}

              {/* Interactive Hover Crosshair and Markers */}
              {activeBurnPoint && activeReservePoint && (
                <g>
                  {/* Vertical Hairline Guideline */}
                  <line
                    x1={activeBurnPoint.x}
                    y1={padding.top}
                    x2={activeBurnPoint.x}
                    y2={padding.top + graphHeight}
                    stroke="#0F172A"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    opacity={0.4}
                  />

                  {/* Marker Dot for Projected Burn */}
                  <circle
                    cx={activeBurnPoint.x}
                    cy={activeBurnPoint.y}
                    r={5}
                    fill="#FFFFFF"
                    stroke="#D97706"
                    strokeWidth={2.5}
                  />

                  {/* Marker Dot for Ring-Fenced Reserve */}
                  <circle
                    cx={activeReservePoint.x}
                    cy={activeReservePoint.y}
                    r={4}
                    fill="#FFFFFF"
                    stroke="#059669"
                    strokeWidth={2}
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Floating Inspection Tooltip */}
          <AnimatePresence>
            {activePointData && activeBurnPoint && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute pointer-events-none z-20 bg-[#FFFFFF] border border-[#E2E8F0] rounded-md px-3.5 py-2.5 shadow-md font-sans text-xs"
                style={{
                  left: `${(activeBurnPoint.x / viewBoxWidth) * 100}%`,
                  top: `${Math.min(activeBurnPoint.y, viewBoxHeight - 90)}px`,
                  transform: 'translate(-50%, -100%) translateY(-10px)',
                }}
              >
                <div className="font-sans font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-1 mb-1.5 flex items-center justify-between gap-4">
                  <span>{activePointData.date}</span>
                  <span className="font-mono text-[10px] text-[#64748B]">Automated Lock</span>
                </div>
                <div className="space-y-1 font-mono text-[11px]">
                  <div className="flex items-center justify-between gap-3 text-[#D97706]">
                    <span className="font-sans text-[#64748B]">Projected Burn:</span>
                    <span className="font-bold">{formatUSD(activePointData.projected_burn)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[#059669]">
                    <span className="font-sans text-[#64748B]">Ring-Fenced Lock:</span>
                    <span className="font-bold">{formatUSD(activePointData.ring_fenced_reserve)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-[#0F172A] pt-1 border-t border-[#E2E8F0]">
                    <span className="font-sans text-[#64748B]">Safety Buffer:</span>
                    <span className="font-bold">
                      {formatUSD(activePointData.ring_fenced_reserve - activePointData.projected_burn)}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend and Micro-Stat Bar */}
          <div className="mt-3 pt-3 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748B]">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-sans">
                <span className="w-2.5 h-0.5 bg-[#D97706]" />
                <span>Projected Cumulative Burn</span>
              </div>
              <div className="flex items-center gap-1.5 font-sans">
                <span className="w-2.5 h-0.5 bg-[#059669] border-t border-dashed" />
                <span>Ring-Fenced EEFC Reserve</span>
              </div>
            </div>

            <div className="font-sans text-[11px]">
              Friction Neutralized: <span className="font-mono font-semibold text-[#059669]">100% FX Spread Exemption</span>
            </div>
          </div>
        </div>
      ) : (
        /* Tab 2: Scheduled Bills Table */
        <div className="divide-y divide-[#E2E8F0] text-xs pt-1">
          {upcoming_bills.map((bill, idx) => (
            <div
              key={idx}
              className="py-3 px-2 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors rounded"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center font-mono font-bold text-xs text-[#0F172A]">
                  {bill.vendor.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-sans font-bold text-[#0F172A]">{bill.vendor}</div>
                  <div className="font-sans text-[10px] text-[#64748B]">
                    {bill.category} • Due {bill.due_date}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono font-bold text-sm text-[#0F172A]">
                  {formatUSD(bill.amount)}
                </div>
                <span className="font-sans text-[10px] text-[#059669] font-semibold">
                  100% Ring-Fenced in EEFC
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
