interface CountdownRingProps {
  daysRemaining: number;
  totalDays?: number;
  size?: number;
  strokeWidth?: number;
}

export function CountdownRing({
  daysRemaining,
  totalDays = 45,
  size = 72,
  strokeWidth = 5,
}: CountdownRingProps) {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;

  // Clamped ratio
  const progress = Math.min(Math.max(daysRemaining / totalDays, 0), 1);
  const strokeDashoffset = circumference - progress * circumference;

  let strokeColor = '#059669'; // Banking emerald (>15 days)
  if (daysRemaining <= 5) {
    strokeColor = '#DC2626'; // Red (urgency)
  } else if (daysRemaining <= 15) {
    strokeColor = '#D97706'; // Amber (warning)
  }

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-base font-bold font-mono text-[#0F172A] leading-none">
          {daysRemaining}
        </span>
        <span className="text-[9px] font-sans uppercase font-semibold text-[#64748B] mt-0.5">days</span>
      </div>
    </div>
  );
}
