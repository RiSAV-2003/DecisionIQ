'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function ScoreBar({
  label,
  score,
  weight,
  delay = 0,
  note,
}: {
  label: string;
  score: number;
  weight?: number;
  delay?: number;
  note?: string | null;
}) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div className="group">
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
          {label}
          {weight !== undefined && (
            <span className="text-[10px] text-cyan-400/80 font-semibold">({Math.round(weight)}%)</span>
          )}
        </span>
        <span
          className={`text-xs font-bold ${
            score >= 80 ? 'text-cyan-300' : score >= 60 ? 'text-blue-300' : 'text-slate-400'
          }`}
        >
          {score.toFixed(0)}
          <span className="text-[10px] text-slate-500 font-medium">/100</span>
        </span>
      </div>
      <div className="progress-track">
        <motion.div
          className="progress-fill"
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      {note && <p className="text-[11px] text-slate-500 mt-1 leading-snug">{note}</p>}
    </div>
  );
}