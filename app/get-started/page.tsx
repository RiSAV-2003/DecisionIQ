'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Sparkles,
  Compass,
  GraduationCap,
  Briefcase,
  TrendingUp,
  Heart,
  Rocket,
  Cpu,
  ShoppingBag,
  PartyPopper,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/services/api';
import { RobotAssistant } from '@/components/ui/RobotAssistant';
import type { Preferences } from '@/lib/api-types';
import { cn } from '@/lib/utils';

const INTERESTS = [
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'career', label: 'Career', icon: Briefcase },
  { key: 'finance', label: 'Finance', icon: TrendingUp },
  { key: 'lifestyle', label: 'Lifestyle', icon: Heart },
  { key: 'business', label: 'Business', icon: Rocket },
  { key: 'technology', label: 'Technology', icon: Cpu },
  { key: 'products', label: 'Products', icon: ShoppingBag },
  { key: 'travel', label: 'Travel', icon: Compass },
];

const PRIORITIES = ['budget', 'performance', 'reliability', 'growth', 'learning', 'risk_tolerance', 'location', 'time'];

const PRIORITY_LABELS: Record<string, string> = {
  budget: 'Budget',
  performance: 'Performance',
  reliability: 'Reliability',
  growth: 'Growth',
  learning: 'Learning',
  risk_tolerance: 'Risk tolerance',
  location: 'Location',
  time: 'Time',
};

const STEPS = [
  { num: 1, title: 'Create Account' },
  { num: 2, title: 'Set Preferences' },
  { num: 3, title: 'Start Exploring' },
];

export default function GetStartedPage() {
  const router = useRouter();
  const { user, register } = useAuth();
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [interests, setInterests] = useState<string[]>([]);
  const [priorities, setPriorities] = useState<string[]>([]);
  const [budgetSensitivity, setBudgetSensitivity] = useState(3);
  const [researchDepth, setResearchDepth] = useState('standard');

  useEffect(() => {
    if (user && step === 0) setStep(1);
  }, [user, step]);

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(fullName.trim(), email.trim(), password);
      setStep(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create your account.');
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: Partial<Preferences> = {
        decision_interests: interests,
        priorities,
        budget_sensitivity: budgetSensitivity,
        research_depth: researchDepth,
        preferred_categories: interests,
      };
      await api.updatePreferences(payload);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save preferences.');
    } finally {
      setLoading(false);
    }
  };

  const toggle = <T,>(list: T[], value: T): T[] =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden px-4 py-12">
      <div className="absolute inset-0 bg-radial-ambient pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-aurora bg-purple-600/15" />
      <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
        <Image src="/assets/cinematic_room_bg.jpg" alt="" fill className="object-cover" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 justify-center mb-10 group">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-0.5 shadow-glow-cyan/40 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Brain className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div className="text-left">
            <span className="text-xl font-heading font-extrabold text-white">Decision<span className="text-cyan-400">IQ</span></span>
            <span className="block text-[10px] text-slate-400 tracking-wide">Research less. Decide better.</span>
          </div>
        </Link>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {STEPS.map((s, i) => (
            <div key={s.num} className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all',
                    i < step
                      ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                      : i === step
                        ? 'bg-gradient-to-r from-purple-600 to-cyan-500 border-transparent text-white shadow-glow-cyan/40'
                        : 'bg-slate-900/60 border-slate-700 text-slate-500',
                  )}
                >
                  {i < step ? <Check className="w-4 h-4" /> : s.num}
                </span>
                <span className={cn('text-xs font-medium hidden sm:block', i === step ? 'text-cyan-300' : 'text-slate-500')}>
                  {s.title}
                </span>
              </div>
              {i < STEPS.length - 1 && <div className={cn('w-10 h-px', i < step ? 'bg-emerald-400/50' : 'bg-slate-700')} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1 — account */}
          {step === 0 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="glass-card p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <RobotAssistant size="sm" pose="widget" className="shrink-0" />
                <div>
                  <h1 className="section-title text-2xl text-white">Let&rsquo;s set you up</h1>
                  <p className="text-sm text-slate-400 mt-1">Step 1 of 3 — create your DecisionIQ account.</p>
                </div>
              </div>

              {error && <p className="mb-4 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">{error}</p>}

              <form onSubmit={createAccount} className="space-y-4">
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="glass-input"
                  aria-label="Full name"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="glass-input"
                  aria-label="Email address"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (8+ characters)"
                  required
                  className="glass-input"
                  aria-label="Password"
                />
                <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
              <p className="text-center text-xs text-slate-500 mt-4">
                Already have an account?{' '}
                <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold">Login →</Link>
              </p>
            </motion.div>
          )}

          {/* Step 2 — preferences */}
          {step === 1 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              className="glass-card p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <Sparkles className="w-8 h-8 text-cyan-400" />
                <div>
                  <h1 className="section-title text-2xl text-white">How do you like to decide?</h1>
                  <p className="text-sm text-slate-400 mt-1">Step 2 of 3 — this personalizes every analysis.</p>
                </div>
              </div>

              <div className="space-y-7">
                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-3">Decision interests (pick any)</p>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setInterests(toggle(interests, key))}
                        className={cn('chip !py-2', interests.includes(key) && 'chip-active')}
                      >
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-3">Your priorities</p>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriorities(toggle(priorities, p))}
                        className={cn('chip !py-2', priorities.includes(p) && 'chip-active')}
                      >
                        {PRIORITY_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-3">
                    Budget sensitivity: <span className="text-cyan-300">{['Very price-conscious', 'Price-conscious', 'Balanced', 'Quality-first', 'Quality over cost'][budgetSensitivity - 1]}</span>
                  </p>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={budgetSensitivity}
                    onChange={(e) => setBudgetSensitivity(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                    aria-label="Budget sensitivity"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Cost matters most</span>
                    <span>Quality matters most</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-3">Research depth</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'quick', label: 'Quick', desc: 'Fast answers' },
                      { key: 'standard', label: 'Standard', desc: 'Balanced' },
                      { key: 'deep', label: 'Deep', desc: 'Max evidence' },
                    ].map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setResearchDepth(r.key)}
                        className={cn('rounded-xl border p-3 text-center transition-all', researchDepth === r.key ? 'border-cyan-400/60 bg-cyan-500/10' : 'border-slate-700 bg-slate-900/40 hover:border-cyan-500/30')}
                      >
                        <p className={cn('text-sm font-bold', researchDepth === r.key ? 'text-cyan-300' : 'text-slate-300')}>{r.label}</p>
                        <p className="text-[10px] text-slate-500">{r.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {error && <p className="text-xs text-rose-300">{error}</p>}

                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="btn btn-secondary px-5 py-2.5 text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                  <button onClick={savePreferences} disabled={loading} className="btn btn-primary flex-1 py-2.5 text-sm disabled:opacity-60">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Save & Continue <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3 — done */}
          {step === 2 && (
            <motion.div
              key="s3"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-10 text-center"
            >
              <div className="flex justify-center mb-6">
                <RobotAssistant size="lg" pose="floating" />
              </div>
              <PartyPopper className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
              <h1 className="section-title text-3xl text-white">
                Welcome aboard, <span className="gradient-text-cyan">{user?.full_name?.split(' ')[0]}</span>!
              </h1>
              <p className="text-slate-400 mt-3 max-w-md mx-auto">
                Your analysis is now personalized — criteria weights, research depth and priorities
                are tuned to how you decide.
              </p>
              <p className="handwritten-script text-lg mt-6 text-cyan-200">
                Think. Compare. Explore. Decide. Grow.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
                <Link href="/decision/new">
                  <button className="btn btn-primary w-full sm:w-auto px-8 py-3 text-sm">
                    Make Your First Decision <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <Link href="/explore">
                  <button className="btn btn-secondary w-full sm:w-auto px-8 py-3 text-sm">Explore Ideas</button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}