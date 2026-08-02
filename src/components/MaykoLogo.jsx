import React from 'react';

export default function MaykoLogo({ height = 34, className = '' }) {
  return (
    <svg
      height={height}
      viewBox="0 0 250 65"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', filter: 'drop-shadow(0 2px 8px rgba(186, 85, 211, 0.35))' }}
    >
      {/* Lowercase "mayk" Text in Vibrant Lavender Purple */}
      <text
        x="0"
        y="48"
        fill="#c084fc"
        fontFamily="Outfit, Inter, system-ui, sans-serif"
        fontSize="54"
        fontWeight="800"
        letterSpacing="-1.5"
      >
        mayk
      </text>

      {/* Circle "o" Emblem Background */}
      <circle cx="210" cy="32" r="22" fill="#c084fc" />

      {/* White 8-Petal Daisy inside the "o" Circle */}
      <g transform="translate(210, 32)">
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
          <ellipse
            key={i}
            cx="0"
            cy="-10"
            rx="4.5"
            ry="8.8"
            fill="#ffffff"
            transform={`rotate(${angle})`}
          />
        ))}
        {/* Yellow Flower Center */}
        <circle cx="0" cy="0" r="5.5" fill="#fde047" />
      </g>
    </svg>
  );
}
