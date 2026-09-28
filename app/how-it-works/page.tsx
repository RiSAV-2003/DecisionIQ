'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Brain,
  Target,
  Search,
  ShieldCheck,
  Scale,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Shield,
  Layers,
  UserCheck,
  BarChart3,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { RobotAssistant } from '@/components/ui/RobotAssistant';

const PIPELINE = [
  { icon: Brain, title: 'Understand your problem', desc: 'We parse your question, extract constraints like budget and location, and detect the decision category.' },
  { icon: Target, title: 'Analyze your priorities', desc: 'Criteria are weighted from your words, your saved preferences, and what actually matters for this decision.' },
  { icon: Search, title: 'Research real information', desc: 'Trusted sources are collected — the keyless Wikipedia API by default, richer providers when keys are configured. Never invented.' },
  { icon: ShieldCheck, title: 'Verify evidence', desc: 'Freshness, authority and relevance are scored. Duplicate, stale and conflicting claims are flagged, not hidden.' },
  { icon: Scale, title: 'Compare your options', desc: 'Every option is scored against every criterion. Each score carries a note you can inspect.' },
  { icon: Sparkles, title: 'Generate insights', desc: 'Trade-offs, risks, what could change, and next steps — personalized to you.' },
  { icon: CheckCircle2, title: 'You decide', desc: 'A transparent recommendation with a confidence score. The final call is always yours.' },
];

const TRUST = [
  { icon: Shield, title: 'Trusted Information', desc: 'Every claim maps to a source you can open.' },
  { icon: Layers, title: 'Transparent Process', desc: 'All criteria, weights and scores are visible.' },
  { icon: UserCheck, title: 'Personalized Results', desc: 'Tuned to your priorities and preferences.' },
  { icon: BarChart3, title: 'Real-World Impact', desc: 'Built for decisions you actually make.' },
];

export default function HowItWorksPage() {
  return (
    <AppShell>
      {/* Hero */}
      <section className="text-center py-14 relative">
        <div className="absolute inset-0 -z-10 flex justify-center">
          <div className="w-[640px] h-[380px] bg-purple-600/10 blur-[120px] rounded-full" />
        </div>
        <p className="eyebrow mb-4">HOW DECISIONIQ WORKS</p>
        <h1 className="section-title text-4xl sm:text-5xl text-white leading-tight">
          From Question to
          <br />
          <span className="gradient-text-cyan">Clarity, Step by Step</span>
        </h1>
        <p className="text-slate-400 mt-4 max-w-xl mx-auto">
          DecisionIQ isn&rsquo;t a chatbot that answers — it&rsquo;s a research partner that
          thinks, verifies, compares and explains, so you can decide with confidence.
        </p>
        <div className="flex justify-center mt-8">
          <RobotAssistant size="lg" pose="floating" showSpeechBubble speechBubble="You bring the question. I bring the research, evidence and comparison." />
        </div>
      </section>

      {/* Pipeline */}
      <section className="max-w-4xl mx-auto space-y-4 pb-16">
        {PIPELINE.map((step, i) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5 }}
            className="glass-card glass-card-hover p-6 flex items-start gap-5"
          >
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600/30 to-cyan-500/30 border border-cyan-500/30 flex items-center justify-center">
                <step.icon className="w-5 h-5 text-cyan-300" />
              </div>
              <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-950 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
            </div>
            <div>
              <h3 className="font-heading font-bold text-white">{step.title}</h3>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Trust */}
      <section className="pb-16">
        <h2 className="section-title text-2xl text-white text-center mb-8">
          Built on <span className="gradient-text-violet">Trust & Transparency</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {TRUST.map((t, i) => (
            <motion.div
              key={t.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card glass-card-hover p-6 text-center"
            >
              <div className="w-11 h-11 mx-auto rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
                <t.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-sm font-bold text-white">{t.title}</h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">{t.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center pb-20">
        <div className="glass-card p-10 max-w-2xl mx-auto relative overflow-hidden">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-40 bg-cyan-500/15 blur-3xl rounded-full" />
          <h2 className="section-title text-2xl text-white relative">Ready to make your best decision yet?</h2>
          <p className="handwritten-script text-lg text-cyan-200 mt-4 relative">Not just answers. Real clarity.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8 relative">
            <Link href="/decision/new">
              <button className="btn btn-primary px-8 py-3 text-sm">
                Make a Decision <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/explore">
              <button className="btn btn-secondary px-8 py-3 text-sm">Explore Examples</button>
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}