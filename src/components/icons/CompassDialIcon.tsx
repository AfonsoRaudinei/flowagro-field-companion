import React from "react";

interface CompassDialIconProps extends React.SVGProps<SVGSVGElement> {
  bearing?: number; // map bearing in degrees
}

const CompassDialIcon: React.FC<CompassDialIconProps> = ({ bearing = 0, className = "", ...rest }) => {
  const size = 48;
  const cx = 24;
  const cy = 24;
  const outer = 22;
  const inner = 18;
  const minor = 20;

  const ticks = Array.from({ length: 16 }, (_, i) => {
    const angle = (i / 16) * Math.PI * 2; // 0 at top
    const isMajor = i % 4 === 0;
    const r1 = isMajor ? inner - 2 : inner;
    const r2 = isMajor ? minor + 1 : minor;
    const x1 = cx + r1 * Math.sin(angle);
    const y1 = cy - r1 * Math.cos(angle);
    const x2 = cx + r2 * Math.sin(angle);
    const y2 = cy - r2 * Math.cos(angle);
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="hsl(var(--muted-foreground))"
        strokeWidth={isMajor ? 2 : 1}
        strokeLinecap="round"
        opacity={isMajor ? 0.9 : 0.7}
      />
    );
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {/* Base */}
      <circle cx={cx} cy={cy} r={outer} fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth={2} />

      {/* Ticks */}
      {ticks}

      {/* North label */}
      <text x={cx} y={cy - outer + 10} textAnchor="middle" fontSize={10} fontWeight={700} fill="hsl(var(--foreground))">
        N
      </text>

      {/* Pointer - rotate opposite to map bearing so it points to North */}
      <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${-bearing}deg)` }}>
        <polygon
          points={`${cx},${cy - 12} ${cx - 3.5},${cy + 2} ${cx + 3.5},${cy + 2}`}
          fill="hsl(var(--destructive))"
          stroke="hsl(var(--background))"
          strokeWidth={1}
        />
      </g>

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={2} fill="hsl(var(--foreground))" opacity={0.8} />
    </svg>
  );
};

export default CompassDialIcon;
