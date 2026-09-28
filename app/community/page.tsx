'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, MessageSquare, ThumbsUp, ArrowRight, Globe2, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { RobotAssistant } from '@/components/ui/RobotAssistant';
import { api } from '@/services/api';
import type { DecisionSummary } from '@/lib/api-types';
import { DOMAIN_META } from '@/components/decision/DomainIcon';

const TOPICS = [
  { title: 'Study Abroad Stories', members: '8.4k', posts: '1.2k', emoji: '🌍' },
  { title: 'Career Crossroads', members: '12.1k', posts: '2.4k', emoji: '💼' },
  { title: 'Smart Investing', members: '9.7k', posts: '1.8k', emoji: '📈' },
  { title: 'Tech Stack Debates', members: '6.3k', posts: '990', emoji: '⚡' },
  { title: 'City Life & Relocation', members: '7.8k', posts: '1.5k', emoji: '🏙️' },
  { title: 'Side Hustles & Startups', members: '5.2k', posts: '860', emoji: '🚀' },
];

export default function CommunityPage() {
  return (
    <ProtectedRoute>
      <CommunityContent />
    </ProtectedRoute>
  );
}

function CommunityContent() {
  const [mine, setMine] = useState<DecisionSummary[]>([]);

  useEffect(() => {
    api
      .listDecisions(5)
      .then((res) => setMine(res.items))
      .catch(() => undefined);
  }, []);

  return (
    <AppShell wide>
      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <Sidebar />

        <div className="min-w-0 space-y-6">
          <section className="glass-card p-8 text-center relative overflow-hidden">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-48 bg-purple-600/15 blur-3xl rounded-full" />
            <div className="relative">
              <p className="eyebrow mb-3">COMMUNITY</p>
              <h1 className="section-title text-3xl text-white">
                Decide <span className="gradient-text-violet">Together</span>
              </h1>
              <p className="text-sm text-slate-400 mt-3 max-w-lg mx-auto">
                Share your decision journeys, learn from others&rsquo; research, and grow with a
                community that values clarity.
              </p>
              <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-cyan-400" /> 48k+ members</span>
                <span className="flex items-center gap-1.5"><MessageSquare className="w-4 h-4 text-purple-400" /> 12k+ discussions</span>
                <span className="flex items-center gap-1.5"><ThumbsUp className="w-4 h-4 text-emerald-400" /> 96% helpful</span>
              </div>
            </div>
          </section>

          <section>
            <h2 className="section-title text-lg text-white mb-4">Explore Topics</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {TOPICS.map((t, i) => (
                <motion.div
                  key={t.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card glass-card-hover p-5"
                >
                  <div className="text-2xl mb-3">{t.emoji}</div>
                  <h3 className="text-sm font-bold text-white">{t.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t.members} members · {t.posts} posts
                  </p>
                  <button className="btn btn-secondary w-full py-2 text-[11px] mt-4">
                    Join discussion <ArrowRight className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </div>
          </section>

          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Recent community decisions */}
            <section>
              <h2 className="section-title text-lg text-white mb-4">Recent Community Decisions</h2>
              {mine.length === 0 ? (
                <div className="glass-card p-6 text-center">
                  <Globe2 className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                  <p className="text-xs text-slate-400">
                    Community feeds are being seeded. Your own decisions will appear here as the
                    community grows.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {mine.map((d) => {
                    const meta = DOMAIN_META[d.domain] || DOMAIN_META.other;
                    return (
                      <Link key={d.id} href={`/decision/${d.id}`} className="glass-card glass-card-hover p-4 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center shrink-0">
                          <meta.icon className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-slate-200 truncate">{d.title}</p>
                          <p className="text-[10px] text-slate-500">{meta.label} · {d.status}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Side panel */}
            <aside className="space-y-6">
              <div className="glass-card p-5 text-center border-purple-500/25">
                <RobotAssistant size="sm" pose="use_case_helper" className="mx-auto" />
                <h3 className="text-sm font-heading font-bold text-white mt-2">Community Q&A</h3>
                <p className="text-[11px] text-slate-400 mt-1 mb-4">
                  Ask the community or the AI — get multiple perspectives on one decision.
                </p>
                <Link href="/decision/new">
                  <button className="btn btn-primary w-full py-2 text-[11px]">
                    <Sparkles className="w-3 h-3" /> Ask DecisionIQ
                  </button>
                </Link>
              </div>
              <div className="glass-card p-5">
                <h3 className="text-sm font-heading font-bold text-white mb-3">Community Guidelines</h3>
                <ul className="space-y-2 text-[11px] text-slate-400">
                  <li>• Back claims with sources when you can</li>
                  <li>• Respect that every decision is personal</li>
                  <li>• No self-promotion or spam</li>
                  <li>• Share what you learned — even the misses</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppShell>
  );
}