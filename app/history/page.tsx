'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Clock, Trash2, PlusCircle, AlertTriangle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DomainBadge } from '@/components/decision/DomainIcon';
import { api } from '@/services/api';
import type { DecisionSummary } from '@/lib/api-types';

export default function HistoryPage() {
  return (
    <ProtectedRoute>
      <HistoryContent />
    </ProtectedRoute>
  );
}

function HistoryContent() {
  const [items, setItems] = useState<DecisionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listDecisions(100);
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your decisions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!window.confirm('Delete this decision and its analysis?')) return;
    try {
      await api.deleteDecision(id);
      setItems((prev) => prev.filter((d) => d.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete.');
    }
  };

  return (
    <AppShell wide>
      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <Sidebar />

        <div className="min-w-0 space-y-6">
          <section className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow mb-2">MY DECISIONS</p>
              <h1 className="section-title text-2xl sm:text-3xl text-white">Your Decision History</h1>
              <p className="text-sm text-slate-400 mt-1">Revisit, re-score and learn from every choice.</p>
            </div>
            <Link href="/decision/new">
              <button className="btn btn-primary px-5 py-2.5 text-sm">
                <PlusCircle className="w-4 h-4" /> New Decision
              </button>
            </Link>
          </section>

          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-5"><div className="skeleton h-4 w-2/3 mb-2" /><div className="skeleton h-3 w-1/3" /></div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <p className="text-sm text-slate-300 mb-2">No decisions yet</p>
              <p className="text-xs text-slate-500 mb-6">Your decision history will appear here.</p>
              <Link href="/decision/new">
                <button className="btn btn-primary px-6 py-2.5 text-xs">Make your first decision</button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((d, i) => (
                <motion.div
                  key={d.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card glass-card-hover p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <Link href={`/decision/${d.id}`} className="min-w-0 flex-1 group">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <DomainBadge domain={d.domain} />
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${
                            d.status === 'completed' ? 'text-emerald-300' : d.status === 'analyzing' ? 'text-cyan-300' : 'text-slate-500'
                          }`}
                        >
                          {d.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                          {d.status}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(d.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="font-medium text-slate-100 group-hover:text-cyan-200 transition-colors">{d.title}</h3>
                      {d.recommended_title && (
                        <p className="text-xs text-slate-400 mt-1.5">
                          Recommendation: <span className="text-cyan-300 font-medium">{d.recommended_title}</span>
                        </p>
                      )}
                    </Link>

                    <div className="flex items-center gap-3 shrink-0">
                      {d.fit_score !== null && (
                        <div className="text-right">
                          <p className="text-xl font-heading font-extrabold text-cyan-300">{Math.round(d.fit_score)}</p>
                          <p className="text-[10px] text-slate-500">fit</p>
                        </div>
                      )}
                      <Link href={`/decision/${d.id}`} className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors" aria-label="Open decision">
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => remove(d.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        aria-label="Delete decision"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}