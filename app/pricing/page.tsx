'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Zap, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    icon: Sparkles,
    priceMonthly: 0,
    priceYearly: 0,
    tagline: 'Start deciding better',
    features: ['5 decisions / month', 'Standard research depth', 'Basic comparison & scoring', 'Evidence-backed sources', 'AI follow-up chat'],
    cta: 'Start Free',
    highlight: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    icon: Zap,
    priceMonthly: 499,
    priceYearly: 399,
    tagline: 'For serious deciders',
    features: [
      '100 decisions / month',
      'Deep research depth',
      'Advanced insights & analytics',
      'Personalized analysis & re-weighting',
      'Priority AI follow-ups',
      'Full decision history',
    ],
    cta: 'Go Pro',
    highlight: true,
  },
  {
    key: 'premium',
    name: 'Premium',
    icon: Crown,
    priceMonthly: 999,
    priceYearly: 799,
    tagline: 'For teams & power users',
    features: ['Unlimited decisions', 'Deepest research depth', 'Everything in Pro', 'Team-ready architecture', 'Early access features'],
    cta: 'Go Premium',
    highlight: false,
  },
];

export default function PricingPage() {
  const { user } = useAuth();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const upgrade = async (plan: string) => {
    if (!user) return;
    setUpgrading(plan);
    setMessage(null);
    try {
      await api.upgradePlan(plan);
      setMessage(`You're on ${PLANS.find((p) => p.key === plan)?.name}. Checkout is staged — enjoy the plan in this demo!`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Upgrade failed.');
    } finally {
      setUpgrading(null);
    }
  };

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 6000);
      return () => clearTimeout(t);
    }
  }, [message]);

  return (
    <AppShell>
      <section className="text-center py-12">
        <p className="eyebrow mb-4">PRICING</p>
        <h1 className="section-title text-4xl sm:text-5xl text-white leading-tight">
          Choose Your <span className="gradient-text-cyan">Clarity</span>
        </h1>
        <p className="text-slate-400 mt-4 max-w-xl mx-auto">
          Start free, upgrade when your decisions get bigger. Every plan includes real research,
          transparent scoring and explainable recommendations.
        </p>

        <div className="inline-flex items-center gap-1 p-1.5 rounded-full glass-panel mt-8">
          {(['monthly', 'yearly'] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={cn(
                'px-5 py-2 rounded-full text-xs font-semibold transition-all',
                billing === b ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-glow-cyan/40' : 'text-slate-400 hover:text-white',
              )}
            >
              {b === 'monthly' ? 'Monthly' : 'Yearly'}
              {b === 'yearly' && <span className="ml-1.5 text-emerald-300">−20%</span>}
            </button>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-6 pb-10">
        {PLANS.map((plan, i) => {
          const price = billing === 'monthly' ? plan.priceMonthly : plan.priceYearly;
          return (
            <motion.div
              key={plan.key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className={cn(
                'glass-card p-7 flex flex-col relative',
                plan.highlight && 'border-cyan-400/50 shadow-[0_0_40px_-10px_rgba(34,211,238,0.5)]',
              )}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-purple-600 to-cyan-500 text-white shadow-glow-cyan/50">
                  Most Popular
                </span>
              )}
              <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4">
                <plan.icon className="w-5 h-5 text-cyan-400" />
              </div>
              <h2 className="font-heading text-xl font-bold text-white">{plan.name}</h2>
              <p className="text-xs text-slate-400 mt-1">{plan.tagline}</p>

              <div className="mt-5 flex items-end gap-1">
                <span className="text-4xl font-heading font-extrabold text-white">
                  {price === 0 ? 'Free' : `₹${price.toLocaleString('en-IN')}`}
                </span>
                {price > 0 && <span className="text-xs text-slate-500 mb-1.5">/mo</span>}
              </div>
              {plan.priceMonthly > 0 && (
                <p className="text-[11px] text-slate-500 mt-1">billed {billing === 'yearly' ? 'yearly' : 'monthly'}</p>
              )}

              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mt-0.5 shrink-0">
                      <Check className="w-2.5 h-2.5 text-emerald-300" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              {user ? (
                <button
                  onClick={() => upgrade(plan.key)}
                  disabled={upgrading === plan.key}
                  className={cn('btn mt-7 w-full py-3 text-sm disabled:opacity-60', plan.highlight ? 'btn-primary' : 'btn-secondary')}
                >
                  {upgrading === plan.key ? <Loader2 className="w-4 h-4 animate-spin" /> : plan.cta}
                </button>
              ) : (
                <Link href="/get-started" className="mt-7">
                  <button className={cn('btn w-full py-3 text-sm', plan.highlight ? 'btn-primary' : 'btn-secondary')}>
                    {plan.cta}
                  </button>
                </Link>
              )}
            </motion.div>
          );
        })}
      </section>

      {message && (
        <div className="max-w-md mx-auto mb-10">
          <p className="text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-3 text-center">{message}</p>
        </div>
      )}

      <section className="pb-16">
        <div className="glass-card p-8 max-w-3xl mx-auto">
          <h2 className="section-title text-xl text-white mb-4">Common questions</h2>
          <div className="space-y-4">
            {[
              { q: 'Is the Free plan really free?', a: 'Yes — no card required. Real research, real scores, 5 decisions a month.' },
              { q: 'What does "deep research" mean?', a: 'Pro and Premium run more research queries with more sources per query, so evidence coverage (and confidence) is higher.' },
              { q: 'Can I cancel anytime?', a: 'Yes. Plans are month-to-month and you keep access to your decision history either way.' },
              { q: 'Do you share my data?', a: 'Never. Your decisions and preferences are private to your account.' },
            ].map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-slate-800/70 bg-slate-900/40 px-5 py-4">
                <summary className="flex items-center justify-between text-sm font-semibold text-slate-200 cursor-pointer list-none">
                  {faq.q}
                  <span className="text-cyan-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}