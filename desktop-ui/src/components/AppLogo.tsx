import React from "react";

interface AppLogoProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

const AppLogo: React.FC<AppLogoProps> = ({
  size = 200,
  color = "#4FD1C5",
  strokeWidth = 6,
  className = "",
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Square Frame */}
      <rect
        x="10"
        y="10"
        width="80"
        height="80"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      {/* Inner Diamond */}
      <path
        d="M50 30 L70 50 L50 70 L30 50 Z"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      {/* Connection Lines */}
      <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
        <line x1="50" y1="30" x2="10" y2="30" />
        <line x1="70" y1="50" x2="70" y2="10" />
        <line x1="50" y1="70" x2="90" y2="70" />
        <line x1="30" y1="50" x2="30" y2="90" />
      </g>

      {/* Wrench / Spanner Overlay */}
      <g
        transform="rotate(-25 72 72)"
        stroke={color}
        strokeWidth={strokeWidth - 1}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Handle */}
        <line x1="58" y1="58" x2="80" y2="80" />

        {/* Open wrench head */}
        <path d="M84 84 L90 78" />
        <path d="M80 88 L86 82" />

        {/* Bottom grip */}
        <circle cx="56" cy="56" r="3" fill={color} stroke="none" />
      </g>
    </svg>
  );
};

export default AppLogo;
