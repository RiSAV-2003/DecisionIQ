'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  CheckCircle2,
  Bookmark,
  MessageSquare,
  TrendingUp,
  Gauge,
  Activity,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RobotAssistant } from '@/components/ui/RobotAssistant';
import { api } from '@/services/api';
import type { AnalyticsSummary } from '@/lib/api-types';
import { DOMAIN_META } from '@/components/decision/DomainIcon';

export default function InsightsPage() {
  return (
    <ProtectedRoute>
      <InsightsContent />
    </ProtectedRoute>
  );
}

function InsightsContent() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .analyticsSummary()
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load insights.'));
  }, []);

  const maxCategory = useMemo(
    () => (data && data.by_category.length ? Math.max(...data.by_category.map((c) => c.count)) : 1),
    [data],
  );

  const activity = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    if (!data) return days;
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ label: d.toLocaleDateString(undefined, { day: 'numeric' }), count: data.activity_last_14_days[key] ?? 0 });
    }
    return days;
  }, [data]);

  const maxActivity = Math.max(1, ...activity.map((a) => a.count));

  return (
    <AppShell wide>
      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <Sidebar />

        <div className="min-w-0 space-y-6">
          <section>
            <p className="eyebrow mb-2">YOUR INSIGHTS</p>
            <h1 className="section-title text-2xl sm:text-3xl text-white">Decision Intelligence</h1>
            <p className="text-sm text-slate-400 mt-1">How you decide, visualized.</p>
          </section>

          {error && <p className="text-xs text-rose-300">{error}</p>}
          {!data && !error && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-5"><div className="skeleton h-8 w-16 mb-3" /><div className="skeleton h-3 w-24" /></div>
              ))}
            </div>
          )}

          {data && (
            <>
              {/* Stat cards */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: FolderKanban, label: 'Total Decisions', value: data.total_decisions },
                  { icon: CheckCircle2, label: 'Completed', value: data.completed_decisions },
                  { icon: Bookmark, label: 'Saved', value: data.saved_decisions },
                  { icon: MessageSquare, label: 'AI Follow-ups', value: data.total_messages },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="glass-card glass-card-hover p-5"
                  >
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
                      <s.icon className="w-4 h-4 text-cyan-400" />
                    </div>
                    <p className="text-2xl font-heading font-extrabold text-white">{s.value}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{s.label}</p>
                  </motion.div>
                ))}
              </section>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Category distribution */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-heading font-bold text-white">Decision Categories</h3>
                  </div>
                  {data.by_category.length === 0 ? (
                    <p className="text-xs text-slate-500">No decisions analyzed yet — your chart will grow here.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {data.by_category.map((c, i) => {
                        const meta = DOMAIN_META[c.category] || DOMAIN_META.other;
                        const Icon = meta.icon;
                        return (
                          <div key={c.category}>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <Icon className="w-3.5 h-3.5 text-cyan-400" />
                                <span className="capitalize">{meta.label}</span>
                              </span>
                              <span className="text-slate-500 font-semibold">{c.count}</span>
                            </div>
                            <div className="progress-track">
                              <motion.div
                                className="progress-fill"
                                initial={{ width: 0 }}
                                whileInView={{ width: `${(c.count / maxCategory) * 100}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.9, delay: i * 0.07 }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Activity chart */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Activity className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-heading font-bold text-white">Decision Activity · 14 days</h3>
                  </div>
                  <ActivityChart days={activity} max={maxActivity} />
                </div>

                {/* Confidence & fit */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <Gauge className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-heading font-bold text-white">Decision Quality</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-slate-900/50 border border-slate-800/60 p-4 text-center">
                      <p className="text-3xl font-heading font-extrabold text-cyan-300">
                        {data.avg_fit_score != null ? Math.round(data.avg_fit_score) : '—'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">Avg. Fit Score /100</p>
                    </div>
                    <div className="rounded-xl bg-slate-900/50 border border-slate-800/60 p-4 text-center">
                      <p className="text-3xl font-heading font-extrabold text-purple-300">
                        {data.avg_confidence != null ? `${Math.round(data.avg_confidence * 100)}%` : '—'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">Avg. Confidence</p>
                    </div>
                  </div>
                  <div className="mt-5">
                    <p className="text-[11px] font-semibold text-slate-300 mb-2.5">Research depth used</p>
                    <div className="flex gap-2">
                      {(['quick', 'standard', 'deep'] as const).map((k) => (
                        <span key={k} className="flex-1 text-center rounded-lg border border-slate-800/60 bg-slate-900/40 px-2 py-2">
                          <span className="block text-lg font-heading font-bold text-white">{data.research_depth[k] ?? 0}</span>
                          <span className="text-[10px] text-slate-500 capitalize">{k}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Events */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <RobotAssistant size="sm" pose="widget" className="!w-8 !h-8" />
                    <h3 className="text-sm font-heading font-bold text-white">How you engage</h3>
                  </div>
                  {Object.keys(data.events_by_type).length === 0 ? (
                    <p className="text-xs text-slate-500">Activity will appear as you use DecisionIQ.</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(data.events_by_type)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 capitalize">{type.replace(/_/g, ' ')}</span>
                            <span className="text-slate-500">{count}</span>
                          </div>
                        ))}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 mt-5 leading-relaxed">
                    Tip: higher confidence comes with deeper research depth. Upgrade your research
                    depth in settings for richer evidence.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ActivityChart({ days, max }: { days: { label: string; count: number }[]; max: number }) {
  const W = 480;
  const H = 150;
  const pad = 8;
  const step = (W - pad * 2) / Math.max(days.length - 1, 1);
  const points = days.map((d, i) => ({
    x: pad + i * step,
    y: H - pad - (d.count / max) * (H - pad * 2),
    ...d,
  }));
  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${(pad + (days.length - 1) * step).toFixed(1)},${H - pad} L${pad},${H - pad} Z`;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Decision activity over the last 14 days">
        <defs>
          <linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(34,211,238,0.35)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
          <linearGradient id="activityLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#00f0ff" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={pad} x2={W - pad} y1={H * f} y2={H * f} stroke="rgba(56,189,248,0.08)" strokeDasharray="4 4" />
        ))}
        <path d={area} fill="url(#activityFill)" />
        <motion.path
          d={line}
          fill="none"
          stroke="url(#activityLine)"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        />
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={p.count > 0 ? 4 : 1.5} fill={p.count > 0 ? '#00f0ff' : 'rgba(148,163,184,0.4)'} />
            {p.count > 0 && (
              <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fill="rgba(165,243,252,0.9)" fontWeight="bold">
                {p.count}
              </text>
            )}
          </g>
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-1 text-[9px] text-slate-600">
        {days.filter((_, i) => i % 2 === 0).map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>
    </div>
  );
}