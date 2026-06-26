"use client";

import { motion } from "framer-motion";

interface Props {
  value: number; // 0–100
  size?: number;
  stroke?: number;
  color?: string;
}

export function ProgressRing({
  value,
  size = 80,
  stroke = 6,
  color = "#059669",
}: Props) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#f4f4f5"
        strokeWidth={stroke}
      />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
      />
    </svg>
  );
}
