'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ProgressRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  score,
  size = 140,
  strokeWidth = 10,
  label = 'Fit Score',
  className = '',
}) => {
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (score / 100) * circumference;

  return (
    <div className={`relative inline-flex flex-col items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <defs>
          <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00f0ff" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>

        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(0, 240, 255, 0.1)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#score-gradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: progressOffset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          strokeLinecap="round"
          style={{
            filter: 'drop-shadow(0px 0px 8px rgba(0, 240, 255, 0.6))',
          }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-3xl font-heading font-extrabold text-white tracking-tight"
        >
          {score}
          <span className="text-sm font-normal text-cyan-400 font-sans">/100</span>
        </motion.span>
        {label && (
          <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mt-0.5">
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
