'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DOMAIN_META } from '@/components/decision/DomainIcon';
import { cn } from '@/lib/utils';

const USE_CASES = [
  { domain: 'education', question: 'Which university or course is right for me?', prompt: 'Which university or course is right for me?' },
  { domain: 'career', question: 'Which job offer should I accept?', prompt: 'Which job offer should I accept?' },
  { domain: 'products', question: 'Which product is best for my needs?', prompt: 'Which laptop should I buy under ₹70,000 for coding and AI?' },
  { domain: 'finance', question: 'Where should I invest my money?', prompt: 'Where should I invest ₹5,00,000?' },
  { domain: 'travel', question: 'Which travel destination should I choose?', prompt: 'Which travel destination should I choose for a 10-day trip?' },
  { domain: 'lifestyle', question: 'What\u2019s the best option for a healthier lifestyle?', prompt: 'What is the best option for a healthier lifestyle?' },
  { domain: 'business', question: 'Which business idea is worth pursuing?', prompt: 'Which business idea is worth pursuing: freelancing, SaaS or e-commerce?' },
  { domain: 'technology', question: 'Which technology or tool should I use?', prompt: 'Which frontend framework should I use: React, Vue or Svelte?' },
  { domain: 'career', question: 'Should I switch careers or upskill in my current one?', prompt: 'Should I switch careers or upskill in my current role?' },
  { domain: 'education', question: 'Is a bootcamp worth it compared to a degree?', prompt: 'Is a 6-month coding bootcamp worth it compared to a CS degree?' },
  { domain: 'finance', question: 'Should I buy a home or keep renting?', prompt: 'Should I buy a home now or rent and invest the difference?' },
  { domain: 'lifestyle', question: 'Should I relocate to a new city?', prompt: 'Should I relocate to a new city for better opportunities?' },
];

const FILTERS = ['All', 'Education', 'Career', 'Finance', 'Lifestyle', 'Travel', 'Business', 'Technology', 'Products'];

export default function UseCasesPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All');

  const shown = USE_CASES.filter((u) => {
    const meta = DOMAIN_META[u.domain] || DOMAIN_META.other;
    const matchesFilter = filter === 'All' || meta.label === filter;
    const matchesQuery = !query.trim() || u.question.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  return (
    <AppShell>
      <section className="text-center py-12">
        <p className="eyebrow mb-4">USE CASES</p>
        <h1 className="section-title text-4xl sm:text-5xl text-white leading-tight">
          Real Questions. Real Life.
          <br />
          <span className="gradient-text-cyan">Smarter Decisions.</span>
        </h1>
        <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
          Explore how DecisionIQ helps people make confident decisions in different areas of life —
          with real research, real evidence, and real clarity.
        </p>

        <div className="glass-panel mt-8 p-2 pl-4 rounded-full border border-cyan-500/30 flex items-center gap-3 max-w-xl mx-auto bg-slate-900/70 backdrop-blur-xl focus-within:border-cyan-400/70 transition-all">
          <Search className="w-4 h-4 text-cyan-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search use cases..."
            className="bg-transparent flex-1 text-sm text-white placeholder-slate-400 focus:outline-none py-2"
            aria-label="Search use cases"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-5">
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={cn('chip', filter === f && 'chip-active')}>
              {f}
            </button>
          ))}
        </div>
      </section>

      <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-20">
        {shown.map((uc, i) => {
          const meta = DOMAIN_META[uc.domain] || DOMAIN_META.other;
          const Icon = meta.icon;
          return (
            <motion.div
              key={uc.question}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-card glass-card-hover p-6 flex flex-col"
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${meta.gradient} p-[1px] mb-4`}>
                <div className="w-full h-full rounded-[10px] bg-slate-950 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-cyan-300" />
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">{meta.label}</span>
              <h3 className="font-heading font-bold text-white leading-snug flex-1">{uc.question}</h3>
              <Link href={`/decision/new?q=${encodeURIComponent(uc.prompt)}`} className="mt-5">
                <button className="btn btn-secondary w-full py-2.5 text-xs">
                  Try this decision <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </motion.div>
          );
        })}
      </section>

      {shown.length === 0 && (
        <div className="text-center pb-20">
          <p className="text-sm text-slate-400">No use cases match.</p>
        </div>
      )}
    </AppShell>
  );
}