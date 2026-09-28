'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sliders, RefreshCcw, Sparkles, Check, AlertCircle } from 'lucide-react';
import type { Criterion, Option, DecisionDetail } from '@/lib/api-types';
import { api } from '@/services/api';

interface CriteriaWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  decision: DecisionDetail;
  onUpdate: (updated: DecisionDetail) => void;
}

export function CriteriaWeightModal({ isOpen, onClose, decision, onUpdate }: CriteriaWeightModalProps) {
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (decision?.criteria) {
      const initial: Record<string, number> = {};
      decision.criteria.forEach((c) => {
        initial[c.id] = Math.round(c.weight);
      });
      setWeights(initial);
    }
  }, [decision]);

  if (!isOpen) return null;

  const totalRawWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;

  const handleSliderChange = (id: string, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const resetToEqual = () => {
    const count = decision.criteria.length;
    if (!count) return;
    const equalVal = Math.round(100 / count);
    const updated: Record<string, number> = {};
    decision.criteria.forEach((c) => {
      updated[c.id] = equalVal;
    });
    setWeights(updated);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.reweightDecision(decision.id, weights);
      onUpdate(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update criteria weights.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-slate-900/95 border border-cyan-500/30 rounded-2xl shadow-2xl p-6 overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-20 -left-20 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Adjust Criteria Weights</h3>
                <p className="text-xs text-slate-400">Customise what matters most to recalculate rankings</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Criteria Sliders */}
          <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
            {decision.criteria.map((c) => {
              const raw = weights[c.id] ?? Math.round(c.weight);
              const normalized = Math.round((raw / totalRawWeight) * 100);
              return (
                <div key={c.id} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-sm font-semibold text-slate-200">{c.name}</span>
                      {c.description && <p className="text-[11px] text-slate-400">{c.description}</p>}
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {normalized}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={raw}
                    onChange={(e) => handleSliderChange(c.id, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Low priority</span>
                    <span>High priority</span>
                  </div>
                </div>
              );
            })}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              onClick={resetToEqual}
              type="button"
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <RefreshCcw className="w-3.5 h-3.5" /> Equal Weights
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                type="button"
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                type="button"
                className="btn btn-primary px-5 py-2 text-xs flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> Recalculating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" /> Apply & Recalculate
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
