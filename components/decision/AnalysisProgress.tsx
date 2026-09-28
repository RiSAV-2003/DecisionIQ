'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, AlertTriangle, Brain, Search, Scale, Sparkles, Target, ShieldCheck, ListChecks } from 'lucide-react';
import type { Stage } from '@/lib/api-types';
import { cn } from '@/lib/utils';

const STAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  understanding: Brain,
  priorities: Target,
  researching: Search,
  verifying: ShieldCheck,
  comparing: Scale,
  insights: Sparkles,
  ready: ListChecks,
};

export function AnalysisProgress({ stages }: { stages: Stage[] }) {
  const visible = stages.filter((s) => s.key !== 'ready');
  const done = visible.filter((s) => s.status === 'completed').length;
  const total = Math.max(visible.length, 1);
  const pct = Math.round((done / total) * 100);
  const current = visible.find((s) => s.status === 'active');

  return (
    <div className="glass-card p-6 max-w-2xl w-full">
      {/* Progress header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-heading font-bold text-white">Analyzing your decision</h3>
        <span className="text-xs font-bold text-cyan-300">{pct}%</span>
      </div>

      <div className="progress-track h-2 mb-6">
        <motion.div
          className="progress-fill"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>

      {/* Stage list — real backend states, never fake */}
      <ol className="space-y-3">
        {visible.map((stage, i) => {
          const Icon = STAGE_ICONS[stage.key] || Sparkles;
          const isActive = stage.status === 'active';
          const isDone = stage.status === 'completed';
          const isFailed = stage.status === 'failed';
          return (
            <motion.li
              key={stage.key}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={cn('flex items-start gap-3', !isDone && !isActive && 'opacity-45')}
            >
              <div
                className={cn(
                  'w-8 h-8 shrink-0 rounded-full border flex items-center justify-center transition-all',
                  isDone && 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300',
                  isActive && 'border-cyan-400/60 bg-cyan-500/15 text-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.4)]',
                  isFailed && 'border-rose-500/50 bg-rose-500/15 text-rose-300',
                  !isDone && !isActive && !isFailed && 'border-slate-700 bg-slate-800/40 text-slate-500',
                )}
              >
                {isDone ? (
                  <Check className="w-4 h-4" />
                ) : isFailed ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <div className="pt-0.5">
                <p className={cn('text-sm font-semibold', isActive ? 'text-cyan-200' : isDone ? 'text-slate-200' : 'text-slate-400')}>
                  {stage.label}
                </p>
                <p className="text-xs text-slate-500">
                  {isActive && stage.detail ? stage.detail : stage.description}
                </p>
              </div>
            </motion.li>
          );
        })}
      </ol>

      {current && (
        <p className="flex items-center gap-2 mt-5 text-[11px] text-slate-400 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          {current.detail || current.description}
        </p>
      )}
    </div>
  );
}