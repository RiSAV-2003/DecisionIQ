'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bookmark, BookmarkX, ArrowRight, AlertTriangle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RobotAssistant } from '@/components/ui/RobotAssistant';
import { DomainBadge } from '@/components/decision/DomainIcon';
import { api } from '@/services/api';
import type { SavedDecisionSummary } from '@/lib/api-types';

export default function SavedPage() {
  return (
    <ProtectedRoute>
      <SavedContent />
    </ProtectedRoute>
  );
}

function SavedContent() {
  const [items, setItems] = useState<SavedDecisionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.listSaved();
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load saved decisions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const unsave = async (decisionId: string) => {
    try {
      await api.unsaveDecision(decisionId);
      setItems((prev) => prev.filter((s) => s.decision.id !== decisionId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not remove.');
    }
  };

  return (
    <AppShell wide>
      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <Sidebar />

        <div className="min-w-0 space-y-6">
          <section>
            <p className="eyebrow mb-2">YOUR LIBRARY</p>
            <h1 className="section-title text-2xl sm:text-3xl text-white">Saved Decisions</h1>
            <p className="text-sm text-slate-400 mt-1">The ones worth revisiting.</p>
          </section>

          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {loading ? (
            <div className="grid sm:grid-cols-2 gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="glass-card p-5"><div className="skeleton h-4 w-2/3 mb-2" /><div className="skeleton h-3 w-1/2" /></div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="glass-card p-10 text-center">
              <RobotAssistant size="md" pose="widget" className="mx-auto" />
              <p className="text-sm text-slate-300 mt-4 font-medium">Nothing saved yet</p>
              <p className="text-xs text-slate-500 mt-1 mb-6">Save a decision to revisit it here anytime.</p>
              <Link href="/explore">
                <button className="btn btn-primary px-6 py-2.5 text-xs">Explore decisions</button>
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((s, i) => {
                const d = s.decision;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card glass-card-hover p-5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <DomainBadge domain={d.domain} />
                      <button
                        onClick={() => unsave(d.id)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        aria-label="Remove from saved"
                      >
                        <BookmarkX className="w-4 h-4" />
                      </button>
                    </div>
                    <Link href={`/decision/${d.id}`}>
                      <h3 className="font-medium text-slate-100 hover:text-cyan-200 transition-colors leading-snug">{d.title}</h3>
                    </Link>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[11px] text-slate-500">
                        {d.recommended_title ? `→ ${d.recommended_title}` : `Saved ${new Date(s.saved_at).toLocaleDateString()}`}
                      </span>
                      <Link href={`/decision/${d.id}`} className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300">
                        Open <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}