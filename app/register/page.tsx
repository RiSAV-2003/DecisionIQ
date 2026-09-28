'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brain, ArrowRight, Github, Apple, Chrome, Lock, Mail, User as UserIcon, Loader2, Eye, EyeOff, AlertTriangle, Users, History, Sparkles } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { RobotAssistant } from '@/components/ui/RobotAssistant';

const HIGHLIGHTS = [
  { icon: Users, text: 'Join a Growing Community' },
  { icon: History, text: 'Save & Revisit Your Decisions' },
  { icon: Sparkles, text: 'Get Personalized Insights' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) router.replace('/get-started');
  }, [user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (!agree) {
      setError('Please accept the Terms of Service and Privacy Policy.');
      return;
    }
    setLoading(true);
    try {
      await register(fullName.trim(), email.trim(), password);
      router.replace('/get-started');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-ambient pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-aurora bg-purple-600/20" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-aurora bg-cyan-500/20" />

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
            Create
            <br />
            <span className="gradient-text-violet">Your Account</span>
          </motion.h1>
          <p className="text-slate-400 mt-3">Join thousands making smarter decisions with DecisionIQ.</p>

          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((h, i) => (
              <motion.li
                key={h.text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
                  <h.icon className="w-4 h-4 text-cyan-300" />
                </span>
                <span className="text-sm font-medium text-slate-200">{h.text}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-4">
          <RobotAssistant size="sm" pose="widget" />
          <p className="handwritten-script text-sm text-slate-400 max-w-[240px]">
            &ldquo;Good decisions build a better you.&rdquo;
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
          <h2 className="section-title text-2xl text-white">Create Account</h2>
          <p className="text-sm text-slate-400 mt-1 mb-6">Start making better decisions today.</p>

          {error && (
            <div className="mb-4 flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="fullName">Full Name</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="fullName" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Aarav Sharma" className="glass-input pl-10" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="email">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="glass-input pl-10" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="password">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ characters" className="glass-input pl-10 pr-9" />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400" aria-label="Toggle password">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="confirm">Confirm Password</label>
                <input id="confirm" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat password" className="glass-input" />
              </div>
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer select-none">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="accent-cyan-400 w-3.5 h-3.5 mt-0.5" />
              <span>
                I agree to the <span className="text-cyan-400">Terms of Service</span> and <span className="text-cyan-400">Privacy Policy</span>
              </span>
            </label>

            <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create Account <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="divider-glow flex-1" />
            <span className="text-[10px] uppercase tracking-widest text-slate-500">or sign up with</span>
            <div className="divider-glow flex-1" />
          </div>

          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Chrome, label: 'Google' },
              { icon: Github, label: 'GitHub' },
              { icon: Apple, label: 'Apple' },
              { icon: Brain, label: 'More' },
            ].map(({ icon: Icon, label }) => (
              <button key={label} className="flex items-center justify-center py-2.5 rounded-xl border border-slate-700/60 bg-slate-900/50 text-slate-300 hover:border-cyan-500/40 hover:text-white transition-all">
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-semibold">
              Login →
            </Link>
          </p>
        </motion.div>
      </div>

      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <Image src="/assets/cinematic_room_bg.jpg" alt="" fill className="object-cover" />
      </div>
    </div>
  );
}