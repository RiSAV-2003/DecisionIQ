'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Sparkles, Filter, Check } from 'lucide-react';
import type { Option, Criterion } from '@/lib/api-types';
import { cn } from '@/lib/utils';

export function ComparisonMatrix({ options, criteria }: { options: Option[]; criteria: Criterion[] }) {
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);

  // If filtered options is empty, show all
  const displayedOptions = selectedOptionIds.length > 0
    ? options.filter((o) => selectedOptionIds.includes(o.id))
    : options;

  const toggleFilter = (id: string) => {
    setSelectedOptionIds((prev) => {
      if (prev.includes(id)) {
        const next = prev.filter((i) => i !== id);
        return next;
      }
      return [...prev, id];
    });
  };

  const clearFilter = () => setSelectedOptionIds([]);

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="section-title text-lg text-white">Side-by-Side Comparison</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-cyan-500/10 text-cyan-300 border border-cyan-500/25">
              Weighted Matrix
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Every score is weighted by your stated priorities. Star highlights denote the winner for each criterion.
          </p>
        </div>

        {/* Filter Quick-Toggles */}
        {options.length > 2 && (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3 text-cyan-400" /> Filter:
            </span>
            {options.map((o) => {
              const isSelected = selectedOptionIds.length === 0 || selectedOptionIds.includes(o.id);
              return (
                <button
                  key={o.id}
                  onClick={() => toggleFilter(o.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1',
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40',
                  )}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-cyan-300" />}
                  <span className="truncate max-w-[100px]">{o.name.split(' ')[0]}</span>
                </button>
              );
            })}
            {selectedOptionIds.length > 0 && (
              <button
                onClick={clearFilter}
                className="text-[10px] text-slate-400 hover:text-white px-2 py-1 underline decoration-dotted"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      <div className="overflow-x-auto -mx-2 px-2 pb-2">
        <div style={{ minWidth: `${Math.max(560, displayedOptions.length * 180 + 180)}px` }}>
          {/* Header row */}
          <div
            className="grid gap-3 mb-3 items-end"
            style={{
              gridTemplateColumns: `minmax(180px, 1.3fr) repeat(${displayedOptions.length}, minmax(150px, 1fr))`,
            }}
          >
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pl-1">
              Criteria / Option
            </div>
            {displayedOptions.map((o) => (
              <button
                key={o.id}
                onClick={() => setActiveOption(activeOption === o.id ? null : o.id)}
                className={cn(
                  'text-left p-3 rounded-xl border transition-all text-xs font-semibold relative overflow-hidden group',
                  o.recommended
                    ? 'border-cyan-400/60 bg-gradient-to-b from-cyan-500/15 to-blue-500/10 text-cyan-200 shadow-[0_0_20px_-4px_rgba(34,211,238,0.5)]'
                    : 'border-slate-800 bg-slate-900/50 text-slate-200 hover:border-cyan-500/40 hover:bg-slate-900/80',
                )}
              >
                {o.recommended && (
                  <div className="absolute top-0 right-0 bg-cyan-400 text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-bl-lg uppercase tracking-wider">
                    Winner
                  </div>
                )}
                <div className="flex items-center gap-1.5 mb-1 pr-10">
                  {o.recommended && <Trophy className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
                  <span className="font-bold text-white line-clamp-2 leading-tight group-hover:text-cyan-200 transition-colors">
                    {o.name}
                  </span>
                </div>
                {o.price_info && <p className="text-[11px] text-cyan-400/90 font-medium mb-1">{o.price_info}</p>}
                {o.fit_score !== null && (
                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/80">
                    <span className="text-[10px] text-slate-400">Weighted Fit</span>
                    <span className={cn('text-xs font-mono font-bold', o.recommended ? 'text-cyan-300' : 'text-slate-300')}>
                      {o.fit_score.toFixed(0)}/100
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Criterion rows */}
          <div className="space-y-3">
            {criteria.map((c, ci) => {
              // Find the top score for this criterion among displayed options
              let highestCriterionScore = -1;
              displayedOptions.forEach((o) => {
                const cs = o.criterion_scores.find((s) => s.criterionId === c.id || s.name.toLowerCase() === c.name.toLowerCase());
                const s = cs?.score ?? 0;
                if (s > highestCriterionScore) highestCriterionScore = s;
              });

              return (
                <div
                  key={c.id}
                  className="grid gap-3 items-stretch p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 hover:border-slate-700/80 transition-colors"
                  style={{
                    gridTemplateColumns: `minmax(180px, 1.3fr) repeat(${displayedOptions.length}, minmax(150px, 1fr))`,
                  }}
                >
                  <div className="flex flex-col justify-center pr-2">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-semibold text-slate-200">{c.name}</p>
                      <span className="text-[10px] font-mono text-cyan-400/90 font-bold shrink-0">
                        {Math.round(c.weight)}%
                      </span>
                    </div>
                    {c.description && (
                      <p className="text-[10px] text-slate-400 leading-tight mt-0.5 line-clamp-2">
                        {c.description}
                      </p>
                    )}
                  </div>

                  {displayedOptions.map((o) => {
                    const cs = o.criterion_scores.find(
                      (s) => s.criterionId === c.id || s.name.toLowerCase() === c.name.toLowerCase(),
                    );
                    const score = cs?.score ?? 0;
                    const isWinnerForCriterion = score > 0 && score === highestCriterionScore;

                    return (
                      <div
                        key={o.id}
                        className={cn(
                          'p-2.5 rounded-lg border flex flex-col justify-between transition-all',
                          isWinnerForCriterion
                            ? 'bg-cyan-500/5 border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.15)]'
                            : 'bg-slate-900/60 border-slate-800/80',
                        )}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1">
                            {isWinnerForCriterion && (
                              <Star className="w-3 h-3 text-cyan-300 fill-cyan-300/40" />
                            )}
                            <span className={cn('text-xs font-bold font-mono', score >= 80 ? 'text-cyan-300' : score >= 60 ? 'text-blue-300' : 'text-slate-400')}>
                              {score.toFixed(0)}
                            </span>
                          </div>
                          {isWinnerForCriterion && (
                            <span className="text-[9px] font-semibold text-cyan-300 uppercase tracking-wider">Top</span>
                          )}
                        </div>

                        <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <motion.div
                            className={cn(
                              'h-full rounded-full',
                              score >= 80
                                ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-500',
                            )}
                            initial={{ width: 0 }}
                            whileInView={{ width: `${score}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: ci * 0.05 }}
                          />
                        </div>

                        {cs?.note && (activeOption === o.id || isWinnerForCriterion) && (
                          <p className="text-[10px] text-slate-400 mt-2 leading-tight border-t border-slate-800/60 pt-1.5">
                            {cs.note}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 mt-4 pt-3 border-t border-slate-800/80">
        <p>
          💡 Tip: Click any option column header to inspect notes explaining specific ratings.
        </p>
        <span className="flex items-center gap-1.5 text-cyan-400 font-medium">
          <Sparkles className="w-3.5 h-3.5" /> Adjust weights above to see real-time shifts
        </span>
      </div>
    </div>
  );
}