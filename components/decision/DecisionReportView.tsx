'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Scale,
  ShieldCheck,
  Lightbulb,
  ListChecks,
  ThumbsUp,
  ThumbsDown,
  RefreshCcw,
  FileText,
  Sliders,
  Share2,
  Printer,
  Sparkles,
} from 'lucide-react';
import type { DecisionDetail } from '@/lib/api-types';
import { api } from '@/services/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { DomainBadge } from '@/components/decision/DomainIcon';
import { ScoreBar } from '@/components/decision/ScoreBar';
import { ComparisonMatrix } from '@/components/decision/ComparisonMatrix';
import { SourceCard } from '@/components/decision/SourceCard';
import { ChatPanel } from '@/components/decision/ChatPanel';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { CriteriaWeightModal } from '@/components/decision/CriteriaWeightModal';
import { ExportShareModal } from '@/components/decision/ExportShareModal';
import { cn } from '@/lib/utils';

export function DecisionReportView({ initial }: { initial: DecisionDetail }) {
  const { user } = useAuth();
  const [decision, setDecision] = useState<DecisionDetail>(initial);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const { result, options, criteria, sources, evidence } = decision;

  const toggleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      if (decision.saved) await api.unsaveDecision(decision.id);
      else await api.saveDecision(decision.id);
      setDecision((d) => ({ ...d, saved: !d.saved }));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const confidence = result?.confidence_score ?? 0;
  const confidenceLabel = confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low';
  const winner = options.find((o) => o.recommended) || options[0];

  return (
    <div className="space-y-8 print:space-y-6">
      {/* ---------- Modals ---------- */}
      <CriteriaWeightModal
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        decision={decision}
        onUpdate={setDecision}
      />

      <ExportShareModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        decision={decision}
      />

      {/* ---------- Summary header ---------- */}
      <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <DomainBadge domain={decision.domain} />
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border',
                  confidenceLabel === 'High' && 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
                  confidenceLabel === 'Medium' && 'text-amber-300 border-amber-500/30 bg-amber-500/10',
                  confidenceLabel === 'Low' && 'text-rose-300 border-rose-500/30 bg-rose-500/10',
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {confidenceLabel} confidence ({Math.round(confidence * 100)}%)
              </span>
              {decision.saved && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-purple-300 border border-purple-500/30 bg-purple-500/10">
                  <BookmarkCheck className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>

            {/* Quick Action Toolbar */}
            <div className="flex items-center gap-2 print:hidden">
              <button
                onClick={() => setIsWeightModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
              >
                <Sliders className="w-3.5 h-3.5" /> Adjust Weights
              </button>
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" /> Export & Share
              </button>
            </div>
          </div>

          <h1 className="section-title text-2xl sm:text-3xl text-white leading-snug mb-2">
            {decision.raw_prompt}
          </h1>
          <p className="text-xs text-slate-500 mb-5">
            Analyzed {new Date(decision.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            {' '}· {decision.research_depth} research depth · {sources.length} sources verified
          </p>

          {result && (
            <div className="space-y-4">
              <div
                className="rounded-2xl p-4 border border-cyan-500/25 bg-gradient-to-r from-cyan-500/10 via-blue-500/5 to-purple-500/10"
                dangerouslySetInnerHTML={{ __html: renderSummary(result.summary) }}
              />
              <div className="rounded-xl p-4 bg-slate-900/50 border border-slate-800/60">
                <p className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-cyan-400" /> Why this recommendation
                </p>
                <p className="text-sm text-slate-300 leading-relaxed">{result.reasoning}</p>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card p-6 flex flex-col items-center gap-4 min-w-[220px]">
          <ProgressRing score={Math.round(result?.overall_fit_score ?? 0)} label="Overall Fit" size={150} />
          {winner && (
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Top Recommendation</p>
              <p className="text-sm font-bold text-cyan-300 leading-snug">{winner.name}</p>
            </div>
          )}
          <div className="w-full space-y-2 print:hidden">
            <button
              onClick={toggleSave}
              disabled={saving}
              className="btn btn-secondary w-full py-2.5 text-xs flex items-center justify-center gap-2"
            >
              {decision.saved ? <BookmarkCheck className="w-4 h-4 text-purple-300" /> : <Bookmark className="w-4 h-4" />}
              {decision.saved ? 'Saved to Library' : 'Save Decision'}
            </button>
            <button
              onClick={() => setIsWeightModalOpen(true)}
              className="btn btn-outline w-full py-2 text-xs flex items-center justify-center gap-1.5 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/10"
            >
              <Sliders className="w-3.5 h-3.5" /> Re-weight Criteria
            </button>
          </div>
          {saveError && <p className="text-[11px] text-rose-300">{saveError}</p>}
        </div>
      </div>

      {/* ---------- What matters most ---------- */}
      <section className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-cyan-400" />
            <h2 className="section-title text-lg text-white">What Matters Most</h2>
          </div>
          <button
            onClick={() => setIsWeightModalOpen(true)}
            className="text-xs font-semibold text-cyan-300 hover:underline flex items-center gap-1 print:hidden"
          >
            <Sliders className="w-3.5 h-3.5" /> Customize Weights
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
          {criteria.map((c, i) => (
            <ScoreBar
              key={c.id}
              label={c.name}
              score={c.weight}
              weight={undefined}
              delay={i * 0.06}
              note={c.description}
            />
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mt-4">
          Weights are dynamically calibrated for your decision. Click &ldquo;Customize Weights&rdquo; or ask the AI assistant to test custom priorities.
        </p>
      </section>

      {/* ---------- Options ---------- */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="w-5 h-5 text-purple-400" />
          <h2 className="section-title text-lg text-white">Evaluated Options</h2>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
          {options.map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                'glass-card p-5 flex flex-col gap-4 relative overflow-hidden',
                o.recommended && 'border-cyan-400/50 shadow-[0_0_36px_-8px_rgba(34,211,238,0.55)]',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-heading font-bold text-white leading-snug">{o.name}</h3>
                  {o.price_info && <p className="text-xs text-cyan-300 mt-1 font-medium">{o.price_info}</p>}
                </div>
                {o.badge && (
                  <span
                    className={cn(
                      'shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase',
                      o.recommended
                        ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-200 border border-cyan-400/50'
                        : 'bg-slate-800/60 text-slate-400 border border-slate-700/60',
                    )}
                  >
                    {o.recommended && <CheckCircle2 className="w-3 h-3 text-cyan-300" />}
                    {o.badge}
                  </span>
                )}
              </div>

              <div className="progress-track">
                <motion.div
                  className={cn('progress-fill', !o.recommended && 'opacity-60')}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${o.fit_score ?? 0}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
                />
              </div>
              <p className="text-right text-xs font-mono font-bold -mt-2 text-slate-300">
                {o.fit_score?.toFixed(0)}/100 fit
              </p>

              {o.summary && <p className="text-xs text-slate-400 leading-relaxed">{o.summary}</p>}

              {o.highlights.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {o.highlights.map((h) => (
                    <span key={h} className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-500/10 text-blue-200 border border-blue-500/25">
                      {h}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-3 text-xs">
                {o.strengths.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold text-emerald-300 mb-1.5">
                      <ThumbsUp className="w-3.5 h-3.5" /> Strengths
                    </p>
                    <ul className="space-y-1">
                      {o.strengths.map((s) => (
                        <li key={s} className="flex gap-1.5 text-slate-300">
                          <span className="text-emerald-400">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {o.weaknesses.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold text-rose-300 mb-1.5">
                      <ThumbsDown className="w-3.5 h-3.5" /> Trade-offs
                    </p>
                    <ul className="space-y-1">
                      {o.weaknesses.map((w) => (
                        <li key={w} className="flex gap-1.5 text-slate-400">
                          <span className="text-rose-400">•</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {o.risks.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold text-amber-300 mb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Risks
                    </p>
                    <ul className="space-y-1">
                      {o.risks.map((r) => (
                        <li key={r} className="flex gap-1.5 text-slate-400">
                          <span className="text-amber-400">•</span> {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---------- Comparison ---------- */}
      <ComparisonMatrix options={options} criteria={criteria} />

      {/* ---------- Evidence & sources ---------- */}
      <section className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-400" />
            <h2 className="section-title text-lg text-white">Evidence Points</h2>
          </div>
          {evidence.length === 0 ? (
            <p className="text-sm text-slate-400">
              No direct claims extracted yet — research may have been limited for this question.
            </p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {evidence.map((ev) => (
                <div key={ev.id} className="rounded-xl p-3.5 bg-slate-900/50 border border-slate-800/60">
                  <p className="text-xs text-slate-300 leading-relaxed">{ev.claim}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-500 font-mono">{ev.evidence_key || 'general'}</span>
                    {ev.conflict && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300">
                        <AlertTriangle className="w-3 h-3" /> conflicting claims flagged
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="section-title text-lg text-white">Research Sources ({sources.length})</h2>
          </div>
          {sources.length === 0 ? (
            <p className="text-sm text-slate-400">
              No web sources could be retrieved for this query. Scores below are grounded in the curated knowledge base and labeled estimates.
            </p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {sources.slice(0, 12).map((s) => (
                <SourceCard key={s.id} source={s} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ---------- Recommendation deep-dive ---------- */}
      {result && (
        <section className="glass-card p-6 border-purple-500/25">
          <div className="flex items-center gap-2 mb-5">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            <h2 className="section-title text-lg text-white">Recommendation Summary — You Decide</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {result.what_could_change.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                  <RefreshCcw className="w-3.5 h-3.5 text-cyan-400" /> What could change this?
                </p>
                <ul className="space-y-1.5">
                  {result.what_could_change.map((w) => (
                    <li key={w} className="flex gap-2 text-xs text-slate-400">
                      <span className="text-cyan-400 mt-0.5">→</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.trade_offs.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                  <Scale className="w-3.5 h-3.5 text-purple-400" /> Trade-offs
                </p>
                <ul className="space-y-1.5">
                  {result.trade_offs.map((t) => (
                    <li key={t} className="flex gap-2 text-xs text-slate-400">
                      <span className="text-purple-400 mt-0.5">•</span> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.next_steps.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                  <ArrowRight className="w-3.5 h-3.5 text-emerald-400" /> Next steps
                </p>
                <ul className="space-y-1.5">
                  {result.next_steps.map((n) => (
                    <li key={n} className="flex gap-2 text-xs text-slate-400">
                      <span className="text-emerald-400 mt-0.5">•</span> {n}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.assumptions.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Assumptions
                </p>
                <ul className="space-y-1.5">
                  {result.assumptions.map((a) => (
                    <li key={a} className="flex gap-2 text-xs text-slate-500">
                      <span className="text-amber-400 mt-0.5">•</span> {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className="handwritten-script text-xl text-cyan-200">
              The analysis is ready. You decide.
            </p>
            <p className="text-[11px] text-slate-500 mt-2 max-w-md mx-auto">
              {user?.full_name?.split(' ')[0] || 'User'}, this is your evidence — not your verdict. Confidence
              is {confidenceLabel.toLowerCase()} ({Math.round(confidence * 100)}%).
            </p>
          </div>
        </section>
      )}

      {/* ---------- AI assistant ---------- */}
      <div className="print:hidden">
        <ChatPanel decision={decision} onDecisionUpdate={setDecision} />
      </div>
    </div>
  );
}

function renderSummary(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-cyan-300">$1</strong>')
    .replace(/`([^`]+)`/g, '<code class="text-blue-300">$1</code>');
}