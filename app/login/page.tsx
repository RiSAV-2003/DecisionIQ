'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Github, Apple, Chrome, Lock, Mail, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { RobotAssistant } from '@/components/ui/RobotAssistant';
import { cn } from '@/lib/utils';

const FEATURES = [
  { title: 'Your Decisions', desc: 'Saved & organized' },
  { title: 'Personalized Insights', desc: 'Across all areas' },
  { title: 'Secure & Private', desc: 'Your data, your control' },
];

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace(next);
  }, [user, router, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-radial-ambient pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-aurora bg-cyan-500/20" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-aurora bg-purple-600/20" />

      {/* Left panel */}
      <div className="relative z-10 lg:w-1/2 flex flex-col justify-between p-8 lg:p-14">
        <Link href="/" className="flex items-center gap-3 group w-fit">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-0.5 shadow-glow-cyan/40 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Brain className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
          <div>
            <span className="text-xl font-heading font-extrabold text-white">Decision<span className="text-cyan-400">IQ</span></span>
            <span className="block text-[10px] text-slate-400 tracking-wide">Research less. Decide better.</span>
          </div>
        </Link>

        <div className="my-12 lg:my-0">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="section-title text-4xl sm:text-5xl text-white leading-tight"
          >
            Welcome
            <br />
            <span className="gradient-text-cyan">Back</span>
          </motion.h1>
          <p className="text-slate-400 mt-3">Better questions. Brighter decisions.</p>

          <ul className="mt-8 space-y-4">
            {FEATURES.map((f, i) => (
              <motion.li
                key={f.title}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
                <div>
                  <span className="text-sm font-semibold text-slate-200">{f.title}</span>
                  <span className="text-xs text-slate-500 ml-2">{f.desc}</span>
                </div>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <RobotAssistant size="sm" pose="widget" />
          <p className="handwritten-script text-sm text-slate-400 max-w-[220px]">
            &ldquo;Every great decision starts with better questions.&rdquo;
          </p>
        </div>
      </div>

      {/* Right card */}
      <div className="relative z-10 lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md glass-card p-8"
        >
          <h2 className="section-title text-2xl text-white">Login to DecisionIQ</h2>
          <p className="text-sm text-slate-400 mt-1 mb-6">Continue your journey towards better decisions.</p>

          {error && (
            <div className="mb-4 flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="glass-input pl-10"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300" htmlFor="password">Password</label>
                <button type="button" className="text-[11px] text-cyan-400 hover:text-cyan-300">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input type="checkbox" className="accent-cyan-400 w-3.5 h-3.5" defaultChecked />
              Remember me
            </label>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full py-3 text-sm disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Login <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="divider-glow flex-1" />
            <span className="text-[10px] uppercase tracking-widest text-slate-500">or continue with</span>
            <div className="divider-glow flex-1" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Chrome, label: 'Google' },
              { icon: Github, label: 'GitHub' },
              { icon: Apple, label: 'Apple' },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                className={cn('flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-700/60 bg-slate-900/50 text-slate-300 hover:border-cyan-500/40 hover:text-white transition-all')}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don&rsquo;t have an account?{' '}
            <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-semibold">
              Create one →
            </Link>
          </p>
        </motion.div>
      </div>

      {/* faint room background */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <Image src="/assets/cinematic_room_bg.jpg" alt="" fill className="object-cover" />
      </div>
    </div>
  );
}