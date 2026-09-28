'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  glow?: boolean;
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  glow = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyber-cyan/50 disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
    xl: 'px-8 py-4 text-lg font-semibold gap-3',
  };

  const variantStyles = {
    primary: 'bg-cyber-cyan text-slate-950 font-semibold hover:bg-cyan-300 shadow-glow-cyan/50 hover:shadow-cyan-400/70',
    secondary: 'glass-panel text-cyan-300 hover:text-white hover:bg-slate-800/80 border-cyan-500/20 hover:border-cyan-400/40',
    outline: 'border border-cyan-500/40 text-cyan-400 hover:bg-cyan-950/30 hover:border-cyan-400',
    ghost: 'text-slate-300 hover:text-cyan-400 hover:bg-slate-800/40',
    danger: 'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/40 hover:text-white hover:border-rose-400 shadow-glow-magenta/30',
    gradient: 'bg-cyber-gradient text-slate-950 font-bold hover:brightness-110 shadow-glow-violet/50',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={cn(
        baseStyles,
        sizeStyles[size],
        variantStyles[variant],
        glow && 'after:absolute after:inset-0 after:rounded-xl after:bg-cyan-400/20 after:blur-md after:-z-10',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700 pointer-events-none" />

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};
