'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Search,
  Eye,
  Bookmark,
  ArrowRight,
  Compass,
  TrendingUp,
  Flame,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { RobotAssistant } from '@/components/ui/RobotAssistant';
import { DOMAIN_META } from '@/components/decision/DomainIcon';

const POPULAR = [
  'Best laptops 2026',
  'Top universities for MS',
  'Remote job opportunities',
  'Best online courses',
  'Travel destinations 2026',
];

const FEATURED = [
  {
    domain: 'products',
    title: 'Best laptops under ₹70,000 for coding & AI',
    desc: 'Compare real specs, GPUs and value across the top 2026 models in India.',
    views: '12.4k',
    saved: '3.2k',
    image: '/assets/holographic_earth_globe.jpg',
    query: 'Which laptop should I buy under ₹70,000 for coding and AI?',
  },
  {
    domain: 'education',
    title: 'Master\u2019s in Germany vs India',
    desc: 'Tuition, living costs, placements and brand — side by side.',
    views: '9.1k',
    saved: '2.8k',
    image: '/assets/cinematic_room_bg.jpg',
    query: 'Should I pursue a Master\u2019s in Germany or stay in India?',
  },
  {
    domain: 'career',
    title: 'Which job offer should you accept?',
    desc: 'Compare salary, growth, balance and stability with weighted scoring.',
    views: '8.7k',
    saved: '2.1k',
    image: '/assets/decision_robot_avatar.jpg',
    query: 'Which job offer should I accept?',
  },
  {
    domain: 'lifestyle',
    title: 'Pune vs Bangalore: where to live?',
    desc: 'Cost of living, jobs, weather and lifestyle — decided by your priorities.',
    views: '7.3k',
    saved: '1.9k',
    image: '/assets/cinematic_room_bg.jpg',
    query: 'Which city is better to live in: Pune or Bangalore?',
  },
  {
    domain: 'finance',
    title: 'Where to invest ₹5,00,000?',
    desc: 'Index funds, FD, PPF, gold and more — scored on returns, risk and liquidity.',
    views: '6.8k',
    saved: '1.7k',
    image: '/assets/holographic_earth_globe.jpg',
    query: 'Where should I invest ₹5,00,000?',
  },
  {
    domain: 'technology',
    title: 'React vs Vue vs Svelte in 2026',
    desc: 'Ecosystem, hiring demand, learning curve and longevity for your stack.',
    views: '5.9k',
    saved: '1.4k',
    image: '/assets/decision_robot_avatar.jpg',
    query: 'Which frontend framework should I use: React, Vue or Svelte?',
  },
];

const CATEGORIES = Object.entries(DOMAIN_META).filter(([k]) => k !== 'other');

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const cards = FEATURED.filter(
    (f) =>
      (!activeCategory || f.domain === activeCategory) &&
      (!query.trim() || (f.title + f.desc).toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <AppShell wide>
      <div className="grid lg:grid-cols-[240px_1fr_300px] gap-6">
        <Sidebar />

        {/* Main */}
        <div className="min-w-0 space-y-8">
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p className="eyebrow mb-3">EXPLORE POSSIBILITIES</p>
            <h1 className="section-title text-3xl sm:text-4xl text-white">
              Discover <span className="gradient-text-cyan">Smarter Decisions</span>
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-xl">
              Explore real-world decisions, insights, and guidance across every area of life.
            </p>

            {/* Search */}
            <div className="glass-panel mt-6 p-2 pl-4 rounded-full border border-cyan-500/30 flex items-center gap-3 bg-slate-900/70 backdrop-blur-xl focus-within:border-cyan-400/70 transition-all">
              <Search className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to explore?"
                className="bg-transparent flex-1 text-sm text-white placeholder-slate-400 focus:outline-none py-2"
                aria-label="What do you want to explore?"
              />
              <Link href={`/decision/new?q=${encodeURIComponent(query || '')}`}>
                <button className="shrink-0 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-xs font-semibold hover:brightness-110 transition-all">
                  Analyze
                </button>
              </Link>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {POPULAR.map((p) => (
                <button key={p} onClick={() => setQuery(p)} className="chip">
                  {p}
                </button>
              ))}
            </div>
          </motion.section>

          {/* Categories */}
          <section>
            <h2 className="section-title text-lg text-white mb-4">Categories</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory(null)}
                className={!activeCategory ? 'chip chip-active' : 'chip'}
              >
                <Sparkles className="w-3.5 h-3.5" /> All
              </button>
              {CATEGORIES.map(([key, meta]) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCategory(activeCategory === key ? null : key)}
                    className={activeCategory === key ? 'chip chip-active' : 'chip'}
                  >
                    <Icon className="w-3.5 h-3.5" /> {meta.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Featured cards */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title text-lg text-white">Featured Decisions</h2>
              <span className="text-[11px] text-slate-500">{cards.length} explorations</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {cards.map((card, i) => {
                const meta = DOMAIN_META[card.domain] || DOMAIN_META.other;
                const Icon = meta.icon;
                return (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="glass-card glass-card-hover overflow-hidden flex flex-col"
                  >
                    <div className="relative h-36 overflow-hidden">
                      <Image src={card.image} alt="" fill className="object-cover opacity-70" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#051428] via-transparent to-transparent" />
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/70 backdrop-blur border border-cyan-500/30 text-cyan-300">
                        <Icon className="w-3 h-3" /> {meta.label}
                      </span>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-heading font-bold text-white leading-snug">{card.title}</h3>
                      <p className="text-xs text-slate-400 mt-2 flex-1">{card.desc}</p>
                      <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {card.views} views</span>
                        <span className="flex items-center gap-1"><Bookmark className="w-3.5 h-3.5" /> {card.saved} saved</span>
                      </div>
                      <Link href={`/decision/new?q=${encodeURIComponent(card.query)}`} className="mt-4">
                        <button className="btn btn-primary w-full py-2.5 text-xs">
                          Explore <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            {cards.length === 0 && (
              <div className="glass-card p-10 text-center">
                <p className="text-sm text-slate-400">No explorations match your search.</p>
                <button onClick={() => { setQuery(''); setActiveCategory(null); }} className="chip mt-4">Clear filters</button>
              </div>
            )}
          </section>
        </div>

        {/* Right panel */}
        <aside className="hidden xl:block space-y-6">
          <div className="glass-card p-6 text-center relative overflow-hidden">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-40 bg-cyan-500/20 blur-3xl rounded-full" />
            <div className="relative">
              <RobotAssistant size="md" pose="use_case_helper" />
              <h3 className="section-title text-lg text-white mt-3">Need Help Exploring?</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                &ldquo;I can suggest ideas, compare options, and help you find the best path.&rdquo;
              </p>
              <Link href="/decision/new" className="mt-4 block">
                <button className="btn btn-primary w-full py-2.5 text-xs">
                  Ask DecisionIQ <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-heading font-bold text-white mb-4">
              <Flame className="w-4 h-4 text-orange-400" /> Trending Topics
            </h3>
            <div className="space-y-3">
              {[
                { t: 'Best AI laptops under ₹75k', n: '2.4k discussions' },
                { t: 'MS in Germany vs India 2026', n: '1.9k discussions' },
                { t: 'Remote-first careers', n: '1.6k discussions' },
                { t: 'Index funds vs FD', n: '1.2k discussions' },
              ].map((topic, i) => (
                <button key={topic.t} className="w-full text-left group">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-600 w-4">{i + 1}</span>
                    <div>
                      <p className="text-xs font-medium text-slate-300 group-hover:text-cyan-300 transition-colors">{topic.t}</p>
                      <p className="text-[10px] text-slate-500">{topic.n}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 border-purple-500/25">
            <h3 className="flex items-center gap-2 text-sm font-heading font-bold text-white mb-2">
              <TrendingUp className="w-4 h-4 text-purple-400" /> Community Pulse
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              1M+ decisions analyzed. Join the conversation in{' '}
              <Link href="/community" className="text-cyan-400 hover:text-cyan-300">Community</Link>.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}