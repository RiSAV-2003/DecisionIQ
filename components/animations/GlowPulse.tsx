'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlowPulseProps {
  color?: 'cyan' | 'violet' | 'magenta' | 'blue';
  size?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

export const GlowPulse: React.FC<GlowPulseProps> = ({
  color = 'cyan',
  size = 'md',
  className = '',
}) => {
  const colors = {
    cyan: 'from-cyan-500/20 via-blue-500/10 to-transparent',
    violet: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    magenta: 'from-pink-500/20 via-rose-500/10 to-transparent',
    blue: 'from-blue-500/20 via-cyan-500/10 to-transparent',
  };

  const sizes = {
    sm: 'w-48 h-48 blur-2xl',
    md: 'w-96 h-96 blur-3xl',
    lg: 'w-[32rem] h-[32rem] blur-[120px]',
    full: 'w-full h-full blur-[140px]',
  };

  return (
    <motion.div
      animate={{
        scale: [1, 1.15, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`absolute rounded-full bg-gradient-radial ${colors[color]} ${sizes[size]} pointer-events-none -z-10 ${className}`}
    />
  );
};
