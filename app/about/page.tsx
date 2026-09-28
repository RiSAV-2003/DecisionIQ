'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Play, Target, Eye, Heart, Users, GraduationCap, Briefcase, Home, Microscope, Star } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { RobotAssistant } from '@/components/ui/RobotAssistant';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

const STATS = [
  { value: 10, suffix: '+', label: 'Decision Categories' },
  { value: 1000, suffix: '+', label: 'Trusted Sources' },
  { value: 1000000, suffix: '+', label: 'Decisions Analyzed' },
  { value: 95, suffix: '%', label: 'User Satisfaction' },
];

const VALUES = [
  { icon: Eye, title: 'Clarity over speed', desc: 'A slower, better-researched answer beats a fast, shallow one.' },
  { icon: ShieldCheck, title: 'Evidence over opinion', desc: 'Every claim traces to a source you can verify yourself.' },
  { icon: Users, title: 'You decide, always', desc: 'We advise with confidence — you keep the final call.' },
  { icon: Heart, title: 'Built for real life', desc: 'Laptops, universities, cities, careers. Decisions that matter.' },
];

const TIMELINE = [
  { year: '2024', title: 'The Idea', desc: 'A question: why is the hardest part of any big choice the research — not the deciding?' },
  { year: '2025', title: 'Built & Launched', desc: 'The decision engine, research pipeline and verification layer came to life.' },
  { year: '2026+', title: 'Growing Together', desc: 'Smarter personalization, deeper research, and a community of better deciders.' },
];

const AUDIENCE = [
  { icon: GraduationCap, label: 'Students', desc: 'Courses, universities, study abroad' },
  { icon: Briefcase, label: 'Professionals', desc: 'Jobs, relocations, career pivots' },
  { icon: Home, label: 'Families', desc: 'Homes, cities, big household calls' },
  { icon: Microscope, label: 'Researchers', desc: 'Evidence-first analysis' },
  { icon: Star, label: 'Dreamers', desc: 'Business ideas worth trying' },
];

function ShieldCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <AppShell>
      {/* Hero */}
      <section className="relative grid lg:grid-cols-2 gap-10 items-center py-14">
        <div className="relative">
          <p className="eyebrow mb-4">ABOUT DECISIONIQ</p>
          <h1 className="section-title text-4xl sm:text-5xl text-white leading-tight">
            A Smarter Tomorrow
            <br />
            <span className="gradient-text-violet">Through Better Decisions.</span>
          </h1>
          <p className="text-slate-400 mt-4 max-w-lg leading-relaxed">
            DecisionIQ is an AI-powered decision intelligence platform designed to help you
            research, compare, and choose with confidence — in every important area of life.
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/get-started">
              <button className="btn btn-primary px-6 py-2.5 text-sm">
                Our Mission <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <button className="btn btn-secondary px-6 py-2.5 text-sm">
              <Play className="w-4 h-4 fill-cyan-400 text-cyan-400" /> Watch Our Story
            </button>
          </div>
          <p className="handwritten-script text-lg mt-8 text-cyan-200">
            &ldquo;Good decisions build a better you.&rdquo;
          </p>
        </div>

        <div className="relative">
          <div className="glass-card overflow-hidden">
            <div className="relative h-80">
              <Image src="/assets/cinematic_room_bg.jpg" alt="Futuristic decision room" fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#051428] via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3">
                <RobotAssistant size="sm" pose="widget" />
                <p className="text-xs text-slate-200 glass-card !rounded-xl px-4 py-2.5">
                  &ldquo;Every big decision deserves real research — not guesswork.&rdquo;
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-5 py-6">
        {STATS.map((s) => (
          <div key={s.label} className="glass-card glass-card-hover p-6 text-center">
            <AnimatedNumber
              value={s.value}
              suffix={s.suffix}
              className="text-3xl font-heading font-extrabold text-white gradient-text-cyan"
            />
            <p className="text-[11px] text-slate-400 mt-2">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Why we exist */}
      <section className="grid lg:grid-cols-2 gap-10 py-14">
        <div>
          <p className="eyebrow mb-3">WHY WE EXIST</p>
          <h2 className="section-title text-3xl text-white mb-6">
            The world rewards <span className="gradient-text-cyan">better decisions</span>
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed mb-6">
            Information is everywhere, but clarity is rare. Most of us make life-defining choices —
            which university, which job, which city, which investment — with scattered tabs, biased
            reviews and gut feel. DecisionIQ was built to change that: real research, transparent
            comparison, and a recommendation you can actually trust — because you can see exactly
            how it was made.
          </p>
          <div className="space-y-5">
            {VALUES.map((v) => (
              <div key={v.title} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <v.icon className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{v.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="glass-card p-7 border-cyan-500/25">
            <Target className="w-6 h-6 text-cyan-400 mb-3" />
            <h3 className="font-heading font-bold text-white text-lg mb-2">Mission</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Make evidence-based decision-making accessible to everyone — so no one chooses a
              university, career or home on guesswork alone.
            </p>
          </div>
          <div className="glass-card p-7 border-purple-500/25">
            <Eye className="w-6 h-6 text-purple-400 mb-3" />
            <h3 className="font-heading font-bold text-white text-lg mb-2">Vision</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              A world where every important decision is researched, compared and understood —
              one smarter choice at a time.
            </p>
          </div>
          <div className="glass-card p-7">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RobotAssistant size="sm" pose="widget" />
                <h3 className="font-heading font-bold text-white">Our Promise</h3>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              We will never hide how a recommendation was made. Scores, weights, sources and
              caveats are always on the table. And we will never claim absolute certainty —
              life doesn&rsquo;t work that way, and neither do we.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-10">
        <h2 className="section-title text-3xl text-white text-center mb-10">Our Journey</h2>
        <div className="relative max-w-3xl mx-auto">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/50 via-purple-500/40 to-transparent" />
          <div className="space-y-10">
            {TIMELINE.map((t, i) => (
              <motion.div
                key={t.year}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'} md:pl-0 md:pr-0`}
              >
                <div className={`md:w-[calc(50%-2rem)] w-full ${i % 2 === 0 ? 'md:pr-0' : 'md:ml-auto'} glass-card p-6`}>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-600/30 to-cyan-500/30 border border-cyan-500/40 text-cyan-200 mb-3">
                    {t.year}
                  </span>
                  <h3 className="font-heading font-bold text-white">{t.title}</h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{t.desc}</p>
                </div>
                <span className="absolute left-1/2 -translate-x-1/2 top-6 w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.9)]" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for everyone */}
      <section className="py-14">
        <h2 className="section-title text-3xl text-white text-center mb-4">
          Built for <span className="gradient-text-violet">Everyone</span>
        </h2>
        <p className="text-sm text-slate-400 text-center max-w-lg mx-auto mb-10">
          Whoever you are, if a decision matters to you, it matters to us.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {AUDIENCE.map((a, i) => (
            <motion.div
              key={a.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="glass-card glass-card-hover p-5 text-center"
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-3">
                <a.icon className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-white">{a.label}</h3>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}