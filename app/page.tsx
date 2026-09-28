'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RobotAssistant } from '@/components/ui/RobotAssistant';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowRight,
  Play,
  AudioWaveform,
  ArrowUp,
  Shield,
  Layers,
  UserCheck,
  BarChart3,
  GraduationCap,
  Briefcase,
  ShoppingBag,
  Compass,
  Building,
  TrendingUp,
  Heart,
  Sparkles,
  Laptop,
  BookOpen,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [decisionInput, setDecisionInput] = useState('');
  const [orbitRadius, setOrbitRadius] = useState(190);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) setOrbitRadius(112);
      else if (w < 640) setOrbitRadius(132);
      else if (w < 1024) setOrbitRadius(150);
      else setOrbitRadius(190);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const sampleQuestions = [
    'Which laptop should I buy?',
    'Which job offer to accept?',
    'Which course should I take?',
    'Which city is better to live in?',
  ];

  const categoryChips = [
    { name: 'Education', icon: GraduationCap },
    { name: 'Career', icon: Briefcase },
    { name: 'Products', icon: ShoppingBag },
    { name: 'Finance', icon: TrendingUp },
    { name: 'Lifestyle', icon: Heart },
    { name: 'Travel', icon: Compass },
    { name: 'Business', icon: Building },
    { name: 'Anything You Decide', icon: Sparkles },
  ];

  const processSteps = [
    { num: 1, title: 'Understand your problem', desc: 'We analyze your needs' },
    { num: 2, title: 'Research real information', desc: 'From trusted sources' },
    { num: 3, title: 'Verify and find evidence', desc: 'Filter what truly matters' },
    { num: 4, title: 'Compare your options', desc: 'Side-by-side analysis' },
    { num: 5, title: 'Generate insights', desc: 'Personalized to you' },
    { num: 6, title: 'You decide', desc: 'With clarity and confidence' },
  ];

  const handleSubmitDecision = (e: React.FormEvent) => {
    e.preventDefault();
    if (decisionInput.trim()) {
      router.push(`/decision/new?q=${encodeURIComponent(decisionInput)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-slate-100 relative overflow-hidden">
      <Header />

      {/* Cinematic Room Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
        <Image
          src="/assets/cinematic_room_bg.jpg"
          alt="Cinematic Dark Room"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-radial-ambient" />
      </div>

      {/* Main Hero */}
      <section className="relative z-10 flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col justify-between">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center mb-10">
          {/* Left column */}
          <div className="lg:col-span-3 space-y-5">
            <Badge variant="cyan" size="sm" className="bg-cyan-500/10 text-cyan-300 border-cyan-500/30">
              YOUR PERSONAL DECISION PARTNER
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold tracking-tight leading-[1.1] text-white">
              Better Questions <br />
              <span className="gradient-text">Brighter Decisions</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-md">
              DecisionIQ researches, verifies, compares and explains your options — for any decision in life.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/decision/new">
                <Button variant="gradient" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Make a Decision
                </Button>
              </Link>
              <Link href="/how-it-works">
                <Button variant="secondary" size="lg" leftIcon={<Play className="w-4 h-4 fill-cyan-400 text-cyan-400" />}>
                  See How It Works
                </Button>
              </Link>
            </div>

            <div className="pt-1 pl-4">
              <p className="handwritten-script text-sm">
                Not just answers <br /> Real clarity &rarr;
              </p>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-5 border-t border-cyan-500/20">
              <div>
                <div className="text-lg font-heading font-bold text-white">10+</div>
                <div className="text-[10px] text-slate-400">Decision Types</div>
              </div>
              <div>
                <div className="text-lg font-heading font-bold text-white">1000+</div>
                <div className="text-[10px] text-slate-400">Trusted Sources</div>
              </div>
              <div>
                <div className="text-lg font-heading font-bold text-white">95%</div>
                <div className="text-[10px] text-slate-400">User Satisfaction</div>
              </div>
              <div>
                <div className="text-lg font-heading font-bold text-white">1M+</div>
                <div className="text-[10px] text-slate-400">Smarter Decisions</div>
              </div>
            </div>
          </div>

          {/* Center: Robot + Globe + Orbit chips */}
          <div className="lg:col-span-5 relative flex flex-col items-center justify-center min-h-[400px] sm:min-h-[440px]">
            <RobotAssistant
              pose="floating"
              size="lg"
              className="z-30 -mb-6"
            />

            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-full flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-cyan-400/40 animate-spin-slow shadow-glow-cyan/30" />
              <div className="absolute -inset-6 rounded-full border border-purple-500/30 animate-spin-slower" />
              <div className="absolute -inset-12 rounded-full border border-blue-500/20" />

              <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full overflow-hidden border border-cyan-400/50 shadow-glow-cyan/50 flex flex-col items-center justify-center text-center p-4">
                <Image
                  src="/assets/holographic_earth_globe.jpg"
                  alt="Holographic Globe"
                  fill
                  className="object-cover opacity-85"
                />
                <div className="relative z-10 bg-slate-950/70 p-3 rounded-2xl backdrop-blur-md border border-cyan-400/40">
                  <span className="text-lg sm:text-xl font-heading font-black text-white tracking-wider uppercase block">
                    Any Decision
                  </span>
                  <span className="text-sm font-semibold text-cyan-300">
                    A Smarter You
                  </span>
                </div>
              </div>
            </div>

            {/* Orbiting category chips */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {categoryChips.map((chip, idx) => {
                const angle = (idx * (360 / categoryChips.length)) * (Math.PI / 180);
                const x = Math.cos(angle) * orbitRadius;
                const y = Math.sin(angle) * orbitRadius;
                return (
                  <motion.div
  key={chip.name}
  animate={{ x, y }}
  whileHover={{ scale: 1.1 }}
                    className="pointer-events-auto absolute glass-panel px-2.5 sm:px-3 py-1.5 rounded-xl border border-cyan-400/30 flex items-center gap-1.5 cursor-pointer shadow-glow-cyan/20 hover:border-cyan-400 bg-slate-900/80 backdrop-blur-md"
                  >
                    <chip.icon className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium text-slate-200 whitespace-nowrap">{chip.name}</span>
                  </motion.div>
                );
              })}
            </div>

            <div className="absolute -bottom-8 left-0 sm:left-2 pointer-events-none z-20">
              <p className="handwritten-script text-xs">
                Think. Compare. Explore. Decide. Grow.
              </p>
            </div>
          </div>

          {/* Right: How DecisionIQ Works panel */}
          <div className="lg:col-span-4">
            <GlassCard variant="cyan" className="p-6 rounded-3xl relative">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-heading font-bold text-white">
                  How DecisionIQ Works?
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live
                </span>
              </div>

              <div className="space-y-3.5 mb-6">
                {processSteps.map((step) => (
                  <div key={step.num} className="flex items-start gap-3 group">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                      {step.num}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                        {step.title}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {step.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Link href="/decision/new">
                <Button variant="gradient" size="md" className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Start Your Decision Journey
                </Button>
              </Link>
            </GlassCard>
          </div>
        </div>

        {/* Desk environment strip */}
        <div className="relative w-full max-w-5xl mx-auto my-4 glass-panel p-4 rounded-3xl border border-cyan-500/20 bg-slate-950/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-200 flex items-center gap-2">
                <span>Developer Desk Environment</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
              </div>
              <div className="text-[11px] text-slate-400">
                Laptop with glowing cyan logo • Warm lamp glow • Mug: &ldquo;A Smarter You Today&rdquo;
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-300">
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Books: <em>&ldquo;Better Choices&rdquo;</em>, <em>&ldquo;A Brighter Tomorrow&rdquo;</em>, <em>&ldquo;Powered by AI&rdquo;</em></span>
          </div>
        </div>

        {/* Decision input */}
        <div className="w-full max-w-4xl mx-auto mb-10">
          <form onSubmit={handleSubmitDecision} className="relative">
            <div className="glass-panel p-2 pl-5 rounded-full border border-cyan-500/30 flex items-center gap-3 shadow-glow-cyan/30 bg-slate-900/80 backdrop-blur-xl focus-within:border-cyan-400/70 focus-within:shadow-[0_0_30px_-6px_rgba(34,211,238,0.5)] transition-all">
              <AudioWaveform className="w-5 h-5 text-cyan-400 animate-pulse shrink-0" />
              <input
                type="text"
                value={decisionInput}
                onChange={(e) => setDecisionInput(e.target.value)}
                placeholder="What are you trying to decide?"
                className="bg-transparent flex-1 text-sm text-white placeholder-slate-400 focus:outline-none py-2 min-w-0"
              />
              <button
                type="submit"
                aria-label="Start your decision"
                className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center hover:scale-105 transition-transform shadow-glow-cyan/50"
              >
                <ArrowUp className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
            {sampleQuestions.map((q) => (
              <button
                key={q}
                onClick={() => setDecisionInput(q)}
                className="glass-panel px-3.5 py-1 rounded-full text-xs text-slate-300 hover:text-cyan-300 hover:border-cyan-400/50 transition-colors bg-slate-900/60"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Trust bar */}
        <div className="pt-5 border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-6">
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" /> Trusted Information
            </span>
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" /> Transparent Process
            </span>
            <span className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" /> Personalized Results
            </span>
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" /> Real-World Impact
            </span>
          </div>


        </div>
      </section>

      <Footer />
    </div>
  );
}