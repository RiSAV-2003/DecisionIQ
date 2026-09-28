'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DecisionReportView } from '@/components/decision/DecisionReportView';
import { AnalysisProgress } from '@/components/decision/AnalysisProgress';
import { RobotAssistant } from '@/components/ui/RobotAssistant';
import { api } from '@/services/api';
import type { DecisionDetail } from '@/lib/api-types';

export default function DecisionDetailPage() {
  return (
    <ProtectedRoute>
      <DecisionDetailContent />
    </ProtectedRoute>
  );
}

function DecisionDetailContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [decision, setDecision] = useState<DecisionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const load = async () => {
      try {
        const d = await api.getDecision(id);
        if (cancelled) return;
        setDecision(d);
        setLoading(false);
        if (d.status === 'analyzing') {
          interval = setInterval(async () => {
            try {
              const next = await api.getDecision(id);
              if (cancelled) return;
              setDecision(next);
              if (next.status === 'completed' || next.status === 'failed') {
                if (interval) clearInterval(interval);
              }
            } catch {
              // transient — keep polling
            }
          }, 1500);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Could not load this decision.');
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [id]);

  return (
    <AppShell wide>
      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <Sidebar />

        <div className="min-w-0">
          <Link href="/history" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition-colors mb-5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to My Decisions
          </Link>

          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <RobotAssistant size="md" pose="floating" />
              <div className="skeleton w-72 h-4" />
              <div className="skeleton w-48 h-4" />
            </div>
          )}

          {error && !loading && (
            <div className="glass-card p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
              <p className="text-sm text-slate-300">{error}</p>
              <button onClick={() => window.location.reload()} className="btn btn-secondary mt-5 px-6 py-2 text-xs">
                <Loader2 className="w-3.5 h-3.5" /> Retry
              </button>
            </div>
          )}

          {!loading && decision?.status === 'analyzing' && (
            <div className="flex flex-col items-center py-10 gap-8">
              <AnalysisProgress stages={decision.stages} />
            </div>
          )}

          {!loading && decision?.status === 'failed' && (
            <div className="glass-card p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
              <p className="text-sm text-slate-300">{decision.error || 'Analysis failed.'}</p>
              <Link href="/decision/new" className="btn btn-primary mt-5 px-6 py-2 text-xs inline-block">
                Try another decision
              </Link>
            </div>
          )}

          {!loading && decision && decision.status === 'completed' && decision.result && (
            <DecisionReportView initial={decision} />
          )}

          {!loading && decision && decision.status === 'completed' && !decision.result && (
            <div className="glass-card p-8 text-center">
              <p className="text-sm text-slate-300">Analysis completed but no recommendation was produced.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}