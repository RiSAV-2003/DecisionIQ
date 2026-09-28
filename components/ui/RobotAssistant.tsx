'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export type RobotPose = 'floating' | 'widget' | 'desk_sitting' | 'pedestal_standing' | 'use_case_helper';

interface RobotAssistantProps {
  pose?: RobotPose;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  speechBubble?: string;
  showSpeechBubble?: boolean;
  className?: string;
}

export const RobotAssistant: React.FC<RobotAssistantProps> = ({
  pose = 'floating',
  size = 'md',
  speechBubble,
  showSpeechBubble = false,
  className = '',
}) => {
  const sizeDimensions = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36',
    lg: 'w-52 h-52',
    xl: 'w-64 h-64',
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center select-none', className)}>
      {/* Robot Speech Bubble matching Reference */}
      {showSpeechBubble && speechBubble && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="absolute -top-20 left-1/2 -translate-x-1/2 z-30 max-w-xs text-center bg-slate-900/90 text-cyan-200 border border-cyan-500/40 px-4 py-2.5 rounded-2xl backdrop-blur-md shadow-glow-cyan/40 text-xs font-medium leading-relaxed"
        >
          {speechBubble}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-r border-b border-cyan-500/40 rotate-45" />
        </motion.div>
      )}

      {/* Floating 2D AI Robot matching Official Reference Image */}
      <motion.div
        animate={{
          y: pose === 'floating' || pose === 'use_case_helper' ? [-8, 8, -8] : [0, 0, 0],
          rotate: pose === 'floating' ? [-1.5, 1.5, -1.5] : [0, 0, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={cn('relative flex items-center justify-center', sizeDimensions[size])}
      >
        {/* Glow Halo behind Robot Head */}
        <div className="absolute inset-0 bg-cyan-400/30 rounded-full blur-2xl animate-pulse-glow" />

        {/* Reference Image Robot Asset */}
        <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-cyan-400/40 shadow-glow-cyan/50">
          <Image
            src="/assets/decision_robot_avatar.jpg"
            alt="DecisionIQ AI Robot"
            fill
            className="object-cover scale-110"
            priority
          />
        </div>
      </motion.div>
    </div>
  );
};
