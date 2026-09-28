'use client';

import React from 'react';
import { ExternalLink, ShieldCheck, AlertTriangle, Clock, FileText } from 'lucide-react';
import type { Source } from '@/lib/api-types';

export function SourceCard({ source }: { source: Source }) {
  const quality = source.overall_score;
  const qualityLabel = quality >= 80 ? 'High' : quality >= 60 ? 'Medium' : 'Low';
  const qualityColor =
    quality >= 80 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
    : quality >= 60 ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
    : 'text-rose-300 border-rose-500/30 bg-rose-500/10';

  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className="glass-card glass-card-hover block p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2">{source.title}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {source.publisher || source.domain_name || 'Source'} · {source.source_type || 'web'}
          </p>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${qualityColor}`}>
          <ShieldCheck className="w-3 h-3" /> {qualityLabel}
        </span>
      </div>

      {source.snippet && (
        <p className="text-xs text-slate-400 mt-2.5 leading-relaxed line-clamp-3">{source.snippet}</p>
      )}

      <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Authority {Math.round(source.authority_score)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-blue-400" /> Fresh {Math.round(source.freshness_score)}
        </span>
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5 text-purple-400" /> Relevant {Math.round(source.relevance_score)}
        </span>
        <span className="ml-auto inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300">
          Visit <ExternalLink className="w-3 h-3" />
        </span>
      </div>

      {source.freshness_score < 60 && (
        <p className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-300/90">
          <AlertTriangle className="w-3 h-3" /> Flagged as possibly outdated — verify before relying on it.
        </p>
      )}
    </a>
  );
}