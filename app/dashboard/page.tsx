'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  PlusCircle,
  Bookmark,
  FolderKanban,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';
import { RobotAssistant } from '@/components/ui/RobotAssistant';
import { DomainBadge } from '@/components/decision/DomainIcon';
import { api } from '@/services/api';
import type { AnalyticsSummary, DecisionSummary } from '@/lib/api-types';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const [decisions, setDecisions] = useState<DecisionSummary[]>([]);
  const [saved, setSaved] = useState<DecisionSummary[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.listDecisions(10), api.listSaved(), api.analyticsSummary()])
      .then(([d, s, a]) => {
        if (cancelled) return;
        setDecisions(d.items);
        setSaved(s.items.map((i) => i.decision));
        setAnalytics(a);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.full_name?.split(' ')[0] || 'there';
  const maxCategory = analytics && analytics.by_category.length > 0 ? analytics.by_category[0].count : 1;

  return (
    <AppShell wide>
      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <Sidebar />

        <div className="min-w-0 space-y-6">
          {/* Welcome */}
          <section className="glass-card p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">DASHBOARD</p>
              <h1 className="section-title text-2xl sm:text-3xl text-white">
                Welcome back, <span className="gradient-text-cyan">{firstName}</span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {loading ? 'Loading your decision activity…' : 'Here\u2019s where your smarter decisions are taking shape.'}
              </p>
            </div>
            <Link href="/decision/new">
              <button className="btn btn-primary px-5 py-2.5 text-sm">
                <PlusCircle className="w-4 h-4" /> New Decision
              </button>
            </Link>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: FolderKanban, label: 'Total Decisions', value: analytics?.total_decisions ?? '—' },
              { icon: CheckCircle2, label: 'Completed', value: analytics?.completed_decisions ?? '—' },
              { icon: Bookmark, label: 'Saved', value: analytics?.saved_decisions ?? '—' },
              { icon: TrendingUp, label: 'Avg. Fit Score', value: analytics?.avg_fit_score != null ? `${Math.round(analytics.avg_fit_score)}/100` : '—' },
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

          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Recent decisions */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="section-title text-lg text-white">Recent Decisions</h2>
                <Link href="/history" className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="glass-card p-5"><div className="skeleton h-4 w-3/4 mb-2" /><div className="skeleton h-3 w-1/2" /></div>
                  ))}
                </div>
              ) : decisions.length === 0 ? (
                <div className="glass-card p-8 text-center">
                  <RobotAssistant size="md" pose="widget" className="mx-auto" />
                  <p className="text-sm text-slate-300 mt-4 font-medium">No decisions yet</p>
                  <p className="text-xs text-slate-500 mt-1 mb-5">Every great decision starts with a question.</p>
                  <Link href="/decision/new">
                    <button className="btn btn-primary px-6 py-2.5 text-xs">Make your first decision</button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {decisions.map((d, i) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link href={`/decision/${d.id}`} className="glass-card glass-card-hover p-5 flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <DomainBadge domain={d.domain} />
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                                d.status === 'completed' ? 'text-emerald-300' : d.status === 'analyzing' ? 'text-cyan-300' : 'text-slate-500'
                              }`}
                            >
                              {d.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : d.status === 'analyzing' ? <Clock className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {d.status}
                            </span>
                          </div>
                          <h3 className="font-medium text-slate-100 text-sm truncate">{d.title}</h3>
                          <p className="text-[11px] text-slate-500 mt-1">
                            {d.recommended_title ? `→ ${d.recommended_title}` : new Date(d.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        {d.fit_score !== null && (
                          <div className="shrink-0 text-right">
                            <p className="text-xl font-heading font-extrabold text-cyan-300">{Math.round(d.fit_score)}</p>
                            <p className="text-[10px] text-slate-500">fit</p>
                          </div>
                        )}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>

            {/* Right rail */}
            <aside className="space-y-6">
              {/* Category distribution */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-heading font-bold text-white mb-4">Categories</h3>
                {analytics && analytics.by_category.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.by_category.slice(0, 6).map((c) => (
                      <div key={c.category}>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-300 capitalize">{c.category}</span>
                          <span className="text-slate-500">{c.count}</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${(c.count / maxCategory) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">No decisions analyzed yet.</p>
                )}
              </div>

              {/* Saved */}
              <div className="glass-card p-5">
                <h3 className="text-sm font-heading font-bold text-white mb-4 flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-purple-400" /> Saved
                </h3>
                {saved.length > 0 ? (
                  <div className="space-y-2">
                    {saved.slice(0, 4).map((d) => (
                      <Link key={d.id} href={`/decision/${d.id}`} className="block text-xs text-slate-300 hover:text-cyan-300 transition-colors truncate">
                        • {d.title}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Nothing saved yet.</p>
                )}
                <Link href="/saved" className="text-[11px] text-cyan-400 hover:text-cyan-300 mt-3 inline-block">Manage saved →</Link>
              </div>

              {/* Assistant */}
              <div className="glass-card p-5 text-center border-purple-500/25">
                <RobotAssistant size="sm" pose="use_case_helper" />
                <h3 className="text-sm font-heading font-bold text-white mt-2">Need a hand?</h3>
                <p className="text-[11px] text-slate-400 mt-1 mb-4">
                  <Sparkles className="inline w-3 h-3 text-cyan-400" /> Ask me to compare, re-weight or explain any decision.
                </p>
                <Link href="/decision/new">
                  <button className="btn btn-secondary w-full py-2 text-[11px]">Start a new decision</button>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}