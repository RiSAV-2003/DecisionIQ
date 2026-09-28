'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: 'default' | 'interactive' | 'cyan' | 'violet' | 'magenta';
  glow?: boolean;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  glow = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'glass-panel',
    interactive: 'glass-panel-interactive cursor-pointer',
    cyan: 'glass-panel border-cyan-500/30 hover:border-cyan-400/60 shadow-glow-cyan/20',
    violet: 'glass-panel border-purple-500/30 hover:border-purple-400/60 shadow-glow-violet/20',
    magenta: 'glass-panel border-pink-500/30 hover:border-pink-400/60 shadow-glow-magenta/20',
  };

  return (
    <motion.div
      className={cn(
        'relative rounded-2xl p-6 overflow-hidden transition-all duration-300',
        variantStyles[variant],
        glow && 'before:absolute before:inset-0 before:-z-10 before:bg-cyber-gradient-soft before:opacity-50 before:blur-xl',
        className
      )}
      {...props}
    >
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent pointer-events-none" />
      {children}
    </motion.div>
  );
};
