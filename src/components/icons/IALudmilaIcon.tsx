import * as React from 'react';

export interface IALudmilaIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

// Stroke-only custom icon for "I.A ludmila"
export const IALudmilaIcon: React.FC<IALudmilaIconProps> = ({ className = 'h-5 w-5', ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Antenna */}
    <circle cx="12" cy="3.5" r="1" />
    <path d="M12 5v2" />

    {/* Head/Body */}
    <rect x="5" y="7" width="14" height="12" rx="5" />

    {/* Eyes */}
    <circle cx="9" cy="12" r="1" />
    <circle cx="15" cy="12" r="1" />

    {/* Subtle smile */}
    <path d="M8.5 16c1.8 1 5.2 1 7 0" />
  </svg>
);

export default IALudmilaIcon;
